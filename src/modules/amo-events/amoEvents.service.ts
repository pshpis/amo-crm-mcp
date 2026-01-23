import { AmoService } from '../../core/amo';
import { Event, GetEventsInput, eventsListResponseSchema } from './amoEvents.schemas';
import { Logger } from '../../lib/logger';

export class AmoEventsService {
  constructor(
    private readonly amoService: AmoService,
    private readonly logger: Logger
  ) {}

  async getEvents(input: GetEventsInput = {}): Promise<Event[]> {
    const params: Record<string, string | number | boolean> = {};

    // Pagination
    if (input.page !== undefined) params.page = input.page;
    if (input.limit !== undefined) params.limit = input.limit;

    // Entity filters - simplified to specific entity types
    if (input.contact_id !== undefined) {
      params['filter[entity]'] = 'contacts';
      params['filter[entity_id]'] = input.contact_id;
    } else if (input.lead_id !== undefined) {
      params['filter[entity]'] = 'leads';
      params['filter[entity_id]'] = input.lead_id;
    } else if (input.task_id !== undefined) {
      params['filter[entity]'] = 'tasks';
      params['filter[entity_id]'] = input.task_id;
    }

    // Date filters
    if (input.created_at_from !== undefined) {
      params['filter[created_at][from]'] = input.created_at_from;
    }
    if (input.created_at_to !== undefined) {
      params['filter[created_at][to]'] = input.created_at_to;
    }

    const data = await this.amoService.request({
      path: '/events',
      query: params,
    });

    // AmoCRM returns 204 No Content (empty response) when there are no results
    if (!data) {
      return [];
    }

    const parsed = eventsListResponseSchema.parse(data);
    return parsed._embedded.events;
  }
}
