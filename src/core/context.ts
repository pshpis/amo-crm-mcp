import { EnvConfig } from '../config/env';
import { ServerConfig } from '../config/serverConfig';
import { AmoService } from './amo';
import { Logger } from './logger';

export interface ServerContext {
  config: ServerConfig;
  env: EnvConfig;
  amo: AmoService;
  logger: Logger;
  startedAt: Date;
  getUptimeSeconds: () => number;
}

export const createServerContext = (
  config: ServerConfig,
  env: EnvConfig,
  amo: AmoService,
  logger: Logger
): ServerContext => {
  const startedAt = new Date();

  return {
    config,
    env,
    amo,
    logger,
    startedAt,
    getUptimeSeconds: () => (Date.now() - startedAt.getTime()) / 1000
  };
};
