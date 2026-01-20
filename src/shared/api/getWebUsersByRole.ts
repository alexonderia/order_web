import { apiConfig } from './client';

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
  const response = await fetch(`${apiConfig.baseUrl}/api/db/users-web/role/${roleId}`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка загрузки пользователей';
    throw new Error(message);
  }

  return response.json();
};