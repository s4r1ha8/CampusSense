/** SNS notification abstraction. Business logic calls NotificationService only. */

export interface NotificationService {
  sendAlert(params: AlertNotificationParams): Promise<void>;
}

export interface AlertNotificationParams {
  deviceId:      string;
  locationName:  string;
  building:      string;
  metric:        'temperature' | 'humidity';
  value:         number;
  threshold:     number;
  timestamp:     string;
}

// ─── AWS SNS implementation ────────────────────────────────────────────────

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export class SnsNotificationService implements NotificationService {
  private client:  SNSClient;
  private topicArn: string;

  constructor(topicArn: string, region: string) {
    this.topicArn = topicArn;
    this.client   = new SNSClient({ region });
  }

  async sendAlert(params: AlertNotificationParams): Promise<void> {
    const subject = `[CampusSense ALERT] ${params.metric.toUpperCase()} threshold exceeded — ${params.deviceId}`;

    const body = [
      `CAMPUS SENSE TEMPERATURE ALERT`,
      ``,
      `Location  : ${params.locationName}`,
      `Building  : ${params.building}`,
      `Device ID : ${params.deviceId}`,
      ``,
      `Metric    : ${params.metric}`,
      `Reading   : ${params.value}`,
      `Threshold : ${params.threshold}`,
      `Time      : ${params.timestamp}`,
      ``,
      `Please check the CampusSense dashboard for more details.`,
    ].join('\n');

    await this.client.send(new PublishCommand({
      TopicArn: this.topicArn,
      Subject:  subject,
      Message:  body,
    }));
  }
}

// ─── Mock implementation ───────────────────────────────────────────────────

export class MockNotificationService implements NotificationService {
  readonly sent: AlertNotificationParams[] = [];

  async sendAlert(params: AlertNotificationParams): Promise<void> {
    this.sent.push(params);
  }

  wasAlertSentFor(deviceId: string): boolean {
    return this.sent.some(n => n.deviceId === deviceId);
  }
}
