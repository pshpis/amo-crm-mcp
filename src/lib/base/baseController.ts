import { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat';

import { Logger } from '../logger';

export interface ToolResult<T = unknown> {
  structuredContent?: T;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface ToolDescriptor {
  name: string;
  title: string;
  description: string;
  inputSchema?: AnySchema | ZodRawShapeCompat;
  outputSchema?: AnySchema | ZodRawShapeCompat;
  handler: (input?: unknown) => Promise<ToolResult> | ToolResult;
}

export type ToolConfig = Omit<ToolDescriptor, 'handler'> & {
  errorLlmMessage?: string;
  errorLogMessage?: string;
};

const TOOL_METADATA_KEY = Symbol('tool_metadata');

export function Tool(config: ToolConfig) {
  return (target: BaseController, propertyKey: string) => {
    const existing: Array<{ propertyKey: string; config: ToolConfig }> =
      (Reflect.getMetadata(TOOL_METADATA_KEY, target.constructor) as
        | Array<{ propertyKey: string; config: ToolConfig }>
        | undefined) ?? [];
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
    fn: (input?: unknown) => Promise<ToolResult<T>> | ToolResult<T>,
    options?: { errorLlmMessage?: string; errorLogMessage?: string }
  ): (input?: unknown) => Promise<ToolResult<T>> {
    return async (input?: unknown) => {
      try {
        return await fn(input);
      } catch (error) {
        this.logger.error(options?.errorLogMessage ?? 'Tool execution failed', error);
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: options?.errorLlmMessage ?? 'An error occurred while executing the tool.',
            },
          ],
        };
      }
    };
  }

  getTools(): ToolDescriptor[] {
    const meta: Array<{ propertyKey: string; config: ToolConfig }> =
      (Reflect.getMetadata(TOOL_METADATA_KEY, this.constructor) as
        | Array<{ propertyKey: string; config: ToolConfig }>
        | undefined) ?? [];

    return meta.map(({ propertyKey, config }) => ({
      name: config.name,
      title: config.title,
      description: config.description,
      inputSchema: config.inputSchema,
      outputSchema: config.outputSchema,
      handler: this.wrapTool(
        (input?: unknown) => {
          const method = (
            this as unknown as Record<string, (input?: unknown) => Promise<ToolResult> | ToolResult>
          )[propertyKey];
          return method.call(this, input);
        },
        {
          errorLlmMessage: config.errorLlmMessage,
          errorLogMessage: config.errorLogMessage,
        }
      ),
    }));
  }
}
