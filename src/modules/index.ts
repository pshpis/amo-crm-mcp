import { ServerModule } from '../core/module';
import { healthModule } from './health/health.module';
import { amoTasksModule } from './amo-tasks/amoTasks.module';

export const modules: ServerModule[] = [healthModule, amoTasksModule];
