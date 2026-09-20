# CampusSense — AWS Connection Guide

> **Purpose:** This guide explains exactly what configuration changes will be
> made when connecting the local CampusSense implementation to real AWS services.
> It is a bridge document — the changes described here have **not yet been made**.
> All local values are currently placeholders.

---

## Overview

CampusSense is fully implemented and tested locally. Connecting it to AWS
requires filling in real values in four places:

1. `simulator/.env` — IoT credentials
2. Lambda environment variables — DynamoDB table names and SNS ARN
3. `frontend/.env` — API Gateway URL
4. `simulator/certs/` — X.509 certificate files

No source code changes are required when moving from mock to AWS.

---

## Connection Map

```
LOCAL                                    AWS
─────────────────────────────────────────────────────────────
simulator/.env                           AWS IoT Core
  AWS_IOT_ENDPOINT=<IOT_ENDPOINT>   ──▶  Device data endpoint
  AWS_IOT_CERT_PATH=./certs/...     ──▶  X.509 certificate
  AWS_IOT_KEY_PATH=./certs/...      ──▶  Private key
  AWS_IOT_ROOT_CA_PATH=./certs/...  ──▶  Amazon Root CA 1

simulator (running)                      AWS IoT Core
  Publishes to:                     ──▶  Topic: campus/telemetry/<deviceId>
  campus/telemetry/<deviceId>            Rules Engine matches: campus/telemetry/+

IoT Rules Engine                         Lambda
  Action: invoke                    ──▶  CampusSenseProcessor
  SQL extracts deviceId from topic

CampusSenseProcessor environment         DynamoDB
  TABLE_CAMPUS_DEVICES         ──reads──▶  CampusDevices table
  TABLE_CAMPUS_READINGS        ──writes─▶  CampusReadings table
  TABLE_CAMPUS_CURRENT         ──writes─▶  CampusCurrent table
  TABLE_CAMPUS_ALERTS          ──writes─▶  CampusAlerts table
  TABLE_CAMPUS_SYSTEM_STATS    ──writes─▶  CampusSystemStats table
  SNS_TOPIC_ARN=<SNS_TOPIC_ARN>──▶  CampusSenseAlerts SNS topic

CampusSenseApi environment               DynamoDB
  TABLE_CAMPUS_* (same as above)  ──reads─▶  All five tables

frontend/.env                            API Gateway
  VITE_API_BASE_URL=<API_GW_URL>  ──▶  HTTP API invoke URL
  VITE_USE_MOCK_API=false              (disables mock mode)

S3 bucket (<S3_BUCKET>)                  Browser
  frontend/dist/ uploaded         ──serves─▶  React dashboard
```

---

## Step-by-Step: Activating AWS Connection

### 1. IoT Simulator → AWS IoT Core

**What to do:**
1. In AWS Console, navigate to IoT Core → Manage → Things
2. Create thing `campus-sense-simulator`
3. Create and download certificate (one-click provisioning):
   - `certificate.pem.crt` → save as `simulator/certs/certificate.pem.crt`
   - `private.pem.key` → save as `simulator/certs/private.pem.key`
   - Amazon Root CA 1 → save as `simulator/certs/AmazonRootCA1.pem`
4. Activate the certificate
5. Attach IoT policy `CampusSenseSimulatorPolicy` to the certificate
6. Copy the IoT endpoint from IoT Core → Settings

**Update `simulator/.env`:**
```env
AWS_IOT_ENDPOINT=<IOT_ENDPOINT>
AWS_IOT_CERT_PATH=./certs/certificate.pem.crt
AWS_IOT_KEY_PATH=./certs/private.pem.key
AWS_IOT_ROOT_CA_PATH=./certs/AmazonRootCA1.pem
SIMULATOR_INTERVAL_MS=600000
```

**Effect:** `isAwsConfigured()` returns `true`. The simulator uses the real
`MqttClient` instead of `MockMqttClient` and publishes to AWS IoT Core.

