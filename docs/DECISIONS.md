# CampusSense — Architectural Decision Records

This document records the major design decisions made for CampusSense,
a college AWS mini-project. Each decision is explained in the specific context
of this project's constraints: academic scope, no physical hardware, no continuous
billing budget, and a deployment target of manual AWS Console setup.

---

## ADR-01: Virtual IoT Devices Rather Than Physical Hardware

**Decision:** Use 50 simulated virtual devices (Node.js simulator) instead of
physical temperature/humidity sensors.

**Context:** This is a college course assignment. Physical sensors require
procurement, wiring, firmware, and physical deployment — all impractical for
a software engineering course.

**Rationale:** The AWS IoT architecture (MQTT, IoT Core, Rules Engine, Lambda)
is identical whether the client is a physical ESP32 sensor or a Node.js process.
The protocol is the same; the simulation accurately exercises the cloud pipeline.
Virtual devices allow all 50 campus locations to be represented immediately.

**Trade-off:** No physical hardware validation. The system has not been tested with
real sensors. Future extension to physical sensors is documented in [AWS_CONNECTION_GUIDE.md](./AWS_CONNECTION_GUIDE.md).

---

## ADR-02: AWS IoT Core for Telemetry Ingestion

**Decision:** Use AWS IoT Core with MQTT as the telemetry ingestion layer.

**Context:** The project needed a scalable, managed ingestion point for sensor data.

**Rationale:** IoT Core is purpose-built for device telemetry. It provides
TLS-authenticated MQTT connections, built-in device certificate management,
and a rules engine that routes messages to downstream services (Lambda, DynamoDB)
without custom polling or message-queue setup. This is the standard AWS IoT
architecture pattern.

**Alternative considered:** Direct POST to API Gateway — rejected because it
conflates the ingestion path with the API path, loses the topic-based routing
capability, and would require reimplementing authentication.

---

## ADR-03: MQTT Over HTTP for Device Telemetry

**Decision:** The simulator publishes via MQTT (`campus/telemetry/<deviceId>`)
rather than HTTP POST.

**Context:** Needed a realistic IoT protocol that works with AWS IoT Core.

**Rationale:** MQTT is the industry-standard IoT protocol. It is lightweight,
supports persistent connections, and IoT Core's Rules Engine routes MQTT topics
natively. Using MQTT means the simulator faithfully represents how a real sensor
fleet would communicate with AWS.

**Trade-off:** Requires IoT certificates for AWS connectivity. The simulator
falls back to dry-run mode when certificates are not present.

---

## ADR-04: AWS Lambda for Processing and API

**Decision:** Use two separate Lambda functions — one for IoT telemetry processing,
one for the REST API.

**Context:** Needed server-side compute that does not run continuously.

**Rationale:** Lambda scales to zero when idle and is charged only for invocations
and compute duration. At a 10-minute telemetry interval, the Processor Lambda runs
briefly 50 times per round then goes idle — no charge between rounds. A continuously
running server (EC2, ECS, Fargate) would accumulate costs 24/7.

Separating the two handlers allows different IAM permissions and timeout
configurations per function.

---

## ADR-05: Amazon DynamoDB Over Amazon RDS

**Decision:** Use DynamoDB for all data storage across five tables.

**Context:** Needed persistent storage for device config, readings, alerts, and stats.

**Rationale:** DynamoDB On-Demand pricing means the project pays only for reads
and writes performed, with no hourly instance charge. RDS requires a minimum
EC2 instance running continuously, which is inappropriate for this scale.
DynamoDB also fits the key-value and simple query patterns used: latest reading
per device (single-key lookup), history per device in a time range (range key
query), and global counters (single-item update).

**Trade-off:** DynamoDB does not support complex SQL joins or ad-hoc queries
efficiently. This is acceptable because the data model is simple and well-defined.

---

## ADR-06: API Gateway HTTP API (Not REST API)

**Decision:** Use API Gateway HTTP API rather than REST API.

**Context:** Needed a managed HTTP endpoint to serve the React dashboard.

**Rationale:** HTTP APIs are priced lower per-request than REST APIs and have
lower latency. The project does not need REST API features such as request
validation, usage plans, caching, or resource policies. Lambda proxy integration
handles all routing logic in the Lambda function itself.

**Alternative considered:** WebSocket API — rejected because the dashboard refreshes
on a polling basis. Persistent connections are unnecessary complexity for a
college demo.

---

## ADR-07: Amazon S3 for Frontend Hosting

**Decision:** Host the React/Vite SPA as static files on S3 with static website
hosting enabled.

**Context:** Needed a hosting solution for the React dashboard.

**Rationale:** S3 static website hosting is the most cost-effective option for
a single-page application. The compiled build is a small set of static files —
ideal for object storage. No server-side rendering is required.

**Alternatives considered:**
- AWS Amplify Hosting — adds managed CI/CD and CDN but is more complex and
  has additional costs; unnecessary for a college project with manual deployment.
