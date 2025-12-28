import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { ServerContext } from './context';

export interface ServerModule {
  name: string;
  register: (server: McpServer, context: ServerContext) => void;
}
