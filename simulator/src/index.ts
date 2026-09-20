/**
 * CampusSense Virtual Sensor Simulator — Entry point
 *
 * Usage:
 *   npm run simulate                               # Continuous (10-min interval)
 *   npm run simulate -- --once                     # Single round and exit
 *   npm run simulate -- --anomaly=SRV-01           # Force SRV-01 into anomaly
 *   npm run simulate -- --interval=30              # 30-second interval (test mode)
 *   npm run simulate -- --duration=5               # Run for 5 minutes then exit
 *   npm run simulate -- --anomaly=LAB-05 --duration=10
 *
 * Set environment variables in simulator/.env (copy from .env.example).
 * The simulator will run in DRY-RUN / LOG-ONLY mode when AWS credentials
 * are not configured.
 */

import 'dotenv/config';

import { DeviceManager }   from './device-manager.js';
import { AnomalyManager }  from './anomaly-manager.js';
import { Simulator }       from './simulator.js';
import { MqttClient, MockMqttClient, IMqttClient } from './mqtt-client.js';
import { config, isAwsConfigured } from './config.js';
import { logger }          from './logger.js';
import { SimulatorOptions } from './types.js';

// ─── Parse CLI args ───────────────────────────────────────────────────────────

function parseArgs(): SimulatorOptions {
  const args = process.argv.slice(2);

  const get = (flag: string): string | undefined =>
    args.find(a => a.startsWith(`--${flag}=`))?.split('=')[1];

  const has = (flag: string): boolean =>
    args.includes(`--${flag}`);

  const rawInterval   = parseInt(get('interval') ?? String(config.intervalMs / 1000), 10);
  const intervalMs    = rawInterval * 1000;
  const durationMin   = get('duration') ? parseInt(get('duration')!, 10) : undefined;
  const anomalyDevice = get('anomaly');
  const once          = has('once');

  if (intervalMs < 600_000) {
    console.warn(
      '\nWARNING: Short simulation interval is intended for testing.\n' +
      'Frequent telemetry may increase eventual AWS usage.\n',
    );
  }

  return { intervalMs, once, durationMinutes: durationMin, anomalyDeviceId: anomalyDevice };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  logger.info('campussense_simulator_starting');

  const options       = parseArgs();
  const deviceManager = new DeviceManager();
  const anomalyMgr    = new AnomalyManager(options.anomalyDeviceId);

  logger.info('simulator_config', {
    devices:       deviceManager.count,
    intervalMs:    options.intervalMs,
    once:          options.once,
    durationMin:   options.durationMinutes,
    anomalyDevice: options.anomalyDeviceId,
    awsConfigured: isAwsConfigured(),
  });

  // Choose real or mock MQTT transport
  let mqttClient: IMqttClient;
  if (isAwsConfigured()) {
    mqttClient = new MqttClient();
    logger.info('transport_mode', { mode: 'AWS_IOT_CORE' });
  } else {
    mqttClient = new MockMqttClient();
    logger.warn(
      'transport_mode',
      {
        mode:   'DRY_RUN',
        reason: 'AWS IoT environment variables are not set. Running in local log-only mode.',
        hint:   'Copy simulator/.env.example to simulator/.env and fill in your IoT credentials.',
      },
    );
  }

  const simulator = new Simulator(deviceManager, anomalyMgr, mqttClient, options);

  try {
    await mqttClient.connect();

    if (options.once) {
      // Single-round mode
      await simulator.runRound();
      logger.info('once_mode_complete');
    } else {
      // Continuous mode
      const deadlineMs = options.durationMinutes
        ? Date.now() + options.durationMinutes * 60_000
        : Infinity;

      let continueRunning = true;

      process.on('SIGINT',  () => { continueRunning = false; logger.info('shutdown_requested', { signal: 'SIGINT' }); });
      process.on('SIGTERM', () => { continueRunning = false; logger.info('shutdown_requested', { signal: 'SIGTERM' }); });

      while (continueRunning && Date.now() < deadlineMs) {
        await simulator.runRound();

        if (!continueRunning || Date.now() >= deadlineMs) break;

        logger.info('waiting_for_next_round', { intervalMs: options.intervalMs });
        await sleep(options.intervalMs);
      }

      logger.info('simulator_finished', { totalRounds: simulator.rounds });
    }
  } finally {
    await mqttClient.disconnect();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('Fatal simulator error:', err);
  process.exit(1);
});
