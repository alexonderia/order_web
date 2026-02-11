import { apiFetch } from './client';

export type UpdateRequestDetailsPayload = {
  requestId: number;
  status?: 'open' | 'review' | 'closed' | 'cancelled' | null;
  deadline_at?: string | null;
  delete_file_ids?: number[];
  files?: File[];
};

export const updateRequestDetails = async (payload: UpdateRequestDetailsPayload) => {
  const formData = new FormData();

  if (payload.status !== undefined) {
    formData.append('status', payload.status ?? '');
  }

  if (payload.deadline_at !== undefined) {
    formData.append('deadline_at', payload.deadline_at ?? '');
  }

  (payload.delete_file_ids ?? []).forEach((fileId) => {
    formData.append('delete_file_ids', String(fileId));
  });

  (payload.files ?? []).forEach((file) => {
    formData.append('files', file, file.name);
  });

  const response = await apiFetch(`/api/v1/requests/${payload.requestId}`, {
    method: 'PATCH',
    body: formData
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail ?? 'Ошибка сохранения заявки');
  }

  return response.json();
};
