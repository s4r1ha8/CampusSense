/**
 * Runtime environment configuration.
 * All Lambda environment variables are read here. No hard-coded values.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  awsRegion:   optional('AWS_REGION', 'ap-south-1'),
  campusId:    optional('CAMPUS_ID', 'VIT-CHENNAI'),
  snsTopicArn: optional('SNS_TOPIC_ARN', ''),

  tables: {
    campusDevices:     optional('TABLE_CAMPUS_DEVICES',      'CampusDevices'),
    campusReadings:    optional('TABLE_CAMPUS_READINGS',     'CampusReadings'),
    campusCurrent:     optional('TABLE_CAMPUS_CURRENT',      'CampusCurrent'),
    campusAlerts:      optional('TABLE_CAMPUS_ALERTS',       'CampusAlerts'),
    campusSystemStats: optional('TABLE_CAMPUS_SYSTEM_STATS', 'CampusSystemStats'),
  },

  /** How long (in days) to retain historical readings before TTL expiry. */
  readingTtlDays: parseInt(optional('READING_TTL_DAYS', '90'), 10),
};
