import { randomUUID } from 'crypto';
import { DeviceManager } from './device-manager.js';
import { AnomalyManager } from './anomaly-manager.js';
import { generateReading } from './sensor-generator.js';
import { IMqttClient } from './mqtt-client.js';
import { TelemetryPayload, SimulatorOptions } from './types.js';
import { logger } from './logger.js';

/**
 * Core simulation engine.
 *
 * Responsibilities:
 * - Iterate over all 50 virtual devices each round.
 * - Generate realistic readings using sensor-generator.
 * - Inject anomalies through anomaly-manager.
 * - Publish telemetry via the provided MQTT client.
 */
export class Simulator {
  private deviceManager: DeviceManager;
  private anomalyManager: AnomalyManager;
  private mqttClient: IMqttClient;
  private options: SimulatorOptions;
  private roundCount = 0;

  constructor(
    deviceManager: DeviceManager,
    anomalyManager: AnomalyManager,
    mqttClient: IMqttClient,
    options: SimulatorOptions,
  ) {
    this.deviceManager  = deviceManager;
    this.anomalyManager = anomalyManager;
    this.mqttClient     = mqttClient;
    this.options        = options;
  }

  /**
   * Runs a single simulation round.
   * Generates readings for all devices and publishes them.
   */
  async runRound(): Promise<TelemetryPayload[]> {
    this.roundCount++;
    const allIds = this.deviceManager.ids();
    this.anomalyManager.tick(allIds);

    const payloads: TelemetryPayload[] = [];
    const timestamp = new Date().toISOString();

    for (const state of this.deviceManager.all()) {
      const inAnomaly = this.anomalyManager.isActive(state.config.deviceId);

      const previous = state.lastTemperature !== 0
        ? { temperature: state.lastTemperature, humidity: state.lastHumidity }
        : undefined;

      const reading = generateReading(state.config.type, previous, inAnomaly);

      this.deviceManager.update(state.config.deviceId, reading.temperature, reading.humidity, inAnomaly);

      const payload: TelemetryPayload = {
        deviceId:    state.config.deviceId,
        timestamp,
        temperature: reading.temperature,
        humidity:    reading.humidity,
        messageId:   randomUUID(),
      };

      payloads.push(payload);

      try {
        await this.mqttClient.publish(payload);
      } catch (err) {
        logger.error('publish_failed', { deviceId: payload.deviceId, error: String(err) });
      }
    }

    logger.info('round_complete', {
      round:         this.roundCount,
      devicesPublished: payloads.length,
      anomalousDevices: allIds.filter(id => this.anomalyManager.isActive(id)).length,
    });

    return payloads;
  }

  /** Returns the number of rounds completed so far. */
  get rounds(): number {
    return this.roundCount;
  }
}
