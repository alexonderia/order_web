import { fetchJson } from './client';

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
  return fetchJson<UpdateWebUserPasswordResponse>(
    '/api/web/users/password',
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    'Ошибка обновления пароля'
  );
};