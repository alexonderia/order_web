import { fetchJson } from './client';
import type { AuthLink } from './loginWebUser';

export type RequestDetailsFile = {
  id: number;
  name: string;
  path: string;
  download_url: string;
};

export type RequestDetailsOffer = {
  offer_id: number;
  id_request: number;
  id_user_tg: number;
  status: string | null;
  created_at: string;
  updated_at: string;
  tg_username: string | null;
  real_name: string | null;
  id_contacts: number | null;
  phone: string | null;
  mail: string | null;
  address: string | null;
  note: string | null;
  offer_chat_stats?: {
    status_web: boolean | null;
    status_tg: boolean | null;
    updated_at?: string | null;
  } | null;
  files: RequestDetailsFile[];
};

export type RequestDetails = {
  id: number;
  id_user: string;
  status: string;
  status_label: string;
  deadline_at: string;
  closed_at: string | null;
  id_offer: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  count_submitted: number;
  count_deleted_alert: number;
  count_accepted_total: number;
  count_rejected_total: number;
  files: RequestDetailsFile[];
  offers: RequestDetailsOffer[];
  availableActions: AuthLink[];
};

type ApiRequestItem = {
  request_id: number;
  description: string | null;
  status: string;
  status_label: string;
  deadline_at: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  owner_user_id: string;
  chosen_offer_id: number | null;
  stats: {
    count_submitted: number;
    count_deleted_alert: number;
    count_accepted_total: number;
    count_rejected_total: number;
  };
  files: RequestDetailsFile[];
  offers?: RequestDetailsOffer[];
};

type ApiResponse = {
  data: {
    item: ApiRequestItem;
  };
  _links?: {
    available_action?: AuthLink[];
    available_actions?: AuthLink[];
    availableActions?: AuthLink[];
  };
};

export const getRequestDetails = async (requestId: number): Promise<RequestDetails> => {
  const response = await fetchJson<ApiResponse>(
    `/api/v1/requests/${requestId}`,
    { method: 'GET' },
    'Ошибка загрузки заявки'
  );

  const item = response.data.item;

  return {
    id: item.request_id,
    id_user: item.owner_user_id,
    status: item.status,
    status_label: item.status_label,
    deadline_at: item.deadline_at,
    closed_at: item.closed_at,
    id_offer: item.chosen_offer_id,
    description: item.description,
    created_at: item.created_at,
    updated_at: item.updated_at,
    count_submitted: item.stats.count_submitted,
    count_deleted_alert: item.stats.count_deleted_alert,
    count_accepted_total: item.stats.count_accepted_total,
    count_rejected_total: item.stats.count_rejected_total,
    files: item.files ?? [],
    offers: item.offers ?? [],
    availableActions:
      response._links?.available_action ??
      response._links?.available_actions ??
      response._links?.availableActions ??
      []
  };
};
