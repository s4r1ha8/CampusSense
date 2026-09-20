# CampusSense — AWS Free Tier & Cost Strategy

> **Disclaimer:** The architecture is designed to operate within applicable AWS Free Tier
> allowances at the intended project scale, subject to the AWS account's current eligibility,
> pricing terms, service limits, and actual usage. AWS Free Tier terms and pricing change over
> time. Verify current terms at [aws.amazon.com/free](https://aws.amazon.com/free) before
> deploying and incurring costs.

---

## Design Characteristics

CampusSense is designed around the following operational parameters:

| Parameter | Value |
|-----------|-------|
| Virtual devices | 50 |
| Telemetry interval | 10 minutes (default) |
| MQTT connections | 1 (simulator multiplexes all 50 devices) |
| Messages per device per hour | 6 |
| Messages per day (all devices) | 50 × 6 × 24 = 7,200 |
| Messages per month (approx.) | ~216,000 |
| Continuously running servers | None |
| Historical data retention | 90 days (DynamoDB TTL auto-deletes older records) |
| CloudWatch log retention | 30 days |

---

## Excluded Services (Cost Avoidance)

The following AWS services are **intentionally excluded** from this architecture
because they generate charges that are disproportionate to the project's needs:

| Excluded service | Reason |
|-----------------|--------|
| Amazon EC2 | Hourly compute charges regardless of utilisation |
| Amazon RDS | Hourly database instance charges plus storage |
| AWS Fargate / EKS | Container orchestration overhead and charges |
| NAT Gateway | Fixed hourly charge plus per-GB data transfer |
| Amazon Kinesis | Stream processing at this scale is unnecessary |
| Amazon MSK (Kafka) | Managed streaming service — far beyond requirements |
| Amazon OpenSearch | Full-text search is not needed for this use case |
| Amazon SageMaker | Machine learning is out of scope |
| AWS Cognito | Authentication is outside this MVP's scope |
| Amazon CloudFront | CDN is not required for a college demo frontend |
| X-Ray tracing | Distributed tracing is outside project scope |

---

## Included Services & Characteristics

### AWS IoT Core
- Billed per million MQTT messages published and delivered
- At ~216,000 messages/month, usage remains at a fraction of typical monthly limits
- One MQTT connection for the simulator reduces connection-time billing versus
  maintaining 50 separate connections

### AWS Lambda
- Billed per request and per GB-second of compute time
- Lambda functions are invoked only when telemetry arrives or API requests are made
- No charge when the system is idle between telemetry rounds

### Amazon DynamoDB
- On-Demand (Pay Per Request) billing — no provisioned capacity costs
- 90-day TTL on `CampusReadings` automatically removes old items, limiting storage growth
- With 50 devices at 10-minute intervals, `CampusReadings` grows at approximately
  7,200 items/day; TTL keeps total items around 648,000 at steady state

### API Gateway (HTTP API)
- HTTP APIs are priced lower than REST APIs and have lower per-request latency
- Only invoked when the dashboard makes a request — no background polling from AWS side

### Amazon S3
- Static website hosting for the React dashboard
- Storage is minimal (a compiled Vite SPA is typically under 2 MB)
- Charged for storage and data transfer (GET requests from users)

### Amazon SNS
- Standard email notifications
- Charged per notification delivery above the free tier threshold
- Alert de-duplication in `AlertService` prevents notification flooding
  (only sends on NORMAL → ALERT transition, not on sustained alerts)

### Amazon CloudWatch Logs
- Log groups configured with 30-day retention to limit storage costs
- Without explicit retention, CloudWatch stores logs indefinitely

---

## Cost Management Notes

- The simulator's default `SIMULATOR_INTERVAL_MS=600000` (10 minutes) is chosen to
  balance telemetry freshness with message volume. Short intervals for testing
  (e.g., `--interval=30`) should not be run continuously.
- DynamoDB TTL deletes records asynchronously — there may be a short period where
  expired items remain readable. This is expected behaviour.
- The IAM roles for Lambda use minimum required permissions, reducing the blast
  radius of any misconfiguration.
