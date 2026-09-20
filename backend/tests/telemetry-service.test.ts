/**
 * Unit tests for TelemetryService — all in-memory, no AWS required.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { TelemetryService }    from '../src/services/telemetry-service.js';
import { AlertService }        from '../src/services/alert-service.js';
import { StatisticsService }   from '../src/services/statistics-service.js';
import { NoopLogger, CapturingLogger } from '../src/adapters/logging/index.js';
import { MockNotificationService }     from '../src/adapters/sns/index.js';
import {
  InMemoryDeviceRepository,
  InMemoryReadingRepository,
  InMemoryCurrentRepository,
  InMemoryAlertRepository,
  InMemoryStatisticsRepository,
} from '../src/repositories/index.js';

import { Device } from '../src/models/telemetry.js';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const DEVICE_LAB: Device = {
  deviceId:                'LAB-01',
  locationName:            'Electronics Lab',
  building:                'Block A',
  room:                    'Lab 01',
  type:                    'LABORATORY',
  temperatureThresholdC:   28,
  humidityThresholdPercent: 60,
  enabled:                 true,
  createdAt:               '2026-01-01T00:00:00.000Z',
};

/**
 * Returns an ISO-8601 timestamp that is `offsetMinutes` minutes before now.
 * All timestamps used in tests that feed the time-window filter must be
 * dynamically generated so the tests remain green regardless of when they run.
 */
function recentTimestamp(offsetMinutes = 0): string {
  return new Date(Date.now() - offsetMinutes * 60_000).toISOString();
}

// VALID_PAYLOAD uses a timestamp 5 minutes in the past so it always falls
// well within the default 24-hour listByDevice window.
const VALID_PAYLOAD = {
  deviceId:    'LAB-01',
  timestamp:   recentTimestamp(5),
  temperature: 25,
  humidity:    55,
  messageId:   'msg-001',
};

// ─── Factory ───────────────────────────────────────────────────────────────

