import { z } from 'zod';

import { ServerModule } from '../../core/module';
import { collectHealthSnapshot, formatHealthText } from './health.service';

const healthOutputSchema = z.object({
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

export const healthModule: ServerModule = {
  name: 'health',
  register: (server, context) => {
    server.registerTool(
      'server-health',
      {
        title: 'Server health',
        description: 'Returns runtime health and configuration details about the MCP server.',
        outputSchema: healthOutputSchema
      },
      () => {
        const snapshot = collectHealthSnapshot(context);
        const structuredContent = snapshot as unknown as Record<string, unknown>;

        return {
          structuredContent,
          content: [
            {
              type: 'text',
              text: formatHealthText(snapshot)
            }
          ]
        };
      }
    );
  }
};
