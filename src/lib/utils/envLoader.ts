import { config as loadEnvFile } from 'dotenv';
import { z, ZodSchema } from 'zod';

/**
 * Load .env file silently (without breaking stdio transport by console output)
 */
export function loadDotenvSilent(): void {
  const originalLog = console.log;
  const originalWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  loadEnvFile();
  console.log = originalLog;
  console.warn = originalWarn;
}

/**
 * Parse and validate environment variables with Zod schema
 */
export function parseEnv<T extends ZodSchema>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return result.data;
}

/**
 * Base environment schema for common fields
 */
export const baseEnvSchema = z.object({
  LOG_LEVEL: z.string().optional(),
  LOG_FILE_PATH: z.string().optional(),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;
