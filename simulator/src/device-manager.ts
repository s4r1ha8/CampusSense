import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DeviceConfig, DeviceState } from './types.js';
import { logger } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Loads device configurations from devices.json and maintains
 * the in-memory state (last readings, anomaly flags) for each device.
 */
export class DeviceManager {
  private devices: Map<string, DeviceState> = new Map();

  constructor() {
    const devicesPath = join(__dirname, '../../devices.json');
    let raw: DeviceConfig[];

    try {
      raw = JSON.parse(readFileSync(devicesPath, 'utf-8')) as DeviceConfig[];
    } catch (err) {
      logger.error('Failed to load devices.json', { error: String(err) });
      throw new Error(`Cannot load device configuration from ${devicesPath}`);
    }

    for (const cfg of raw) {
      this.devices.set(cfg.deviceId, {
        config: cfg,
        currentStatus: 'NORMAL',
        lastTemperature: 0,
        lastHumidity: 0,
        inAnomaly: false,
      });
    }

    logger.info('devices_loaded', { count: this.devices.size });
  }

  /** Returns all device states. */
  all(): DeviceState[] {
    return [...this.devices.values()];
  }

  /** Returns all device IDs. */
  ids(): string[] {
    return [...this.devices.keys()];
  }

  /** Returns a single device state by ID. */
  get(deviceId: string): DeviceState | undefined {
    return this.devices.get(deviceId);
  }

  /** Updates last readings for a device. */
  update(deviceId: string, temperature: number, humidity: number, inAnomaly: boolean): void {
    const state = this.devices.get(deviceId);
    if (!state) return;
    state.lastTemperature = temperature;
    state.lastHumidity    = humidity;
    state.inAnomaly       = inAnomaly;
  }

  /** Returns total number of loaded devices. */
  get count(): number {
    return this.devices.size;
  }
}
