# CampusSense — Testing Strategy & Results

> **Phase 3 verified test results: 28/28 backend tests passed.**
> AWS live integration testing has not yet been performed.

---

## 1. Backend Unit Tests

All backend tests run entirely in-memory. No AWS account, network connection,
or running services are required.

### Run Command

```powershell
cd backend
npm test
# or from the repo root:
npm test --prefix backend
```

### Test Framework

Vitest (`^1.6.0`), ESM mode, no external test doubles library.

### Test Results (Phase 3 / Phase 4)

```
Test Files: 2 passed (2)
     Tests: 28 passed (28)
  Duration: ~3 seconds
```

### Test File: `tests/validator.test.ts` — 14 tests

Tests the telemetry payload schema validator
(`backend/src/validators/telemetry-validator.ts`):

| Test | Validates |
|------|-----------|
| Accepts a valid payload | Normal happy-path payload |
| Rejects null | Non-object input |
| Rejects missing deviceId | Empty string deviceId |
| Rejects missing messageId | Payload without messageId field |
| Rejects missing timestamp | Payload without timestamp field |
| Rejects malformed timestamp | Non-ISO timestamp string |
| Rejects missing temperature | Payload without temperature |
| Rejects non-numeric temperature | String temperature value |
| Rejects out-of-range temperature (>85°C) | Physically impossible value |
| Rejects missing humidity | Payload without humidity |
| Rejects impossible humidity (>100%) | Over-range humidity |
| Rejects negative humidity | Under-range humidity |
| Accepts boundary temperature 85°C | Inclusive boundary |
| Accepts boundary humidity 100% | Inclusive boundary |

### Test File: `tests/telemetry-service.test.ts` — 14 tests

Tests the full processing pipeline
(`backend/src/services/telemetry-service.ts`) end-to-end using in-memory
repository and service implementations:

**Valid readings (4 tests)**
| Test | Validates |
|------|-----------|
| Processes a valid normal reading | Happy path returns `success: true`, `status: NORMAL` |
| Saves reading to reading repo | Historical reading persisted in `ReadingRepository` |
| Updates current reading snapshot | `CurrentRepository` upserted correctly |
| Increments stats counters | `processedMessages` and `validMessages` incremented |

**Invalid payloads (4 tests)**
| Test | Validates |
|------|-----------|
| Rejects missing deviceId | Schema failure path |
| Rejects unknown device | Device existence check |
| Rejects temperature >85 | Out-of-range validation |
| Rejects negative humidity | Out-of-range validation |

**Alert state machine (5 tests)**
| Test | Validates |
|------|-----------|
| NORMAL → ALERT transition | SNS notification sent on first breach |
| No second notification in sustained ALERT | Deduplication during sustained alert |
| ALERT → NORMAL recovery | Recovery flag set, `recoveries` stat incremented |
| alertsGenerated stat | Counter incremented on first alert |
| Full 6-reading lifecycle | NORMAL→ALERT→ALERT→ALERT→RECOVERY→ALERT with correct notification counts |

**Historical readings (1 test)**
| Test | Validates |
|------|-----------|
| Stores multiple readings chronologically | Three readings within 24h window retrieved |

> **Note on timestamps:** All test timestamps are dynamically generated relative
> to the current time (e.g., `recentTimestamp(30)` = 30 minutes ago). This
> prevents tests from becoming stale when hardcoded past dates age beyond the
> 24-hour filter window.

---

## 2. TypeScript Type Checking

Strict TypeScript is enabled in all three packages.

```powershell
# Backend
npm run typecheck --prefix backend

# Simulator
npm run typecheck --prefix simulator

# Frontend
npm run typecheck --prefix frontend

# All at once
npm run typecheck
```

**Phase 3 result:** All three packages pass `tsc --noEmit` with zero errors.

---

## 3. Frontend Build Verification

```powershell
cd frontend
npm run build
```

Or from the repo root:

```powershell
npm run build:frontend
```

**Phase 3 result:** Frontend builds cleanly. `frontend/dist/` is produced
without TypeScript or Vite errors.

---

## 4. Frontend Mock Mode (Manual UI Verification)

```powershell
# Ensure .env has:
# VITE_USE_MOCK_API=true
# VITE_API_BASE_URL=          (leave blank)

cd frontend
npm run dev
# Open: http://localhost:5173
```

Manually verify:

| Page | What to check |
|------|---------------|
| Dashboard | KPI cards, 50-device summary, status distribution |
| Locations | All 50 devices listed; search/filter works |
| Location Detail | Historical chart renders; status badge correct |
| Alerts | SRV-01 ALERT shown; recovered LAB-06 shown |
| System Monitor | Processing counters render |

The MOCK badge appears in the sidebar when `VITE_USE_MOCK_API=true`.

---

## 5. Simulator Verification (Local Dry-Run)

Without AWS credentials configured, the simulator runs in **DRY_RUN** mode:
it generates telemetry and logs the payloads locally without publishing to
AWS IoT Core.

```powershell
# Single round, dry-run
npm run simulate:once

# Continuous dry-run (Ctrl+C to stop)
npm run simulate
```

Confirm:
- 50 device payloads generated per round
- No crash on missing AWS credentials (graceful fallback)
- Anomaly flag works: `npm run simulate:once -- --anomaly=SRV-01`

**Phase 3 result:** Simulator typecheck passes; dry-run logs correct payloads
for all 50 devices.

---

## 6. AWS Live Integration Testing

> **AWS live integration testing has not yet been performed.**
>
> The following have NOT been tested end-to-end with real AWS services:
> - MQTT connection from simulator to AWS IoT Core
> - IoT Rule routing to Processor Lambda
> - DynamoDB reads/writes from Lambda
> - SNS email notification delivery
> - API Gateway → Lambda → DynamoDB → React dashboard live data flow

These tests will be performed after manual AWS deployment using the guide in
[DEPLOYMENT.md](./DEPLOYMENT.md) and [AWS_CONSOLE_CHECKLIST.md](./AWS_CONSOLE_CHECKLIST.md).

---

## 7. Test Coverage Summary

| Component | Test type | Status |
|-----------|-----------|--------|
| Telemetry validator | Unit | ✅ 14/14 pass |
| TelemetryService pipeline | Unit | ✅ 14/14 pass |
| Alert state machine | Unit | ✅ 5/5 pass |
| Backend TypeScript | Type check | ✅ Clean |
| Simulator TypeScript | Type check | ✅ Clean |
| Frontend TypeScript | Type check | ✅ Clean |
| Frontend Vite build | Build | ✅ Passes |
| Frontend mock UI | Manual | ✅ Verified |
| AWS IoT Core MQTT | Integration | ❌ Not yet tested |
| Lambda → DynamoDB | Integration | ❌ Not yet tested |
| Lambda → SNS | Integration | ❌ Not yet tested |
| API Gateway → Lambda | Integration | ❌ Not yet tested |
| End-to-end dashboard | Integration | ❌ Not yet tested |
