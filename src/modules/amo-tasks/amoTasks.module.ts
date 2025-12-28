import { tasksResponseSchema, fetchActiveTasks } from './amoTasks.service';
import { ServerModule } from '../../core/module';

export const amoTasksModule: ServerModule = {
  name: 'amo-tasks',
  register: (server, context) => {
    server.registerTool(
      'get_active_tasks',
      {
        title: 'Get active tasks from AmoCRM',
        description: 'Возвращает список невыполненных задач из AmoCRM.',
        outputSchema: tasksResponseSchema
      },
      async () => {
        try {
          const parsed = await fetchActiveTasks(context.amo);
          const tasks = parsed._embedded.tasks;

          const summary =
            tasks.length === 0
              ? 'Активных задач нет.'
              : `Найдено активных задач: ${tasks.length}.`;

          return {
            structuredContent: parsed as unknown as Record<string, unknown>,
            content: [
              {
                type: 'text',
                text: summary
              }
            ]
          };
        } catch (error) {
          context.logger.error('Failed to fetch active tasks from AmoCRM', error);
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: 'Не удалось получить список задач из AmoCRM.'
              }
            ]
          };
        }
      }
    );
  }
};
