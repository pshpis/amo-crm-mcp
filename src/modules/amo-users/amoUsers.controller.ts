import { AmoUsersService } from './amoUsers.service';
import {
  User,
  UserDetailed,
  usersListResultSchema,
  userDetailsResultSchema,
  listUsersInputSchema,
  singleUserInputSchema,
  ListUsersInput,
  SingleUserInput,
} from './amoUsers.schemas';
import { Logger } from '../../lib/logger';
import { BaseController, Tool, ToolResult } from '../../lib/base/baseController';

export class AmoUsersController extends BaseController {
  constructor(
    private readonly service: AmoUsersService,
    logger: Logger
  ) {
    super(logger);
  }

  private formatUserSummary(user: User): string {
    const name = user.name?.trim() || 'Без имени';
    const email = user.email || 'без email';
    const rights = user.rights;
    const role = rights?.is_admin ? 'админ' : rights?.is_free ? 'бесплатный' : 'пользователь';
    const status = rights?.is_active !== false ? 'активен' : 'неактивен';
    return `#${user.id}: ${name} (${email}) [${role}, ${status}]`;
  }

  private formatUserDetails(user: UserDetailed): string {
    const rights = user.rights;
    const roles = user._embedded?.roles?.map((r) => r.name ?? `#${r.id}`).join(', ') || 'нет';
    const groups = user._embedded?.groups?.map((g) => g.name ?? `#${g.id}`).join(', ') || 'нет';

    const lines = [
      `Пользователь #${user.id}`,
      `Имя: ${user.name ?? 'не указано'}`,
      `Email: ${user.email ?? 'не указан'}`,
      `Язык: ${user.lang ?? 'не указан'}`,
      `Статус: ${rights?.is_active !== false ? 'активен' : 'неактивен'}`,
      `Админ: ${rights?.is_admin ? 'да' : 'нет'}`,
      `Бесплатный аккаунт: ${rights?.is_free ? 'да' : 'нет'}`,
      `Роли: ${roles}`,
      `Группы: ${groups}`,
    ];

    if (rights?.leads) {
      lines.push(
        `Доступ к лидам: просмотр=${rights.leads.view ?? '-'}, редактирование=${rights.leads.edit ?? '-'}, добавление=${rights.leads.add ?? '-'}`
      );
    }
    if (rights?.contacts) {
      lines.push(
        `Доступ к контактам: просмотр=${rights.contacts.view ?? '-'}, редактирование=${rights.contacts.edit ?? '-'}, добавление=${rights.contacts.add ?? '-'}`
      );
    }

    return lines.join('\n');
  }

  @Tool({
    name: 'get_users',
    title: 'Get users from AmoCRM',
    description:
      'Возвращает список всех пользователей аккаунта AmoCRM с их базовой информацией и ролями.',
    inputSchema: listUsersInputSchema,
    outputSchema: usersListResultSchema,
    errorLogMessage: 'Failed to fetch users from AmoCRM',
    errorLlmMessage: 'Не удалось получить список пользователей из AmoCRM.',
  })
  private async getUsers(input: ListUsersInput = {}): Promise<ToolResult<{ users: User[] }>> {
    const users = await this.service.getUsers(input);

    const lines = users.map((user) => `- ${this.formatUserSummary(user)}`);
    const summary =
      users.length === 0 ? 'Пользователи не найдены.' : `Найдено пользователей: ${users.length}.`;

    return {
      structuredContent: { users },
      content: [
        {
          type: 'text',
          text: users.length === 0 ? summary : `${summary}\nСписок:\n${lines.join('\n')}`,
        },
      ],
    };
  }

  @Tool({
    name: 'get_user_by_id',
    title: 'Get user by ID from AmoCRM',
    description:
      'Возвращает детальную информацию о конкретном пользователе по его ID, включая роли, группы и права доступа.',
    inputSchema: singleUserInputSchema,
    outputSchema: userDetailsResultSchema,
    errorLogMessage: 'Failed to fetch user by ID from AmoCRM',
    errorLlmMessage: 'Не удалось получить данные пользователя из AmoCRM.',
  })
  private async getUserById(input: SingleUserInput): Promise<ToolResult<{ user: UserDetailed }>> {
    const user = await this.service.getUserById(input.id);

    return {
      structuredContent: { user },
      content: [
        {
          type: 'text',
          text: this.formatUserDetails(user),
        },
      ],
    };
  }
}
