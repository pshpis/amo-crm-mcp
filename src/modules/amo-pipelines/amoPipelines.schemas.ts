import { z } from 'zod';

export const pipelineStatusSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().optional(),
  sort: z.number().optional(),
  // AmoCRM может отдавать type как строку или числовой код
  type: z.union([z.string(), z.number()]).optional(),
});

export const pipelineSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_main: z.boolean().optional(),
  sort: z.number().optional(),
  _embedded: z.object({
    statuses: z.array(pipelineStatusSchema),
  }),
});

export const amoPipelinesResponseSchema = z.object({
  _embedded: z.object({
    pipelines: z.array(pipelineSchema),
  }),
});

export const pipelineWithStatusesSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_main: z.boolean().optional(),
  sort: z.number().optional(),
  statuses: z.array(pipelineStatusSchema),
});

export const pipelinesResultSchema = z.object({
  pipelines: z.array(pipelineWithStatusesSchema),
});

export type PipelineStatus = z.infer<typeof pipelineStatusSchema>;
export type PipelineWithStatuses = z.infer<typeof pipelineWithStatusesSchema>;
export type PipelinesResult = z.infer<typeof pipelinesResultSchema>;
