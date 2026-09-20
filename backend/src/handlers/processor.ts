/**
 * processor.ts — IoT Rule Lambda handler
 *
 * This handler is triggered by an AWS IoT Rule each time a message arrives
 * on the 'campus/telemetry/+' topic. The IoT Rule extracts the full MQTT
 * JSON payload and passes it directly as the Lambda event.
 *
 * The handler itself is intentionally thin — all business logic lives in
 * TelemetryService so it can be unit-tested without Lambda or IoT Core.
 */

import {
  DynamoDeviceRepository,
  DynamoReadingRepository,
  DynamoCurrentRepository,
  DynamoAlertRepository,
  DynamoStatisticsRepository,
} from '../adapters/dynamodb/index.js';

import { SnsNotificationService } from '../adapters/sns/index.js';
import { CloudWatchLogger }       from '../adapters/logging/index.js';
import { TelemetryService }       from '../services/telemetry-service.js';
import { AlertService }           from '../services/alert-service.js';
import { StatisticsService }      from '../services/statistics-service.js';
import { env }                    from '../config/environment.js';

// ─── Dependency wiring ─────────────────────────────────────────────────────
// All adapters are instantiated once per cold start (not per invocation).

const logger = new CloudWatchLogger();

const deviceRepo  = new DynamoDeviceRepository();
const readingRepo = new DynamoReadingRepository();
const currentRepo = new DynamoCurrentRepository();
const alertRepo   = new DynamoAlertRepository();
const statsRepo   = new DynamoStatisticsRepository();
const notifSvc    = new SnsNotificationService(env.snsTopicArn, env.awsRegion);

const alertSvc   = new AlertService(alertRepo, currentRepo, notifSvc, logger);
const statsSvc   = new StatisticsService(statsRepo);
const telemetrySvc = new TelemetryService(deviceRepo, readingRepo, currentRepo, alertSvc, statsSvc, logger);

// ─── Handler ───────────────────────────────────────────────────────────────

export async function handler(event: unknown): Promise<void> {
  logger.info('processor_invoked', { event: JSON.stringify(event).slice(0, 500) });

  try {
    const result = await telemetrySvc.process(event);

    if (!result.success) {
      logger.warn('processing_rejected', { error: result.error });
    }
  } catch (err) {
    logger.error('processor_fatal', { error: String(err) });
    // Re-throw so the IoT Rule can retry (optional based on IoT Rule error action config)
    throw err;
  }
}
