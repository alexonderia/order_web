import { apiConfig } from './client';

export type LoginWebUserPayload = {
  login: string;
  password: string;
};

export type LoginWebUserResponse = {
  status: 'ok';
  login: string;
  role: number;
};

export const loginWebUser = async (payload: LoginWebUserPayload): Promise<LoginWebUserResponse> => {
  const response = await fetch(`${apiConfig.baseUrl}/api/web/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка авторизации';
    throw new Error(message);
  }

  return response.json();
};