import { apiConfig } from './client';

export type OfferCommentRecord = {
  id: number;
  id_offer: number;
  comment: string;
  answer: string | null;
  created_at: string | null;
  answered_at: string | null;
  status_web?: boolean | null;
  status_tg?: boolean | null;
};

export type GetOfferCommentsResponse = {
  status: 'ok';
  offer_id: number;
  comments: OfferCommentRecord[];
};

export type GetOfferCommentsPayload = {
  offerId: number;
  userLogin: string;
};

export const getOfferComments = async (
  payload: GetOfferCommentsPayload
): Promise<GetOfferCommentsResponse> => {
  const queryParams = new URLSearchParams({ id_user_web: payload.userLogin });
  const response = await fetch(
    `${apiConfig.baseUrl}/api/web/offers/${payload.offerId}/comments?${queryParams.toString()}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка загрузки комментариев по офферу';
    throw new Error(message);
  }

  return response.json();
};