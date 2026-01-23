import {
  leadsListResultSchema,
  singleLeadInputSchema,
  updateLeadInputSchema,
  updateLeadResultSchema,
  leadDetailsResultSchema,
  listLeadsInputSchema,
  LeadsListResult,
  ListLeadsInput,
  Lead,
  SingleLeadInput,
  UpdateLeadInput,
  LeadDetailsResult,
  UpdateLeadResult,
  Contact,
} from './amoLeads.schemas';
import { AmoLeadsService } from './amoLeads.service';
import { Logger } from '../../lib/logger/index';
import { BaseController, Tool, ToolResult } from '../../lib/base/baseController';
import { DateFormatter } from '../../lib/utils/dateFormatter';
import { safeToString } from '../../lib/utils/stringUtils';

export class AmoLeadsController extends BaseController {
  private readonly dateFormatter: DateFormatter;

  constructor(
    private readonly service: AmoLeadsService,
    logger: Logger,
    timezone: string
  ) {
    super(logger);
    this.dateFormatter = new DateFormatter(timezone);
  }

  private leadSummary(lead: Lead): string {
    const name = lead.name?.trim() || 'Без названия';
    const price = lead.price !== undefined ? `${lead.price}₽` : 'цена не указана';
    const pipeline = lead.pipeline_id ? `воронка ${lead.pipeline_id}` : 'воронка не указана';
    const status = lead.status_id ? `этап ${lead.status_id}` : 'этап не указан';
    const responsible = lead.responsible_user_id
      ? `ответственный ${lead.responsible_user_id}`
      : 'ответственный не указан';
    const created = `создано: ${this.dateFormatter.format(lead.created_at)}`;
    return `#${lead.id}: ${name} (${price}; ${pipeline}; ${status}; ${responsible}; ${created})`;
  }

  private formatContact(contact: Contact): string {
    const name =
      contact.name ||
      [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
      `Контакт #${contact.id}`;

    const lines: string[] = [`  ${name}`];

    // Добавляем кастомные поля
    if (contact.custom_fields_values && contact.custom_fields_values.length > 0) {
      contact.custom_fields_values.forEach((field) => {
        const fieldName = field.field_name ?? `Поле ${field.field_id}`;
        const values =
          field.values
            ?.map((v) => safeToString(v.value))
            .filter(Boolean)
            .join(', ') ?? '—';
        lines.push(`    ${fieldName}: ${values}`);
      });
    }

    lines.push(`    Ответственный: ${contact.responsible_user_id ?? 'не указан'}`);
    lines.push(`    Создан: ${this.dateFormatter.format(contact.created_at)}`);
    lines.push(`    Обновлен: ${this.dateFormatter.format(contact.updated_at)}`);

    return lines.join('\n');
  }

  @Tool({
    name: 'get_leads',
    title: 'Get leads from AmoCRM',
    description: 'Возвращает список сделок AmoCRM с фильтрацией и пагинацией.',
    inputSchema: listLeadsInputSchema,
    outputSchema: leadsListResultSchema,
    errorLogMessage: 'Failed to fetch leads from AmoCRM',
    errorLlmMessage: 'Не удалось получить список сделок из AmoCRM.',
  })
  private async getLeads(input: ListLeadsInput): Promise<ToolResult<LeadsListResult>> {
    const leads = await this.service.getLeads(input);

    const lines = leads.map((lead) => `- ${this.leadSummary(lead)}`);
    const summary = leads.length === 0 ? 'Сделки не найдены.' : `Найдено сделок: ${leads.length}.`;

    return {
      structuredContent: { leads },
      content: [
        {
          type: 'text',
          text: leads.length === 0 ? summary : `${summary}\nСписок:\n${lines.join('\n')}`,
        },
      ],
    };
  }

  @Tool({
    name: 'get_lead_by_id',
    title: 'Get lead by id from AmoCRM',
    description: 'Возвращает полную информацию по сделке по ее id.',
    inputSchema: singleLeadInputSchema,
    outputSchema: leadDetailsResultSchema,
    errorLogMessage: 'Failed to fetch lead by id from AmoCRM',
    errorLlmMessage: 'Не удалось получить сделку по указанному id.',
  })
  private async getLeadById(input: SingleLeadInput): Promise<ToolResult<LeadDetailsResult>> {
    const { lead, nearest_task, contacts } = await this.service.getLeadById({ id: input.id });

    const tags =
      lead.tags && lead.tags.length
        ? `теги: ${lead.tags.map((t) => t.name ?? t.id).join(', ')}`
        : 'теги отсутствуют';

    const customFields =
      lead.custom_fields_values && lead.custom_fields_values.length
        ? lead.custom_fields_values
            .map((field) => {
              const values =
                field.values
                  ?.map((v) => safeToString(v.value))
                  .filter(Boolean)
                  .join(', ') ?? '—';
              return `${field.field_name ?? field.field_id}: ${values}`;
            })
            .join('\n')
        : 'кастомные поля отсутствуют';

    const nearestTaskText = nearest_task
      ? `Ближайшая задача: #${nearest_task.id} "${nearest_task.text ?? 'без названия'}", срок: ${this.dateFormatter.format(nearest_task.complete_till)}`
      : 'Ближайших незавершенных задач нет.';

    const contactsText =
      contacts && contacts.length > 0
        ? `\n\nКонтакты (${contacts.length}):\n${contacts.map((c) => this.formatContact(c)).join('\n')}`
        : '\n\nКонтактов нет.';

    const text = [
      `Сделка #${lead.id}`,
      `Название: ${lead.name ?? 'не указано'}`,
      `Сумма: ${lead.price ?? 'не указана'}`,
      `Воронка: ${lead.pipeline_id ?? 'не указана'}, этап: ${lead.status_id ?? 'не указан'}`,
      `Ответственный: ${lead.responsible_user_id ?? 'не указан'}`,
      `Создана: ${this.dateFormatter.format(lead.created_at)}`,
      `Обновлена: ${this.dateFormatter.format(lead.updated_at)}`,
      `Закрыта: ${this.dateFormatter.format(lead.closed_at ?? undefined)}`,
      tags,
      `Кастомные поля:\n${customFields}`,
      nearestTaskText,
      contactsText,
    ].join('\n');

    return {
      structuredContent: { lead, nearest_task, contacts },
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }

  @Tool({
    name: 'update_lead',
    title: 'Update lead in AmoCRM',
    description:
      'Обновляет сделку в AmoCRM. Позволяет изменить название и передвинуть сделку по этапам.',
    inputSchema: updateLeadInputSchema,
    outputSchema: updateLeadResultSchema,
    errorLogMessage: 'Failed to update lead in AmoCRM',
    errorLlmMessage: 'Не удалось обновить сделку в AmoCRM.',
  })
  private async updateLead(input: UpdateLeadInput): Promise<ToolResult<UpdateLeadResult>> {
    const lead = await this.service.updateLead(input);

    // Use only data that AmoCRM actually returns (usually just id)
    const text = [`Сделка успешно обновлена.`, `ID: #${lead.id}`].join('\n');

    return {
      structuredContent: { lead },
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  }
}
