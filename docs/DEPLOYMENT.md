# CampusSense — AWS Manual Deployment Guide

> **Status:** This guide describes the manual AWS Console deployment process.
> AWS CLI and AWS SAM CLI are **not** used in this project's deployment workflow.
> All infrastructure is created through the AWS Management Console.

The detailed step-by-step checklist is in:
**[AWS_CONSOLE_CHECKLIST.md](./AWS_CONSOLE_CHECKLIST.md)**

This document provides a high-level overview of the deployment sequence and
explains the relationship between local development and AWS.

---

## Prerequisites

- An AWS account (student or Free Tier account recommended)
- This repository cloned locally
- Node.js 20+ installed
- A text editor for `.env` files

**Not required:**
- AWS CLI
- AWS SAM CLI
- Docker
- Any infrastructure-as-code tool

---

## Deployment Architecture

```
LOCAL MACHINE                          AWS (ap-south-1 / Mumbai)
─────────────────                      ──────────────────────────
Virtual IoT Simulator ──MQTT/TLS──▶   AWS IoT Core
                                              │
                                         IoT Rule
                                              │
                                       Processor Lambda
                                       ┌──────┼──────┐
                                       │      │      │
                                   DynamoDB  SNS  CloudWatch
                                       │
                                   API Lambda
                                       │
                                  API Gateway
                                       │
React Dashboard (browser) ◀──HTTPS──  Amazon S3
```

---

## Deployment Sequence

### Step 1 — Build the Backend Lambda Package

Run this on your **local machine** before uploading to AWS:

```powershell
cd backend
npm install
npm run build
```

This compiles TypeScript → JavaScript into `backend/dist/`. Zip the `dist/`
folder — this is what you upload to AWS Lambda.

---

### Step 2 — AWS Console: Create Infrastructure

Follow **[AWS_CONSOLE_CHECKLIST.md](./AWS_CONSOLE_CHECKLIST.md)** in order:

| Phase | Task |
|-------|------|
| A | Region & account setup (`<REGION>` = `ap-south-1`) |
| B | Create 5 DynamoDB tables |
| C | Create Processor Lambda (`CampusSenseProcessor`) |
| D | Create API Lambda (`CampusSenseApi`) |
| E | Create API Gateway HTTP API |
| F | Create IoT Thing & certificate |
| G | Create IoT Policy |
| H | Create IoT Rule (`campus/telemetry/+` → Processor Lambda) |
| I | Create SNS Topic & email subscription |
| J | Configure IAM roles & permissions |
| K | Set Lambda environment variables |
| L | Create S3 bucket for frontend hosting |
| M | Seed CampusDevices table from `simulator/devices.json` |
| N | Configure simulator `.env` with IoT credentials |
| O | Start simulator, verify telemetry arrives |
| P | Test alert flow |
| Q | Final end-to-end verification |

---

### Step 3 — Lambda Environment Variables

Set these on **both** Lambda functions in the AWS Console
(Lambda → Configuration → Environment variables):

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

### Step 4 — Simulator Configuration

Copy `simulator/.env.example` to `simulator/.env` and fill in the values
obtained from the AWS Console:

```env
AWS_IOT_ENDPOINT=<IOT_ENDPOINT>
AWS_IOT_CERT_PATH=./certs/certificate.pem.crt
AWS_IOT_KEY_PATH=./certs/private.pem.key
AWS_IOT_ROOT_CA_PATH=./certs/AmazonRootCA1.pem
SIMULATOR_INTERVAL_MS=600000
```

Place the downloaded certificate files in `simulator/certs/`.
**Do not commit these files — they are in `.gitignore`.**

---

### Step 5 — Frontend Deployment

1. Copy `frontend/.env.example` to `frontend/.env`
2. Set `VITE_API_BASE_URL` to your API Gateway URL:
   ```env
   VITE_API_BASE_URL=<API_GATEWAY_URL>
   VITE_USE_MOCK_API=false
   ```
3. Build the frontend:
   ```powershell
   cd frontend
   npm install
   npm run build
   ```
4. Upload the contents of `frontend/dist/` to your S3 bucket
5. Enable Static Website Hosting on the bucket with `index.html` as both
   the index and error document

---

### Step 6 — Verify the Full Pipeline

1. Run the simulator: `npm run simulate --prefix simulator`
2. Open the S3 website URL in a browser
3. Confirm the dashboard shows 50 locations with live readings
4. Test alert flow: `npm run simulate --prefix simulator -- --anomaly=SRV-01`
5. Confirm an email notification is received from SNS

---

## Infrastructure Blueprint

The file `backend/template.yaml` describes the complete AWS infrastructure as
CloudFormation / AWS SAM. It is provided as an **architecture reference** and
for potential future automated deployment. It is **not used for the current
manual deployment process**.

---

## Placeholder Reference

| Placeholder | Where to find the real value |
|-------------|------------------------------|
| `<REGION>` | Your chosen AWS region (e.g., `ap-south-1`) |
| `<ACCOUNT_ID>` | AWS Console → top-right corner (12-digit ID) |
| `<IOT_ENDPOINT>` | IoT Core → Settings → Device data endpoint |
| `<SNS_TOPIC_ARN>` | SNS → Topics → CampusSenseAlerts → ARN |
| `<API_GATEWAY_URL>` | API Gateway → your HTTP API → Invoke URL |
| `<S3_BUCKET>` | The name you chose when creating the S3 bucket |

---

## Security Checklist

Before deploying and after:

- [ ] No `.env` file committed to Git
- [ ] No certificate or key files committed (`simulator/certs/`)
- [ ] SNS email subscription confirmed
- [ ] IoT policy restricts publish to `campus/telemetry/*` only
- [ ] API Gateway CORS restricted to your S3 bucket domain (after setup)
- [ ] Lambda roles use minimum required permissions only
