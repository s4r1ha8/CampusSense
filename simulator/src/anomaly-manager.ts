import { logger } from './logger.js';

/**
 * Manages anomaly state for each device.
 * An anomaly is a deliberately injected high-temperature / high-humidity condition.
 */
export class AnomalyManager {
  /** Set of device IDs currently in anomaly state. */
  private active = new Set<string>();

  /** Device ID that should have a sustained anomaly for the entire run. */
  private forcedDeviceId?: string;

  constructor(forcedDeviceId?: string) {
    this.forcedDeviceId = forcedDeviceId;

    if (forcedDeviceId) {
      this.active.add(forcedDeviceId);
      logger.info('anomaly_forced', { deviceId: forcedDeviceId });
    }
  }

  /**
   * Returns true when the given device is currently in anomaly state.
   */
  isActive(deviceId: string): boolean {
    return this.active.has(deviceId);
  }

  /**
   * Randomly injects or recovers anomalies to simulate realistic transient faults.
   * Call once per simulation round.
   *
   * Probabilities:
   * - A normal device has a 2% chance of entering anomaly each round.
   * - An anomalous device has a 15% chance of recovering each round.
   * - The forced device is never automatically recovered.
   */
  tick(allDeviceIds: string[]): void {
    for (const id of allDeviceIds) {
      // Never auto-recover the forced device
      if (id === this.forcedDeviceId) continue;

      if (this.active.has(id)) {
        // 15% chance of recovery
        if (Math.random() < 0.15) {
          this.active.delete(id);
          logger.info('anomaly_recovered', { deviceId: id });
        }
      } else {
        // 2% chance of new anomaly
        if (Math.random() < 0.02) {
          this.active.add(id);
          logger.info('anomaly_started', { deviceId: id });
        }
      }
    }
  }
}
