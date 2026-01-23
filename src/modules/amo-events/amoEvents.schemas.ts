import { z } from 'zod';

// Event types in AmoCRM
export const eventTypeEnum = z.enum([
  // Lead events
  'lead_added',
  'lead_deleted',
  'lead_restored',
  'lead_status_changed',
  'lead_linked',
  'lead_unlinked',

  // Contact events
  'contact_added',
  'contact_deleted',
  'contact_restored',

  // Company events
  'company_added',
  'company_deleted',
  'company_restored',

  // Customer events
  'customer_added',
  'customer_deleted',
  'customer_status_changed',

  // Task events
  'task_added',
  'task_deleted',
  'task_completed',
  'task_type_changed',
  'task_text_changed',
  'task_deadline_changed',
  'task_result_added',

  // Communication events
  'incoming_call',
  'outgoing_call',
  'incoming_sms',
  'outgoing_sms',
  'incoming_chat_message',
  'outgoing_chat_message',

  // Tag events
  'entity_tag_added',
  'entity_tag_deleted',

  // Link events
  'entity_linked',
  'entity_unlinked',

  // Field change events
  'sale_field_changed',
  'name_field_changed',
  'custom_field_value_changed',
  'ltv_field_changed',

  // Other events
  'entity_responsible_changed',
  'entity_merged',
  'robot_replied',
  'intent_identified',
  'nps_rate_added',
  'link_followed',
  'transaction_added',
  'common_note_added',
  'common_note_deleted',
  'attachment_note_added',
  'targeting_in_note_added',
  'targeting_out_note_added',
  'geo_note_added',
  'service_note_added',
  'site_visit_note_added',
  'message_to_cashier_note_added',
]);

// Entity types
export const entityTypeEnum = z.enum([
  'lead',
  'leads',
  'contact',
  'contacts',
  'company',
  'companies',
  'customer',
  'customers',
  'task',
  'tasks',
  'catalog_element',
]);

export const eventValueSchema = z
  .object({
    before: z.unknown().optional(),
    after: z.unknown().optional(),
  })
  .passthrough()
  .optional();

// Comprehensive value schema for events
const eventValueItemSchema = z
  .object({
    // Note events
    note: z
      .object({
        id: z.number(),
      })
      .optional(),

    // Lead status changes
    lead_status: z
      .object({
        id: z.number(),
        pipeline_id: z.number(),
      })
      .optional(),

    // Customer status changes
    customer_status: z
      .object({
        id: z.number(),
        pipeline_id: z.number().optional(),
      })
      .optional(),

    // Responsible user changes
    responsible_user: z
      .object({
        id: z.number(),
      })
      .optional(),
    responsible_user_id: z.number().optional(),

    // Custom field changes
    custom_field_value: z
      .object({
        field_id: z.number(),
        field_type: z.union([z.string(), z.number()]).optional(),
        value: z.unknown().optional(),
        enum_id: z.number().nullable().optional(),
        enum_code: z.string().nullable().optional(),
      })
      .optional(),

    // Link changes
    link: z
      .object({
        entity: z
          .object({
            id: z.number(),
            type: z.string(),
          })
          .optional(),
      })
      .optional(),

    // Tag changes
    tag: z
      .object({
        id: z.number().optional(),
        name: z.string().optional(),
      })
      .optional(),

    // Value changes (for sale_field_changed, name_field_changed, ltv_field_changed, etc.)
    value: z.unknown().optional(),

    // Text changes (for task_text_changed, name_field_changed)
    text: z.string().nullable().optional(),

    // Task-specific changes
    complete_till: z.number().optional(), // Deadline changes (for task_deadline_changed)
    task_type_id: z.number().optional(), // Task type changes
    is_completed: z.boolean().optional(), // Task completion status (for task_completed, task_added)
    result: z.string().nullable().optional(), // Task result text (for task_result_added)
    entity_id: z.number().optional(), // Entity ID task is linked to
    entity_type: z.string().optional(), // Entity type task is linked to (leads, contacts, etc.)

    // Price/sale changes
    price: z.number().optional(),
    sale: z.number().optional(),

    // LTV changes
    ltv: z.number().optional(),

    // Name changes
    name: z.string().nullable().optional(),

    // Custom field values array (for multiselect, etc.)
    custom_field_values: z
      .array(
        z.object({
          field_id: z.number(),
          field_type: z.union([z.string(), z.number()]).optional(),
          value: z.unknown().optional(),
          enum_id: z.number().nullable().optional(),
          enum_code: z.string().nullable().optional(),
        })
      )
      .optional(),

    // Lead statuses array (for multiple status changes)
    leads_statuses: z
      .array(
        z.object({
          id: z.number(),
          pipeline_id: z.number(),
        })
      )
      .optional(),

    // Customer statuses array
    customers_statuses: z
      .array(
        z.object({
          id: z.number(),
          pipeline_id: z.number().optional(),
        })
      )
      .optional(),
  })
  .passthrough();

export const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  entity_id: z.number(),
  entity_type: z.string(),
  created_by: z.number(),
  created_at: z.number(),
  value_after: z.array(eventValueItemSchema).optional(),
  value_before: z.array(eventValueItemSchema).optional(),
  account_id: z.number().optional(),
});

export const eventsListResponseSchema = z.object({
  _embedded: z.object({
    events: z.array(eventSchema),
  }),
});

// Simplified input schema
export const getEventsInputSchema = z.object({
  // Pagination
  page: z.number().int().positive().optional().describe('Номер страницы для пагинации'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Количество событий на странице (максимум 100)'),

  // Entity filters - simplified to specific entity IDs
  contact_id: z.number().int().positive().optional().describe('Фильтр по ID контакта'),
  lead_id: z.number().int().positive().optional().describe('Фильтр по ID лида'),
  task_id: z.number().int().positive().optional().describe('Фильтр по ID задачи'),

  // Date filters (Unix timestamps)
  created_at_from: z
    .number()
    .int()
    .optional()
    .describe('Фильтр событий, созданных после указанной даты (Unix timestamp)'),
  created_at_to: z
    .number()
    .int()
    .optional()
    .describe('Фильтр событий, созданных до указанной даты (Unix timestamp)'),
});

// Output schema
export const eventsListResultSchema = z.object({
  events: z.array(eventSchema),
});

// Types
export type Event = z.infer<typeof eventSchema>;
export type EventValueItem = z.infer<typeof eventValueItemSchema>;
export type EventType = z.infer<typeof eventTypeEnum>;
export type EntityType = z.infer<typeof entityTypeEnum>;
export type GetEventsInput = z.infer<typeof getEventsInputSchema>;
export type EventsListResult = z.infer<typeof eventsListResultSchema>;