function buildServices(opts?: { devices?: Device[] }) {
  const deviceRepo  = new InMemoryDeviceRepository();
  const readingRepo = new InMemoryReadingRepository();
  const currentRepo = new InMemoryCurrentRepository();
  const alertRepo   = new InMemoryAlertRepository();
  const statsRepo   = new InMemoryStatisticsRepository();
  const notifSvc    = new MockNotificationService();
  const logger      = new CapturingLogger();

  deviceRepo.seed(opts?.devices ?? [DEVICE_LAB]);

  const alertSvc   = new AlertService(alertRepo, currentRepo, notifSvc, logger);
  const statsSvc   = new StatisticsService(statsRepo);
  const telemetrySvc = new TelemetryService(deviceRepo, readingRepo, currentRepo, alertSvc, statsSvc, logger);

  return { deviceRepo, readingRepo, currentRepo, alertRepo, statsRepo, notifSvc, logger, telemetrySvc, statsSvc };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('TelemetryService', () => {
  describe('Valid readings', () => {
    it('processes a valid normal reading successfully', async () => {
      const { telemetrySvc } = buildServices();
      const result = await telemetrySvc.process(VALID_PAYLOAD);
      expect(result.success).toBe(true);
      expect(result.status).toBe('NORMAL');
      expect(result.alertTriggered).toBe(false);
    });

    it('saves a reading to the reading repo', async () => {
      const { telemetrySvc, readingRepo } = buildServices();
      await telemetrySvc.process(VALID_PAYLOAD);
      const readings = await readingRepo.listByDevice('LAB-01', 24);
      expect(readings).toHaveLength(1);
      expect(readings[0]!.temperature).toBe(25);
    });

    it('updates the current reading snapshot', async () => {
      const { telemetrySvc, currentRepo } = buildServices();
      await telemetrySvc.process(VALID_PAYLOAD);
      const current = await currentRepo.get('LAB-01');
      expect(current).not.toBeNull();
      expect(current!.temperature).toBe(25);
      expect(current!.status).toBe('NORMAL');
    });

    it('increments processedMessages and validMessages stats', async () => {
      const { telemetrySvc, statsSvc } = buildServices();
      await telemetrySvc.process(VALID_PAYLOAD);
      const stats = await statsSvc.get();
      expect(stats.processedMessages).toBe(1);
      expect(stats.validMessages).toBe(1);
      expect(stats.invalidMessages).toBe(0);
    });
  });

  describe('Invalid payloads', () => {
    it('rejects missing deviceId', async () => {
      const { telemetrySvc, statsSvc } = buildServices();
      const result = await telemetrySvc.process({ ...VALID_PAYLOAD, deviceId: '' });
      expect(result.success).toBe(false);
      const stats = await statsSvc.get();
      expect(stats.invalidMessages).toBe(1);
    });

    it('rejects unknown device', async () => {
      const { telemetrySvc } = buildServices();
      const result = await telemetrySvc.process({ ...VALID_PAYLOAD, deviceId: 'UNKNOWN-99' });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Unknown device/);
    });

    it('rejects temperature > 85', async () => {
      const { telemetrySvc } = buildServices();
      const result = await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 200 });
      expect(result.success).toBe(false);
    });

    it('rejects negative humidity', async () => {
      const { telemetrySvc } = buildServices();
      const result = await telemetrySvc.process({ ...VALID_PAYLOAD, humidity: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('Alert state machine', () => {
    it('triggers an alert when temperature exceeds threshold (NORMAL → ALERT)', async () => {
      const { telemetrySvc, notifSvc, alertRepo } = buildServices();

      // First reading — normal
      await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 25, timestamp: recentTimestamp(10) });

      // Second reading — above threshold (28°C)
      const result = await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 33, messageId: 'msg-002', timestamp: recentTimestamp(5) });
      expect(result.status).toBe('ALERT');
      expect(result.alertTriggered).toBe(true);
      expect(notifSvc.wasAlertSentFor('LAB-01')).toBe(true);
    });

    it('does NOT send a second notification when already in ALERT state (sustained)', async () => {
      const { telemetrySvc, notifSvc } = buildServices();

      // Trigger alert
      await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 33, messageId: 'msg-A', timestamp: recentTimestamp(20) });
      // Still above threshold — should NOT send again
      await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 34, messageId: 'msg-B', timestamp: recentTimestamp(10) });

      expect(notifSvc.sent).toHaveLength(1);
    });

    it('marks recovery when temperature returns to normal (ALERT → NORMAL)', async () => {
      const { telemetrySvc, telemetrySvc: svc2, alertRepo, statsSvc } = buildServices();

      // Trigger alert
      await svc2.process({ ...VALID_PAYLOAD, temperature: 33, messageId: 'msg-A', timestamp: recentTimestamp(20) });
      // Recover
      const result = await svc2.process({ ...VALID_PAYLOAD, temperature: 25, messageId: 'msg-B', timestamp: recentTimestamp(10) });

      expect(result.alertRecovered).toBe(true);
      expect(result.status).toBe('NORMAL');

      const stats = await statsSvc.get();
      expect(stats.recoveries).toBe(1);
    });

    it('increments alertsGenerated stat on first alert', async () => {
      const { telemetrySvc, statsSvc } = buildServices();
      await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 33, messageId: 'msg-A', timestamp: recentTimestamp(5) });
      const stats = await statsSvc.get();
      expect(stats.alertsGenerated).toBe(1);
    });

    it('executes full 6-reading lifecycle (NORMAL -> ALERT -> sustained -> sustained -> RECOVERY -> ALERT)', async () => {
      // Threshold for LAB-01 is 28, let's create a custom device with threshold 30 to match prompt exactly
      const customDevice: Device = { ...DEVICE_LAB, temperatureThresholdC: 30 };
      const { telemetrySvc, notifSvc, statsSvc } = buildServices({ devices: [customDevice] });

      // 1. NORMAL (29°C)
      let r = await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 29, messageId: 'm1', timestamp: recentTimestamp(60) });
      expect(r.status).toBe('NORMAL');

      // 2. ALERT (31°C) -> 1st notification
      r = await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 31, messageId: 'm2', timestamp: recentTimestamp(50) });
      expect(r.status).toBe('ALERT');
      expect(notifSvc.sent).toHaveLength(1);

      // 3. ALERT (32°C) -> No notification
      r = await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 32, messageId: 'm3', timestamp: recentTimestamp(40) });
      expect(r.status).toBe('ALERT');
      expect(notifSvc.sent).toHaveLength(1);

      // 4. ALERT (33°C) -> No notification
      r = await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 33, messageId: 'm4', timestamp: recentTimestamp(30) });
      expect(r.status).toBe('ALERT');
      expect(notifSvc.sent).toHaveLength(1);

      // 5. RECOVERY (28°C)
      r = await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 28, messageId: 'm5', timestamp: recentTimestamp(20) });
      expect(r.status).toBe('NORMAL');
      const stats = await statsSvc.get();
      expect(stats.recoveries).toBe(1);

      // 6. ALERT (31°C) -> 2nd notification
      r = await telemetrySvc.process({ ...VALID_PAYLOAD, temperature: 31, messageId: 'm6', timestamp: recentTimestamp(10) });
      expect(r.status).toBe('ALERT');
      expect(notifSvc.sent).toHaveLength(2);
    });
  });

  describe('Historical readings', () => {
    it('stores multiple readings chronologically', async () => {
      const { telemetrySvc, readingRepo } = buildServices();
      // Use recent timestamps (30 min, 20 min, 10 min ago) so all fall within the 24h window
      await telemetrySvc.process({ ...VALID_PAYLOAD, timestamp: recentTimestamp(30), messageId: 'r1' });
      await telemetrySvc.process({ ...VALID_PAYLOAD, timestamp: recentTimestamp(20), messageId: 'r2' });
      await telemetrySvc.process({ ...VALID_PAYLOAD, timestamp: recentTimestamp(10), messageId: 'r3' });
      const readings = await readingRepo.listByDevice('LAB-01', 24);
      expect(readings).toHaveLength(3);
    });
  });
});
