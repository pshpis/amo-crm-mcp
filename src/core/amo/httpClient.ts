import axios, { AxiosRequestConfig } from 'axios';

import { EnvConfig } from '../env';
import { Logger } from '../../lib/logger/index';
import { ConcurrencyLimiter } from '../../lib/utils/concurrencyLimiter';

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

export class AmoHttpClient implements AmoApiClient {
  public readonly limiter: ConcurrencyLimiter;
  private readonly baseUrl: string;
  private readonly logger: Logger;
  private readonly env: EnvConfig;

  constructor(env: EnvConfig, limiter: ConcurrencyLimiter, logger: Logger) {
    this.limiter = limiter;
    this.baseUrl = env.AMO_BASE_URL;
    this.logger = logger;
    this.env = env;
  }

  async request<T = unknown>(options: AmoRequestOptions): Promise<T> {
    return this.limiter.run(async () => {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(options.headers ?? {}),
      };

      const token = options.accessTokenOverride ?? this.env.AMO_INTEGRATION_KEY;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const method = options.method ?? (options.body ? 'POST' : 'GET');
      const axiosConfig: AxiosRequestConfig = {
        baseURL: this.baseUrl,
        url: options.path,
        method,
        headers,
        params: options.query,
        data: options.body,
      };

      try {
        const response = await axios.request<T>(axiosConfig);
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const errorBody: unknown = error.response?.data ?? error.message;
          this.logger.warn('AmoCRM request failed', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: `${this.baseUrl}${options.path}`,
            body: errorBody,
          });
          const status = error.response?.status ?? 'unknown';
          const statusText = error.response?.statusText ?? 'unknown';
          throw new Error(`AmoCRM request failed with ${status}: ${statusText}`);
        }
        throw error;
      }
    });
  }
}
