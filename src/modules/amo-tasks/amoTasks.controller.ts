import { AmoTasksService } from './amoTasks.service';
import {
  tasksListResultSchema,
  TasksList,
  getTaskByIdInputSchema,
  singleTaskResultSchema,
  getTasksByLeadIdInputSchema,
  tasksByLeadResultSchema,
  createTaskInputSchema,
  createTaskResultSchema,
  updateTaskInputSchema,
  updateTaskResultSchema,
  completeTaskInputSchema,
  completeTaskResultSchema,
  GetTaskByIdInput,
  GetTasksByLeadIdInput,
  CreateTaskInput,
  UpdateTaskInput,
  CompleteTaskInput,
  SingleTaskResult,
  TasksByLeadResult,
  CreateTaskResult,
  UpdateTaskResult,
  CompleteTaskResult,
} from './amoTasks.schemas';
import { Logger } from '../../lib/logger/index';
import { BaseController, Tool, ToolResult } from '../../lib/base/baseController';
import { DateFormatter } from '../../lib/utils/dateFormatter';

export class AmoTasksController extends BaseController {
  private readonly dateFormatter: DateFormatter;

  constructor(
    private readonly service: AmoTasksService,
    logger: Logger,
    timezone: string
  ) {
    super(logger);
    this.dateFormatter = new DateFormatter(timezone, { emptyValue: 'без срока' });
  }

  private formatTaskType(taskTypeId?: number): string {
    if (!taskTypeId) {
      return 'тип не указан';
    }

    const taskTypes: Record<number, string> = {
      1: 'Звонок',
      2: 'Встреча',
    };

    return taskTypes[taskTypeId] || `тип ${taskTypeId}`;
  }

  @Tool({
    name: 'get_active_tasks',
    title: 'Get active tasks from AmoCRM',
    description: 'Возвращает список невыполненных задач из AmoCRM.',
    outputSchema: tasksListResultSchema,
    errorLogMessage: 'Failed to fetch active tasks from AmoCRM',
    errorLlmMessage: 'Не удалось получить список задач из AmoCRM.',
  })
  private async getActiveTasks(): Promise<ToolResult<{ tasks: TasksList }>> {
    const tasks = await this.service.getActiveTasks();

    const lines = tasks.map((task) => {
      const title = task.text?.trim() || 'без названия';
      const due = this.dateFormatter.format(task.complete_till);
      const taskType = this.formatTaskType(task.task_type_id);
      const link =
        task.entity_type === 'leads'
          ? `лид #${task.entity_id}`
          : task.entity_type
            ? `${task.entity_type} #${task.entity_id ?? '—'}`
            : 'без привязки';
      return `- #${task.id}: ${title} (${taskType}, ${link}, до ${due})`;
    });

    const summary =
      tasks.length === 0 ? 'Активных задач нет.' : `Найдено активных задач: ${tasks.length}.`;

    return {
      structuredContent: { tasks },
      content: [
        {
          type: 'text',
          text: tasks.length === 0 ? summary : `${summary}\nСписок:\n${lines.join('\n')}`,
        },
      ],
    };
  }

