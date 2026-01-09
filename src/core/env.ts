import { config as loadEnvFile } from 'dotenv';
import { z } from 'zod';

// Silence dotenv noisy banner to avoid breaking stdio transports
const originalLog = console.log;
const originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};
loadEnvFile();
console.log = originalLog;
console.warn = originalWarn;

// Load environment variables from .env into process.env

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
  AMO_MAX_CONCURRENCY: z
    .coerce.number()
    .int()
    .positive()
    .default(5)
    .describe('Максимальное число одновременных запросов к AmoCRM API'),
  LOG_FILE_PATH: z
    .string()
    .optional()
    .describe('Путь до файла логов (по умолчанию mcp.log в рабочей директории)'),
  AMO_BASE_URL: z
    .string()
    .url()
    .describe('Base URL of the AmoCRM API (e.g., https://example.amocrm.ru/api/v4/)'),
  AMO_INTEGRATION_ID: z.string().optional(),
  AMO_INTEGRATION_SECRET: z.string().optional(),
  AMO_INTEGRATION_KEY: z
    .string()
    .describe('Access token for AmoCRM API authentication')
});

export type EnvConfig = z.infer<typeof envSchema>;

export const loadEnvConfig = (): EnvConfig => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return result.data;
};
