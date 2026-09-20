# AWS Manual Deployment — Prerequisites & Gaps

> Because AWS CLI and SAM CLI are not used in this project, all AWS resources
> must be created manually through the AWS Management Console.
> This document summarises the gaps between the local source code and a fully
> functional AWS deployment. Use the detailed step-by-step guide in
> **[AWS_CONSOLE_CHECKLIST.md](./AWS_CONSOLE_CHECKLIST.md)**.

---

## 1. IoT Core Configuration

The simulator connects to AWS IoT Core using MQTT/TLS.
Manually create the following in the AWS Console (IoT Core service):

- **IoT Thing:** Name it `campus-sense-simulator`
- **X.509 Certificate:** Create via one-click provisioning; download:
  - `certificate.pem.crt`
  - `private.pem.key`
  - Amazon Root CA 1 (`AmazonRootCA1.pem`)
  Place all files in `simulator/certs/` — **do not commit them to Git**
- **IoT Policy:** `CampusSenseSimulatorPolicy` — allow:
  - `iot:Connect` on `*`
  - `iot:Publish` on `arn:aws:iot:<REGION>:*:topic/campus/telemetry/*`
- **IoT Endpoint:** Copy from IoT Core → Settings → Device data endpoint
  Format: `<ACCOUNT_ID>-ats.iot.<REGION>.amazonaws.com`

---

## 2. IoT Rule

Create an IoT Rule to route incoming MQTT messages to the Processor Lambda:

- **Rule name:** `CampusSenseTelemetryRule`
- **SQL statement:** `SELECT *, topic(3) AS deviceId FROM 'campus/telemetry/+'`
- **Action:** Invoke Lambda → `CampusSenseProcessor`
- **Permission:** The Console will prompt to grant IoT Core permission to
  invoke the Lambda — accept the auto-created resource-based policy

---

## 3. DynamoDB Tables

Create all five tables in the AWS Console using **On-Demand (Pay Per Request)**
billing mode:

| Table name | Partition Key | Sort Key | Notes |
|------------|---------------|----------|-------|
| `CampusDevices` | `deviceId` (String) | — | Seeded from `simulator/devices.json` |
| `CampusReadings` | `deviceId` (String) | `timestamp` (String) | Enable TTL on `expiresAt` attribute |
| `CampusCurrent` | `deviceId` (String) | — | Latest snapshot per device |
| `CampusAlerts` | `campusId` (String) | `sk` (String) | Alert event history |
| `CampusSystemStats` | `metricId` (String) | — | Processing counters |

---

## 4. SNS Topic

- **Topic type:** Standard
- **Topic name:** `CampusSenseAlerts`
- **Subscription:** email — your address
- **Action required:** Click the confirmation link in the subscription email
- **Copy the Topic ARN** — needed for Lambda environment variables

---

## 5. Lambda Functions

Create two Lambda functions using **Node.js 22.x** runtime:

### CampusSenseProcessor
- Upload: zip of `backend/dist/` (built with `npm run build` in `backend/`)
- Handler: `handlers/processor.handler`
- Timeout: 30 seconds
- Memory: 256 MB
- Triggered by: IoT Rule

### CampusSenseApi
- Upload: same `backend/dist/` zip
- Handler: `handlers/api.handler`
- Timeout: 30 seconds
- Memory: 256 MB
- Triggered by: API Gateway HTTP API

### Environment Variables (set on BOTH functions)

The variable names below must match **exactly** — they are read verbatim by
`backend/src/config/environment.ts` and referenced in `backend/template.yaml`:

| Variable | Value |
|----------|-------|
| `TABLE_CAMPUS_DEVICES` | `CampusDevices` |
| `TABLE_CAMPUS_READINGS` | `CampusReadings` |
| `TABLE_CAMPUS_CURRENT` | `CampusCurrent` |
| `TABLE_CAMPUS_ALERTS` | `CampusAlerts` |
| `TABLE_CAMPUS_SYSTEM_STATS` | `CampusSystemStats` |
| `SNS_TOPIC_ARN` | `<SNS_TOPIC_ARN>` |
| `CAMPUS_ID` | `VIT-CHENNAI` |
| `READING_TTL_DAYS` | `90` |
| `AWS_REGION` | `<REGION>` |

---

## 6. IAM Roles

Create an execution role for each Lambda:

### CampusSenseProcessorRole — permissions needed:
- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `Query`, `Scan` on all 5 tables
- `sns:Publish` on `<SNS_TOPIC_ARN>`
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`
  (or attach `AWSLambdaBasicExecutionRole` managed policy)

### CampusSenseApiRole — permissions needed:
- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `Query`, `Scan` on all 5 tables
- `sns:Publish` on `<SNS_TOPIC_ARN>` (needed for POST /telemetry alert path)
- `AWSLambdaBasicExecutionRole` managed policy

---

## 7. API Gateway (HTTP API)

- **Type:** HTTP API (not REST API — HTTP API is cheaper)
- **Integration:** Lambda proxy → `CampusSenseApi`
- **Routes to create:**
  - `GET /api/v1/health`
  - `GET /api/v1/devices`
  - `GET /api/v1/readings/latest`
  - `GET /api/v1/readings/history`
  - `GET /api/v1/alerts`
  - `GET /api/v1/system`
  - `POST /api/v1/telemetry`
  - `ANY /api/v1/{proxy+}`
- **CORS:** Allow `*` during setup; restrict to your S3 bucket URL after
- **Copy the Invoke URL** (`<API_GATEWAY_URL>`) — needed for the frontend

---

## 8. S3 Frontend Hosting

- Create bucket: e.g., `campus-sense-dashboard-<ACCOUNT_ID>`
  (bucket names must be globally unique)
- Enable Static Website Hosting:
  - Index document: `index.html`
  - Error document: `index.html`
- Apply a bucket policy allowing `s3:GetObject` for `Principal: "*"`
- Build the frontend with `VITE_API_BASE_URL=<API_GATEWAY_URL>` set
- Upload `frontend/dist/` contents to the bucket root

---

## 9. Device Seeding

After DynamoDB tables are created, import device definitions:

- Option A: Use the AWS Console → DynamoDB → Import from S3 (export
  `simulator/devices.json` to S3 first, then import)
- Option B: Create items manually for a small subset to test the pipeline
- Option C: Write a seed script using the AWS SDK (Node.js) and run it locally
  after configuring AWS credentials on your machine

All 50 device records from `simulator/devices.json` should be imported into
the `CampusDevices` table.

---

## 10. Simulator Configuration

Copy `simulator/.env.example` → `simulator/.env` and fill in real values:

```env
AWS_IOT_ENDPOINT=<IOT_ENDPOINT>
AWS_IOT_CERT_PATH=./certs/certificate.pem.crt
AWS_IOT_KEY_PATH=./certs/private.pem.key
AWS_IOT_ROOT_CA_PATH=./certs/AmazonRootCA1.pem
SIMULATOR_INTERVAL_MS=600000
```

Test with a single round: `npm run simulate --prefix simulator -- --once`
Check CloudWatch Logs for `/aws/lambda/CampusSenseProcessor` to confirm receipt.
