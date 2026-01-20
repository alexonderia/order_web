import { apiConfig } from './client';

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
  const response = await fetch(`${apiConfig.baseUrl}/api/web/users/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка обновления роли';
    throw new Error(message);
  }

  return response.json();
};