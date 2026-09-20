# AWS Console Deployment Checklist

**Use this checklist when manually creating AWS resources in the AWS Console.**

No AWS CLI or SAM CLI is required. Check off each item as you complete it.
Region to use: **ap-south-1 (Asia Pacific — Mumbai)**

---

## Phase A — Region & Account Setup

- [ ] AWS Console region set to **ap-south-1**
- [ ] Verify you are logged into the correct AWS account (student/Free Tier)
- [ ] Note down your **AWS Account ID** (12-digit number, visible in top-right of Console)

---

## Phase B — DynamoDB Tables

Create all five tables with **On-Demand (Pay Per Request)** billing mode.

- [ ] **CampusDevices** table created
  - PK: `deviceId` (String)
- [ ] **CampusReadings** table created
  - PK: `deviceId` (String)
  - SK: `timestamp` (String)
  - TTL attribute: `expiresAt` — enabled on this attribute
- [ ] **CampusCurrent** table created
  - PK: `deviceId` (String)
- [ ] **CampusAlerts** table created
  - PK: `campusId` (String)
  - SK: `sk` (String)
- [ ] **CampusSystemStats** table created
  - PK: `metricId` (String)

---

## Phase C — Lambda — Processor

- [ ] Create Lambda function: `CampusSenseProcessor`
  - Runtime: Node.js 22.x
  - Architecture: x86_64
  - Upload: `backend/dist/` (zip the dist folder after `npm run build`)
  - Handler: `handlers/processor.handler`
  - Timeout: 30 seconds
  - Memory: 256 MB
- [ ] Environment variables set for ProcessorFunction (see Phase I)
- [ ] IAM execution role created and attached (see Phase J)

---

## Phase D — Lambda — API

- [ ] Create Lambda function: `CampusSenseApi`
  - Runtime: Node.js 22.x
  - Architecture: x86_64
  - Upload: same `backend/dist/` zip
  - Handler: `handlers/api.handler`
  - Timeout: 30 seconds
  - Memory: 256 MB
- [ ] Environment variables set (see Phase I)
- [ ] IAM execution role attached

---

## Phase E — API Gateway

- [ ] Create **HTTP API** (not REST API — HTTP API is cheaper)
- [ ] Add integration: Lambda proxy → `CampusSenseApi` function
- [ ] Add routes:
  - `GET /api/v1/health`
  - `GET /api/v1/devices`
  - `GET /api/v1/readings/latest`
  - `GET /api/v1/readings/history`
  - `GET /api/v1/alerts`
  - `GET /api/v1/system`
  - `POST /api/v1/telemetry`
  - `ANY /api/v1/{proxy+}`
- [ ] CORS configured (allow `*` or your S3 URL)
- [ ] **API Gateway URL copied** and saved for frontend `.env`

---

## Phase F — IoT Thing & Certificate

- [ ] Create an **IoT Thing**: `campus-sense-simulator`
- [ ] Create and download **certificate** (one-click create)
  - Download: certificate `.pem.crt`
  - Download: private key `.pem.key`
  - Download: Amazon Root CA 1 from the CA link
- [ ] Place downloaded files into: `simulator/certs/`
  - DO NOT commit these files (they are in `.gitignore`)
- [ ] Certificate **activated**
- [ ] **IoT Endpoint** copied from: IoT Core → Settings → Device data endpoint
  - Format: `xxxxxx-ats.iot.ap-south-1.amazonaws.com`

---

## Phase G — IoT Policy

- [ ] Create an IoT Policy: `CampusSenseSimulatorPolicy`
  - Statement 1: Allow `iot:Connect` on `*`
  - Statement 2: Allow `iot:Publish` on `arn:aws:iot:ap-south-1:*:topic/campus/telemetry/*`
- [ ] Policy **attached to certificate**

---

## Phase H — IoT Rule

- [ ] Create IoT Rule: `CampusSenseTelemetryRule`
  - SQL: `SELECT *, topic(3) AS deviceId FROM 'campus/telemetry/+'`
  - Action: Lambda → `CampusSenseProcessor`
- [ ] Lambda invoke permission granted to IoT Rule (console should offer this automatically)

---

## Phase I — SNS Topic

