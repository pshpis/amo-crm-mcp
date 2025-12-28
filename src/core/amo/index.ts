import { EnvConfig } from '../../config/env';
import { Logger } from '../logger';
import { ConcurrencyLimiter } from './concurrencyLimiter';
import { AmoApiClient, createAmoApiClient } from './httpClient';

export interface AmoService extends AmoApiClient {}

export const createAmoService = (
  env: EnvConfig,
  logger: Logger
): AmoService => {
  const limiter = new ConcurrencyLimiter(env.AMO_MAX_CONCURRENCY);
  logger.debug(
    `AmoCRM concurrency limiter initialized with max ${limiter.limit}`
  );

  return createAmoApiClient(env, limiter, logger);
};
