# Data Model

The project utilizes Amazon DynamoDB for all data storage, optimizing for NoSQL scale and minimal cost.

## Proposed Tables

### 1. CampusDevices
Stores static information about each virtual device.
- **PK (Partition Key):** `deviceId` (String)
- **Attributes:** `locationName`, `building`, `room`, `type`, `temperatureThresholdC`, `humidityThresholdPercent`

*Reasoning:* Needed to enrich telemetry data and provide frontend metadata about locations.

### 2. CampusReadings
Stores time-series historical telemetry data.
- **PK:** `deviceId` (String)
- **SK (Sort Key):** `timestamp` (String, ISO-8601 or Epoch)
- **Attributes:** `temperature`, `humidity`
- **TTL Attribute:** `expiresAt` (Number, for automatic data cleanup after X days)

*Reasoning:* Required for generating historical charts on the dashboard. Using a sort key on timestamp allows efficient time-range queries. TTL will be used to control storage costs.

### 3. CampusCurrent
Stores the most recent reading for each device.
- **PK:** `deviceId` (String)
- **Attributes:** `temperature`, `humidity`, `timestamp`, `status` (String: NORMAL, ALERT, OFFLINE)

*Reasoning:* Ensures the dashboard can fetch the immediate "current state" of the entire campus quickly without querying large history tables.

### 4. CampusAlerts
Logs instances when thresholds are breached.
- **PK:** `campusId` (String, e.g., 'VIT-CHENNAI')
- **SK:** `timestamp#alertId` (String)
- **Attributes:** `deviceId`, `metric`, `value`, `threshold`, `resolved` (Boolean)

*Reasoning:* Provides a log of actionable alerts for the dashboard and system administrators.

### 5. CampusSystemStats
Stores aggregated statistics for system monitoring.
- **PK:** `metricId` (String, e.g., 'TOTAL_READINGS', 'TOTAL_ALERTS')
- **Attributes:** `count` (Number), `lastUpdated` (String)

*Reasoning:* Allows the frontend to quickly show high-level system metrics without performing expensive count queries on large tables.

## Notes
- Advanced DynamoDB features like Global Secondary Indexes (GSIs) are omitted initially to keep costs and complexity low, fitting the college mini-project constraints.
