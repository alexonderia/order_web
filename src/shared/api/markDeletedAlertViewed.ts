import { apiConfig } from './client';

export type MarkDeletedAlertViewedPayload = {
  id_user_web: string;
  request_id: number;
};

export type MarkDeletedAlertViewedResponse = {
  status: 'ok';
  request_offer_stats: {
    request_id: number;
    count_deleted_alert: number;
    updated_at: string;
  };
};

export const markDeletedAlertViewed = async (
  payload: MarkDeletedAlertViewedPayload
): Promise<MarkDeletedAlertViewedResponse> => {
  const response = await fetch(`${apiConfig.baseUrl}/api/web/requests/deleted-alerts/viewed`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? 'Не удалось отметить уведомление об отмене сделки';
    throw new Error(message);
  }

  return response.json();
};