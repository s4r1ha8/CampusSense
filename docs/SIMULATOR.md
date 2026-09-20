# Simulator Design

Because this project does not use physical IoT hardware, a Node.js-based simulator acts as the data source.

## Overview
- **Device Count:** 50 virtual devices representing logical campus locations (Laboratories, Classrooms, Server Rooms, Workshops).
- **Interval:** The default data generation interval is 10 minutes per device.
- **Connection:** To minimize connection overhead, the simulator uses a *single* MQTT connection to AWS IoT Core and publishes messages on behalf of all 50 devices sequentially or in batches.

## Behavior Modes
The simulator generates realistic temperature and humidity data using slight random variations around a baseline. It supports injecting anomalies:
1. **Normal State:** Readings fluctuate within normal bounds (e.g., 20-25°C).
2. **Abnormal State:** Spikes above configured thresholds (e.g., Server Room hits 35°C), triggering the backend to issue alerts.
3. **Recovery State:** Returns to normal bounds after an anomaly.

## Configuration
Devices are defined in `simulator/devices.json`, allowing the core simulator logic to remain completely generic. Each definition includes location metadata and specific thresholds for that environment type.
