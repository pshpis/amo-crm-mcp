export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export const normalizeLevel = (level?: string | null): LogLevel => {
  const normalized = level?.toLowerCase() as LogLevel | undefined;
  if (normalized && levelWeight[normalized] !== undefined) {
    return normalized;
  }
  return 'info';
};

export const formatPrefix = (level: LogLevel): string =>
  `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
