import { AmoService } from '../../core/amo';
import {
  AmoTask,
  amoTasksApiResponseSchema,
  TasksList,
  tasksListSchema
} from './amoTasks.schemas';

export class AmoTasksService {
  constructor(private readonly amoService: AmoService) {}

  async getActiveTasks(): Promise<TasksList> {
    const data = await this.amoService.request({
      path: '/tasks',
      query: { 'filter[is_completed]': 0 }
    });

    const parsed = amoTasksApiResponseSchema.parse(data);
    return tasksListSchema.parse(parsed._embedded.tasks) as AmoTask[];
  }
}
