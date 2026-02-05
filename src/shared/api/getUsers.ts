import { fetchJson } from './client';

export type UserListItem = {
  user_id: string;
  role_id: number;
  status: string;
  full_name: string | null;
  phone: string | null;
  mail: string | null;
  tg_user_id: number | null;
  tg_status: string | null;
  company_name: string | null;
  inn: string | null;
  company_phone: string | null;
  company_mail: string | null;
  address: string | null;
  note: string | null;
};

type UserListResponse = {
  data: {
    items: UserListItem[];
  };
};

export const getUsers = async (roleId?: number): Promise<UserListItem[]> => {
  const search = typeof roleId === 'number' ? `?role_id=${roleId}` : '';
  const response = await fetchJson<UserListResponse>(
    `/api/v1/users${search}`,
    { method: 'GET' },
    'Ошибка загрузки пользователей'
  );

  return response.data.items;
};
