import os from 'node:os';

import { BaseServerContext } from '../../base/baseContext';
import { HealthSnapshot } from './health.schemas';

export class HealthService<TContext extends BaseServerContext = BaseServerContext> {
  constructor(protected readonly context: TContext) {}

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
        startedAt: this.context.startedAt.toISOString(),
      },
      environment: {
        nodeVersion: process.version,
        platform: `${process.platform}-${process.arch}`,
        pid: process.pid,
        cwd: process.cwd(),
      },
      resources: {
        memory: {
          rssBytes: memoryUsage.rss,
          heapUsedBytes: memoryUsage.heapUsed,
          heapTotalBytes: memoryUsage.heapTotal,
          externalBytes: memoryUsage.external ?? 0,
        },
        cpuCount: os.cpus().length,
        loadAverage: [load[0], load[1], load[2]],
      },
    };
  }

  formatSnapshot(snapshot: HealthSnapshot): string {
    const memory = snapshot.resources.memory;
    const load = snapshot.resources.loadAverage.map((value: number) => value.toFixed(2)).join('/');

    return [
      `${snapshot.server.name}@${snapshot.server.version} работает нормально`,
      `Время работы: ${snapshot.server.uptimeSeconds.toFixed(2)}с`,
      `Память: rss ${this.formatBytes(memory.rssBytes)}, heap ${this.formatBytes(memory.heapUsedBytes)}`,
      `Нагрузка (1м/5м/15м): ${load}`,
      `PID: ${snapshot.environment.pid} | Node: ${snapshot.environment.nodeVersion}`,
      `Метка времени: ${snapshot.timestamp}`,
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
