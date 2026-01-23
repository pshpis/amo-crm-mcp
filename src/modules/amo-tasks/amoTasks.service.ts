import { AmoService } from '../../core/amo';
import {
  amoTasksApiResponseSchema,
  singleTaskMinimalApiResponseSchema,
  taskSchema,
  TasksList,
  AmoTask,
  TaskMinimal,
  GetTaskByIdInput,
  GetTasksByLeadIdInput,
  CreateTaskInput,
  UpdateTaskInput,
  CompleteTaskInput,
} from './amoTasks.schemas';

export class AmoTasksService {
  constructor(private readonly amoService: AmoService) {}

  async getActiveTasks(): Promise<TasksList> {
    const data = await this.amoService.request({
      path: '/tasks',
      query: {
        'filter[is_completed]': 0,
        'order[complete_till]': 'asc',
      },
    });

    // AmoCRM returns 204 No Content (empty response) when there are no results
    if (!data) {
      return [];
    }

    const parsed = amoTasksApiResponseSchema.parse(data);
    return parsed._embedded.tasks;
  }

  async getTaskById(input: GetTaskByIdInput): Promise<AmoTask> {
    const data = await this.amoService.request({
      path: `/tasks/${input.id}`,
    });

    // AmoCRM returns single entity directly, not wrapped in _embedded
    const task = taskSchema.parse(data);
    return task;
  }

  async getTasksByLeadId(input: GetTasksByLeadIdInput): Promise<TasksList> {
    const data = await this.amoService.request({
      path: '/tasks',
      query: {
        'filter[entity_id]': input.lead_id,
        'filter[entity_type]': 'leads',
      },
    });

    // AmoCRM returns 204 No Content (empty response) when there are no results
    if (!data) {
      return [];
    }

    const parsed = amoTasksApiResponseSchema.parse(data);
    return parsed._embedded.tasks;
  }

  async createTask(input: CreateTaskInput): Promise<TaskMinimal> {
    const taskData: Record<string, unknown> = {
      text: input.text,
      responsible_user_id: input.responsible_user_id,
      complete_till: input.complete_till,
    };

    if (input.entity_id !== undefined) {
      taskData.entity_id = input.entity_id;
    }
    if (input.entity_type !== undefined) {
      taskData.entity_type = input.entity_type;
    }
    if (input.task_type_id !== undefined) {
      taskData.task_type_id = input.task_type_id;
    }
    if (input.duration !== undefined) {
      taskData.duration = input.duration;
    }

    const data = await this.amoService.request({
      path: '/tasks',
      method: 'POST',
      body: [taskData],
    });

    // POST operations return minimal data in _embedded format
    const parsed = singleTaskMinimalApiResponseSchema.parse(data);
    return parsed._embedded.tasks[0];
  }

  async updateTask(input: UpdateTaskInput): Promise<TaskMinimal> {
    const taskData: Record<string, unknown> = {
      id: input.id,
    };

    if (input.text !== undefined) {
      taskData.text = input.text;
    }
    if (input.responsible_user_id !== undefined) {
      taskData.responsible_user_id = input.responsible_user_id;
    }
    if (input.complete_till !== undefined) {
      taskData.complete_till = input.complete_till;
    }
    if (input.entity_id !== undefined) {
      taskData.entity_id = input.entity_id;
    }
    if (input.entity_type !== undefined) {
      taskData.entity_type = input.entity_type;
    }
    if (input.task_type_id !== undefined) {
      taskData.task_type_id = input.task_type_id;
    }
    if (input.duration !== undefined) {
      taskData.duration = input.duration;
    }

    // AmoCRM API v4 requires PATCH to /tasks endpoint (not /tasks/{id}) with id in body
    const data = await this.amoService.request({
      path: '/tasks',
      method: 'PATCH',
      body: [taskData],
    });

    // PATCH operations return minimal data in _embedded format
    const parsed = singleTaskMinimalApiResponseSchema.parse(data);
    return parsed._embedded.tasks[0];
  }

  async completeTask(input: CompleteTaskInput): Promise<TaskMinimal> {
    // AmoCRM API v4 requires PATCH to /tasks endpoint (not /tasks/{id}) with id in body
    const data = await this.amoService.request({
      path: '/tasks',
      method: 'PATCH',
      body: [
        {
          id: input.id,
          is_completed: true,
          result: {
            text: 'Задача выполнена через MCP',
          },
        },
      ],
    });

    // PATCH operations return minimal data in _embedded format
    const parsed = singleTaskMinimalApiResponseSchema.parse(data);
    return parsed._embedded.tasks[0];
  }
}
