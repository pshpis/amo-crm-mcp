import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface ServerConfig {
  name: string;
  version: string;
  description?: string;
}

export interface LoadServerConfigOptions {
  /**
   * Path to package.json file. If not provided, will search from process.cwd()
   */
  packageJsonPath?: string;
  /**
   * Fallback name if not found in package.json
   */
  defaultName?: string;
  /**
   * Fallback version if not found in package.json
   */
  defaultVersion?: string;
}

export function loadServerConfig(options?: LoadServerConfigOptions): ServerConfig {
  const packageJsonPath = options?.packageJsonPath ?? path.resolve(process.cwd(), 'package.json');

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    name?: string;
    version?: string;
    description?: string;
  };

  return {
    name: packageJson.name ?? options?.defaultName ?? 'mcp-server',
    version: packageJson.version ?? options?.defaultVersion ?? '0.0.0',
    description: packageJson.description,
  };
}
