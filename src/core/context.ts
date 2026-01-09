import { EnvConfig } from './env';
import { AmoService } from './amo';
import { Logger } from '../lib/logger/index';
import { SingletonStorage } from '../lib/singletonStorage';
import { BaseServerContext } from '../lib/baseContext';

export class AmoServerContext extends BaseServerContext<EnvConfig> {
  constructor(
    config: BaseServerContext<EnvConfig>['config'],
    env: EnvConfig,
    public readonly amo: AmoService,
    services: SingletonStorage,
    controllers: SingletonStorage,
    logger: Logger
  ) {
    super(config, env, services, controllers, logger);
  }
}
