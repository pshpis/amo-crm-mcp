export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const normalizeLevel = (level?: string | null): LogLevel => {
  const normalized = level?.toLowerCase() as LogLevel | undefined;
  if (normalized && levelWeight[normalized] !== undefined) {
    return normalized;
  }
  return 'info';
};

const formatPrefix = (level: LogLevel): string =>
  `[${new Date().toISOString()}] [${level.toUpperCase()}]`;

export class ConsoleLogger implements Logger {
  private readonly threshold: number;

  constructor(level?: string | null) {
    const minLevel = normalizeLevel(level);
    this.threshold = levelWeight[minLevel];
  }

  private log(level: LogLevel, ...args: unknown[]) {
    if (levelWeight[level] < this.threshold) {
      return;
    }
    const prefix = formatPrefix(level);
    // Always write logs to stderr to avoid interfering with stdio transports
    // that expect JSON on stdout.
    console.error(prefix, ...args);
  }

  debug(...args: unknown[]) {
    this.log('debug', ...args);
  }

  info(...args: unknown[]) {
    this.log('info', ...args);
  }

  warn(...args: unknown[]) {
    this.log('warn', ...args);
  }

  error(...args: unknown[]) {
    this.log('error', ...args);
  }
}
