import { z } from 'zod';

export const taskSchema = z.object({
  id: z.number(),
  text: z.string().optional(),
  entity_id: z.number().nullable().optional(),
  entity_type: z.string().nullable().optional(),
  responsible_user_id: z.number().optional(),
  created_by: z.number().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
  complete_till: z.number().optional(),
  is_completed: z.boolean().optional()
});

export const amoTasksApiResponseSchema = z.object({
  _embedded: z.object({
    tasks: z.array(taskSchema)
  })
});

export const tasksListSchema = z.array(taskSchema);
export const tasksListResultSchema = z.object({
  tasks: tasksListSchema
});

export type AmoTask = z.infer<typeof taskSchema>;
export type TasksList = z.infer<typeof tasksListSchema>;
