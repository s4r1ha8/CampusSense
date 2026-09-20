# CampusSense — College Demo Guide

**Duration:** 5–10 minutes  
**Mode:** Local mock mode (no AWS account required during presentation)  
**URL:** http://localhost:5173

> **Before presenting:** Run `npm run dev` in `frontend/` and confirm the dashboard
> loads in your browser. The MOCK badge confirms local mode is active.

---

## Setup (Before the Room)

```powershell
# Terminal 1 — Start the dashboard
cd frontend
npm run dev
# Open http://localhost:5173 in browser
```

No second terminal required for a mock-only demo. Optionally in Terminal 2:

```powershell
# Terminal 2 — Simulator dry-run (optional, shows telemetry generation)
npm run simulate:once
```

---

## Demo Flow

---

### Step 1 — Introduce the Problem (~1 minute)

**Say:**
> "University campuses have dozens of spaces with different environmental
> requirements — server rooms need to stay below 22°C, chemistry labs below 26°C,
> and welding bays can tolerate up to 40°C. Without monitoring, equipment failures
> and safety incidents happen before anyone notices a problem."
>
> "CampusSense is an AWS cloud project that monitors temperature and humidity
> across 50 virtual campus locations — in real-time."

**Show:** The dashboard (no interaction yet) — let the audience see the
live-updating KPI cards.

---

### Step 2 — Architecture Overview (~1 minute)

**Show:** [docs/ARCHITECTURE.md](./ARCHITECTURE.md) or draw on the board:

```
Virtual Sensor → MQTT → AWS IoT Core → Lambda → DynamoDB
                                                     ↓
React Dashboard ← API Gateway ← Lambda ← DynamoDB
```

**Say:**
> "50 virtual devices publish temperature and humidity over MQTT to AWS IoT Core.
> A Lambda function processes each message, checks thresholds, and stores the data
> in DynamoDB. The React dashboard reads from DynamoDB via API Gateway.
> Right now we're running in local mock mode — the dashboard generates data
> in-browser without needing AWS."

**Point to the MOCK badge in the sidebar.**

---

### Step 3 — Dashboard Overview (~1 minute)

**Show:** The Dashboard page (already open).

**Point out:**
- KPI row: total devices, devices in alert, normal count, last update time
- Status distribution (Labs, Classrooms, Server Rooms, Workshops)
- Top alerts panel showing SRV-01 in ALERT state

**Say:**
> "The dashboard gives a campus-wide view instantly. We can see which
> buildings are within normal range and which are flagging alerts."

---

### Step 4 — Locations — All 50 Devices (~1 minute)

**Navigate to:** Locations page.

**Show:**
- The full list of 50 devices
- Use the search bar — type "server" to filter server rooms
- Use the type filter to show only LABORATORY devices
- Click on a device in ALERT state (SRV-01) to open detail

**Say:**
> "All 50 campus locations are listed here — 15 labs, 20 classrooms,
> 5 server rooms, and 10 workshops. Each has a custom threshold based
> on its environment type."

---

### Step 5 — Location Detail — Historical Chart (~1 minute)

**Show:** Location Detail page for SRV-01 (Main Server Room).

**Point out:**
- Current temperature and humidity readings
- ALERT status badge (red)
- Historical 24-hour chart showing temperature trend
- The device's threshold line

**Say:**
> "This server room has a 22°C threshold. The chart shows how temperature
> has varied over the past 24 hours. When it crosses the threshold, an
> alert is triggered."

---

### Step 6 — Trigger an Anomaly (Simulator Demo) (~1 minute)

In Terminal 2:

```powershell
npm run simulate:once -- --anomaly=SRV-01
```

**Say:**
> "In production, the simulator publishes this telemetry over MQTT to
> AWS IoT Core. The Lambda function evaluates the reading against the 22°C
> threshold and — if this were live — would publish an SNS email notification
> and write an alert record to DynamoDB."

**Point to the terminal output** showing the SRV-01 payload with a temperature
above 22°C.

---

### Step 7 — Alert State (~30 seconds)

**Navigate to:** Alerts page.

**Show:**
- SRV-01 alert with TRIGGERED state, timestamp, and temperature value
- LAB-06 alert with RECOVERED state

**Say:**
> "The alert system uses a state machine. When a device exceeds its threshold,
> one SNS email is sent — just one, not one per reading. If the temperature
> stays high, we stay in ALERT without spamming. When it drops back below the
> threshold, the system marks it as RECOVERED."

---

### Step 8 — Alert State Machine Walkthrough (~1 minute)

Draw or show on screen:

```
NORMAL  ──(breach)──▶  ALERT  ──(still high)──▶  ALERT (no new email)
                          │
                    (returns to normal)
                          │
                          ▼
                      RECOVERED  ──(next breach)──▶  ALERT (new email)
```

**Say:**
> "This is the alert state machine. The key design decision is that SNS
> sends exactly one email on the first breach. Sustained alerts don't
> flood the inbox. A recovery is recorded when temperature normalises,
> and the next breach starts a new alert cycle."

---

### Step 9 — System Monitor (~30 seconds)

**Navigate to:** System Monitor page.

**Show:**
- Total messages processed
- Valid vs invalid message counts
- Alerts generated
- Recoveries
- Last error information

**Say:**
> "The System Monitor page shows processing statistics — how many messages
> the Lambda has handled, validation errors, and when the system last
> processed a reading."

---

### Step 10 — AWS Services Explanation (~1 minute)

**Say:**
> "Let me explain the AWS services used and why they were chosen:"

| Service | Why |
|---------|-----|
| AWS IoT Core | Purpose-built MQTT ingestion with X.509 certificate auth |
| AWS Lambda | Runs only when needed — zero cost when idle |
| DynamoDB | Serverless, pay-per-request — no always-on database |
| API Gateway | Managed HTTPS endpoint — no server to maintain |
| SNS | Email notifications — simple and included in Free Tier |
| S3 | Static hosting for the React dashboard |

---

### Step 11 — Free Tier Design (~30 seconds)

**Say:**
> "At 50 devices with 10-minute intervals, this system generates about
> 216,000 MQTT messages per month. The architecture is designed to stay
> within AWS Free Tier allowances — no EC2, no RDS, no NAT Gateway.
> Everything is serverless and event-driven."

---

### Step 12 — Physical Sensor Extension (~30 seconds)

**Say:**
> "If we wanted to deploy real sensors tomorrow, we'd provision one AWS
> IoT certificate per device, flash it to the sensor firmware, and the
> sensor would publish to the same MQTT topic. The Lambda, DynamoDB schema,
> API, and dashboard would require zero changes — the architecture is already
> ready for real hardware."

---

## Summary Points

1. 50 virtual campus locations monitored
2. MQTT → IoT Core → Lambda → DynamoDB pipeline
3. Alert state machine prevents notification flooding
4. 100% serverless — no continuously running servers
5. Free Tier optimised — no EC2, RDS, NAT Gateway
6. Dashboard works locally in mock mode — no AWS required for demo
7. Designed for physical sensor extension with no code changes

---

## Honest Disclosure

This demo runs in **local mock mode**. The data shown is generated in-browser
by `mock-api.ts`. AWS services (IoT Core, Lambda, DynamoDB, SNS) have not been
live-tested. AWS deployment requires the manual steps in
[AWS_CONSOLE_CHECKLIST.md](./AWS_CONSOLE_CHECKLIST.md).
