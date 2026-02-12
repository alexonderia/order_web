import { fetchJson  } from './client';

export type UpdateOfferStatusPayload = {
  id_user: string;
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
  return fetchJson<UpdateOfferStatusResponse>(
    '/api/web/offers/status',
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    'Ошибка обновления статуса оффера'
  );
};