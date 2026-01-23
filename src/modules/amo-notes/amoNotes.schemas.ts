import { z } from 'zod';

// Note types in AmoCRM that support text-based creation
// Only types that can be created with params.text field
export const noteTypeEnum = z.enum([
  'common', // Regular text note - uses params.text
  'sms_in', // Incoming SMS - uses params.text
  'sms_out', // Outgoing SMS - uses params.text
]);

export const noteSchema = z.object({
  id: z.number(),
  entity_id: z.number(),
  note_type: z.string().optional(),
  params: z
    .object({
      text: z.string().nullable().optional(),
      service: z.string().nullable().optional(),
      uniq: z.string().nullable().optional(),
      duration: z.number().nullable().optional(),
      source: z.string().nullable().optional(),
      link: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
    })
    .passthrough()
    .optional(),
  text: z.string().nullable().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
  responsible_user_id: z.number().optional(),
  group_id: z.number().nullable().optional(),
  account_id: z.number().optional(),
});

export const notesListResponseSchema = z.object({
  _embedded: z.object({
    notes: z.array(noteSchema),
  }),
});

// Input schemas
export const getLeadNotesInputSchema = z.object({
  lead_id: z.number().int().positive().describe('Lead ID to get notes for'),
  page: z.number().int().positive().optional().describe('Page number for pagination'),
  limit: z
    .number()
    .int()
    .positive()
    .max(250)
    .optional()
    .describe('Number of notes per page (max 250)'),
});

export const addNoteInputSchema = z.object({
  lead_id: z.number().int().positive().describe('Lead ID to add note to'),
  text: z.string().min(1).max(10000).describe('Note text content'),
  note_type: noteTypeEnum
    .default('common')
    .optional()
    .describe(
      'Тип записи: common (обычная), sms_in (входящая SMS), sms_out (исходящая SMS). По умолчанию: common'
    ),
});

export const updateNoteInputSchema = z.object({
  lead_id: z.number().int().positive().describe('Lead ID the note belongs to'),
  note_id: z.number().int().positive().describe('Note ID to update'),
  text: z.string().min(1).max(10000).describe('New text content for the note'),
});

// Output schemas
export const notesListResultSchema = z.object({
  notes: z.array(noteSchema),
});

export const noteResultSchema = z.object({
  note: noteSchema,
});

export const noteCreatedResultSchema = z.object({
  id: z.number(),
  request_id: z.string().optional(),
});

export const noteUpdatedResultSchema = z.object({
  id: z.number(),
  updated_at: z.number(),
});

// Types
export type Note = z.infer<typeof noteSchema>;
export type NoteType = z.infer<typeof noteTypeEnum>;
export type GetLeadNotesInput = z.infer<typeof getLeadNotesInputSchema>;
export type AddNoteInput = z.infer<typeof addNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;
export type NotesListResult = z.infer<typeof notesListResultSchema>;
