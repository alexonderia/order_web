import { apiConfig } from './client';

export type UpdateWebUserPasswordPayload = {
  login: string;
  current_password: string;
  new_password: string;
};

export type UpdateWebUserPasswordResponse = {
  status: 'ok';
  login: string;
};

export const updateWebUserPassword = async (
  payload: UpdateWebUserPasswordPayload
): Promise<UpdateWebUserPasswordResponse> => {
  const response = await fetch(`${apiConfig.baseUrl}/api/web/users/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка обновления пароля';
    throw new Error(message);
  }

  return response.json();
};