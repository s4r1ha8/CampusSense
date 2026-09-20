import { SystemStats } from '../models/telemetry.js';
import { StatisticsRepository } from '../repositories/index.js';
import { env } from '../config/environment.js';

const METRIC_ID = 'GLOBAL';

const DEFAULT_STATS: SystemStats = {
  metricId:          METRIC_ID,
  totalMessages:     0,
  validMessages:     0,
  invalidMessages:   0,
  processedMessages: 0,
  alertsGenerated:   0,
  recoveries:        0,
  processingErrors:  0,
  lastProcessedAt:   '',
  lastErrorAt:       '',
  lastErrorMessage:  '',
};

/**
 * Manages CampusSystemStats counters.
 * Reads the current record, increments the relevant fields, and writes it back.
 * This is a simple read-modify-write — acceptable at the 10-minute telemetry rate.
 */
export class StatisticsService {
  constructor(private statsRepo: StatisticsRepository) {}

  async increment(delta: Partial<Pick<SystemStats,
    | 'totalMessages'
    | 'validMessages'
    | 'invalidMessages'
    | 'processedMessages'
    | 'alertsGenerated'
    | 'recoveries'
    | 'processingErrors'
  >> & {
    lastProcessedAt?:  string;
    lastErrorAt?:      string;
    lastErrorMessage?: string;
  }): Promise<void> {
    const current = (await this.statsRepo.get(METRIC_ID)) ?? { ...DEFAULT_STATS };

    const updated: SystemStats = {
      ...current,
      totalMessages:     current.totalMessages     + (delta.totalMessages     ?? 0),
      validMessages:     current.validMessages     + (delta.validMessages     ?? 0),
      invalidMessages:   current.invalidMessages   + (delta.invalidMessages   ?? 0),
      processedMessages: current.processedMessages + (delta.processedMessages ?? 0),
      alertsGenerated:   current.alertsGenerated   + (delta.alertsGenerated   ?? 0),
      recoveries:        current.recoveries        + (delta.recoveries        ?? 0),
      processingErrors:  current.processingErrors  + (delta.processingErrors  ?? 0),
      lastProcessedAt:   delta.lastProcessedAt  ?? current.lastProcessedAt,
      lastErrorAt:       delta.lastErrorAt       ?? current.lastErrorAt,
      lastErrorMessage:  delta.lastErrorMessage  ?? current.lastErrorMessage,
    };

    await this.statsRepo.save(updated);
  }

  async get(): Promise<SystemStats> {
    return (await this.statsRepo.get(METRIC_ID)) ?? { ...DEFAULT_STATS };
  }
}
