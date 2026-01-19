import { apiConfig } from './client';

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
  const response = await fetch(`${apiConfig.baseUrl}/api/web/requests/update`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка сохранения заявки';
    throw new Error(message);
  }

  return response.json();
};