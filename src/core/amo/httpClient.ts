import axios, { AxiosRequestConfig } from 'axios';

import { EnvConfig } from '../../config/env';
import { Logger } from '../logger';
import { ConcurrencyLimiter } from './concurrencyLimiter';

export interface AmoRequestOptions {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  accessTokenOverride?: string;
}

export interface AmoApiClient {
  limiter: ConcurrencyLimiter;
  request<T = unknown>(options: AmoRequestOptions): Promise<T>;
}

export const createAmoApiClient = (
  env: EnvConfig,
  limiter: ConcurrencyLimiter,
  logger: Logger
): AmoApiClient => {
  const baseUrl = env.AMO_BASE_URL;

  const request = async <T>(options: AmoRequestOptions): Promise<T> => {
    if (!baseUrl) {
      throw new Error('AMO_BASE_URL is not configured');
    }

    return limiter.run(async () => {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(options.headers ?? {})
      };

      const token = options.accessTokenOverride ?? env.AMO_INTEGRATION_KEY;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const method = options.method ?? (options.body ? 'POST' : 'GET');
      const axiosConfig: AxiosRequestConfig = {
        baseURL: baseUrl,
        url: options.path,
        method,
        headers,
        params: options.query,
        data: options.body
      };

      try {
        const response = await axios.request<T>(axiosConfig);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          logger.warn('AmoCRM request failed', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: `${baseUrl}${options.path}`,
            body: error.response?.data ?? error.message
          });
          const status = error.response?.status ?? 'unknown';
          const statusText = error.response?.statusText ?? 'unknown';
          throw new Error(
            `AmoCRM request failed with ${status}: ${statusText}`
          );
        }
        throw error;
      }
    });
  };

  return {
    limiter,
    request
  };
};
