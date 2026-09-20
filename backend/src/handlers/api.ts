/**
 * api.ts — API Gateway HTTP API Lambda handler
 *
 * Handles REST API requests from the React frontend.
 * Uses a simple manual router to avoid heavy framework dependencies in Lambda.
 *
 * Routes handled:
 *   GET  /api/v1/health
 *   GET  /api/v1/devices
 *   GET  /api/v1/readings/latest
 *   GET  /api/v1/readings/history   ?deviceId=X&hours=24
 *   GET  /api/v1/alerts             ?hours=48
 *   GET  /api/v1/system
 *   POST /api/v1/telemetry
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

import {
  DynamoDeviceRepository,
  DynamoReadingRepository,
  DynamoCurrentRepository,
  DynamoAlertRepository,
  DynamoStatisticsRepository,
} from '../adapters/dynamodb/index.js';

import { SnsNotificationService }    from '../adapters/sns/index.js';
import { CloudWatchLogger }          from '../adapters/logging/index.js';
import { TelemetryService }          from '../services/telemetry-service.js';
import { AlertService }              from '../services/alert-service.js';
import { StatisticsService }         from '../services/statistics-service.js';
import { env }                       from '../config/environment.js';

// ─── Dependency wiring ─────────────────────────────────────────────────────

const logger    = new CloudWatchLogger();
const deviceRepo  = new DynamoDeviceRepository();
const readingRepo = new DynamoReadingRepository();
const currentRepo = new DynamoCurrentRepository();
const alertRepo   = new DynamoAlertRepository();
const statsRepo   = new DynamoStatisticsRepository();
const notifSvc    = new SnsNotificationService(env.snsTopicArn, env.awsRegion);

const alertSvc    = new AlertService(alertRepo, currentRepo, notifSvc, logger);
const statsSvc    = new StatisticsService(statsRepo);
const telemetrySvc = new TelemetryService(deviceRepo, readingRepo, currentRepo, alertSvc, statsSvc, logger);

// ─── Response helpers ──────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

function ok(data: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ success: true, data }) };
}

function err(code: string, message: string, status = 400): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: { code, message } }) };
}

// ─── Handler ───────────────────────────────────────────────────────────────

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method.toUpperCase();
  const path   = event.rawPath ?? '';
  const qs     = event.queryStringParameters ?? {};

  logger.info('api_request', { method, path });

  // CORS pre-flight
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    // ── GET /api/v1/health ───────────────────────────────────────────────
    if (method === 'GET' && path.endsWith('/health')) {
      return ok({ status: 'ok', timestamp: new Date().toISOString(), region: env.awsRegion });
    }

    // ── GET /api/v1/devices ──────────────────────────────────────────────
    if (method === 'GET' && path.endsWith('/devices')) {
      const devices = await deviceRepo.listAll();
      return ok(devices);
    }

    // ── GET /api/v1/readings/latest ──────────────────────────────────────
    if (method === 'GET' && path.endsWith('/readings/latest')) {
      const readings = await currentRepo.listAll();
      return ok(readings);
    }

    // ── GET /api/v1/readings/history ─────────────────────────────────────
    if (method === 'GET' && path.endsWith('/readings/history')) {
      const deviceId = qs['deviceId'];
      if (!deviceId) return err('MISSING_PARAM', 'deviceId query parameter is required');
      const hours = parseInt(qs['hours'] ?? '24', 10);
      const readings = await readingRepo.listByDevice(deviceId, hours);
      return ok(readings);
    }

    // ── GET /api/v1/alerts ───────────────────────────────────────────────
    if (method === 'GET' && path.endsWith('/alerts')) {
      const hours  = parseInt(qs['hours'] ?? '48', 10);
      const alerts = await alertRepo.listRecent(env.campusId, hours);
      return ok(alerts);
    }

    // ── GET /api/v1/system ───────────────────────────────────────────────
    if (method === 'GET' && path.endsWith('/system')) {
      const stats = await statsSvc.get();
      return ok(stats);
    }

    // ── POST /api/v1/telemetry ───────────────────────────────────────────
    if (method === 'POST' && path.endsWith('/telemetry')) {
      let body: unknown;
      try {
        body = JSON.parse(event.body ?? '');
      } catch {
        return err('INVALID_JSON', 'Request body is not valid JSON');
      }

      const result = await telemetrySvc.process(body);

      if (!result.success) {
        return err('PROCESSING_FAILED', result.error ?? 'Processing failed', 422);
      }

      return ok(result, 201);
    }

    // ── 404 ──────────────────────────────────────────────────────────────
    return err('NOT_FOUND', `Route not found: ${method} ${path}`, 404);
  } catch (e) {
    logger.error('api_error', { error: String(e), path, method });
    return err('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}
