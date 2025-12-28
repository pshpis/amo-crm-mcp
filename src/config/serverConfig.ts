import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface ServerConfig {
  name: string;
  version: string;
  description?: string;
}

export function loadServerConfig(): ServerConfig {
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    name?: string;
    version?: string;
    description?: string;
  };

  return {
    name: packageJson.name ?? 'amo-crm-mcp',
    version: packageJson.version ?? '0.0.0',
    description: packageJson.description
  };
}