- [ ] Create SNS Topic (Standard): `CampusSenseAlerts`
- [ ] Create email subscription with your email address
- [ ] **Confirm the subscription** (click the link in the confirmation email)
- [ ] **SNS Topic ARN copied** for Lambda environment variables

---

## Phase J — IAM Permissions

For **CampusSenseProcessor** Lambda execution role, attach an inline policy allowing:
- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `Query`, `Scan` on all 5 tables
- `sns:Publish` on `CampusSenseAlerts` topic ARN

For **CampusSenseApi** Lambda execution role:
- Same DynamoDB permissions
- `sns:Publish` on the topic (for POST /telemetry path)

- [ ] ProcessorFunction role configured
- [ ] ApiFunction role configured

---

## Phase K — Lambda Environment Variables

Set these on **both** Lambda functions:

| Variable                  | Value                                      |
|---------------------------|--------------------------------------------|
| `TABLE_CAMPUS_DEVICES`    | `CampusDevices`                            |
| `TABLE_CAMPUS_READINGS`   | `CampusReadings`                           |
| `TABLE_CAMPUS_CURRENT`    | `CampusCurrent`                            |
| `TABLE_CAMPUS_ALERTS`     | `CampusAlerts`                             |
| `TABLE_CAMPUS_SYSTEM_STATS` | `CampusSystemStats`                     |
| `SNS_TOPIC_ARN`           | (paste copied SNS Topic ARN)               |
| `CAMPUS_ID`               | `VIT-CHENNAI`                              |
| `READING_TTL_DAYS`        | `90`                                       |
| `AWS_REGION`              | `ap-south-1`                               |

- [ ] ProcessorFunction environment variables saved
- [ ] ApiFunction environment variables saved

---

## Phase L — S3 Frontend Hosting

- [ ] Create S3 bucket: `campus-sense-dashboard` (bucket names must be globally unique — append your account ID if needed)
- [ ] Enable **Static Website Hosting** on the bucket
  - Index document: `index.html`
  - Error document: `index.html`
- [ ] Set **Bucket Policy** to allow public read access
- [ ] **Build the frontend:**
  - Edit `frontend/.env` — set `VITE_API_BASE_URL` to your API Gateway URL and `VITE_USE_MOCK_API=false`
  - Run: `npm run build` inside `frontend/`
  - Upload all files from `frontend/dist/` to the S3 bucket root
- [ ] S3 website URL noted for testing
- [ ] Dashboard accessible in browser

---

## Phase M — Seed CampusDevices Table

- [ ] Run the seed script (to be created in Phase 3):
  `node scripts/seed-devices.js`
  or manually import `simulator/devices.json` records into DynamoDB.
- [ ] Verify all 50 device records exist in the CampusDevices table

---

## Phase N — Simulator Configuration

- [ ] Copy `simulator/.env.example` to `simulator/.env`
- [ ] Fill in `AWS_IOT_ENDPOINT` with your copied IoT endpoint
- [ ] Fill in `AWS_IOT_CERTIFICATE_PATH`, `AWS_IOT_PRIVATE_KEY_PATH`, `AWS_IOT_CA_PATH`
  (relative to the `simulator/` folder, e.g. `./certs/certificate.pem.crt`)
- [ ] Run simulator (test): `npm run once --prefix simulator`
- [ ] Verify message in CloudWatch Logs for `CampusSenseProcessor`

---

## Phase O — Start Simulator

- [ ] Run full simulator: `npm run simulate --prefix simulator`
- [ ] Verify DynamoDB `CampusCurrent` table populates
- [ ] Verify DynamoDB `CampusReadings` table populates
- [ ] Open dashboard in browser — verify live data appears

---

## Phase P — Test Alert Flow

- [ ] Run simulator with anomaly flag: `npm run simulate --prefix simulator -- --anomaly=SRV-01 --duration=3`
- [ ] Verify alert record in DynamoDB `CampusAlerts` table
- [ ] Verify email notification received from SNS
- [ ] Verify Alert appears on dashboard Alerts page
- [ ] Run normal simulation — verify SRV-01 recovers and status returns to NORMAL

---

## Phase Q — Final Verification

- [ ] Dashboard loads and shows 50 locations
- [ ] Location detail page shows 24h charts
- [ ] Alerts page shows alert history
- [ ] System Monitor page shows statistics
- [ ] All API endpoints return 200 with valid JSON
