import type { Transport } from '@modelcontextprotocol/sdk/shared/transport';

import { loadEnvConfig } from './env';
import { loadServerConfig } from '../lib/serverConfig';
import { AmoService } from './amo';
import { FileLogger } from '../lib/logger/index';
import { SingletonStorage } from '../lib/singletonStorage';
import { AmoServerContext } from './context';
import { ServerModule } from '../lib/baseModule';
import { BaseServerApp } from '../lib/baseServerApp';

export class ServerApp extends BaseServerApp<AmoServerContext> {
  constructor(modules: ServerModule<AmoServerContext>[], transport?: Transport) {
    const env = loadEnvConfig();
    const config = loadServerConfig();
    const logger = new FileLogger(env.LOG_FILE_PATH, env.LOG_LEVEL);
    const amo = new AmoService(env, logger);
    const services = new SingletonStorage();
    const controllers = new SingletonStorage();
    const context = new AmoServerContext(
      config,
      env,
      amo,
      services,
      controllers,
      logger
    );
    super(modules, context, transport);
  }
}
