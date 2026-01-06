import { BaseModule } from '../../lib/baseModule';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { AmoServerContext } from '../../core/context';
import { AmoTasksService } from './amoTasks.service';
import { AmoTasksController } from './amoTasks.controller';

export class AmoTasksModule extends BaseModule<AmoServerContext> {
  constructor() {
    super('amo-tasks');
  }

  register = (server: McpServer, context: AmoServerContext) => {
    const service = context.services.getOrCreate(
      AmoTasksService,
      () => new AmoTasksService(context.amo)
    );
    const controller = context.controllers.getOrCreate(
      AmoTasksController,
      () => new AmoTasksController(service, context.logger)
    );

    this.registerTools(server, controller);
  };
}
