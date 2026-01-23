import { Event, EventValueItem } from '../amoEvents.schemas';
import { DateFormatter } from '../../../lib/utils/dateFormatter';
import { safeToString } from '../../../lib/utils/stringUtils';

export class EventDetailsFormatter {
  constructor(private readonly dateFormatter: DateFormatter) {}

  format(event: Event): string {
    const parts: string[] = [];
    const after: EventValueItem | undefined = event.value_after?.[0];
    const before: EventValueItem | undefined = event.value_before?.[0];

    if (!after && !before) {
      return '';
    }

    // Status changes
    this.formatLeadStatusChanges(parts, before, after);
    this.formatCustomerStatusChanges(parts, before, after);

    // User and entity changes
    this.formatResponsibleUserChanges(parts, before, after);
    this.formatTagChanges(parts, before, after);
    this.formatLinkChanges(parts, before, after);
    this.formatNoteChanges(parts, before, after);

    // Field changes
    this.formatCustomFieldChanges(parts, before, after);
    this.formatValueChanges(parts, before, after);
    this.formatTextChanges(parts, before, after, event);
    this.formatNameChanges(parts, before, after);
    this.formatPriceChanges(parts, before, after);
    this.formatLtvChanges(parts, before, after);

    // Task-specific changes
    this.formatTaskDeadlineChanges(parts, before, after);
    this.formatTaskTypeChanges(parts, before, after);
    this.formatTaskCompletionStatusChanges(parts, before, after);
    this.formatTaskResultChanges(parts, before, after);
    this.formatTaskEntityLinkChanges(parts, before, after);

    // Array changes
    this.formatCustomFieldValuesArrayChanges(parts, before, after);
    this.formatLeadStatusesArrayChanges(parts, before, after);
    this.formatCustomerStatusesArrayChanges(parts, before, after);

    return parts.length > 0 ? ` (${parts.join(', ')})` : '';
  }

