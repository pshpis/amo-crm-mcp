import { z } from 'zod';

export const userRightsSchema = z
  .object({
    leads: z
      .object({
        view: z.string().optional(),
        edit: z.string().optional(),
        add: z.string().optional(),
        delete: z.string().optional(),
        export: z.string().optional(),
      })
      .optional(),
    contacts: z
      .object({
        view: z.string().optional(),
        edit: z.string().optional(),
        add: z.string().optional(),
        delete: z.string().optional(),
        export: z.string().optional(),
      })
      .optional(),
    companies: z
      .object({
        view: z.string().optional(),
        edit: z.string().optional(),
        add: z.string().optional(),
        delete: z.string().optional(),
        export: z.string().optional(),
      })
      .optional(),
    tasks: z
      .object({
        edit: z.string().optional(),
        delete: z.string().optional(),
      })
      .optional(),
    mail_access: z.boolean().optional(),
    catalog_access: z.boolean().optional(),
    is_admin: z.boolean().optional(),
    is_free: z.boolean().optional(),
    is_active: z.boolean().optional(),
    group_id: z.number().nullable().optional(),
    role_id: z.number().nullable().optional(),
  })
  .optional();

export const userSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().optional(),
  lang: z.string().optional(),
  rights: userRightsSchema,
});

export const userDetailedSchema = userSchema.extend({
  _embedded: z
    .object({
      roles: z
        .array(
          z.object({
            id: z.number(),
            name: z.string().optional(),
          })
        )
        .optional(),
      groups: z
        .array(
          z.object({
            id: z.number(),
            name: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const usersListResponseSchema = z.object({
  _embedded: z.object({
    users: z.array(userSchema),
  }),
});

export const listUsersInputSchema = z.object({
  page: z.number().int().positive().optional().describe('Page number for pagination'),
  limit: z
    .number()
    .int()
    .positive()
    .max(250)
    .optional()
    .describe('Number of users per page (max 250)'),
});

export const usersListResultSchema = z.object({
  users: z.array(userSchema),
});

export const singleUserInputSchema = z.object({
  id: z.number().int().positive().describe('User ID in AmoCRM'),
});

export const userDetailsResultSchema = z.object({
  user: userDetailedSchema,
});

export type User = z.infer<typeof userSchema>;
export type UserDetailed = z.infer<typeof userDetailedSchema>;
export type UsersListResult = z.infer<typeof usersListResultSchema>;
export type ListUsersInput = z.infer<typeof listUsersInputSchema>;
export type SingleUserInput = z.infer<typeof singleUserInputSchema>;
export type UserDetailsResult = z.infer<typeof userDetailsResultSchema>;
