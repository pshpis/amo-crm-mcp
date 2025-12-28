import { config as loadEnvFile } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env into process.env
loadEnvFile();

const envSchema = z.object({
  LOG_LEVEL: z.string().optional(),
  AMO_MAX_CONCURRENCY: z
    .coerce.number()
    .int()
    .positive()
    .default(5)
    .describe('Максимальное число одновременных запросов к AmoCRM API'),
  AMO_BASE_URL: z
    .string()
    .url()
    .describe('Base URL of the AmoCRM API (e.g., https://example.amocrm.ru/api/v4/)')
    .optional(),
  AMO_INTEGRATION_ID: z.string().optional(),
  AMO_INTEGRATION_SECRET: z.string().optional(),
  AMO_INTEGRATION_KEY: z.string().optional()
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