  private formatLeadStatusChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.lead_status) {
      if (before?.lead_status) {
        parts.push(
          `статус: ${before.lead_status.id} → ${after.lead_status.id} (воронка: ${after.lead_status.pipeline_id})`
        );
      } else {
        parts.push(`статус → ${after.lead_status.id} (воронка: ${after.lead_status.pipeline_id})`);
      }
    } else if (before?.lead_status) {
      parts.push(`статус: ${before.lead_status.id} → удалён`);
    }
  }

  private formatCustomerStatusChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.customer_status) {
      if (before?.customer_status) {
        parts.push(`статус покупателя: ${before.customer_status.id} → ${after.customer_status.id}`);
      } else {
        parts.push(`статус покупателя → ${after.customer_status.id}`);
      }
    } else if (before?.customer_status) {
      parts.push(`статус покупателя: ${before.customer_status.id} → удалён`);
    }
  }

  private formatResponsibleUserChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    const afterResponsibleId = after?.responsible_user?.id ?? after?.responsible_user_id;
    const beforeResponsibleId = before?.responsible_user?.id ?? before?.responsible_user_id;
    if (afterResponsibleId !== undefined) {
      if (beforeResponsibleId !== undefined) {
        parts.push(`ответственный: #${beforeResponsibleId} → #${afterResponsibleId}`);
      } else {
        parts.push(`ответственный → пользователь #${afterResponsibleId}`);
      }
    } else if (beforeResponsibleId !== undefined) {
      parts.push(`ответственный: #${beforeResponsibleId} → удалён`);
    }
  }

  private formatTagChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.tag) {
      const tagName = after.tag.name ?? `#${after.tag.id}`;
      if (before?.tag) {
        const beforeTagName = before.tag.name ?? `#${before.tag.id}`;
        parts.push(`тег: ${beforeTagName} → ${tagName}`);
      } else {
        parts.push(`тег добавлен: ${tagName}`);
      }
    } else if (before?.tag) {
      const tagName = before.tag.name ?? `#${before.tag.id}`;
      parts.push(`тег удалён: ${tagName}`);
    }
  }

  private formatLinkChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.link?.entity) {
      if (before?.link?.entity) {
        parts.push(
          `связь: ${before.link.entity.type} #${before.link.entity.id} → ${after.link.entity.type} #${after.link.entity.id}`
        );
      } else {
        parts.push(`привязан ${after.link.entity.type} #${after.link.entity.id}`);
      }
    } else if (before?.link?.entity) {
      parts.push(`отвязан ${before.link.entity.type} #${before.link.entity.id}`);
    }
  }

  private formatNoteChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.note) {
      if (before?.note) {
        parts.push(`примечание: #${before.note.id} → #${after.note.id}`);
      } else {
        parts.push(`примечание #${after.note.id} добавлено`);
      }
    } else if (before?.note) {
      parts.push(`примечание #${before.note.id} удалено`);
    }
  }

  private formatCustomFieldChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.custom_field_value) {
      const fieldId = after.custom_field_value.field_id;
      const fieldType = after.custom_field_value.field_type;
      const value = after.custom_field_value.value;
      const enumCode = after.custom_field_value.enum_code;

      if (before?.custom_field_value) {
        const beforeValue = before.custom_field_value.value;
        const beforeEnumCode = before.custom_field_value.enum_code;
        const valueStr =
          enumCode ?? (value !== undefined && value !== null ? safeToString(value) : 'изменено');
        const beforeValueStr =
          beforeEnumCode ??
          (beforeValue !== undefined && beforeValue !== null ? safeToString(beforeValue) : 'было');
        parts.push(`поле #${fieldId} (${fieldType}): ${beforeValueStr} → ${valueStr}`);
      } else {
        const valueStr =
          enumCode ?? (value !== undefined && value !== null ? safeToString(value) : 'установлено');
        parts.push(`поле #${fieldId} (${fieldType}) → ${valueStr}`);
      }
    } else if (before?.custom_field_value) {
      parts.push(`поле #${before.custom_field_value.field_id} удалено`);
    }
  }

  private formatValueChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.value !== undefined && after.value !== null) {
      const valueStr = safeToString(after.value);
      if (before?.value !== undefined && before.value !== null) {
        const beforeValueStr = safeToString(before.value);
        parts.push(`значение: ${beforeValueStr} → ${valueStr}`);
      } else {
        parts.push(`значение → ${valueStr}`);
      }
    } else if (before?.value !== undefined && before.value !== null) {
      const beforeValueStr = safeToString(before.value);
      parts.push(`значение: ${beforeValueStr} → удалено`);
    }
  }

  private formatTextChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined,
    event: Event
  ): void {
    if (after?.text !== undefined) {
      if (before?.text !== undefined) {
        const afterText: string = after.text || '(пусто)';
        const beforeText: string = before.text || '(пусто)';
        // Для задач показываем более информативно
        if (event.entity_type === 'tasks' || event.type?.includes('task')) {
          parts.push(
            `текст задачи: "${beforeText.substring(0, 50)}${beforeText.length > 50 ? '...' : ''}" → "${afterText.substring(0, 50)}${afterText.length > 50 ? '...' : ''}"`
          );
        } else {
          parts.push(`текст: "${beforeText}" → "${afterText}"`);
        }
      } else {
        const text: string = after.text || '(пусто)';
        if (event.entity_type === 'tasks' || event.type?.includes('task')) {
          parts.push(
            `текст задачи установлен: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
          );
        } else {
          parts.push(`текст → "${text}"`);
        }
      }
    } else if (before?.text !== undefined) {
      const text: string = before.text || '(пусто)';
      if (event.entity_type === 'tasks' || event.type?.includes('task')) {
        parts.push(
          `текст задачи удалён: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
        );
      } else {
        parts.push(`текст: "${text}" → удалён`);
      }
    }
  }

  private formatNameChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.name !== undefined) {
      if (before?.name !== undefined) {
        parts.push(`название: "${before.name || '(пусто)'}" → "${after.name || '(пусто)'}"`);
      } else {
        parts.push(`название → "${after.name || '(пусто)'}"`);
      }
    } else if (before?.name !== undefined) {
      parts.push(`название: "${before.name || '(пусто)'}" → удалено`);
    }
  }

  private formatPriceChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.price !== undefined || after?.sale !== undefined) {
      const price = after.price ?? after.sale;
      if (before?.price !== undefined || before?.sale !== undefined) {
        const beforePrice = before.price ?? before.sale;
        parts.push(`сумма: ${beforePrice}₽ → ${price}₽`);
      } else {
        parts.push(`сумма → ${price}₽`);
      }
    } else if (before?.price !== undefined || before?.sale !== undefined) {
      const beforePrice = before.price ?? before.sale;
      parts.push(`сумма: ${beforePrice}₽ → удалена`);
    }
  }

  private formatLtvChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.ltv !== undefined) {
      if (before?.ltv !== undefined) {
        parts.push(`LTV: ${before.ltv} → ${after.ltv}`);
      } else {
        parts.push(`LTV → ${after.ltv}`);
      }
    } else if (before?.ltv !== undefined) {
      parts.push(`LTV: ${before.ltv} → удалён`);
    }
  }

  private formatTaskDeadlineChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.complete_till !== undefined) {
      if (before?.complete_till !== undefined) {
        parts.push(
          `срок выполнения: ${this.dateFormatter.format(before.complete_till)} → ${this.dateFormatter.format(after.complete_till)}`
        );
      } else {
        parts.push(`срок выполнения установлен: ${this.dateFormatter.format(after.complete_till)}`);
      }
    } else if (before?.complete_till !== undefined) {
      parts.push(`срок выполнения удалён: ${this.dateFormatter.format(before.complete_till)}`);
    }
  }

  private formatTaskTypeChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.task_type_id !== undefined) {
      if (before?.task_type_id !== undefined) {
        parts.push(`тип задачи: ${before.task_type_id} → ${after.task_type_id}`);
      } else {
        parts.push(`тип задачи установлен: ${after.task_type_id}`);
      }
    } else if (before?.task_type_id !== undefined) {
      parts.push(`тип задачи удалён: ${before.task_type_id}`);
    }
  }

  private formatTaskCompletionStatusChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.is_completed !== undefined) {
      if (before?.is_completed !== undefined) {
        const beforeStatus = before.is_completed ? 'выполнена' : 'не выполнена';
        const afterStatus = after.is_completed ? 'выполнена' : 'не выполнена';
        if (before.is_completed !== after.is_completed) {
          parts.push(`статус выполнения: ${beforeStatus} → ${afterStatus}`);
        }
      } else {
        const status = after.is_completed ? 'выполнена' : 'не выполнена';
        parts.push(`статус выполнения: ${status}`);
      }
    } else if (before?.is_completed !== undefined) {
      const status = before.is_completed ? 'выполнена' : 'не выполнена';
      parts.push(`статус выполнения удалён: была ${status}`);
    }
  }

  private formatTaskResultChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.result !== undefined) {
      const resultText = after.result || '(пусто)';
      if (before?.result !== undefined) {
        const beforeResultText = before.result || '(пусто)';
        parts.push(`результат задачи: "${beforeResultText}" → "${resultText}"`);
      } else {
        parts.push(`результат задачи добавлен: "${resultText}"`);
      }
    } else if (before?.result !== undefined) {
      const beforeResultText = before.result || '(пусто)';
      parts.push(`результат задачи удалён: "${beforeResultText}"`);
    }
  }

  private formatTaskEntityLinkChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.entity_id !== undefined && after?.entity_type !== undefined) {
      if (before?.entity_id !== undefined && before?.entity_type !== undefined) {
        if (before.entity_id !== after.entity_id || before.entity_type !== after.entity_type) {
          parts.push(
            `привязка: ${before.entity_type} #${before.entity_id} → ${after.entity_type} #${after.entity_id}`
          );
        }
      } else {
        parts.push(`задача привязана к ${after.entity_type} #${after.entity_id}`);
      }
    } else if (before?.entity_id !== undefined && before?.entity_type !== undefined) {
      parts.push(`привязка задачи удалена: была к ${before.entity_type} #${before.entity_id}`);
    }
  }

  private formatCustomFieldValuesArrayChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.custom_field_values && after.custom_field_values.length > 0) {
      const values = after.custom_field_values
        .map((v) => {
          if (v.enum_code) return v.enum_code;
          return safeToString(v.value);
        })
        .filter(Boolean)
        .join(', ');
      if (before?.custom_field_values && before.custom_field_values.length > 0) {
        const beforeValues = before.custom_field_values
          .map((v) => {
            if (v.enum_code) return v.enum_code;
            return safeToString(v.value);
          })
          .filter(Boolean)
          .join(', ');
        parts.push(`поля: [${beforeValues}] → [${values}]`);
      } else {
        parts.push(`поля → [${values}]`);
      }
    } else if (before?.custom_field_values && before.custom_field_values.length > 0) {
      const beforeValues = before.custom_field_values
        .map((v) => {
          if (v.enum_code) return v.enum_code;
          return safeToString(v.value);
        })
        .filter(Boolean)
        .join(', ');
      parts.push(`поля: [${beforeValues}] → удалены`);
    }
  }

  private formatLeadStatusesArrayChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.leads_statuses && after.leads_statuses.length > 0) {
      const statuses = after.leads_statuses
        .map((s) => `${s.id} (воронка: ${s.pipeline_id})`)
        .join(', ');
      if (before?.leads_statuses && before.leads_statuses.length > 0) {
        const beforeStatuses = before.leads_statuses
          .map((s) => `${s.id} (воронка: ${s.pipeline_id})`)
          .join(', ');
        parts.push(`статусы лидов: [${beforeStatuses}] → [${statuses}]`);
      } else {
        parts.push(`статусы лидов → [${statuses}]`);
      }
    }
  }

  private formatCustomerStatusesArrayChanges(
    parts: string[],
    before: EventValueItem | undefined,
    after: EventValueItem | undefined
  ): void {
    if (after?.customers_statuses && after.customers_statuses.length > 0) {
      const statuses = after.customers_statuses
        .map((s) => `${s.id}${s.pipeline_id ? ` (воронка: ${s.pipeline_id})` : ''}`)
        .join(', ');
      if (before?.customers_statuses && before.customers_statuses.length > 0) {
        const beforeStatuses = before.customers_statuses
          .map((s) => `${s.id}${s.pipeline_id ? ` (воронка: ${s.pipeline_id})` : ''}`)
          .join(', ');
        parts.push(`статусы покупателей: [${beforeStatuses}] → [${statuses}]`);
      } else {
        parts.push(`статусы покупателей → [${statuses}]`);
      }
    }
  }
}
