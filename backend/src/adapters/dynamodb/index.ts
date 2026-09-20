/**
 * DynamoDB adapter implementations for all five CampusSense tables.
 *
 * These classes implement the repository interfaces using the AWS SDK v3.
 * They are only used in the real Lambda runtime — unit tests use the
 * InMemory implementations from repositories/index.ts.
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import {
  DeviceRepository,
  ReadingRepository,
  CurrentRepository,
  AlertRepository,
  StatisticsRepository,
} from '../../repositories/index.js';

import {
  Device,
  Reading,
  CurrentReading,
  Alert,
  SystemStats,
} from '../../models/telemetry.js';

import { env } from '../../config/environment.js';

// Shared DynamoDB client (one instance per Lambda cold start)
const ddb = new DynamoDBClient({ region: env.awsRegion });

// ─── Device Repository ─────────────────────────────────────────────────────

export class DynamoDeviceRepository implements DeviceRepository {
  private table = env.tables.campusDevices;

  async getById(deviceId: string): Promise<Device | null> {
    const res = await ddb.send(new GetItemCommand({
      TableName: this.table,
      Key: marshall({ deviceId }),
    }));
    return res.Item ? (unmarshall(res.Item) as Device) : null;
  }

  async listAll(): Promise<Device[]> {
    const res = await ddb.send(new ScanCommand({ TableName: this.table }));
    return (res.Items ?? []).map(i => unmarshall(i) as Device);
  }

  async save(device: Device): Promise<void> {
    await ddb.send(new PutItemCommand({
      TableName: this.table,
      Item:      marshall(device),
    }));
  }
}

// ─── Reading Repository ────────────────────────────────────────────────────

export class DynamoReadingRepository implements ReadingRepository {
  private table = env.tables.campusReadings;

  async save(reading: Reading): Promise<void> {
    await ddb.send(new PutItemCommand({
      TableName: this.table,
      Item:      marshall(reading),
    }));
  }

  async listByDevice(deviceId: string, limitHours = 24): Promise<Reading[]> {
    const since = new Date(Date.now() - limitHours * 60 * 60 * 1000).toISOString();

    const res = await ddb.send(new QueryCommand({
      TableName:                 this.table,
      KeyConditionExpression:    'deviceId = :id AND #ts >= :since',
      ExpressionAttributeNames:  { '#ts': 'timestamp' },
      ExpressionAttributeValues: marshall({ ':id': deviceId, ':since': since }),
    }));

    return (res.Items ?? []).map(i => unmarshall(i) as Reading);
  }
}

// ─── Current Repository ────────────────────────────────────────────────────

export class DynamoCurrentRepository implements CurrentRepository {
  private table = env.tables.campusCurrent;

  async get(deviceId: string): Promise<CurrentReading | null> {
    const res = await ddb.send(new GetItemCommand({
      TableName: this.table,
      Key:       marshall({ deviceId }),
    }));
    return res.Item ? (unmarshall(res.Item) as CurrentReading) : null;
  }

  async save(reading: CurrentReading): Promise<void> {
    await ddb.send(new PutItemCommand({
      TableName: this.table,
      Item:      marshall(reading),
    }));
  }

  async listAll(): Promise<CurrentReading[]> {
    const res = await ddb.send(new ScanCommand({ TableName: this.table }));
    return (res.Items ?? []).map(i => unmarshall(i) as CurrentReading);
  }
}

// ─── Alert Repository ──────────────────────────────────────────────────────

export class DynamoAlertRepository implements AlertRepository {
  private table = env.tables.campusAlerts;

  async save(alert: Alert): Promise<void> {
    await ddb.send(new PutItemCommand({
      TableName: this.table,
      Item:      marshall(alert),
    }));
  }

  async listRecent(campusId: string, limitHours = 48): Promise<Alert[]> {
    const since = new Date(Date.now() - limitHours * 60 * 60 * 1000).toISOString();

    const res = await ddb.send(new QueryCommand({
      TableName:                 this.table,
      KeyConditionExpression:    'campusId = :cid AND sk >= :since',
      ExpressionAttributeValues: marshall({ ':cid': campusId, ':since': since }),
      ScanIndexForward:          false,
    }));

    return (res.Items ?? []).map(i => unmarshall(i) as Alert);
  }

  async getLatestForDevice(deviceId: string): Promise<Alert | null> {
    // Scan is acceptable here for this low-volume table; a GSI could optimise this later.
    const res = await ddb.send(new ScanCommand({
      TableName:                 this.table,
      FilterExpression:          'deviceId = :id',
      ExpressionAttributeValues: marshall({ ':id': deviceId }),
    }));

    const items = (res.Items ?? []).map(i => unmarshall(i) as Alert);
    items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return items[0] ?? null;
  }
}

// ─── Statistics Repository ─────────────────────────────────────────────────

export class DynamoStatisticsRepository implements StatisticsRepository {
  private table = env.tables.campusSystemStats;

  async get(metricId: string): Promise<SystemStats | null> {
    const res = await ddb.send(new GetItemCommand({
      TableName: this.table,
      Key:       marshall({ metricId }),
    }));
    return res.Item ? (unmarshall(res.Item) as SystemStats) : null;
  }

  async save(stats: SystemStats): Promise<void> {
    await ddb.send(new PutItemCommand({
      TableName: this.table,
      Item:      marshall(stats),
    }));
  }
}
