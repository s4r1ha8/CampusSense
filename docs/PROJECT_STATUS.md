# CampusSense — Project Status

> **Last updated:** Phase 4 (Repository Preparation)
> **AWS live integration:** Not yet performed.

---

## Implemented

The following features are fully implemented in source code:

- ✅ Telemetry payload schema validation (11 validation rules)
- ✅ Device existence check (device registry in DynamoDB / in-memory)
- ✅ Threshold-based status determination (NORMAL / ALERT per device type)
- ✅ Alert state machine (NORMAL → ALERT → RECOVERY → ALERT transitions)
- ✅ SNS notification de-duplication (one email per NORMAL → ALERT transition)
- ✅ Historical readings persistence with 90-day TTL
- ✅ Current reading snapshot (latest per device, overwritten each cycle)
- ✅ System statistics counters (total, valid, invalid, alerts, recoveries)
- ✅ REST API (7 endpoints): health, devices, readings/latest, readings/history, alerts, system, telemetry
- ✅ React dashboard: Dashboard, Locations, LocationDetail, Alerts, SystemMonitor
- ✅ Local mock API (50 devices, pre-loaded alerts, historical charts)
- ✅ IoT simulator: 50 virtual devices, MQTT client, dry-run mode, anomaly injection
- ✅ DynamoDB adapters (5 table adapters with full CRUD)
- ✅ In-memory repository implementations (for unit testing)
- ✅ Lambda handlers: Processor (`processor.ts`) and API (`api.ts`)
- ✅ Structured JSON logging (CloudWatch-ready)
- ✅ Infrastructure blueprint: `backend/template.yaml` (AWS SAM / CloudFormation)
- ✅ `simulator/devices.json` — 50 verified virtual device definitions

---

## Locally Tested

The following have been verified to work on a local development machine
without AWS credentials:

- ✅ 28/28 backend unit tests pass (`npm test`)
- ✅ Backend TypeScript: clean (`npm run typecheck --prefix backend`)
- ✅ Simulator TypeScript: clean (`npm run typecheck --prefix simulator`)
- ✅ Frontend TypeScript: clean (`npm run typecheck --prefix frontend`)
- ✅ Frontend Vite build: passes (`npm run build --prefix frontend`)
- ✅ Frontend mock mode: Dashboard, Locations, LocationDetail, Alerts, SystemMonitor verified
- ✅ Simulator dry-run: generates and logs payloads for all 50 devices
- ✅ Security scan: no credentials, private keys, or real ARNs in repository

---

## Ready for GitHub

- ✅ Repository is clean — no real credentials, IoT certs, or `.env` secrets
- ✅ `.gitignore` covers `.env`, `*.pem`, `*.key`, `*.crt`, `node_modules/`, `dist/`
- ✅ `.env.example` files committed for simulator and frontend
- ✅ All documentation consistent — no claims that AWS is deployed or tested
- ✅ README is professional with Mermaid diagram and all required sections
- ✅ CHANGELOG, LIMITATIONS, DEMO_GUIDE, PROJECT_STATUS created

---

## Ready for AWS Manual Configuration

The following source code and configuration is complete and waiting for
real AWS values to be filled in:

- ✅ `backend/template.yaml` — complete CloudFormation/SAM blueprint
- ✅ `docs/AWS_CONSOLE_CHECKLIST.md` — step-by-step resource creation guide
- ✅ `docs/DEPLOYMENT.md` — deployment sequence and Lambda environment variable reference
- ✅ `docs/AWS_MANUAL_DEPLOYMENT_GAPS.md` — prerequisites and exact env-var names
- ✅ `docs/AWS_CONNECTION_GUIDE.md` — explains every configuration change needed
- ✅ Simulator `MockMqttClient` auto-detected — real MQTT activates when `simulator/.env` is filled

---

## Not Yet Tested

- ❌ MQTT connection from simulator to AWS IoT Core
- ❌ IoT Rule → Lambda invocation
- ❌ Lambda → DynamoDB reads and writes (live)
- ❌ Lambda → SNS email delivery
- ❌ API Gateway → Lambda → DynamoDB → dashboard data flow
- ❌ End-to-end alert email delivery
- ❌ DynamoDB TTL deletion of expired records
- ❌ Frontend with real API Gateway URL (non-mock mode)

---

## Known Limitations

1. All 50 devices are virtual — no physical sensors
2. AWS live deployment not performed — integration testing deferred
3. No authentication on the dashboard API
4. No deep message deduplication (messageId not enforced for uniqueness)
5. Free Tier suitability depends on account eligibility and current AWS pricing
6. Manual AWS deployment required (no CLI, no SAM, no CI/CD pipeline)
7. Single-region deployment (ap-south-1 / Mumbai)
8. No CI/CD pipeline

See [LIMITATIONS.md](./LIMITATIONS.md) for full details.

---

## Next Step

**Action:** Follow the manual AWS deployment guide.

1. Start with [DEPLOYMENT.md](./DEPLOYMENT.md) for the high-level sequence
2. Execute [AWS_CONSOLE_CHECKLIST.md](./AWS_CONSOLE_CHECKLIST.md) step by step
3. Use [AWS_CONNECTION_GUIDE.md](./AWS_CONNECTION_GUIDE.md) to understand each config change
4. After deployment, verify the full pipeline using the final checklist section
5. Update this document to reflect what has been tested
