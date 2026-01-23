import { AmoEventsService } from './amoEvents.service';
import {
  Event,
  GetEventsInput,
  eventsListResultSchema,
  getEventsInputSchema,
} from './amoEvents.schemas';
import { Logger } from '../../lib/logger';
import { BaseController, Tool, ToolResult } from '../../lib/base/baseController';
import { DateFormatter } from '../../lib/utils/dateFormatter';
import { EventDetailsFormatter } from './tools/eventDetailsFormatter';

export class AmoEventsController extends BaseController {
  private readonly dateFormatter: DateFormatter;
  private readonly eventDetailsFormatter: EventDetailsFormatter;

  constructor(
    private readonly service: AmoEventsService,
    logger: Logger,
    timezone: string
  ) {
    super(logger);
    this.dateFormatter = new DateFormatter(timezone);
    this.eventDetailsFormatter = new EventDetailsFormatter(this.dateFormatter);
  }

  private formatEventType(type: string): string {
    // Translate common event types to Russian
    const translations: Record<string, string> = {
      lead_added: 'Лид создан',
      lead_deleted: 'Лид удалён',
      lead_status_changed: 'Изменён статус лида',
      lead_linked: 'Лид привязан',
      lead_unlinked: 'Лид отвязан',
      contact_added: 'Контакт создан',
      contact_deleted: 'Контакт удалён',
      contact_restored: 'Контакт восстановлен',
      task_added: 'Задача создана',
      task_completed: 'Задача выполнена',
      task_deleted: 'Задача удалена',
      task_deadline_changed: 'Изменён срок задачи',
      incoming_call: 'Входящий звонок',
      outgoing_call: 'Исходящий звонок',
      common_note_added: 'Добавлено примечание',
      attachment_note_added: 'Добавлен файл',
      entity_responsible_changed: 'Изменён ответственный',
      custom_field_value_changed: 'Изменено значение поля',
      name_field_changed: 'Изменено название',
    };

    return (
      translations[type] ||
      type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  }

  private formatEventDetails(event: Event): string {
    return this.eventDetailsFormatter.format(event);
  }

  private formatEventSummary(event: Event): string {
    const type = this.formatEventType(event.type);
    const entity = `${event.entity_type} #${event.entity_id}`;
    const created = this.dateFormatter.format(event.created_at);
    const details = this.formatEventDetails(event);
    return `[${created}] ${type} в ${entity}${details} (пользователь #${event.created_by})`;
  }

  @Tool({
    name: 'get_events',
    title: 'Get events from AmoCRM',
    description: `Возвращает список событий (ленту активности) из AmoCRM.
    
Доступные фильтры:
- contact_id: Фильтр по ID контакта
- lead_id: Фильтр по ID лида
- task_id: Фильтр по ID задачи
- created_at_from/to: Фильтр по диапазону дат создания (Unix timestamp)
- page, limit: Пагинация

Примеры использования:
1. Все события: (без фильтров)
2. События конкретного лида: lead_id=47550049
3. События конкретного контакта: contact_id=123456
4. События конкретной задачи: task_id=789012
5. События за период: created_at_from=1234567890, created_at_to=1234567890`,
    inputSchema: getEventsInputSchema,
    outputSchema: eventsListResultSchema,
    errorLogMessage: 'Failed to fetch events from AmoCRM',
    errorLlmMessage: 'Не удалось получить события из AmoCRM.',
  })
  private async getEvents(input: GetEventsInput): Promise<ToolResult<{ events: Event[] }>> {
    const events = await this.service.getEvents(input);

    // Build filter description for the summary
    const filterParts: string[] = [];
    if (input.contact_id !== undefined) {
      filterParts.push(`контакт #${input.contact_id}`);
    }
    if (input.lead_id !== undefined) {
      filterParts.push(`лид #${input.lead_id}`);
    }
    if (input.task_id !== undefined) {
      filterParts.push(`задача #${input.task_id}`);
    }
    if (input.created_at_from || input.created_at_to) {
      const from = input.created_at_from ? this.dateFormatter.format(input.created_at_from) : '...';
      const to = input.created_at_to ? this.dateFormatter.format(input.created_at_to) : '...';
      filterParts.push(`дата: ${from} - ${to}`);
    }

    const filterText = filterParts.length > 0 ? ` (фильтры: ${filterParts.join(', ')})` : '';
    const lines = events.map((event) => `- ${this.formatEventSummary(event)}`);
    const summary =
      events.length === 0
        ? `События не найдены${filterText}.`
        : `Найдено событий: ${events.length}${filterText}.`;

    return {
      structuredContent: { events },
      content: [
        {
          type: 'text',
          text: events.length === 0 ? summary : `${summary}\n\nСобытия:\n${lines.join('\n')}`,
        },
      ],
    };
  }
}
