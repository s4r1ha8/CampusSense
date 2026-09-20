# Project Specification

## Project Objective
Develop an AWS cloud-based IoT sensor monitoring system (CampusSense) for VIT Chennai, simulating temperature and humidity monitoring across various campus locations.

## Problem Statement
A campus needs real-time environmental monitoring to ensure the safety and comfort of students, staff, and equipment (e.g., in server rooms or laboratories). Real hardware deployment is out of scope; thus, a scalable simulated solution using AWS is required.

## Requirements
1. Collect temperature and humidity data from 50 simulated IoT devices.
2. Process and validate incoming sensor data using serverless functions.
3. Store sensor readings for historical analysis.
4. Provide a REST API for the frontend dashboard to fetch sensor data.
5. Develop a React web dashboard showing current and historical readings.
6. Detect abnormal temperature conditions and generate notifications.
7. Monitor application health, errors, and system activity.
8. The architecture must be scalable to support more sensors later.
9. Avoid continuously running servers or expensive infrastructure.

## Assumptions & Constraints
- **No Physical Hardware:** All sensors are simulated.
- **AWS Free Tier:** The project uses an AWS Free Tier/student account. All services and usage must be minimized to avoid costs.
- **Simulated Interval:** Sensors emit data every 10 minutes.
- **Security:** In this initial academic MVP phase, complex frontend user authentication (e.g., Cognito) may be omitted to prioritize core IoT workflows.

## Scope
Includes building the simulator, configuring AWS IoT Core, setting up Lambda processors, DynamoDB tables, an API Gateway, and a React frontend hosted on S3.

## Non-Goals
- Real physical sensor integration.
- Complex user management/authentication (Cognito).
- Highly complex ML-based anomaly detection (SageMaker).
