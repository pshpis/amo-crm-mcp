import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport';

import { ServerConfig } from '../config/serverConfig';
import { ServerContext } from './context';
import { ServerModule } from './module';

export const createMcpServer = (
  config: ServerConfig,
  modules: ServerModule[],
  context: ServerContext
): McpServer => {
  const server = new McpServer(
    {
      name: config.name,
      version: config.version
    },
    {
      instructions: config.description
    }
  );

  modules.forEach((module) => {
    context.logger.debug(`Registering module: ${module.name}`);
    module.register(server, context);
  });

  return server;
};

export const startServer = async (
  server: McpServer,
  context: ServerContext,
  transport: Transport = new StdioServerTransport()
) => {
  await server.connect(transport);
  context.logger.info('MCP server started (stdio transport).');
};
