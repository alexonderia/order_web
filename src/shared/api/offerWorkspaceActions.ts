import { fetchEmpty, fetchJson } from './client';

export type OfferWorkspaceMessage = {
  id: number;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  status: string;
};

type MessagesResponse = {
  data: {
    items: OfferWorkspaceMessage[];
  };
};

type UploadResponse = {
  data: {
    offer_id: number;
    file_id: number;
  };
};

export const getOfferMessages = async (offerId: number): Promise<OfferWorkspaceMessage[]> => {
  const response = await fetchJson<MessagesResponse>(
    `/api/v1/offers/${offerId}/messages`,
    { method: 'GET' },
    'Ошибка загрузки сообщений'
  );

  return response.data.items ?? [];
};

export const sendOfferMessage = async (offerId: number, text: string) => {
  await fetchEmpty(
    `/api/v1/offers/${offerId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ text })
    },
    'Не удалось отправить сообщение'
  );
};

export const uploadOfferFile = async (offerId: number, file: File) => {
  const formData = new FormData();
  formData.set('file', file);

  const response = await fetchJson<UploadResponse>(
    `/api/v1/offers/${offerId}/files`,
    {
      method: 'POST',
      body: formData
    },
    'Не удалось загрузить файл'
  );

  return response.data;
};

export const deleteOfferFile = async (offerId: number, fileId: number) => {
  await fetchEmpty(
    `/api/v1/offers/${offerId}/files/${fileId}`,
    { method: 'DELETE' },
    'Не удалось удалить файл'
  );
};
