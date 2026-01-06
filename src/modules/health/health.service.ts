import os from 'node:os';

import { AmoServerContext } from '../../core/context';
import { HealthSnapshot } from './health.schemas';

export class HealthService {
  constructor(private readonly context: AmoServerContext) {}

  getSnapshot(): HealthSnapshot {
    const memoryUsage = process.memoryUsage();
    const load = os.loadavg();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: {
        name: this.context.config.name,
        version: this.context.config.version,
        description: this.context.config.description,
        uptimeSeconds: this.context.getUptimeSeconds(),
        startedAt: this.context.startedAt.toISOString()
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
  }

  formatSnapshot(snapshot: HealthSnapshot): string {
    const memory = snapshot.resources.memory;
    const load = snapshot.resources.loadAverage
      .map((value: number) => value.toFixed(2))
      .join('/');

    return [
      `${snapshot.server.name}@${snapshot.server.version} is healthy`,
      `Uptime: ${snapshot.server.uptimeSeconds.toFixed(2)}s`,
      `Memory: rss ${this.formatBytes(memory.rssBytes)}, heap ${this.formatBytes(memory.heapUsedBytes)}`,
      `Load avg (1m/5m/15m): ${load}`,
      `PID: ${snapshot.environment.pid} | Node: ${snapshot.environment.nodeVersion}`,
      `Timestamp: ${snapshot.timestamp}`
    ].join('\n');
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${value.toFixed(1)}${units[unitIndex]}`;
  }
}
