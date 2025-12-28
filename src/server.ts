import { loadServerConfig } from './config/serverConfig';
import { createServerContext } from './core/context';
import { createMcpServer, startServer } from './core/serverFactory';
import { createLogger } from './core/logger';
import { modules } from './modules';
import { loadEnvConfig } from './config/env';
import { createAmoService } from './core/amo';

const bootstrap = async () => {
  const env = loadEnvConfig();
  const config = loadServerConfig();
  const logger = createLogger(env.LOG_LEVEL);
  const amo = createAmoService(env, logger);
  const context = createServerContext(config, env, amo, logger);
  const server = createMcpServer(config, modules, context);

  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    context.logger.info('Shutting down MCP server...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await startServer(server, context);
};

bootstrap().catch((error) => {
  console.error('Failed to start MCP server', error);
  process.exit(1);
});
