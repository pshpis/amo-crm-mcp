import { Logger } from '../../logger/types';
import { HealthService } from './health.service';
import { HealthSnapshot, healthOutputSchema } from './health.schemas';
import { BaseController, Tool, ToolResult } from '../../base/baseController';
import { BaseServerContext } from '../../base/baseContext';

export class HealthController<
  TContext extends BaseServerContext = BaseServerContext,
> extends BaseController {
  constructor(
    private readonly service: HealthService<TContext>,
    logger: Logger
  ) {
    super(logger);
  }

  @Tool({
    name: 'server-health',
    title: 'Server health',
    description: 'Возвращает информацию о состоянии и конфигурации MCP сервера.',
    outputSchema: healthOutputSchema,
    errorLogMessage: 'Failed to collect server health snapshot',
    errorLlmMessage: 'Не удалось получить информацию о состоянии сервера.',
  })
  private getHealth(): ToolResult<HealthSnapshot> {
    const snapshot = this.service.getSnapshot();
    return {
      structuredContent: snapshot,
      content: [
        {
          type: 'text',
          text: this.service.formatSnapshot(snapshot),
        },
      ],
    };
  }
}
