import { fetchJson } from './client';

export type NotifyOfferCommentPayload = {
  id_user_web: string;
  offer_id: number;
  comment: string;
};

export type OfferComment = {
  id?: number;
  offer_id: number;
  comment: string;
  created_at?: string | null;
};

export type NotifyOfferCommentResponse = {
  status: 'ok';
  comment: OfferComment;
};

export const notifyOfferComment = async (
  payload: NotifyOfferCommentPayload
): Promise<NotifyOfferCommentResponse> => {
  return fetchJson<NotifyOfferCommentResponse>(
    '/api/web/offers/commented',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    'Ошибка отправки комментария по офферу'
  );
};