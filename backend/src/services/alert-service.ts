import { randomUUID } from 'crypto';
import { Alert, AlertState, CurrentReading, Device } from '../models/telemetry.js';
import { AlertRepository, CurrentRepository } from '../repositories/index.js';
import { NotificationService } from '../adapters/sns/index.js';
import { Logger } from '../adapters/logging/index.js';
import { env } from '../config/environment.js';

/**
 * Alert State Machine
 * ───────────────────
 * NORMAL  →  (temp > threshold)  →  ALERT     (notification sent, alert record created)
 * ALERT   →  (temp > threshold)  →  ALERT     (NO notification — prevents spam)
 * ALERT   →  (temp ≤ threshold)  →  RECOVERED (recovery notification, alert updated)
 * NORMAL  →  (temp ≤ threshold)  →  NORMAL    (no action)
 */
export class AlertService {
  constructor(
    private alertRepo:     AlertRepository,
    private currentRepo:   CurrentRepository,
    private notifications: NotificationService,
    private logger:        Logger,
  ) {}

  /**
   * Evaluates the alert state for a single device reading.
   * Returns whether an alert was triggered or recovered.
   */
  async evaluate(params: {
    device:      Device;
    temperature: number;
    humidity:    number;
    timestamp:   string;
    current:     CurrentReading | null;
  }): Promise<{ triggered: boolean; recovered: boolean }> {
    const { device, temperature, humidity, timestamp, current } = params;

    const tempExceeded = temperature > device.temperatureThresholdC;
    const humExceeded  = humidity    > device.humidityThresholdPercent;
    const exceeded     = tempExceeded || humExceeded;

    const previousStatus = current?.status ?? 'NORMAL';

    // Determine primary metric for alert message
    const primaryMetric  = tempExceeded ? 'temperature' : 'humidity';
    const primaryValue   = tempExceeded ? temperature   : humidity;
    const primaryThresh  = tempExceeded
      ? device.temperatureThresholdC
      : device.humidityThresholdPercent;

    let triggered = false;
    let recovered = false;

    if (exceeded && previousStatus === 'NORMAL') {
      // New alert — transition NORMAL → ALERT
      const alert = this.buildAlert({ device, metric: primaryMetric, value: primaryValue, threshold: primaryThresh, timestamp, state: 'TRIGGERED' });
      await this.alertRepo.save(alert);

      await this.notifications.sendAlert({
        deviceId:     device.deviceId,
        locationName: device.locationName,
        building:     device.building,
        metric:       primaryMetric,
        value:        primaryValue,
        threshold:    primaryThresh,
        timestamp,
      });

      this.logger.warn('alert_triggered', { deviceId: device.deviceId, metric: primaryMetric, value: primaryValue, threshold: primaryThresh });
      triggered = true;
    } else if (exceeded && previousStatus === 'ALERT') {
      // Sustained alert — record SUSTAINED, do NOT send notification again
      const alert = this.buildAlert({ device, metric: primaryMetric, value: primaryValue, threshold: primaryThresh, timestamp, state: 'SUSTAINED' });
      await this.alertRepo.save(alert);
      this.logger.info('alert_sustained', { deviceId: device.deviceId, metric: primaryMetric, value: primaryValue });
    } else if (!exceeded && previousStatus === 'ALERT') {
      // Recovery — transition ALERT → NORMAL
      const alert = this.buildAlert({ device, metric: primaryMetric, value: primaryValue, threshold: primaryThresh, timestamp, state: 'RECOVERED', resolvedAt: timestamp });
      await this.alertRepo.save(alert);
      this.logger.info('alert_recovered', { deviceId: device.deviceId, metric: primaryMetric, value: primaryValue });
      recovered = true;
    }

    return { triggered, recovered };
  }

  /** Derives the DeviceStatus string from threshold evaluation. */
  static deriveStatus(
    temperature: number,
    humidity:    number,
    device:      Device,
  ): 'NORMAL' | 'ALERT' {
    if (temperature > device.temperatureThresholdC) return 'ALERT';
    if (humidity    > device.humidityThresholdPercent) return 'ALERT';
    return 'NORMAL';
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private buildAlert(p: {
    device:      Device;
    metric:      'temperature' | 'humidity';
    value:       number;
    threshold:   number;
    timestamp:   string;
    state:       AlertState;
    resolvedAt?: string;
  }): Alert {
    const alertId = randomUUID();
    return {
      campusId:     env.campusId,
      sk:           `${p.timestamp}#${alertId}`,
      alertId,
      deviceId:     p.device.deviceId,
      locationName: p.device.locationName,
      building:     p.device.building,
      metric:       p.metric,
      value:        p.value,
      threshold:    p.threshold,
      state:        p.state,
      timestamp:    p.timestamp,
      resolvedAt:   p.resolvedAt,
    };
  }
}
