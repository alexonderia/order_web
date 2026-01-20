import { apiConfig } from './client';

export type UpdateOfferStatusPayload = {
  id_user_web: string;
  offer_id: number;
  status: string;
};

export type UpdateOfferStatusResponse = {
  status: 'ok';
  offer: {
    id: number;
    status: string;
  };
};

export const updateOfferStatus = async (
  payload: UpdateOfferStatusPayload
): Promise<UpdateOfferStatusResponse> => {
  const response = await fetch(`${apiConfig.baseUrl}/api/web/offers/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка обновления статуса оффера';
    throw new Error(message);
  }

  return response.json();
};