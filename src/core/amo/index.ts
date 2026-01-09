import { EnvConfig } from '../env';
import { Logger } from '../../lib/logger/index';
import { ConcurrencyLimiter } from './concurrencyLimiter';
import { AmoHttpClient, AmoRequestOptions } from './httpClient';

export class AmoService {
  readonly limiter: ConcurrencyLimiter;
  private readonly client: AmoHttpClient;

  constructor(private readonly env: EnvConfig, private readonly logger: Logger) {
    this.limiter = new ConcurrencyLimiter(env.AMO_MAX_CONCURRENCY);
    this.logger.debug(
      `AmoCRM concurrency limiter initialized with max ${this.limiter.limit}`
    );
    this.client = new AmoHttpClient(env, this.limiter, logger);
  }

  request<T = unknown>(options: AmoRequestOptions): Promise<T> {
    return this.client.request<T>(options);
  }
}

export type { AmoRequestOptions } from './httpClient';
