import { Device }         from '../models/telemetry.js';
import { Reading }        from '../models/telemetry.js';
import { CurrentReading } from '../models/telemetry.js';
import { Alert }          from '../models/telemetry.js';
import { SystemStats }    from '../models/telemetry.js';

// ─── Repository interfaces ─────────────────────────────────────────────────
// All business logic depends ONLY on these interfaces, not on DynamoDB directly.
// This enables in-memory implementations for testing.

export interface DeviceRepository {
  getById(deviceId: string): Promise<Device | null>;
  listAll(): Promise<Device[]>;
  save(device: Device): Promise<void>;
}

export interface ReadingRepository {
  save(reading: Reading): Promise<void>;
  listByDevice(deviceId: string, limitHours?: number): Promise<Reading[]>;
}

export interface CurrentRepository {
  get(deviceId: string): Promise<CurrentReading | null>;
  save(reading: CurrentReading): Promise<void>;
  listAll(): Promise<CurrentReading[]>;
}

export interface AlertRepository {
  save(alert: Alert): Promise<void>;
  listRecent(campusId: string, limitHours?: number): Promise<Alert[]>;
  getLatestForDevice(deviceId: string): Promise<Alert | null>;
}

export interface StatisticsRepository {
  get(metricId: string): Promise<SystemStats | null>;
  save(stats: SystemStats): Promise<void>;
}

// ─── In-memory implementations ─────────────────────────────────────────────
// Used in unit tests and local development without AWS credentials.

export class InMemoryDeviceRepository implements DeviceRepository {
  private store: Map<string, Device> = new Map();

  async getById(deviceId: string): Promise<Device | null> {
    return this.store.get(deviceId) ?? null;
  }

  async listAll(): Promise<Device[]> {
    return [...this.store.values()];
  }

  async save(device: Device): Promise<void> {
    this.store.set(device.deviceId, device);
  }

  /** Seed helper for tests. */
  seed(devices: Device[]): void {
    for (const d of devices) this.store.set(d.deviceId, d);
  }
}

export class InMemoryReadingRepository implements ReadingRepository {
  private store: Reading[] = [];

  async save(reading: Reading): Promise<void> {
    this.store.push(reading);
  }

  async listByDevice(deviceId: string, limitHours = 24): Promise<Reading[]> {
    const cutoff = Date.now() - limitHours * 60 * 60 * 1000;
    return this.store.filter(
      r => r.deviceId === deviceId && new Date(r.timestamp).getTime() >= cutoff,
    );
  }

  all(): Reading[] { return this.store; }
}

export class InMemoryCurrentRepository implements CurrentRepository {
  private store: Map<string, CurrentReading> = new Map();

  async get(deviceId: string): Promise<CurrentReading | null> {
    return this.store.get(deviceId) ?? null;
  }

  async save(reading: CurrentReading): Promise<void> {
    this.store.set(reading.deviceId, reading);
  }

  async listAll(): Promise<CurrentReading[]> {
    return [...this.store.values()];
  }
}

export class InMemoryAlertRepository implements AlertRepository {
  private store: Alert[] = [];

  async save(alert: Alert): Promise<void> {
    this.store.push(alert);
  }

  async listRecent(campusId: string, limitHours = 48): Promise<Alert[]> {
    const cutoff = Date.now() - limitHours * 60 * 60 * 1000;
    return this.store.filter(
      a => a.campusId === campusId && new Date(a.timestamp).getTime() >= cutoff,
    );
  }

  async getLatestForDevice(deviceId: string): Promise<Alert | null> {
    const hits = this.store
      .filter(a => a.deviceId === deviceId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return hits[0] ?? null;
  }

  all(): Alert[] { return this.store; }
}

export class InMemoryStatisticsRepository implements StatisticsRepository {
  private store: Map<string, SystemStats> = new Map();

  async get(metricId: string): Promise<SystemStats | null> {
    return this.store.get(metricId) ?? null;
  }

  async save(stats: SystemStats): Promise<void> {
    this.store.set(stats.metricId, stats);
  }
}
