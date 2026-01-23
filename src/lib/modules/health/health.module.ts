import { BaseModule } from '../../base/baseModule';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { BaseServerContext } from '../../base/baseContext';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

export class HealthModule<
  TContext extends BaseServerContext = BaseServerContext,
> extends BaseModule<TContext> {
  constructor() {
    super('health');
  }

  register = (server: McpServer, context: TContext) => {
    const service = context.services.getOrCreate(
      HealthService,
      () => new HealthService<TContext>(context)
    ) as HealthService<TContext>;
    const controller = context.controllers.getOrCreate(
      HealthController,
      () => new HealthController<TContext>(service, context.logger)
    );

    this.registerTools(server, controller);
  };
}
