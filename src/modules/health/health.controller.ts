import { Logger } from '../../lib/logger';
import { HealthService } from './health.service';
import { HealthSnapshot, healthOutputSchema } from './health.schemas';
import { BaseController, Tool, ToolResult } from '../../lib/baseController';

export class HealthController extends BaseController {
  constructor(
    private readonly service: HealthService,
    logger: Logger
  ) {
    super(logger);
  }

  @Tool({
    name: 'server-health',
    title: 'Server health',
    description: 'Returns runtime health and configuration details about the MCP server.',
    outputSchema: healthOutputSchema,
    errorLogMessage: 'Failed to collect server health snapshot',
    errorLlmMessage: 'Не удалось получить информацию о состоянии сервера.'
  })
  private getHealth(): ToolResult<HealthSnapshot> {
    const snapshot = this.service.getSnapshot();
    return {
      structuredContent: snapshot as unknown as Record<string, unknown>,
      content: [
        {
          type: 'text',
          text: this.service.formatSnapshot(snapshot)
        }
      ]
    };
  }
}
