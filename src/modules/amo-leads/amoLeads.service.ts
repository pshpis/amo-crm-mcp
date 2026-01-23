import { AmoService } from '../../core/amo';
import {
  LeadsListResult,
  leadsListResponseSchema,
  ListLeadsInput,
  SingleLeadInput,
  UpdateLeadInput,
  leadSchema,
  LeadDetailsResult,
  contactSchema,
  Contact,
  LeadMinimal,
  singleLeadMinimalApiResponseSchema,
} from './amoLeads.schemas';
import { amoTasksApiResponseSchema } from '../amo-tasks/amoTasks.schemas';

export class AmoLeadsService {
  constructor(private readonly amoService: AmoService) {}

  async getLeads(input: ListLeadsInput): Promise<LeadsListResult['leads']> {
    const params: Record<string, string | number | boolean> = {};

    if (input.page !== undefined) params.page = input.page;
    if (input.limit !== undefined) params.limit = input.limit;
    if (input.pipeline_id !== undefined) params['filter[pipeline_id]'] = input.pipeline_id;
    if (input.responsible_user_id !== undefined) {
      params['filter[responsible_user_id]'] = input.responsible_user_id;
    }
    if (input.status_id !== undefined) {
      params['filter[statuses][0][status_id]'] = input.status_id;
      if (input.pipeline_id !== undefined) {
        params['filter[statuses][0][pipeline_id]'] = input.pipeline_id;
      }
    }
    if (input.query) {
      params.query = input.query;
    }
    if (input.created_at_from !== undefined) {
      params['filter[created_at][from]'] = input.created_at_from;
    }
    if (input.created_at_to !== undefined) {
      params['filter[created_at][to]'] = input.created_at_to;
    }

    // AmoCRM API uses format: order[field]=asc|desc
    const sortField = input.sort_by ?? 'created_at';
    const sortOrder = input.sort_order ?? 'desc';
    params[`order[${sortField}]`] = sortOrder;

    const data = await this.amoService.request({
      path: '/leads',
      query: params,
    });

    // AmoCRM returns 204 No Content (empty response) when there are no results
    if (!data) {
      return [];
    }

    const parsed = leadsListResponseSchema.parse(data);
    return parsed._embedded.leads;
  }

  async getLeadById(input: SingleLeadInput): Promise<LeadDetailsResult> {
    // Запрашиваем лид с контактами через параметр with для получения ID контактов
    const data = await this.amoService.request({
      path: `/leads/${input.id}`,
      query: { with: 'contacts' },
    });

    const lead = leadSchema.parse(data);

    // Извлекаем ID контактов из урезанного ответа
    const contactIds: number[] = [];
    const responseData = data as Record<string, unknown>;
    const embedded = responseData._embedded as Record<string, unknown> | undefined;
    if (embedded?.contacts && Array.isArray(embedded.contacts)) {
      for (const contactLink of embedded.contacts) {
        if (typeof contactLink === 'object' && contactLink !== null && 'id' in contactLink) {
          const contactId = (contactLink as { id: unknown }).id;
          if (typeof contactId === 'number') {
            contactIds.push(contactId);
          } else if (typeof contactId === 'string') {
            const parsedId = Number.parseInt(contactId, 10);
            if (!Number.isNaN(parsedId)) {
              contactIds.push(parsedId);
            }
          }
        }
      }
    }

    // Получаем полную информацию о контактах через batch запрос
    let contacts: Contact[] = [];
    if (contactIds.length > 0) {
      try {
        // Используем batch запрос для получения нескольких контактов за раз
        // AmoCRM поддерживает фильтр по массиву ID через индексацию
        const queryParams: Record<string, string | number> = {};
        contactIds.forEach((id, index) => {
          queryParams[`filter[id][${index}]`] = id;
        });
        queryParams.limit = contactIds.length;

        const contactsData = await this.amoService.request({
          path: '/contacts',
          query: queryParams,
        });

        const contactsResponse = contactsData as { _embedded?: { contacts?: unknown[] } };
        if (
          contactsResponse._embedded?.contacts &&
          Array.isArray(contactsResponse._embedded.contacts)
        ) {
          contacts = contactsResponse._embedded.contacts
            .map((c) => {
              const parsed = contactSchema.safeParse(c);
              return parsed.success ? parsed.data : null;
            })
            .filter((c): c is Contact => c !== null);
        }
      } catch {
        // Игнорируем ошибки получения контактов, чтобы не ломать основной ответ
      }
    }

    // Попытка получить ближайшую незавершенную задачу по сделке
    let nearestTask: LeadDetailsResult['nearest_task'];
    try {
      const tasksData = await this.amoService.request({
        path: '/tasks',
        query: {
          'filter[entity_id]': input.id,
          'filter[entity_type]': 'leads',
          'filter[is_completed]': 0,
          'order[complete_till]': 'asc',
          limit: 1,
        },
      });
      const parsedTasks = amoTasksApiResponseSchema.safeParse(tasksData);
      if (parsedTasks.success) {
        nearestTask = parsedTasks.data._embedded.tasks[0];
      }
    } catch {
      // Игнорируем ошибки задач, чтобы не ломать основной ответ
    }

    return { lead, nearest_task: nearestTask, contacts };
  }

  async updateLead(input: UpdateLeadInput): Promise<LeadMinimal> {
    const leadData: Record<string, unknown> = {
      id: input.id,
    };

    if (input.name !== undefined) {
      leadData.name = input.name;
    }
    if (input.status_id !== undefined) {
      leadData.status_id = input.status_id;
    }
    if (input.pipeline_id !== undefined) {
      leadData.pipeline_id = input.pipeline_id;
    }

    // AmoCRM API v4 requires PATCH to /leads endpoint (not /leads/{id}) with id in body
    const data = await this.amoService.request({
      path: '/leads',
      method: 'PATCH',
      body: [leadData],
    });

    // PATCH operations return minimal data in _embedded format
    const parsed = singleLeadMinimalApiResponseSchema.parse(data);
    return parsed._embedded.leads[0];
  }
}
