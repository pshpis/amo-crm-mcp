import { z } from 'zod';

import { AmoService } from '../../core/amo';

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

export const tasksResponseSchema = z.object({
  _embedded: z.object({
    tasks: z.array(taskSchema)
  })
});

export type TasksResponse = z.infer<typeof tasksResponseSchema>;

export const fetchActiveTasks = async (
  amoService: AmoService
): Promise<TasksResponse> => {
  const data = await amoService.request({
    path: '/tasks',
    query: { 'filter[is_completed]': 0 }
  });

  return tasksResponseSchema.parse(data);
};
