import { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat';

import { Logger } from './logger';

export interface ToolResult<T = unknown> {
  [key: string]: unknown;
  structuredContent?: Record<string, unknown>;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface ToolDescriptor {
  name: string;
  title: string;
  description: string;
  outputSchema?: AnySchema | ZodRawShapeCompat;
  handler: () => Promise<ToolResult> | ToolResult;
}

export abstract class BaseController {
  protected constructor(protected readonly logger: Logger) {}

  protected wrapTool<T>(
    fn: () => Promise<ToolResult<T>> | ToolResult<T>,
    options?: { errorLlmMessage?: string; errorLogMessage?: string }
  ): () => Promise<ToolResult<T>> {
    return async () => {
      try {
        return await fn();
      } catch (error) {
        this.logger.error(options?.errorLogMessage ?? 'Tool execution failed', error);
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: options?.errorLlmMessage ?? 'Произошла ошибка при выполнении инструмента.'
            }
          ]
        };
      }
    };
  }

  abstract getTools(): ToolDescriptor[];
}
