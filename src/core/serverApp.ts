import type { Transport } from '@modelcontextprotocol/sdk/shared/transport';

import { loadEnvConfig } from '../config/env';
import { loadServerConfig } from '../config/serverConfig';
import { AmoService } from './amo';
import { ConsoleLogger } from '../lib/logger';
import { SingletonStorage } from '../lib/singletonStorage';
import { AmoServerContext } from './context';
import { ServerModule } from '../lib/baseModule';
import { BaseServerApp } from '../lib/baseServerApp';

export class ServerApp extends BaseServerApp<AmoServerContext> {
  constructor(modules: ServerModule<AmoServerContext>[], transport?: Transport) {
    const env = loadEnvConfig();
    const config = loadServerConfig();
    const logger = new ConsoleLogger(env.LOG_LEVEL);
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
