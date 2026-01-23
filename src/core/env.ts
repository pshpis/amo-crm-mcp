import { z } from 'zod';
import { loadDotenvSilent, parseEnv } from '../lib/utils/envLoader';

const isValidTimezone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const envSchema = z.object({
  LOG_LEVEL: z.string().optional(),
  APP_TIMEZONE: z
    .string()
    .default('Europe/Moscow')
    .refine(isValidTimezone, { message: 'Invalid IANA timezone' })
    .describe('IANA timezone for date formatting (e.g., Europe/Moscow)'),
  AMO_MAX_CONCURRENCY: z.coerce
    .number()
    .int()
    .positive()
    .default(5)
    .describe('Maximum number of concurrent requests to AmoCRM API'),
  LOG_FILE_PATH: z
    .string()
    .optional()
    .describe('Path to log file (defaults to mcp.log in working directory)'),
  AMO_BASE_URL: z
    .string()
    .url()
    .describe('Base URL of the AmoCRM API (e.g., https://example.amocrm.ru/api/v4/)'),
  AMO_INTEGRATION_ID: z.string().optional(),
  AMO_INTEGRATION_SECRET: z.string().optional(),
  AMO_INTEGRATION_KEY: z.string().describe('Access token for AmoCRM API authentication'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const loadEnvConfig = (): EnvConfig => {
  // Explicitly load .env file before parsing
  loadDotenvSilent();
  return parseEnv(envSchema);
};
