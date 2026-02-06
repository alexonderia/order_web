import { fetchJson } from './client';

export type RequestFile = {
  id: number;
  path: string;
  name: string;
  download_url: string;
};

export type RequestWithOfferStats = {
  id: number;
  id_user_web: string;
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
  count_chat_alert?: number;
  files: RequestFile[];
};

export type GetRequestsResponse = {
  requests: RequestWithOfferStats[];
};

type ApiResponse = {
  data: {
    items: Array<{
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
      files: RequestFile[];
    }>;
  };
};

export const getRequests = async (): Promise<GetRequestsResponse> => {
  const response = await fetchJson<ApiResponse>(
    '/api/v1/requests',
    { method: 'GET' },
    'Ошибка загрузки заявок'
  );
  return {
    requests: response.data.items.map((item) => ({
      id: item.request_id,
      id_user_web: item.owner_user_id,
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
      files: item.files
    }))
  };
};