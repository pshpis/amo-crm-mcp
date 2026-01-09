import { ServerConfig } from './serverConfig';
import { Logger } from './logger';
import { SingletonStorage } from './singletonStorage';

export class BaseServerContext<TEnv = unknown> {
  readonly startedAt: Date;

  constructor(
    public readonly config: ServerConfig,
    public readonly env: TEnv,
    public readonly services: SingletonStorage,
    public readonly controllers: SingletonStorage,
    public readonly logger: Logger
  ) {
    this.startedAt = new Date();
  }

  getUptimeSeconds(): number {
    return (Date.now() - this.startedAt.getTime()) / 1000;
  }
}
