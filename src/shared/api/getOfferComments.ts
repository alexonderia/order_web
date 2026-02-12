import { fetchJson } from './client';

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
  const queryParams = new URLSearchParams({ id_user: payload.userLogin });
  return fetchJson<GetOfferCommentsResponse>(
    `/api/web/offers/${payload.offerId}/comments?${queryParams.toString()}`,
    { method: 'GET' },
    'Ошибка загрузки комментариев по офферу'
  );

};