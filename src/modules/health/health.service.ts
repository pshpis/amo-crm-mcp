import os from 'node:os';

import { ServerContext } from '../../core/context';

export interface HealthSnapshot {
  status: 'ok';
  timestamp: string;
  server: {
    name: string;
    version: string;
    description?: string;
    uptimeSeconds: number;
    startedAt: string;
  };
  environment: {
    nodeVersion: string;
    platform: string;
    pid: number;
    cwd: string;
  };
  resources: {
    memory: {
      rssBytes: number;
      heapUsedBytes: number;
      heapTotalBytes: number;
      externalBytes: number;
    };
    cpuCount: number;
    loadAverage: [number, number, number];
  };
}

export const collectHealthSnapshot = (context: ServerContext): HealthSnapshot => {
  const memoryUsage = process.memoryUsage();
  const load = os.loadavg();

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: {
      name: context.config.name,
      version: context.config.version,
      description: context.config.description,
      uptimeSeconds: context.getUptimeSeconds(),
      startedAt: context.startedAt.toISOString()
    },
    environment: {
      nodeVersion: process.version,
      platform: `${process.platform}-${process.arch}`,
      pid: process.pid,
      cwd: process.cwd()
    },
    resources: {
      memory: {
        rssBytes: memoryUsage.rss,
        heapUsedBytes: memoryUsage.heapUsed,
        heapTotalBytes: memoryUsage.heapTotal,
        externalBytes: memoryUsage.external ?? 0
      },
      cpuCount: os.cpus().length,
      loadAverage: [load[0], load[1], load[2]]
    }
  };
};

const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)}${units[unitIndex]}`;
};

export const formatHealthText = (snapshot: HealthSnapshot): string => {
  const memory = snapshot.resources.memory;
  const load = snapshot.resources.loadAverage
    .map((value) => value.toFixed(2))
    .join('/');

  return [
    `${snapshot.server.name}@${snapshot.server.version} is healthy`,
    `Uptime: ${snapshot.server.uptimeSeconds.toFixed(2)}s`,
    `Memory: rss ${formatBytes(memory.rssBytes)}, heap ${formatBytes(memory.heapUsedBytes)}`,
    `Load avg (1m/5m/15m): ${load}`,
    `PID: ${snapshot.environment.pid} | Node: ${snapshot.environment.nodeVersion}`,
    `Timestamp: ${snapshot.timestamp}`
  ].join('\n');
};
