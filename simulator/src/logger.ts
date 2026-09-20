/** Lightweight structured logger for the simulator. */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  const output = JSON.stringify(entry);

  if (level === 'error' || level === 'warn') {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
  info:  (message: string, data?: Record<string, unknown>) => log('info',  message, data),
  warn:  (message: string, data?: Record<string, unknown>) => log('warn',  message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
};
