# Phase 3 Engineering Review & Hardening Report

## Overview
This document represents the final state of the CampusSense project after the Phase 3 engineering audit and hardening phase. All functional code logic, device configurations, schema validations, and mock frontend states have been thoroughly vetted.

## Classifications

### IMPLEMENTED
- **Virtual IoT Simulator:** Generates accurate, fluctuating, configurable payload data for exactly 50 devices. Properly adheres to baseline temperatures (fixed Server Room baseline to `< 22°C` max) and bounds.
- **Backend Business Logic:** The `TelemetryService` correctly separates validation, device verification, reading persistence, and state machine alert processing. Double-counting on validation failures has been resolved.
- **Alert State Machine:** Accurately manages the transitions between `NORMAL`, `ALERT`, and `RECOVERED` without duplicating notifications during sustained anomaly events.
- **Database Architecture:** Repositories correctly reflect the partition/sort keys defined in the requirements.
- **Frontend / Backend Contract:** The internal DynamoDB keys (`sk`, `campusId`) are now correctly stripped from the API Gateway responses so the frontend remains decoupled from database internals.
- **Mock Mode:** `VITE_USE_MOCK_API=true` is fully functional and safely isolates the dashboard from requiring live AWS endpoints.

### READY FOR GITHUB
- **Security Posture:** A repository-wide security scan was completed. No hardcoded AWS credentials, private keys, or certificates were found. `.env.example` files are cleanly provided.
- **Dependencies:** All unnecessary packages were vetted, and strict-mode typechecking passes globally.
- **Documentation:** All markdown files have been reconciled with the actual codebase.

### READY FOR AWS MANUAL CONFIGURATION
- **CloudFormation Blueprint:** The `template.yaml` defines the necessary resources logically but is purely structural for manual setup.
- **Lambda Handlers:** The IoT Core processor Lambda and the API Gateway Lambda are bundled and ready to upload.

### MANUAL AWS CONFIGURATION REQUIRED
Because the `AWS CLI` and `SAM CLI` are expressly disallowed, all deployments must be handled manually. Refer to the newly created `AWS_MANUAL_DEPLOYMENT_GAPS.md` for the explicit manual checklist, including:
- Creating the IoT Thing and IoT Rule.
- Generating the X.509 device certificates.
- Provisioning the 5 DynamoDB tables with correct primary keys.
- Setting up the SNS topic and environment variables for Lambdas.
- Deploying the API Gateway routes.

### KNOWN LIMITATION
- **Message Idempotency:** While every telemetry payload contains a `messageId`, the DynamoDB persistence layer does not actively prevent the re-insertion of duplicate `messageId`s if they have identical timestamps. A true distributed deduplication queue was deemed too complex for this academic scope.
- **Humidity Alerting:** Humidity is recorded and validated, but it is intentionally kept secondary to Temperature, which primarily drives the Alert State Machine.
- **No Live AWS Testing:** No real AWS infrastructure has been provisioned, so the AWS IoT Core MQTT handshake and API Gateway mapping have been verified structurally but not tested end-to-end in the cloud.

---

## Final Status Report

### Files Modified During Hardening
- `simulator/src/sensor-generator.ts` (Fixed Server Room baseline to prevent constant false-positive alerts, renamed seeded random function)
- `simulator/package.json` (Streamlined CLI scripts for `--once` usage)
- `backend/src/handlers/api.ts` (Stripped DB internals from `getAlerts` response)
- `backend/src/services/telemetry-service.ts` (Removed invalid message double-counting in processing errors)
- `backend/tests/validator.test.ts` (Added `MISSING_MESSAGE_ID` validation test)
- `backend/tests/telemetry-service.test.ts` (Added comprehensive 6-stage alert lifecycle transition test)
- `docs/AWS_MANUAL_DEPLOYMENT_GAPS.md` (Created checklist)
- `docs/PHASE_3_REVIEW.md` (Created this report)

### Important Fixes
- **Server Room Alert Loop:** The previous `sensor-generator` allowed server rooms to randomly drift to 24°C, triggering an alert on the 22°C threshold. The maximum normal temp is now bounded to 20°C.
- **Stat Double Counting:** Handled payloads that fail schema validation without incorrectly incrementing the critical `processingErrors` metric.
- **API Leakage:** Prevented the frontend from receiving backend-specific sorting/partition keys.

### Test & Build Results
- **Backend Tests:** `28/28 passed` (Vitest run successful).
- **Backend Typecheck:** Clean (`tsc --noEmit` exited with 0).
- **Backend Build:** Clean (`tsc` exited with 0).
- **Frontend Typecheck:** Clean (`tsc --noEmit` exited with 0).
- **Frontend Dev Server:** Verified to run cleanly on port `5173`.
- **Simulator Typecheck:** Clean.

### Simulator Verification
- **50 Devices:** `devices.json` has been hard-verified to contain exactly 15 Labs, 20 Classrooms, 5 Server Rooms, and 10 Workshops.
- **Flags:** `--once`, `--interval`, and `--duration` arguments natively function using the existing setup.

### Security Scan Result
- `grep` scan for `AWS_ACCESS_KEY`, `AWS_SECRET`, `BEGIN PRIVATE KEY`, `password=`, etc., across `.ts`, `.json`, `.env`, and `.yaml` files yielded **0 findings**. Codebase is safe for a public GitHub commit.

### Before You Push to GitHub
1. Double-check that `.gitignore` correctly ignores `simulator/certs/` (it currently does).
2. Ensure you have not accidentally created any local `.env` files that contain real account IDs.
3. Review `docs/AWS_MANUAL_DEPLOYMENT_GAPS.md` to ensure you understand exactly what needs to be manually clicked in the AWS console during your presentation.
