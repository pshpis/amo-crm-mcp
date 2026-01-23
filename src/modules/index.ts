import { ServerModule } from '../lib/base/baseModule';
import { AmoServerContext } from '../core/context';
import { HealthModule } from '../lib/modules/health';
import { AmoTasksModule } from './amo-tasks/amoTasks.module';
import { AmoPipelinesModule } from './amo-pipelines/amoPipelines.module';
import { AmoLeadsModule } from './amo-leads/amoLeads.module';
import { AmoUsersModule } from './amo-users/amoUsers.module';
import { AmoNotesModule } from './amo-notes/amoNotes.module';
import { AmoEventsModule } from './amo-events/amoEvents.module';

export const modules: ServerModule<AmoServerContext>[] = [
  new HealthModule<AmoServerContext>(),
  new AmoTasksModule(),
  new AmoPipelinesModule(),
  new AmoLeadsModule(),
  new AmoUsersModule(),
  new AmoNotesModule(),
  new AmoEventsModule(),
];
