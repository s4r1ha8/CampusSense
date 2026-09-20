# Changelog

All significant milestones for the CampusSense project are recorded here.
Dates are not listed because this is an academic project developed iteratively
without fixed release dates.

---

## Phase 4 — Repository & Submission Preparation

**Goal:** Professional, consistent, GitHub-ready repository.

### Changes
- Fixed 2 failing backend tests caused by hardcoded past timestamps aging beyond the 24-hour filter window; replaced with `recentTimestamp()` utility generating relative offsets
- Rewrote `docs/DEPLOYMENT.md` — removed SAM CLI / AWS CLI references, replaced with full manual AWS Console deployment guide
- Corrected all Lambda environment variable names in `docs/AWS_MANUAL_DEPLOYMENT_GAPS.md` (e.g., `TABLE_CAMPUS_DEVICES` not `TABLE_DEVICES`)
- Rewrote `docs/TESTING.md` to reflect actual Phase 3 results (28/28 tests) and honest disclosure of AWS integration test status
- Complete README rewrite: Mermaid architecture diagram, AWS service mapping table, alert demo section, local dev instructions (Windows-compatible), known limitations, future hardware extension
- Created `docs/architecture.mmd` — Mermaid source for full AWS architecture diagram
- Created `docs/data-flow.mmd` — Mermaid source for telemetry ingestion and API read paths
- Rewrote `docs/ARCHITECTURE.md` — full service responsibilities, LOCAL vs AWS distinction, DynamoDB table reference
- Updated `docs/FREE_TIER.md` — conditional language, no unsupported pricing claims
- Expanded `docs/DECISIONS.md` — 15 architectural decision records (ADR-01 through ADR-15)
- Created `docs/LIMITATIONS.md` — factual scope boundaries
- Created `docs/DEMO_GUIDE.md` — 5–10 minute college presentation guide
- Created `docs/AWS_CONNECTION_GUIDE.md` — local-to-AWS configuration bridge
- Created `docs/PROJECT_STATUS.md` — current implementation status matrix
- Created `docs/PHASE_4_FINAL_REVIEW.md` — pre-GitHub audit report
- Created `CHANGELOG.md` (this file)
- Updated `frontend/.env.example` — added `VITE_USE_MOCK_API` entry
- Updated `.gitignore` — added `!.env.example` explicit exception
- Fixed `backend/template.yaml` header — removed Phase 3 reference
- Security scan: no credentials, private keys, or real ARNs found in repository

---

## Phase 3 — Engineering Hardening & Testing

**Goal:** Robust, tested, production-quality local implementation.

### Changes
- Fixed server room sensor baseline to prevent false-positive temperature alerts
  (bounded max normal temperature to 20°C for server rooms)
- Resolved alert state machine double-counting: validation failures no longer
  incorrectly increment `processingErrors`
- Stripped DynamoDB-internal keys (`sk`, `campusId`) from API Gateway responses
  to decouple the frontend from backend storage details
- Implemented full `AlertService` state machine: NORMAL → ALERT → RECOVERY
  with de-duplicated SNS notifications
- Added `MISSING_MESSAGE_ID` validation test
- Added comprehensive 6-stage alert lifecycle transition test
- All 28 backend tests pass; TypeScript is clean across all packages
- Repository-wide security scan: no credentials found
- Created `docs/AWS_MANUAL_DEPLOYMENT_GAPS.md`
- Created `docs/PHASE_3_REVIEW.md`

---

## Phase 2 — Local Implementation

**Goal:** Working local implementation of all system components.

### Changes
- Implemented `TelemetryService` processing pipeline (validate → device check
  → threshold → persist → alert → stats)
- Implemented `AlertService` with state machine transitions
- Implemented `StatisticsService` counter management
- Implemented `AlterService` with `MockNotificationService` for testing
- Implemented 5 DynamoDB adapter classes (device, reading, current, alert, stats)
- Implemented 5 in-memory repository implementations for unit testing
- Implemented 2 Lambda handlers: `processor.ts` (IoT) and `api.ts` (REST)
- Implemented all REST API routes: health, devices, readings/latest,
  readings/history, alerts, system, telemetry
- Implemented React dashboard with 5 pages: Dashboard, Locations,
  LocationDetail, Alerts, SystemMonitor
- Implemented `mock-api.ts` for full local demo without AWS
- Implemented IoT simulator with 50 virtual devices, MQTT client,
  anomaly injection, and dry-run mode
- Created `simulator/devices.json` with 50 verified device definitions
  (15 Labs, 20 Classrooms, 5 Server Rooms, 10 Workshops)
- Created `backend/template.yaml` AWS SAM / CloudFormation blueprint
- Created `docs/AWS_CONSOLE_CHECKLIST.md` manual deployment checklist
- Created `docs/DATA_MODEL.md`, `docs/API.md`, `docs/SIMULATOR.md`

---

## Phase 1 — Architecture & Scaffolding

**Goal:** Project structure, design decisions, and documentation foundation.

### Changes
- Defined system architecture: IoT Core → Lambda → DynamoDB → API Gateway → React
- Documented 50 virtual campus sensor locations (4 types, 5 buildings)
- Defined DynamoDB table schemas (5 tables with keys and TTL)
- Defined REST API contract (7 endpoints)
- Defined telemetry payload format and validation rules
- Defined alert state machine (NORMAL / ALERT / RECOVERED)
- Defined threshold values per device type
- Created monorepo structure: `backend/`, `simulator/`, `frontend/`, `docs/`
- Created `docs/PROJECT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`
- Created `docs/FREE_TIER.md` cost strategy
- Initialised TypeScript configuration for all three packages
- Configured Vitest for backend unit testing