---

### 2. Lambda → DynamoDB

**What to do:**
1. Build the backend: `cd backend && npm run build`
2. Create a zip of `backend/dist/`
3. Create Lambda function `CampusSenseProcessor` in AWS Console
4. Upload the zip
5. Set environment variables:

```
TABLE_CAMPUS_DEVICES    = CampusDevices
TABLE_CAMPUS_READINGS   = CampusReadings
TABLE_CAMPUS_CURRENT    = CampusCurrent
TABLE_CAMPUS_ALERTS     = CampusAlerts
TABLE_CAMPUS_SYSTEM_STATS = CampusSystemStats
SNS_TOPIC_ARN           = <SNS_TOPIC_ARN>
CAMPUS_ID               = VIT-CHENNAI
READING_TTL_DAYS        = 90
AWS_REGION              = <REGION>
```

**Effect:** The Lambda function's `DynamoDB*Repository` adapters connect to
real DynamoDB tables using these environment variables. The
`DynamoDeviceRepository.getById()` reads from `CampusDevices`, etc.

---

### 3. API Lambda → DynamoDB (read path)

**What to do:** Same as above, but for `CampusSenseApi` Lambda function.
Set the same environment variables on this function too.

**Effect:** The API handler (`handlers/api.ts`) reads current readings,
history, alerts, and system stats from real DynamoDB tables.

---

### 4. Frontend → API Gateway

**What to do:**
1. In API Gateway, copy the HTTP API Invoke URL
2. Update `frontend/.env`:

```env
VITE_API_BASE_URL=<API_GATEWAY_URL>
VITE_USE_MOCK_API=false
```

3. Rebuild the frontend: `cd frontend && npm run build`
4. Upload `frontend/dist/` to the S3 bucket

**Effect:** `VITE_USE_MOCK_API=false` causes `frontend/src/services/api.ts`
to make real HTTP requests to `<API_GATEWAY_URL>/api/v1/*`. The MOCK badge
disappears from the sidebar.

---

## Values to Collect from AWS Console

Before starting, collect these values and store them securely (not in Git):

| Value | Where to find it | Used in |
|-------|-----------------|---------|
| `<IOT_ENDPOINT>` | IoT Core → Settings → Device data endpoint | `simulator/.env` |
| `<SNS_TOPIC_ARN>` | SNS → Topics → CampusSenseAlerts → ARN | Lambda env vars |
| `<API_GATEWAY_URL>` | API Gateway → your HTTP API → Invoke URL | `frontend/.env` |
| `<S3_BUCKET>` | S3 → your bucket name | Upload destination |
| `<ACCOUNT_ID>` | AWS Console top-right (12-digit number) | IAM policies |
| `<REGION>` | Your chosen region (e.g., `ap-south-1`) | Lambda env vars |

---

## Files Changed When Connecting to AWS

| File | Change |
|------|--------|
| `simulator/.env` | Fill in real IoT endpoint and certificate paths |
| `simulator/certs/*.pem.crt`, `*.pem.key`, `*.pem` | Add certificate files (never commit these) |
| `frontend/.env` | Set `VITE_API_BASE_URL` to real URL, set `VITE_USE_MOCK_API=false` |
| Lambda env vars (AWS Console) | Fill in table names, SNS ARN, region |

**No source code changes required.**

---

## Verification After Connection

1. Run `npm run simulate:once` — check CloudWatch Logs for `CampusSenseProcessor`
2. Open the frontend (S3 URL) — MOCK badge should be gone
3. Verify 50 locations appear with live data
4. Run `npm run simulate -- --anomaly=SRV-01` — confirm SNS email arrives
5. Check DynamoDB tables in AWS Console for populated records

Full verification checklist: [AWS_CONSOLE_CHECKLIST.md Phase O, P, Q](./AWS_CONSOLE_CHECKLIST.md)
