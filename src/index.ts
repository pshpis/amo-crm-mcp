import 'reflect-metadata';

import { modules } from './modules';
import { ServerApp } from './core/serverApp';

const bootstrap = async () => {
  const app = new ServerApp(modules);
  await app.start();
};

bootstrap().catch((error) => {
  console.error('Failed to start MCP server', error);
  process.exit(1);
});
