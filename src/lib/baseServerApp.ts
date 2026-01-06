import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport';

import { BaseServerContext } from './baseContext';
import { ServerModule } from './baseModule';

export class BaseServerApp<TContext extends BaseServerContext> {
  protected readonly server: McpServer;
  protected readonly transport: Transport;
  private shuttingDown = false;

  constructor(
    protected readonly modules: ServerModule<TContext>[],
    protected readonly context: TContext,
    transport?: Transport
  ) {
    this.transport = transport ?? new StdioServerTransport();
    this.server = this.createServer();
  }

  private createServer(): McpServer {
    const server = new McpServer(
      {
        name: this.context.config.name,
        version: this.context.config.version
      },
      {
        instructions: this.context.config.description
      }
    );

    this.modules.forEach((module) => {
      this.context.logger.debug(`Registering module: ${module.name}`);
      module.register(server, this.context);
    });

    return server;
  }

  async start(): Promise<void> {
    await this.server.connect(this.transport);
    this.context.logger.info('MCP server started (stdio transport).');
    this.registerSignalHandlers();
  }

  async stop(): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.context.logger.info('Shutting down MCP server...');
    await this.server.close();
  }

  private registerSignalHandlers() {
    const shutdown = async () => {
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
