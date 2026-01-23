import type { Transport } from '@modelcontextprotocol/sdk/shared/transport';

import { loadEnvConfig } from './env';
import { loadServerConfig } from '../lib/utils/serverConfig';
import { AmoService } from './amo';
import { Logger, FileLogger, ConsoleLogger } from '../lib/logger/index';
import { SingletonStorage } from '../lib/utils/singletonStorage';
import { AmoServerContext } from './context';
import { ServerModule } from '../lib/base/baseModule';
import { BaseServerApp } from '../lib/base/baseServerApp';

function createLogger(filePath: string | undefined, level: string | undefined): Logger {
  if (filePath) {
    return new FileLogger(filePath, level);
  }
  return new ConsoleLogger(level);
}

export class ServerApp extends BaseServerApp<AmoServerContext> {
  constructor(modules: ServerModule<AmoServerContext>[], transport?: Transport) {
    const env = loadEnvConfig();
    const config = loadServerConfig();
    const logger = createLogger(env.LOG_FILE_PATH, env.LOG_LEVEL);
    const amo = new AmoService(env, logger);
    const services = new SingletonStorage();
    const controllers = new SingletonStorage();
    const context = new AmoServerContext(config, env, amo, services, controllers, logger);
    super(modules, context, transport);
  }
}
