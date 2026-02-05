import { fetchJson  } from './client';

export type LoginWebUserPayload = {
  login: string;
  password: string;
};

export type AuthLink = {
  href: string;
  method: string;
};

export type LoginWebUserResponse = {
  data: {
    access_token: string;
    token_type: string;
    role_id: number;
  };
  _links?: {
    self: AuthLink;
    available_action?: AuthLink;
    availableAction?: AuthLink;
  };
};

export const loginWebUser = async (payload: LoginWebUserPayload): Promise<LoginWebUserResponse> =>
  fetchJson<LoginWebUserResponse>(
    '/api/v1/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    'Ошибка авторизации',
    false
  );