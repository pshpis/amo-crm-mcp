import { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp';

import { BaseServerContext } from './baseContext';
import { ToolDescriptor } from './baseController';

export interface ServerModule<TContext extends BaseServerContext = BaseServerContext> {
  name: string;
  register: (server: McpServer, context: TContext) => void;
}

export interface ControllerWithTools {
  getTools(): ToolDescriptor[];
}

export abstract class BaseModule<
  TContext extends BaseServerContext = BaseServerContext,
> implements ServerModule<TContext> {
  constructor(public readonly name: string) {}

  protected registerTools(server: McpServer, controller: ControllerWithTools) {
    controller.getTools().forEach((tool) => {
      server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
        },
        tool.handler as ToolCallback
      );
    });
  }

  abstract register(server: McpServer, context: TContext): void;
}
