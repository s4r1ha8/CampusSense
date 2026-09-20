/** Shared TypeScript types for the frontend. Must match backend data models. */

export type DeviceType   = 'LABORATORY' | 'CLASSROOM' | 'SERVER_ROOM' | 'WORKSHOP';
export type DeviceStatus = 'NORMAL' | 'ALERT' | 'OFFLINE';
export type AlertState   = 'TRIGGERED' | 'SUSTAINED' | 'RECOVERED';

export interface Device {
  deviceId:                string;
  locationName:            string;
  building:                string;
  room:                    string;
  type:                    DeviceType;
  temperatureThresholdC:   number;
  humidityThresholdPercent: number;
  enabled:                 boolean;
}

export interface CurrentReading {
  deviceId:    string;
  temperature: number;
  humidity:    number;
  status:      DeviceStatus;
  lastSeenAt:  string;
}

export interface HistoryReading {
  deviceId:    string;
  timestamp:   string;
  temperature: number;
  humidity:    number;
  status:      DeviceStatus;
}

export interface Alert {
  alertId:      string;
  deviceId:     string;
  locationName: string;
  building:     string;
  metric:       'temperature' | 'humidity';
  value:        number;
  threshold:    number;
  state:        AlertState;
  timestamp:    string;
  resolvedAt?:  string;
}

export interface SystemStats {
  metricId:          string;
  totalMessages:     number;
  validMessages:     number;
  invalidMessages:   number;
  processedMessages: number;
  alertsGenerated:   number;
  recoveries:        number;
  processingErrors:  number;
  lastProcessedAt:   string;
  lastErrorAt:       string;
  lastErrorMessage:  string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  { code: string; message: string };
}

export interface DashboardSummary {
  totalLocations:    number;
  onlineLocations:   number;
  activeAlerts:      number;
  avgTemperature:    number;
  avgHumidity:       number;
}
