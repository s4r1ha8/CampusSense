/**
 * Unit tests for the telemetry validator.
 * No AWS credentials or network calls required.
 */

import { describe, it, expect } from 'vitest';
import { validateTelemetry }     from '../src/validators/telemetry-validator.js';

const VALID_PAYLOAD = {
  deviceId:    'LAB-01',
  timestamp:   '2026-09-18T17:30:00.000Z',
  temperature: 27.4,
  humidity:    63.2,
  messageId:   'abc123',
};

describe('validateTelemetry', () => {
  it('accepts a valid payload', () => {
    const r = validateTelemetry(VALID_PAYLOAD);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('rejects null', () => {
    expect(validateTelemetry(null).valid).toBe(false);
  });

  it('rejects missing deviceId', () => {
    const r = validateTelemetry({ ...VALID_PAYLOAD, deviceId: '' });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('MISSING_DEVICE_ID');
  });

  it('rejects missing messageId', () => {
    const { messageId, ...rest } = VALID_PAYLOAD;
    const r = validateTelemetry(rest);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('MISSING_MESSAGE_ID');
  });

  it('rejects missing timestamp', () => {
    const { timestamp, ...rest } = VALID_PAYLOAD;
    const r = validateTelemetry(rest);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('MISSING_TIMESTAMP');
  });

  it('rejects malformed timestamp', () => {
    const r = validateTelemetry({ ...VALID_PAYLOAD, timestamp: 'not-a-date' });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('INVALID_TIMESTAMP');
  });

  it('rejects missing temperature', () => {
    const { temperature, ...rest } = VALID_PAYLOAD;
    const r = validateTelemetry(rest);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('MISSING_TEMPERATURE');
  });

  it('rejects non-numeric temperature', () => {
    const r = validateTelemetry({ ...VALID_PAYLOAD, temperature: 'hot' });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('INVALID_TEMPERATURE');
  });

  it('rejects out-of-range temperature (>85)', () => {
    const r = validateTelemetry({ ...VALID_PAYLOAD, temperature: 200 });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('OUT_OF_RANGE_TEMPERATURE');
  });

  it('rejects missing humidity', () => {
    const { humidity, ...rest } = VALID_PAYLOAD;
    const r = validateTelemetry(rest);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('MISSING_HUMIDITY');
  });

  it('rejects impossible humidity (>100)', () => {
    const r = validateTelemetry({ ...VALID_PAYLOAD, humidity: 110 });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('OUT_OF_RANGE_HUMIDITY');
  });

  it('rejects negative humidity', () => {
    const r = validateTelemetry({ ...VALID_PAYLOAD, humidity: -5 });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('OUT_OF_RANGE_HUMIDITY');
  });

  it('accepts boundary temperature 85', () => {
    const r = validateTelemetry({ ...VALID_PAYLOAD, temperature: 85 });
    expect(r.valid).toBe(true);
  });

  it('accepts boundary humidity 100', () => {
    const r = validateTelemetry({ ...VALID_PAYLOAD, humidity: 100 });
    expect(r.valid).toBe(true);
  });
});
