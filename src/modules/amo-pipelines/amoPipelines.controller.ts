import { AmoPipelinesService } from './amoPipelines.service';
import { pipelinesResultSchema, PipelinesResult } from './amoPipelines.schemas';
import { Logger } from '../../lib/logger/index';
import { BaseController, Tool, ToolResult } from '../../lib/base/baseController';

export class AmoPipelinesController extends BaseController {
  constructor(
    private readonly service: AmoPipelinesService,
    logger: Logger
  ) {
    super(logger);
  }

  @Tool({
    name: 'get_pipelines',
    title: 'Get pipelines and stages from AmoCRM',
    description: 'Возвращает список всех воронок и этапов сделок в AmoCRM.',
    outputSchema: pipelinesResultSchema,
    errorLogMessage: 'Failed to fetch pipelines from AmoCRM',
    errorLlmMessage: 'Не удалось получить список воронок AmoCRM.',
  })
  private async getPipelines(): Promise<ToolResult<PipelinesResult>> {
    const pipelines = await this.service.getPipelines();

    const lines = pipelines.flatMap((pipeline) => {
      const header = `Воронка "${pipeline.name}" (id: ${pipeline.id}${
        pipeline.is_main ? ', главная' : ''
      })`;
      if (!pipeline.statuses.length) {
        return [`- ${header}: этапов нет`];
      }
      const statusLines = pipeline.statuses.map((status) => {
        const color = status.color ? `цвет ${status.color}` : 'цвет не указан';
        return `    • ${status.name} (id: ${status.id}, ${color})`;
      });
      return [`- ${header}:`, ...statusLines];
    });

    const summary =
      pipelines.length === 0 ? 'Воронки не найдены.' : `Найдено воронок: ${pipelines.length}.`;

    return {
      structuredContent: { pipelines },
      content: [
        {
          type: 'text',
          text: pipelines.length === 0 ? summary : `${summary}\nСписок:\n${lines.join('\n')}`,
        },
      ],
    };
  }
}
