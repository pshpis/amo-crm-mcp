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

export const createLogger = (level?: string | null): Logger => {
  const minLevel = normalizeLevel(level);
  const threshold = levelWeight[minLevel];

  const log = (logLevel: LogLevel, ...args: unknown[]) => {
    if (levelWeight[logLevel] < threshold) {
      return;
    }

    const prefix = formatPrefix(logLevel);
    const printer =
      logLevel === 'debug' ? console.log : console[logLevel] ?? console.log;

    printer(prefix, ...args);
  };

  return {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args)
  };
};
