import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport';

import { BaseServerContext } from './baseContext';
import { ServerModule } from './baseModule';

export class BaseServerApp<TContext extends BaseServerContext> {
  protected readonly server: McpServer;
  protected readonly transport: Transport;
  private shuttingDown = false;
  private readonly boundShutdown: () => Promise<void>;
  private readonly signalHandlers: {
    sigint: () => void;
    sigterm: () => void;
  };

  constructor(
    protected readonly modules: ServerModule<TContext>[],
    protected readonly context: TContext,
    transport?: Transport
  ) {
    this.transport = transport ?? new StdioServerTransport();
    this.server = this.createServer();
    this.boundShutdown = this.shutdown.bind(this);
    this.signalHandlers = {
      sigint: () => {
        void this.boundShutdown();
      },
      sigterm: () => {
        void this.boundShutdown();
      },
    };
  }

  private createServer(): McpServer {
    const server = new McpServer(
      {
        name: this.context.config.name,
        version: this.context.config.version,
      },
      {
        instructions: this.context.config.description,
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
    this.context.logger.info('MCP server started.');
    this.registerSignalHandlers();
  }

  async stop(): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.context.logger.info('Shutting down MCP server...');
    this.removeSignalHandlers();

    // Flush logger if it has flush method (e.g., FileLogger)
    if ('flush' in this.context.logger && typeof this.context.logger.flush === 'function') {
      await (this.context.logger.flush as () => Promise<void>)();
    }

    await this.server.close();
  }

  private async shutdown(): Promise<void> {
    await this.stop();
    process.exit(0);
  }

  private registerSignalHandlers(): void {
    process.on('SIGINT', this.signalHandlers.sigint);
    process.on('SIGTERM', this.signalHandlers.sigterm);
  }

  private removeSignalHandlers(): void {
    process.off('SIGINT', this.signalHandlers.sigint);
    process.off('SIGTERM', this.signalHandlers.sigterm);
  }
}
