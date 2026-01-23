import { z } from 'zod';

export const taskSchema = z.object({
  id: z.number(),
  text: z.string().nullable().optional(),
  entity_id: z.number().nullable().optional(),
  entity_type: z.string().nullable().optional(),
  responsible_user_id: z.number().optional(),
  created_by: z.number().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
  complete_till: z.number().optional(),
  is_completed: z.boolean().optional(),
  task_type_id: z.number().optional(),
  duration: z.number().optional(),
});

export const amoTasksApiResponseSchema = z.object({
  _embedded: z.object({
    tasks: z.array(taskSchema),
  }),
});

export const singleTaskApiResponseSchema = z.object({
  _embedded: z.object({
    tasks: z.array(taskSchema).min(1),
  }),
});

// Schema for POST/PATCH responses - AmoCRM returns minimal data
export const taskMinimalSchema = z
  .object({
    id: z.number(),
  })
  .passthrough(); // Allow additional fields but only require id

export const singleTaskMinimalApiResponseSchema = z.object({
  _embedded: z.object({
    tasks: z.array(taskMinimalSchema).min(1),
  }),
});

export type TaskMinimal = z.infer<typeof taskMinimalSchema>;

export const tasksListSchema = z.array(taskSchema);
export const tasksListResultSchema = z.object({
  tasks: tasksListSchema,
});

// Input schemas
export const getTaskByIdInputSchema = z.object({
  id: z.number().int().positive(),
});

export const getTasksByLeadIdInputSchema = z.object({
  lead_id: z.number().int().positive(),
});

export const createTaskInputSchema = z.object({
  text: z.string().min(1),
  responsible_user_id: z.number().int().positive(),
  complete_till: z.number().int().positive(),
  entity_id: z.number().int().positive().optional(),
  entity_type: z.enum(['leads', 'contacts', 'companies', 'customers']).optional(),
  task_type_id: z.number().int().positive().optional(),
  duration: z.number().int().nonnegative().optional(),
});

export const updateTaskInputSchema = z.object({
  id: z.number().int().positive(),
  text: z.string().min(1).optional(),
  responsible_user_id: z.number().int().positive().optional(),
  complete_till: z.number().int().positive().optional(),
  entity_id: z.number().int().positive().optional(),
  entity_type: z.enum(['leads', 'contacts', 'companies', 'customers']).optional(),
  task_type_id: z.number().int().positive().optional(),
  duration: z.number().int().nonnegative().optional(),
});

export const completeTaskInputSchema = z.object({
  id: z.number().int().positive(),
});

// Output schemas
export const singleTaskResultSchema = z.object({
  task: taskSchema,
});

export const tasksByLeadResultSchema = z.object({
  tasks: tasksListSchema,
});

export const createTaskResultSchema = z.object({
  task: taskMinimalSchema,
});

export const updateTaskResultSchema = z.object({
  task: taskMinimalSchema,
});

export const completeTaskResultSchema = z.object({
  task: taskMinimalSchema,
});

// Types
export type AmoTask = z.infer<typeof taskSchema>;
export type TasksList = z.infer<typeof tasksListSchema>;
export type GetTaskByIdInput = z.infer<typeof getTaskByIdInputSchema>;
export type GetTasksByLeadIdInput = z.infer<typeof getTasksByLeadIdInputSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskInputSchema>;
export type SingleTaskResult = z.infer<typeof singleTaskResultSchema>;
export type TasksByLeadResult = z.infer<typeof tasksByLeadResultSchema>;
export type CreateTaskResult = z.infer<typeof createTaskResultSchema>;
export type UpdateTaskResult = z.infer<typeof updateTaskResultSchema>;
export type CompleteTaskResult = z.infer<typeof completeTaskResultSchema>;
