import { apiFetch } from './client';

export type CreateRequestPayload = {
  id_user_web: string;
  description?: string | null;
  deadline_at: string;
  file: File;
};

export type CreateRequestResponse = {
  status: 'ok';
  request_id: number;
  id_file: number;
};

export const createRequest = async (payload: CreateRequestPayload): Promise<CreateRequestResponse> => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('id_user_web', payload.id_user_web);
  formData.append('deadline_at', payload.deadline_at);

  
  if (payload.description) {
    formData.append('description', payload.description);
  }

  const response = await apiFetch('/api/web/requests/create', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка создания заявки';
    throw new Error(message);
  }

  return response.json();
};