import { apiConfig } from './client';

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
  const response = await fetch(`${apiConfig.baseUrl}/api/web/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка регистрации';
    throw new Error(message);
  }

  return response.json();
};