import { AmoNotesService } from './amoNotes.service';
import {
  Note,
  GetLeadNotesInput,
  AddNoteInput,
  UpdateNoteInput,
  notesListResultSchema,
  noteResultSchema,
  getLeadNotesInputSchema,
  addNoteInputSchema,
  updateNoteInputSchema,
} from './amoNotes.schemas';
import { Logger } from '../../lib/logger';
import { BaseController, Tool, ToolResult } from '../../lib/base/baseController';
import { DateFormatter } from '../../lib/utils/dateFormatter';

export class AmoNotesController extends BaseController {
  private readonly dateFormatter: DateFormatter;

  constructor(
    private readonly service: AmoNotesService,
    logger: Logger,
    timezone: string
  ) {
    super(logger);
    this.dateFormatter = new DateFormatter(timezone);
  }

  private formatNoteSummary(note: Note): string {
    const type = note.note_type || 'неизвестно';
    const text = note.params?.text || note.text || 'Без текста';
    const created = this.dateFormatter.format(note.created_at);
    return `#${note.id} [${type}]: ${text} (создано: ${created})`;
  }

  private formatNoteDetails(note: Note): string {
    const lines = [
      `Запись #${note.id}`,
      `Тип: ${note.note_type || 'неизвестно'}`,
      `ID лида: ${note.entity_id}`,
      `Текст: ${note.params?.text || note.text || 'Без текста'}`,
      `Создал: ${note.created_by ?? 'неизвестно'}`,
      `Создано: ${this.dateFormatter.format(note.created_at)}`,
      `Обновлено: ${this.dateFormatter.format(note.updated_at)}`,
    ];

    if (note.params?.phone) {
      lines.push(`Телефон: ${note.params.phone}`);
    }
    if (note.params?.duration) {
      lines.push(`Длительность: ${note.params.duration}с`);
    }
    if (note.params?.link) {
      lines.push(`Ссылка: ${note.params.link}`);
    }

    return lines.join('\n');
  }

  @Tool({
    name: 'get_lead_notes',
    title: 'Get notes for a lead from AmoCRM',
    description:
      'Возвращает список записей (комментарии, записи звонков и т.д.) прикреплённых к лиду.',
    inputSchema: getLeadNotesInputSchema,
    outputSchema: notesListResultSchema,
    errorLogMessage: 'Failed to fetch lead notes from AmoCRM',
    errorLlmMessage: 'Не удалось получить записи лида из AmoCRM.',
  })
  private async getLeadNotes(input: GetLeadNotesInput): Promise<ToolResult<{ notes: Note[] }>> {
    const notes = await this.service.getLeadNotes(input);

    const lines = notes.map((note) => `- ${this.formatNoteSummary(note)}`);
    const summary =
      notes.length === 0
        ? `Записи для лида #${input.lead_id} не найдены.`
        : `Найдено записей для лида #${input.lead_id}: ${notes.length}.`;

    return {
      structuredContent: { notes },
      content: [
        {
          type: 'text',
          text: notes.length === 0 ? summary : `${summary}\nСписок:\n${lines.join('\n')}`,
        },
      ],
    };
  }

  @Tool({
    name: 'add_lead_note',
    title: 'Add a note to a lead in AmoCRM',
    description:
      'Создает новую текстовую запись к лиду. Используйте для добавления комментариев или наблюдений о сделке.',
    inputSchema: addNoteInputSchema,
    outputSchema: noteResultSchema,
    errorLogMessage: 'Failed to add note to lead in AmoCRM',
    errorLlmMessage: 'Не удалось добавить запись к лиду в AmoCRM.',
  })
  private async addNote(input: AddNoteInput): Promise<ToolResult<{ note: Note }>> {
    const note = await this.service.addNote(input);

    return {
      structuredContent: { note },
      content: [
        {
          type: 'text',
          text: `Запись успешно добавлена. ID лида: ${input.lead_id}, ID записи: ${note.id}`,
        },
      ],
    };
  }

  @Tool({
    name: 'update_lead_note',
    title: 'Update a note on a lead in AmoCRM',
    description: 'Обновляет текстовое содержимое существующей записи к лиду.',
    inputSchema: updateNoteInputSchema,
    outputSchema: noteResultSchema,
    errorLogMessage: 'Failed to update note in AmoCRM',
    errorLlmMessage: 'Не удалось обновить запись в AmoCRM.',
  })
  private async updateNote(input: UpdateNoteInput): Promise<ToolResult<{ note: Note }>> {
    const note = await this.service.updateNote(input);

    return {
      structuredContent: { note },
      content: [
        {
          type: 'text',
          text: `Запись #${input.note_id} успешно обновлена.`,
        },
      ],
    };
  }
}