- CloudFront — not required for a local demo; can be added later for HTTPS
  and edge caching in a production scenario.

---

## ADR-08: Amazon SNS for Alert Notifications

**Decision:** Use SNS email subscriptions for threshold breach notifications.

**Context:** Needed a way to notify a human operator when a sensor exceeds its threshold.

**Rationale:** SNS email is simple to set up (create topic, subscribe email,
confirm via inbox), requires no infrastructure, and is included in the AWS Free Tier.
The de-duplication logic in `AlertService` ensures only the first breach in a
NORMAL → ALERT transition triggers a notification — preventing email floods during
sustained anomalies.

**Alternative considered:** SES (Simple Email Service) — provides more formatting
control but requires domain verification. SNS is sufficient for a college project.

---

## ADR-09: Amazon CloudWatch Logs for Monitoring

**Decision:** Use CloudWatch Logs for structured Lambda logging.

**Context:** Needed visibility into Lambda execution, errors, and system behaviour.

**Rationale:** CloudWatch Logs is the native logging destination for Lambda.
Explicit log groups with 30-day retention are defined in `template.yaml` to
prevent unbounded log accumulation. Structured JSON logging (one line per event
with a topic key) makes logs queryable with CloudWatch Insights.

---

## ADR-10: Single MQTT Connection for All 50 Simulated Devices

**Decision:** The simulator maintains one MQTT connection and publishes messages
for all 50 devices sequentially on that connection.

**Context:** Needed to simulate 50 devices from a single local Node.js process.

**Rationale:** MQTT supports multiple topic publications over a single connection.
Maintaining 50 separate TLS connections from one machine is computationally
expensive and would consume more IoT Core connection-minutes. One connection
is sufficient because the simulator publishes sequentially within each round.

---

## ADR-11: Local Mock Mode for Development

**Decision:** Implement a `mock-api.ts` module that generates realistic data
when `VITE_USE_MOCK_API=true`.

**Context:** The frontend needs to be developed and demonstrated without
requiring AWS credentials or a live API Gateway URL.

**Rationale:** Requiring AWS for frontend development creates friction. The mock
allows the full UI — all five pages, all 50 devices, alert states, history charts —
to be demonstrated locally in seconds. The mock data includes one active alert
(SRV-01) and one recovered alert (LAB-06) so the complete alert lifecycle can
be shown without simulating time.

**Important:** The mock mode is clearly indicated by a MOCK badge in the sidebar.
It is not a substitute for AWS integration testing.

---

## ADR-12: No Authentication in MVP

**Decision:** The dashboard API has no authentication layer.

**Context:** Adding authentication (e.g., Cognito user pools + JWT on API Gateway)
was considered during planning.

**Rationale:** Authentication adds significant complexity to both the API Gateway
configuration and the frontend (login flow, token refresh, protected routes). For
a college academic project demonstrating IoT data flow, the additional complexity
distracted from the core goals. The project's data (environmental readings) is
not personally identifiable or sensitive at this scope.

**Acknowledged limitation:** Any API Gateway URL that is publicly accessible can
be called without authentication. This is documented in [LIMITATIONS.md](./LIMITATIONS.md).
Authentication would be the first addition for a production deployment.

---

## ADR-13: Manual AWS Console Deployment

**Decision:** Deploy all AWS resources manually through the AWS Console rather
than using AWS CLI, SAM CLI, or automated CI/CD.

**Context:** The project explicitly prohibits AWS CLI and SAM CLI installation.

**Rationale:** Manual deployment ensures the student understands what each
AWS resource is, what configuration it requires, and how the services connect.
Automated deployment tools abstract away these details. `backend/template.yaml`
serves as an Infrastructure-as-Code reference describing the target architecture,
and can be used for future automated deployment when CLI tools become available.

**Trade-off:** Manual deployment is error-prone and not repeatable without careful
following of the checklist. This is acceptable for a one-time college project setup.

---

## ADR-14: No EC2, RDS, Fargate, or NAT Gateway

**Decision:** Exclude all always-on compute and networking services.

**Context:** AWS Free Tier has limits; unnecessary services accumulate unexpected charges.

**Rationale:** EC2 (even t2.micro after Free Tier year) and RDS generate hourly
charges regardless of utilisation. NAT Gateway has a fixed hourly charge plus
data transfer fees. These services are appropriate for production workloads but
are architectural anti-patterns for a serverless, event-driven, pay-per-use
college project.

---

## ADR-15: 90-Day TTL on Historical Readings

**Decision:** Historical readings in `CampusReadings` expire after 90 days
via DynamoDB TTL on the `expiresAt` attribute.

**Context:** Unconstrained growth of the `CampusReadings` table would increase
DynamoDB storage charges over time.

**Rationale:** For a college monitoring project, 90 days of history is ample
for trend analysis and charts. DynamoDB TTL automatically removes expired items
asynchronously at no additional cost. Without TTL, the table would grow at
~216,000 items/month indefinitely.
