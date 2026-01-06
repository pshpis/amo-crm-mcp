import { BaseModule } from '../../lib/baseModule';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { AmoServerContext } from '../../core/context';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

export class HealthModule extends BaseModule<AmoServerContext> {
  constructor() {
    super('health');
  }

  register = (server: McpServer, context: AmoServerContext) => {
    const service = context.services.getOrCreate(
      HealthService,
      () => new HealthService(context)
    );
    const controller = context.controllers.getOrCreate(
      HealthController,
      () => new HealthController(service, context.logger)
    );

    this.registerTools(server, controller);
  };
}
