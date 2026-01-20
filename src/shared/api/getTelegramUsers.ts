import { apiConfig } from './client';

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
  const response = await fetch(`${apiConfig.baseUrl}/api/db/users-tg`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка загрузки контрагентов';
    throw new Error(message);
  }

  return response.json();
};