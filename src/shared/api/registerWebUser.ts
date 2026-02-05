import { fetchJson } from './client';

export type RegisterWebUserPayload = {
  login: string;
  password: string;
};

export type RegisterWebUserResponse = {
  status: 'ok';
  login: string;
  role: number;
};

export const registerWebUser = async (payload: RegisterWebUserPayload): Promise<RegisterWebUserResponse> => {
  return fetchJson<RegisterWebUserResponse>(
    '/api/web/register',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    'Ошибка регистрации'
  );
};