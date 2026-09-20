import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import mqtt from 'aws-iot-device-sdk-v2';
import { TelemetryPayload } from './types.js';
import { config, isAwsConfigured } from './config.js';
import { logger } from './logger.js';

const { iot, mqtt: mqttLib } = mqtt;

/**
 * MqttClient wraps the AWS IoT Device SDK v2 connection.
 *
 * Separation of concerns:
 *   - All AWS-specific MQTT/TLS logic lives ONLY in this file.
 *   - The rest of the simulator uses the publish() method and does not
 *     know whether it is talking to a real broker or a no-op.
 */
export class MqttClient {
  private connection?: mqtt.mqtt.MqttClientConnection;
  private connected = false;

  /**
   * Establishes a TLS connection to AWS IoT Core.
   * Throws a descriptive error when configuration is missing.
   */
  async connect(): Promise<void> {
    if (!isAwsConfigured()) {
      throw new Error(
        'AWS IoT configuration is incomplete. ' +
        'Please copy simulator/.env.example to simulator/.env and fill in all values.\n' +
        'Required variables: AWS_IOT_ENDPOINT, AWS_IOT_CERTIFICATE_PATH, AWS_IOT_PRIVATE_KEY_PATH, AWS_IOT_CA_PATH',
      );
    }

    this.validateCertPaths();

    const builder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
      config.certificatePath,
      config.privateKeyPath,
    );

    builder.with_certificate_authority_from_path(undefined, config.caPath);
    builder.with_clean_session(true);
    builder.with_client_id(config.clientId);
    builder.with_endpoint(config.iotEndpoint);

    const mqttClient = new mqttLib.MqttClient();
    this.connection = mqttClient.new_connection(builder.build());

    await this.connection.connect();
    this.connected = true;
    logger.info('mqtt_connected', { endpoint: config.iotEndpoint, clientId: config.clientId });
  }

  /** Publishes a telemetry payload to the correct topic. */
  async publish(payload: TelemetryPayload): Promise<void> {
    if (!this.connected || !this.connection) {
      throw new Error('MQTT client is not connected. Call connect() first.');
    }

    const topic   = config.topicTemplate.replace('{deviceId}', payload.deviceId);
    const message = JSON.stringify(payload);

    await this.connection.publish(topic, message, mqttLib.QoS.AtLeastOnce);
    logger.debug('mqtt_published', { topic, deviceId: payload.deviceId });
  }

  /** Gracefully disconnects from AWS IoT Core. */
  async disconnect(): Promise<void> {
    if (this.connected && this.connection) {
      await this.connection.disconnect();
      this.connected = false;
      logger.info('mqtt_disconnected');
    }
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  private validateCertPaths(): void {
    const paths = [config.certificatePath, config.privateKeyPath, config.caPath];
    for (const p of paths) {
      if (!existsSync(p)) {
        throw new Error(
          `Certificate file not found: ${p}\n` +
          'Download your IoT certificates from the AWS Console and place them in simulator/certs/.',
        );
      }
    }
  }
}

/**
 * A no-op MQTT client used during local testing and dry-run mode.
 * Implements the same interface as MqttClient so the simulator code is unchanged.
 */
export class MockMqttClient {
  published: Array<{ topic: string; payload: TelemetryPayload }> = [];

  async connect(): Promise<void> {
    logger.info('mock_mqtt_connected');
  }

  async publish(payload: TelemetryPayload): Promise<void> {
    const topic = config.topicTemplate.replace('{deviceId}', payload.deviceId);
    this.published.push({ topic, payload });
    logger.debug('mock_mqtt_published', { topic, deviceId: payload.deviceId, temperature: payload.temperature, humidity: payload.humidity });
  }

  async disconnect(): Promise<void> {
    logger.info('mock_mqtt_disconnected');
  }
}

export type IMqttClient = Pick<MqttClient, 'connect' | 'publish' | 'disconnect'>;
