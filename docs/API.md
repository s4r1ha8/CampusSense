# REST API Specification

The API is exposed via Amazon API Gateway (HTTP API) and backed by AWS Lambda.

## Endpoints

### `GET /api/v1/health`
Checks API health.
- **Response:** `{ "status": "ok", "timestamp": "..." }`

### `GET /api/v1/devices`
Returns a list of all registered sensors and their metadata.
- **Response:** `[{ "deviceId": "LAB-01", "locationName": "...", ... }]`

### `GET /api/v1/readings/latest`
Returns the most recent readings for all devices (from CampusCurrent).
- **Response:** `[{ "deviceId": "LAB-01", "temperature": 25.4, "status": "NORMAL" ... }]`

### `GET /api/v1/readings/history?deviceId={id}&hours={n}`
Returns the historical time-series data for a specific device.
- **Response:** `[{ "timestamp": "...", "temperature": 24.1, "humidity": 50 }, ...]`

### `GET /api/v1/alerts`
Returns recent active and resolved alerts.
- **Response:** `[{ "alertId": "...", "deviceId": "LAB-01", "value": 35, "threshold": 32, "resolved": false }]`

### `GET /api/v1/system`
Returns high-level system statistics (from CampusSystemStats).
- **Response:** `{ "processedReadings": 1500, "activeAlerts": 2, "lastProcessed": "..." }`

### `POST /api/v1/telemetry`
*(Optional/Future)* Allows pushing telemetry via HTTP instead of MQTT for testing.
