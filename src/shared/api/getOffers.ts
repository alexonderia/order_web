import { fetchJson } from './client';

export type OfferDetails = {
  offer_id: number;
  id_request: number;
  id_user_tg: number;
  status: string | null;
  id_file: number | null;
  created_at: string;
  updated_at: string;
  file_path: string | null;
  offer_chat_stats?: {
    status_web: boolean | null;
    status_tg: boolean | null;
    updated_at?: string | null;
  } | null;
  tg_username: string | null;
  real_name: string | null;
  id_contacts: number | null;
  phone: string | null;
  mail: string | null;
  address: string | null;
  note: string | null;
};

export type GetOffersResponse = {
  status: 'ok';
  offers: OfferDetails[];
};

export type GetOffersPayload = {
  requestId: number;
  userLogin: string;
};

export const getOffers = async (payload: GetOffersPayload): Promise<GetOffersResponse> => {
  const queryParams = new URLSearchParams({ id_user: payload.userLogin });
  return fetchJson<GetOffersResponse>(
    `/api/web/requests/${payload.requestId}/offers?${queryParams.toString()}`,
    { method: 'GET' },
    'Ошибка загрузки офферов'
  );
};