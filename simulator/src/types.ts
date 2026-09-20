/** Shared type definitions for the CampusSense simulator */

export type DeviceType = 'LABORATORY' | 'CLASSROOM' | 'SERVER_ROOM' | 'WORKSHOP';

export type DeviceStatus = 'NORMAL' | 'ALERT' | 'OFFLINE';

export interface DeviceConfig {
  deviceId: string;
  locationName: string;
  building: string;
  room: string;
  type: DeviceType;
  temperatureThresholdC: number;
  humidityThresholdPercent: number;
}

export interface TelemetryPayload {
  deviceId: string;
  timestamp: string;       // ISO-8601
  temperature: number;     // Celsius, 2 decimal places
  humidity: number;        // Percent, 2 decimal places
  messageId: string;       // UUID
}

export interface DeviceState {
  config: DeviceConfig;
  currentStatus: DeviceStatus;
  lastTemperature: number;
  lastHumidity: number;
  inAnomaly: boolean;
  anomalyStartTime?: string;
}

export interface SimulatorOptions {
  intervalMs: number;
  once: boolean;
  durationMinutes?: number;
  anomalyDeviceId?: string;
}
