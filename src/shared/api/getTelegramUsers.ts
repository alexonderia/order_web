import { fetchJson } from './client';

export type TelegramUser = {
  id: number;
  tg_username: string | null;
  real_name: string | null;
  id_contacts: number | null;
  id_role: number | null;
};

export type GetTelegramUsersResponse = {
  status: 'ok';
  users: TelegramUser[];
};

export const getTelegramUsers = async (): Promise<GetTelegramUsersResponse> => {
  return fetchJson<GetTelegramUsersResponse>(
    '/api/db/users-tg',
    { method: 'GET' },
    'Ошибка загрузки контрагентов'
  );
};