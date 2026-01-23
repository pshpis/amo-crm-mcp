import { AmoService } from '../../core/amo';
import {
  Note,
  GetLeadNotesInput,
  AddNoteInput,
  UpdateNoteInput,
  notesListResponseSchema,
  noteSchema,
} from './amoNotes.schemas';

export class AmoNotesService {
  constructor(private readonly amoService: AmoService) {}

  async getLeadNotes(input: GetLeadNotesInput): Promise<Note[]> {
    const params: Record<string, string | number | boolean> = {};

    if (input.page !== undefined) params.page = input.page;
    if (input.limit !== undefined) params.limit = input.limit;

    const data = await this.amoService.request({
      path: `/leads/${input.lead_id}/notes`,
      query: params,
    });

    // AmoCRM returns 204 No Content (empty response) when there are no results
    if (!data) {
      return [];
    }

    const parsed = notesListResponseSchema.parse(data);
    return parsed._embedded.notes;
  }

  async addNote(input: AddNoteInput): Promise<Note> {
    const noteType = input.note_type ?? 'common';

    const requestBody = [
      {
        note_type: noteType,
        params: {
          text: input.text,
        },
      },
    ];

    const data = await this.amoService.request({
      path: `/leads/${input.lead_id}/notes`,
      method: 'POST',
      body: requestBody,
    });

    // AmoCRM returns created notes in _embedded.notes array
    const response = data as { _embedded?: { notes?: unknown[] } };
    if (response._embedded?.notes?.[0]) {
      return noteSchema.parse(response._embedded.notes[0]);
    }

    throw new Error('Failed to create note: unexpected response format');
  }

  async updateNote(input: UpdateNoteInput): Promise<Note> {
    // First, get the existing note to retrieve its note_type
    const existingNoteData = await this.amoService.request({
      path: `/leads/${input.lead_id}/notes/${input.note_id}`,
      method: 'GET',
    });

    const existingNote = noteSchema.parse(existingNoteData);

    // Now update with the note_type included
    const requestBody = {
      id: input.note_id,
      note_type: existingNote.note_type ?? 'common',
      params: {
        text: input.text,
      },
    };

    const data = await this.amoService.request({
      path: `/leads/${input.lead_id}/notes/${input.note_id}`,
      method: 'PATCH',
      body: requestBody,
    });

    return noteSchema.parse(data);
  }
}
