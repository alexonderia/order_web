import { fetchJson  } from './client';

export type WebUser = {
  id: string;
  id_role: number;
};

export type GetWebUsersByRoleResponse = {
  status: 'ok';
  role: number;
  users: WebUser[];
};

export const getWebUsersByRole = async (roleId: number): Promise<GetWebUsersByRoleResponse> => {
  return fetchJson<GetWebUsersByRoleResponse>(
    `/api/db/users-web/role/${roleId}`,
    { method: 'GET' },
    'Ошибка загрузки пользователей'
  );
};