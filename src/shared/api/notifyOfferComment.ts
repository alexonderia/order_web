import { apiConfig } from './client';

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
  const response = await fetch(`${apiConfig.baseUrl}/api/web/offers/commented`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка отправки комментария по офферу';
    throw new Error(message);
  }

  return response.json();
};