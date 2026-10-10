type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogFields = Record<string, unknown>;

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE_KEY_PATTERN = /token|password|secret|authorization|cookie/i;
const REDACTED = '[REDACTED]';

let minimumLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  minimumLevel = level;
}

function redact(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : value])
  );
}

export function serializeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message, stack: error.stack };
  }
  return { errorMessage: String(error) };
}

function write(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minimumLevel]) {
    return;
  }
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...redact(fields) });
  if (level === 'error' || level === 'warn') {
    console.error(entry);
    return;
  }
  console.log(entry);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write('debug', message, fields),
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, fields?: LogFields) => write('error', message, fields),
};
