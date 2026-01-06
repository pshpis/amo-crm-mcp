import { AmoTasksService } from './amoTasks.service';
import { tasksListResultSchema, TasksList } from './amoTasks.schemas';
import { Logger } from '../../lib/logger';
import { BaseController, ToolDescriptor, ToolResult } from '../../lib/baseController';

export class AmoTasksController extends BaseController {
  constructor(
    private readonly service: AmoTasksService,
    logger: Logger
  ) {
    super(logger);
  }

  getTools(): ToolDescriptor[] {
    return [
      {
        name: 'get_active_tasks',
        title: 'Get active tasks from AmoCRM',
        description: 'Возвращает список невыполненных задач из AmoCRM.',
        outputSchema: tasksListResultSchema,
        handler: this.wrapTool(() => this.getActiveTasks(), {
          errorLogMessage: 'Failed to fetch active tasks from AmoCRM',
          errorLlmMessage: 'Не удалось получить список задач из AmoCRM.'
        })
      }
    ];
  }

  private async getActiveTasks(): Promise<ToolResult<TasksList>> {
    const tasks = await this.service.getActiveTasks();

    const summary =
      tasks.length === 0
        ? 'Активных задач нет.'
        : `Найдено активных задач: ${tasks.length}.`;

    return {
      structuredContent: { tasks } as unknown as Record<string, unknown>,
      content: [
        {
          type: 'text',
          text: summary
        }
      ]
    };
  }
}
