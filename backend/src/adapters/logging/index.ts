/** Structured logger for Lambda functions. Output is captured by CloudWatch Logs. */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface Logger {
  debug(event: string, data?: Record<string, unknown>): void;
  info (event: string, data?: Record<string, unknown>): void;
  warn (event: string, data?: Record<string, unknown>): void;
  error(event: string, data?: Record<string, unknown>): void;
}

/** CloudWatch-compatible structured logger (used in real Lambda runtime). */
export class CloudWatchLogger implements Logger {
  debug(event: string, data?: Record<string, unknown>): void { this.log('DEBUG', event, data); }
  info (event: string, data?: Record<string, unknown>): void { this.log('INFO',  event, data); }
  warn (event: string, data?: Record<string, unknown>): void { this.log('WARN',  event, data); }
  error(event: string, data?: Record<string, unknown>): void { this.log('ERROR', event, data); }

  private log(level: LogLevel, event: string, data?: Record<string, unknown>): void {
    // JSON output is automatically indexed by CloudWatch
    const entry = { level, event, timestamp: new Date().toISOString(), ...data };
    // Never log credentials or private key paths
    console.log(JSON.stringify(entry));
  }
}

/** Silent logger used in unit tests. */
export class NoopLogger implements Logger {
  debug(): void {}
  info (): void {}
  warn (): void {}
  error(): void {}
}

/** Capturing logger — stores log entries for assertions in tests. */
export class CapturingLogger implements Logger {
  readonly entries: Array<{ level: LogLevel; event: string; data?: Record<string, unknown> }> = [];

  debug(event: string, data?: Record<string, unknown>): void { this.entries.push({ level: 'DEBUG', event, data }); }
  info (event: string, data?: Record<string, unknown>): void { this.entries.push({ level: 'INFO',  event, data }); }
  warn (event: string, data?: Record<string, unknown>): void { this.entries.push({ level: 'WARN',  event, data }); }
  error(event: string, data?: Record<string, unknown>): void { this.entries.push({ level: 'ERROR', event, data }); }

  hasEvent(event: string): boolean {
    return this.entries.some(e => e.event === event);
  }
}
