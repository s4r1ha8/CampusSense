# CampusSense — Known Limitations

This document honestly describes the boundaries and limitations of the
CampusSense project as it exists at the end of Phase 4 (local development phase).

---

## 1. Virtual Devices — No Physical Hardware

All 50 campus sensor locations are represented by virtual devices simulated
in a local Node.js process (`simulator/`). No physical temperature or humidity
sensors exist.

The AWS IoT architecture is designed to accept real sensors with minimal
changes (see [AWS_CONNECTION_GUIDE.md](./AWS_CONNECTION_GUIDE.md)), but this
has not been implemented or tested.

---

## 2. AWS Live Deployment Not Yet Performed

AWS infrastructure has not been provisioned. No real-world integration testing
has occurred for:

- MQTT connection from simulator to AWS IoT Core
- IoT Rule → Lambda invocation
- Lambda → DynamoDB reads/writes
- Lambda → SNS email delivery
- API Gateway → Lambda → DynamoDB → dashboard live data flow

The following have been tested locally only:
- Backend business logic (unit tests, in-memory repositories)
- Frontend rendering (mock API)
- TypeScript correctness (all packages)

All AWS integration testing is deferred to after manual deployment using the
guide in [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 3. No Authentication

The dashboard API (API Gateway → Lambda) has no authentication layer. Any URL
that is publicly exposed can be called without credentials.

Authentication (e.g., Amazon Cognito user pools with JWT on API Gateway)
is outside the MVP scope for this college project. It would be the first
addition for a production deployment.

---

## 4. No Deep Message Deduplication

Every telemetry payload contains a `messageId` field. However, the DynamoDB
persistence layer does not enforce uniqueness based on `messageId`. If the same
message is delivered twice (e.g., due to MQTT QoS retry), it will be stored twice
in `CampusReadings`.

A distributed deduplication layer (e.g., an idempotency table or conditional
`PutItem`) was deemed outside the scope of this academic project.

---

## 5. Mock Mode Is Not AWS Integration Testing

`VITE_USE_MOCK_API=true` provides a fully functional local dashboard with
realistic data. It is useful for development and demonstration, but it does not
exercise any AWS services, Lambda code, DynamoDB adapters, or SNS integrations.

The mock API (`frontend/src/services/mock-api.ts`) generates data in-browser.
It is not a backend service.

---

## 6. Free Tier Suitability Is Not Guaranteed

The architecture is designed to operate within applicable AWS Free Tier
allowances at the intended project scale. However, Free Tier eligibility
depends on the account's age, prior usage, and current AWS pricing terms —
all of which change. The project does not guarantee zero-cost operation.

See [FREE_TIER.md](./FREE_TIER.md) for detailed cost characteristics.

---

## 7. Manual AWS Deployment Required

No automated deployment exists. Before the system can operate with real data:

1. All AWS resources must be created manually (see [AWS_CONSOLE_CHECKLIST.md](./AWS_CONSOLE_CHECKLIST.md))
2. IoT certificates must be downloaded and placed in `simulator/certs/`
3. Environment variables must be filled in for the simulator and frontend
4. The Lambda zip must be uploaded manually
5. The frontend build must be uploaded to S3

---

## 8. Humidity Alerting Is Secondary

Temperature is the primary metric driving the alert state machine. Humidity is
recorded, validated, and displayed, but threshold breaches for humidity alone do
not currently trigger alerts or state transitions. This is a deliberate scope
decision for the MVP.

---

## 9. Single-Region Deployment

The architecture targets `ap-south-1` (Mumbai) as the AWS region. Multi-region
deployment, disaster recovery, and cross-region replication are outside project scope.

---

## 10. No CI/CD Pipeline

There is no GitHub Actions, CodePipeline, or automated deployment pipeline.
Testing is run manually (`npm test`). Builds are manual. Deployment to AWS
is manual. A CI/CD pipeline would be the natural next infrastructure addition.
