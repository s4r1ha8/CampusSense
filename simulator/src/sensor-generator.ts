import { DeviceType } from './types.js';

/**
 * Temperature and humidity baseline ranges per device type.
 * Values represent realistic environmental conditions.
 */
const BASELINES: Record<DeviceType, { tempMin: number; tempMax: number; humMin: number; humMax: number }> = {
  LABORATORY:   { tempMin: 22, tempMax: 30, humMin: 45, humMax: 70 },
  CLASSROOM:    { tempMin: 22, tempMax: 30, humMin: 45, humMax: 72 },
  SERVER_ROOM:  { tempMin: 17, tempMax: 20, humMin: 38, humMax: 50 },
  WORKSHOP:     { tempMin: 26, tempMax: 34, humMin: 48, humMax: 78 },
};

/** Anomaly boost — how many degrees/percent to add when simulating a fault. */
const ANOMALY_BOOST = {
  temperatureC: 12,
  humidityPercent: 20,
};

/** Maximum random drift between consecutive readings. */
const DRIFT = {
  temperatureC: 0.8,
  humidityPercent: 2.0,
};

/**
 * Generates a single, realistic telemetry reading for a device.
 *
 * @param deviceType  The type of location being simulated.
 * @param previous    The previous temperature/humidity for continuity. Undefined on first reading.
 * @param inAnomaly   When true, values are boosted above normal range to simulate a fault.
 */
export function generateReading(
  deviceType: DeviceType,
  previous: { temperature: number; humidity: number } | undefined,
  inAnomaly: boolean,
): { temperature: number; humidity: number } {
  const base = BASELINES[deviceType];

  let targetTemp: number;
  let targetHum: number;

  if (inAnomaly) {
    // Push values above normal range
    targetTemp = base.tempMax + ANOMALY_BOOST.temperatureC;
    targetHum  = Math.min(base.humMax + ANOMALY_BOOST.humidityPercent, 99);
  } else {
    // Drift toward a random mid-range target
    targetTemp = lerp(base.tempMin, base.tempMax, getRandom());
    targetHum  = lerp(base.humMin, base.humMax, getRandom());
  }

  // If we have a previous reading, add only a small drift toward the target
  const temp = previous
    ? clamp(previous.temperature + drift(DRIFT.temperatureC) * 0.4 + (targetTemp - previous.temperature) * 0.2, base.tempMin - 2, base.tempMax + 15)
    : targetTemp;

  const hum = previous
    ? clamp(previous.humidity + drift(DRIFT.humidityPercent) * 0.4 + (targetHum - previous.humidity) * 0.2, 10, 99)
    : targetHum;

  return {
    temperature: round2(temp),
    humidity:    round2(hum),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRandom(): number {
  return Math.random();
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drift(max: number): number {
  return (Math.random() - 0.5) * 2 * max;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
