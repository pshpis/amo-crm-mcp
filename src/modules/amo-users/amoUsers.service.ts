import { AmoService } from '../../core/amo';
import {
  User,
  UserDetailed,
  ListUsersInput,
  usersListResponseSchema,
  userDetailedSchema,
} from './amoUsers.schemas';

export class AmoUsersService {
  constructor(private readonly amoService: AmoService) {}

  async getUsers(input: ListUsersInput = {}): Promise<User[]> {
    const params: Record<string, string | number | boolean> = {};

    if (input.page !== undefined) params.page = input.page;
    if (input.limit !== undefined) params.limit = input.limit;

    // Request with_roles to get role information
    params.with = 'role,group';

    const data = await this.amoService.request({
      path: '/users',
      query: params,
    });

    // AmoCRM returns 204 No Content (empty response) when there are no results
    if (!data) {
      return [];
    }

    const parsed = usersListResponseSchema.parse(data);
    return parsed._embedded.users;
  }

  async getUserById(id: number): Promise<UserDetailed> {
    const data = await this.amoService.request({
      path: `/users/${id}`,
      query: { with: 'role,group' },
    });

    return userDetailedSchema.parse(data);
  }
}
