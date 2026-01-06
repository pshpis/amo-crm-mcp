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

export type ToolConfig = Omit<ToolDescriptor, 'handler'> & {
  errorLlmMessage?: string;
  errorLogMessage?: string;
};

const TOOL_METADATA_KEY = Symbol('tool_metadata');

export function Tool(config: ToolConfig) {
  return (target: BaseController, propertyKey: string) => {
    const existing: Array<{ propertyKey: string; config: ToolConfig }> =
      Reflect.getMetadata(TOOL_METADATA_KEY, target.constructor) ?? [];
    Reflect.defineMetadata(
      TOOL_METADATA_KEY,
      [...existing, { propertyKey, config }],
      target.constructor
    );
  };
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

  getTools(): ToolDescriptor[] {
    const meta: Array<{ propertyKey: string; config: ToolConfig }> =
      Reflect.getMetadata(TOOL_METADATA_KEY, this.constructor) ?? [];

    return meta.map(({ propertyKey, config }) => ({
      name: config.name,
      title: config.title,
      description: config.description,
      outputSchema: config.outputSchema,
      handler: this.wrapTool(
        () => (this as any)[propertyKey](),
        {
          errorLlmMessage: config.errorLlmMessage,
          errorLogMessage: config.errorLogMessage
        }
      )
    }));
  }
}
