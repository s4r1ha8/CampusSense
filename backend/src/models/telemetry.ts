/** Core data models used across the backend. */

export type DeviceType   = 'LABORATORY' | 'CLASSROOM' | 'SERVER_ROOM' | 'WORKSHOP';
export type DeviceStatus = 'NORMAL' | 'ALERT' | 'OFFLINE';
export type AlertState   = 'TRIGGERED' | 'SUSTAINED' | 'RECOVERED';

// ─── Telemetry ─────────────────────────────────────────────────────────────

/** Raw payload received from IoT Core (or POST /api/v1/telemetry). */
export interface TelemetryPayload {
  deviceId:    string;
  timestamp:   string;   // ISO-8601
  temperature: number;
  humidity:    number;
  messageId:   string;
}

// ─── Device ────────────────────────────────────────────────────────────────

/** Static device/location configuration stored in CampusDevices. */
export interface Device {
  deviceId:                string;
  locationName:            string;
  building:                string;
  room:                    string;
  type:                    DeviceType;
  temperatureThresholdC:   number;
  humidityThresholdPercent: number;
  enabled:                 boolean;
  createdAt:               string;
}

// ─── Reading ───────────────────────────────────────────────────────────────

/** One historical reading stored in CampusReadings. */
export interface Reading {
  deviceId:    string;
  timestamp:   string;
  temperature: number;
  humidity:    number;
  status:      DeviceStatus;
  messageId:   string;
  expiresAt:   number;   // Unix epoch seconds — DynamoDB TTL field
}

// ─── Current State ─────────────────────────────────────────────────────────

/** Latest snapshot stored in CampusCurrent. */
export interface CurrentReading {
  deviceId:    string;
  temperature: number;
  humidity:    number;
  status:      DeviceStatus;
  lastSeenAt:  string;
  messageId:   string;
}

// ─── Alert ─────────────────────────────────────────────────────────────────

/** Alert event stored in CampusAlerts. */
export interface Alert {
  campusId:      string;          // PK — always 'VIT-CHENNAI'
  sk:            string;          // SK — `{timestamp}#{alertId}`
  alertId:       string;
  deviceId:      string;
  locationName:  string;
  building:      string;
  metric:        'temperature' | 'humidity';
  value:         number;
  threshold:     number;
  state:         AlertState;
  timestamp:     string;
  resolvedAt?:   string;
}

// ─── Statistics ────────────────────────────────────────────────────────────

/** Aggregate counters stored in CampusSystemStats. */
export interface SystemStats {
  metricId:           string;   // PK — always 'GLOBAL'
  totalMessages:      number;
  validMessages:      number;
  invalidMessages:    number;
  processedMessages:  number;
  alertsGenerated:    number;
  recoveries:         number;
  processingErrors:   number;
  lastProcessedAt:    string;
  lastErrorAt:        string;
  lastErrorMessage:   string;
}

// ─── Processing result ─────────────────────────────────────────────────────

/** Internal result returned by the telemetry service after processing one payload. */
export interface ProcessingResult {
  success:         boolean;
  deviceId?:       string;
  status?:         DeviceStatus;
  alertTriggered?: boolean;
  alertRecovered?: boolean;
  error?:          string;
}
