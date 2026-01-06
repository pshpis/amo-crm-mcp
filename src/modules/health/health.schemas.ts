import { z } from 'zod';

export const healthOutputSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  server: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
    uptimeSeconds: z.number(),
    startedAt: z.string()
  }),
  environment: z.object({
    nodeVersion: z.string(),
    platform: z.string(),
    pid: z.number(),
    cwd: z.string()
  }),
  resources: z.object({
    memory: z.object({
      rssBytes: z.number(),
      heapUsedBytes: z.number(),
      heapTotalBytes: z.number(),
      externalBytes: z.number()
    }),
    cpuCount: z.number(),
    loadAverage: z.tuple([z.number(), z.number(), z.number()])
  })
});

export type HealthSnapshot = z.infer<typeof healthOutputSchema>;
