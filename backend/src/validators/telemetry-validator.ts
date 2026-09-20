import { TelemetryPayload } from '../models/telemetry.js';

/** Validation error codes used in API error responses. */
export type ValidationErrorCode =
  | 'MISSING_DEVICE_ID'
  | 'MISSING_TIMESTAMP'
  | 'INVALID_TIMESTAMP'
  | 'MISSING_TEMPERATURE'
  | 'INVALID_TEMPERATURE'
  | 'OUT_OF_RANGE_TEMPERATURE'
  | 'MISSING_HUMIDITY'
  | 'INVALID_HUMIDITY'
  | 'OUT_OF_RANGE_HUMIDITY'
  | 'MISSING_MESSAGE_ID'
  | 'MALFORMED_PAYLOAD';

export interface ValidationResult {
  valid:   boolean;
  errors:  ValidationErrorCode[];
}

/**
 * Validates an incoming telemetry payload.
 *
 * Accepted ranges (based on realistic campus IoT sensor operating specs):
 *   temperature:  -10 °C  to  85 °C
 *   humidity:       0 %   to  100 %
 *
 * These are intentionally wide to accommodate workshops and server rooms.
 * Business-level threshold checks (e.g., > 32°C triggers alert) are done
 * separately in the alert service.
 */
export function validateTelemetry(raw: unknown): ValidationResult {
  const errors: ValidationErrorCode[] = [];

  if (raw === null || typeof raw !== 'object') {
    return { valid: false, errors: ['MALFORMED_PAYLOAD'] };
  }

  const payload = raw as Record<string, unknown>;

  // deviceId
  if (!payload['deviceId']) {
    errors.push('MISSING_DEVICE_ID');
  }

  // timestamp
  if (!payload['timestamp']) {
    errors.push('MISSING_TIMESTAMP');
  } else if (typeof payload['timestamp'] !== 'string' || isNaN(Date.parse(payload['timestamp'] as string))) {
    errors.push('INVALID_TIMESTAMP');
  }

  // messageId
  if (!payload['messageId']) {
    errors.push('MISSING_MESSAGE_ID');
  }

  // temperature
  if (payload['temperature'] === undefined || payload['temperature'] === null) {
    errors.push('MISSING_TEMPERATURE');
  } else if (typeof payload['temperature'] !== 'number' || isNaN(payload['temperature'] as number)) {
    errors.push('INVALID_TEMPERATURE');
  } else {
    const t = payload['temperature'] as number;
    if (t < -10 || t > 85) errors.push('OUT_OF_RANGE_TEMPERATURE');
  }

  // humidity
  if (payload['humidity'] === undefined || payload['humidity'] === null) {
    errors.push('MISSING_HUMIDITY');
  } else if (typeof payload['humidity'] !== 'number' || isNaN(payload['humidity'] as number)) {
    errors.push('INVALID_HUMIDITY');
  } else {
    const h = payload['humidity'] as number;
    if (h < 0 || h > 100) errors.push('OUT_OF_RANGE_HUMIDITY');
  }

  return { valid: errors.length === 0, errors };
}
