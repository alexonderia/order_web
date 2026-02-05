import { fetchJson  } from './client';

export type UpdateRequestPayload = {
  id_user_web: string;
  request_id: number;
  status?: 'open' | 'review' | 'closed' | 'cancelled' | null;
  deadline_at?: string | null;
};

export type UpdateRequestResponse = {
  status: 'ok';
  request: {
    id: number;
    status: string | null;
    deadline_at: string | null;
    updated_at: string;
  };
};

export const updateRequest = async (payload: UpdateRequestPayload): Promise<UpdateRequestResponse> => {
  return fetchJson<UpdateRequestResponse>(
    '/api/web/requests/update',
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    'Ошибка сохранения заявки'
  );
};