import { apiConfig } from './client';

export type RequestWithOfferStats = {
  id: number;
  id_user_web: string;
  id_file: number;
  file_path?: string | null;
  file?: {
    id: number;
    path: string | null;
    download_url: string;
  } | null;
  status: string | null;
  deadline_at: string | null;
  closed_at: string | null;
  id_offer: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  count_submitted: number;
  count_deleted_alert: number;
};

export type GetRequestsPayload = {
  id_user_web: string;
};

export type GetRequestsResponse = {
  status: 'ok';
  requests: RequestWithOfferStats[];
};

export const getRequests = async (payload: GetRequestsPayload): Promise<GetRequestsResponse> => {
  const queryParams = new URLSearchParams({ id_user_web: payload.id_user_web });
  const response = await fetch(`${apiConfig.baseUrl}/api/web/requests?${queryParams.toString()}`);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Ошибка загрузки заявок';
    throw new Error(message);
  }

  return response.json();
};