  @Tool({
    name: 'get_task_by_id',
    title: 'Get task by id from AmoCRM',
    description: 'Возвращает задачу по её ID из AmoCRM.',
    inputSchema: getTaskByIdInputSchema,
    outputSchema: singleTaskResultSchema,
    errorLogMessage: 'Failed to fetch task by id from AmoCRM',
    errorLlmMessage: 'Не удалось получить задачу по указанному ID.',
  })
  private async getTaskById(input: GetTaskByIdInput): Promise<ToolResult<SingleTaskResult>> {
    const task = await this.service.getTaskById(input);

    const title = task.text?.trim() || 'без названия';
    const due = this.dateFormatter.format(task.complete_till);
    const status = task.is_completed ? 'выполнена' : 'не выполнена';
    const taskType = this.formatTaskType(task.task_type_id);
    const link =
      task.entity_type === 'leads'
        ? `лид #${task.entity_id}`
        : task.entity_type
          ? `${task.entity_type} #${task.entity_id ?? '—'}`
          : 'без привязки';
    const responsible = task.responsible_user_id
      ? `ответственный: ${task.responsible_user_id}`
      : 'ответственный не указан';
    const created = task.created_at ? `создана: ${this.dateFormatter.format(task.created_at)}` : '';
    const updated = task.updated_at
      ? `обновлена: ${this.dateFormatter.format(task.updated_at)}`
      : '';

    const text = [
      `Задача #${task.id}`,
      `Название: ${title}`,
      `Тип: ${taskType}`,
      `Статус: ${status}`,
      `Срок выполнения: ${due}`,
      `Привязка: ${link}`,
      responsible,
      created,
      updated,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      structuredContent: { task },
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  @Tool({
    name: 'get_tasks_by_lead_id',
    title: 'Get tasks by lead id from AmoCRM',
    description: 'Возвращает все задачи по лиду (включая выполненные) из AmoCRM.',
    inputSchema: getTasksByLeadIdInputSchema,
    outputSchema: tasksByLeadResultSchema,
    errorLogMessage: 'Failed to fetch tasks by lead id from AmoCRM',
    errorLlmMessage: 'Не удалось получить задачи по указанному лиду.',
  })
  private async getTasksByLeadId(
    input: GetTasksByLeadIdInput
  ): Promise<ToolResult<TasksByLeadResult>> {
    const tasks = await this.service.getTasksByLeadId(input);

    const lines = tasks.map((task) => {
      const title = task.text?.trim() || 'без названия';
      const due = this.dateFormatter.format(task.complete_till);
      const status = task.is_completed ? 'выполнена' : 'не выполнена';
      const taskType = this.formatTaskType(task.task_type_id);
      return `- #${task.id}: ${title} (${taskType}, ${status}, до ${due})`;
    });

    const summary =
      tasks.length === 0
        ? `Задач по лиду #${input.lead_id} не найдено.`
        : `Найдено задач по лиду #${input.lead_id}: ${tasks.length}.`;

    return {
      structuredContent: { tasks },
      content: [
        {
          type: 'text',
          text: tasks.length === 0 ? summary : `${summary}\nСписок:\n${lines.join('\n')}`,
        },
      ],
    };
  }

  @Tool({
    name: 'create_task',
    title: 'Create task in AmoCRM',
    description: 'Создает новую задачу в AmoCRM.',
    inputSchema: createTaskInputSchema,
    outputSchema: createTaskResultSchema,
    errorLogMessage: 'Failed to create task in AmoCRM',
    errorLlmMessage: 'Не удалось создать задачу в AmoCRM.',
  })
  private async createTask(input: CreateTaskInput): Promise<ToolResult<CreateTaskResult>> {
    const task = await this.service.createTask(input);

    // Use only data that AmoCRM actually returns (usually just id)
    const text = [`Задача успешно создана.`, `ID: #${task.id}`].join('\n');

    return {
      structuredContent: { task },
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  @Tool({
    name: 'update_task',
    title: 'Update task in AmoCRM',
    description: 'Обновляет существующую задачу в AmoCRM.',
    inputSchema: updateTaskInputSchema,
    outputSchema: updateTaskResultSchema,
    errorLogMessage: 'Failed to update task in AmoCRM',
    errorLlmMessage: 'Не удалось обновить задачу в AmoCRM.',
  })
  private async updateTask(input: UpdateTaskInput): Promise<ToolResult<UpdateTaskResult>> {
    const task = await this.service.updateTask(input);

    // Use only data that AmoCRM actually returns (usually just id)
    const text = [`Задача успешно обновлена.`, `ID: #${task.id}`].join('\n');

    return {
      structuredContent: { task },
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  @Tool({
    name: 'complete_task',
    title: 'Complete task in AmoCRM',
    description: 'Отмечает задачу как выполненную в AmoCRM.',
    inputSchema: completeTaskInputSchema,
    outputSchema: completeTaskResultSchema,
    errorLogMessage: 'Failed to complete task in AmoCRM',
    errorLlmMessage: 'Не удалось выполнить задачу в AmoCRM.',
  })
  private async completeTask(input: CompleteTaskInput): Promise<ToolResult<CompleteTaskResult>> {
    const task = await this.service.completeTask(input);

    // Use only data that AmoCRM actually returns (usually just id)
    const text = [`Задача успешно выполнена.`, `ID: #${task.id}`].join('\n');

    return {
      structuredContent: { task },
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }
}
