import { ServerModule } from '../lib/baseModule';
import { AmoServerContext } from '../core/context';
import { HealthModule } from './health/health.module';
import { AmoTasksModule } from './amo-tasks/amoTasks.module';

export const modules: ServerModule<AmoServerContext>[] = [
  new HealthModule(),
  new AmoTasksModule()
];
