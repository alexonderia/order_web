import { fetchJson } from './client';

export type UpdateWebUserRolePayload = {
  login: string;
  role_id: number;
};

export type UpdateWebUserRoleResponse = {
  status: 'ok';
  user: {
    id: string;
    id_role: number;
  };
};

export const updateWebUserRole = async (
  payload: UpdateWebUserRolePayload
): Promise<UpdateWebUserRoleResponse> => {
  return fetchJson<UpdateWebUserRoleResponse>(
    '/api/web/users/role',
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    'Ошибка обновления роли'
  );
};