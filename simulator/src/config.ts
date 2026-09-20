import 'dotenv/config';

/** All runtime configuration for the simulator, sourced from environment variables. */
export const config = {
  /** AWS IoT Core endpoint — required for real MQTT publishing. */
  iotEndpoint: process.env.AWS_IOT_ENDPOINT ?? '',

  /** MQTT client ID — defaults to 'campus-sense-simulator'. */
  clientId: process.env.AWS_IOT_CLIENT_ID ?? 'campus-sense-simulator',

  /** Path to the device certificate file (.pem.crt). */
  certificatePath: process.env.AWS_IOT_CERTIFICATE_PATH ?? '',

  /** Path to the private key file (.pem.key). */
  privateKeyPath: process.env.AWS_IOT_PRIVATE_KEY_PATH ?? '',

  /** Path to the Amazon Root CA file. */
  caPath: process.env.AWS_IOT_CA_PATH ?? '',

  /** Interval between rounds of telemetry publishing (milliseconds). Default: 600_000 (10 min). */
  intervalMs: parseInt(process.env.SIMULATOR_INTERVAL_MS ?? '600000', 10),

  /** MQTT topic template. {deviceId} is replaced at publish time. */
  topicTemplate: 'campus/telemetry/{deviceId}',

  /** Default campus identifier used in alert records. */
  campusId: 'VIT-CHENNAI',
} as const;

/**
 * Returns true when the four required AWS MQTT settings are all non-empty.
 * The simulator will log a warning and skip MQTT if this is false.
 */
export function isAwsConfigured(): boolean {
  return !!(
    config.iotEndpoint &&
    config.certificatePath &&
    config.privateKeyPath &&
    config.caPath
  );
}
