import {
  TelemetryPayload,
  ProcessingResult,
  Reading,
  CurrentReading,
} from '../models/telemetry.js';

import { validateTelemetry } from '../validators/telemetry-validator.js';

import {
  DeviceRepository,
  ReadingRepository,
  CurrentRepository,
} from '../repositories/index.js';

import { AlertService } from './alert-service.js';
import { StatisticsService } from './statistics-service.js';
import { Logger } from '../adapters/logging/index.js';
import { env } from '../config/environment.js';

/**
 * TelemetryService — the heart of the backend processing pipeline.
 *
 * Processing steps:
 *  1. Parse and schema-validate the payload.
 *  2. Look up the device in CampusDevices. Reject unknown devices.
 *  3. Load the current state for the device (for alert state machine).
 *  4. Determine DeviceStatus using threshold comparison.
 *  5. Persist the historical reading (with TTL).
 *  6. Update the current reading snapshot.
 *  7. Run the alert state machine.
 *  8. Update system statistics counters.
 *  9. Return a ProcessingResult.
 */
export class TelemetryService {
  constructor(
    private deviceRepo:    DeviceRepository,
    private readingRepo:   ReadingRepository,
    private currentRepo:   CurrentRepository,
    private alertService:  AlertService,
    private statsService:  StatisticsService,
    private logger:        Logger,
  ) {}

  async process(raw: unknown): Promise<ProcessingResult> {
    const timestamp = new Date().toISOString();

    // ── 1. Schema validation ───────────────────────────────────────────────
    const validation = validateTelemetry(raw);
    if (!validation.valid) {
      this.logger.warn('telemetry_invalid', { errors: validation.errors });
      await this.statsService.increment({
        totalMessages: 1,
        invalidMessages: 1,
        lastErrorAt: timestamp,
        lastErrorMessage: validation.errors.join(', '),
      });
      return { success: false, error: validation.errors.join(', ') };
    }

    const payload = raw as TelemetryPayload;

    // ── 2. Device existence check ──────────────────────────────────────────
    const device = await this.deviceRepo.getById(payload.deviceId);
    if (!device) {
      this.logger.warn('unknown_device', { deviceId: payload.deviceId });
      await this.statsService.increment({
        totalMessages: 1,
        invalidMessages: 1,
        lastErrorAt: timestamp,
        lastErrorMessage: `Unknown device: ${payload.deviceId}`,
      });
      return { success: false, error: `Unknown device: ${payload.deviceId}` };
    }

    // ── 3. Load current state for alert machine ────────────────────────────
    const current = await this.currentRepo.get(payload.deviceId);

    // ── 4. Determine status ────────────────────────────────────────────────
    const status = AlertService.deriveStatus(payload.temperature, payload.humidity, device);

    // ── 5. Save historical reading ─────────────────────────────────────────
    const expiresAt = Math.floor(Date.now() / 1000) + env.readingTtlDays * 86_400;
    const reading: Reading = {
      deviceId:    payload.deviceId,
      timestamp:   payload.timestamp,
      temperature: payload.temperature,
      humidity:    payload.humidity,
      status,
      messageId:   payload.messageId,
      expiresAt,
    };
    await this.readingRepo.save(reading);

    // ── 6. Update current snapshot ─────────────────────────────────────────
    const currentReading: CurrentReading = {
      deviceId:    payload.deviceId,
      temperature: payload.temperature,
      humidity:    payload.humidity,
      status,
      lastSeenAt:  payload.timestamp,
      messageId:   payload.messageId,
    };
    await this.currentRepo.save(currentReading);

    // ── 7. Alert state machine ─────────────────────────────────────────────
    let alertTriggered = false;
    let alertRecovered = false;

    try {
      const alertResult = await this.alertService.evaluate({
        device,
        temperature: payload.temperature,
        humidity:    payload.humidity,
        timestamp:   payload.timestamp,
        current,
      });
      alertTriggered = alertResult.triggered;
      alertRecovered = alertResult.recovered;
    } catch (err) {
      this.logger.error('alert_evaluation_failed', { deviceId: payload.deviceId, error: String(err) });
    }

    // ── 8. Update statistics ───────────────────────────────────────────────
    await this.statsService.increment({
      totalMessages:     1,
      validMessages:     1,
      processedMessages: 1,
      alertsGenerated:   alertTriggered ? 1 : 0,
      recoveries:        alertRecovered ? 1 : 0,
      lastProcessedAt:   timestamp,
    });

    this.logger.info('reading_processed', {
      deviceId:    payload.deviceId,
      temperature: payload.temperature,
      humidity:    payload.humidity,
      status,
      alertTriggered,
      alertRecovered,
    });

    return {
      success: true,
      deviceId: payload.deviceId,
      status,
      alertTriggered,
      alertRecovered,
    };
  }
}
