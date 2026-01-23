import { z } from 'zod';
import { taskSchema } from '../amo-tasks/amoTasks.schemas';

export const leadTagSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

// Схема для урезанного контакта из with=contacts
export const contactLinkSchema = z
  .object({
    id: z.number(),
    is_main: z.boolean().optional(),
    _links: z
      .object({
        self: z
          .object({
            href: z.string(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

// Схема для полного контакта
export const contactSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    responsible_user_id: z.number().optional(),
    created_by: z.number().optional(),
    updated_by: z.number().optional(),
    created_at: z.number().optional(),
    updated_at: z.number().optional(),
    custom_fields_values: z
      .array(
        z.object({
          field_id: z.number().optional(),
          field_name: z.string().optional(),
          field_type: z.string().optional(),
          values: z
            .array(
              z.object({
                value: z.unknown(),
                enum_id: z.number().optional(),
                enum_code: z.string().nullable().optional(),
              })
            )
            .optional(),
        })
      )
      .nullable()
      .optional(),
    phone: z
      .array(
        z
          .object({
            value: z.string().optional(),
            enum_code: z.string().nullable().optional(),
          })
          .passthrough()
      )
      .nullable()
      .optional(),
    email: z
      .array(
        z
          .object({
            value: z.string().optional(),
            enum_code: z.string().nullable().optional(),
          })
          .passthrough()
      )
      .nullable()
      .optional(),
  })
  .passthrough();

export const leadSchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  status_id: z.number().optional(),
  pipeline_id: z.number().optional(),
  responsible_user_id: z.number().optional(),
  price: z.number().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
  closed_at: z.number().nullable().optional(),
  tags: z.array(leadTagSchema).optional(),
  custom_fields_values: z
    .array(
      z.object({
        field_id: z.number().optional(),
        field_name: z.string().optional(),
        values: z
          .array(
            z.object({
              value: z.unknown(),
              enum_id: z.number().optional(),
              enum_code: z.string().nullable().optional(),
            })
          )
          .optional(),
      })
    )
    .nullable()
    .optional(),
});

export const leadsListResponseSchema = z.object({
  _embedded: z.object({
    leads: z.array(leadSchema),
  }),
});

export const listLeadsInputSchema = z
  .object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(250).optional(),
    pipeline_id: z.number().optional(),
    status_id: z.number().optional(),
    responsible_user_id: z.number().optional(),
    query: z.string().optional(),
    created_at_from: z.number().int().optional(),
    created_at_to: z.number().int().optional(),
    sort_by: z.enum(['created_at', 'updated_at', 'id']).default('created_at').optional(),
    sort_order: z.enum(['asc', 'desc']).default('desc').optional(),
  })
  .refine((data) => !(data.status_id !== undefined && data.pipeline_id === undefined), {
    message: 'pipeline_id is required when filtering by status_id',
    path: ['pipeline_id'],
  });

export const leadsListResultSchema = z.object({
  leads: z.array(leadSchema),
});

export const singleLeadInputSchema = z.object({
  id: z.number().int().positive(),
});

export const updateLeadInputSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1).optional(),
    status_id: z.number().int().positive().optional(),
    pipeline_id: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      // Если указан status_id, должен быть указан pipeline_id
      if (data.status_id !== undefined && data.pipeline_id === undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'pipeline_id is required when updating status_id',
      path: ['pipeline_id'],
    }
  );

// Schema for PATCH responses - AmoCRM returns minimal data
export const leadMinimalSchema = z
  .object({
    id: z.number(),
  })
  .passthrough(); // Allow additional fields but only require id

export const singleLeadMinimalApiResponseSchema = z.object({
  _embedded: z.object({
    leads: z.array(leadMinimalSchema).min(1),
  }),
});

export const singleLeadResultSchema = z.object({
  lead: leadSchema,
});

export const updateLeadResultSchema = z.object({
  lead: leadMinimalSchema,
});

export const leadDetailsResultSchema = z.object({
  lead: leadSchema,
  nearest_task: taskSchema.optional().nullable(),
  contacts: z.array(contactSchema).optional(),
});

export type Lead = z.infer<typeof leadSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type LeadMinimal = z.infer<typeof leadMinimalSchema>;
export type LeadsListResult = z.infer<typeof leadsListResultSchema>;
export type ListLeadsInput = z.infer<typeof listLeadsInputSchema>;
export type SingleLeadInput = z.infer<typeof singleLeadInputSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadInputSchema>;
export type LeadDetailsResult = z.infer<typeof leadDetailsResultSchema>;
export type UpdateLeadResult = z.infer<typeof updateLeadResultSchema>;
