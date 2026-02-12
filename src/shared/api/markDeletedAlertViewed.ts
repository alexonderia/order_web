import { fetchJson } from './client';

export type MarkDeletedAlertViewedPayload = {
  id_user: string;
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
  return fetchJson<MarkDeletedAlertViewedResponse>(
    '/api/web/requests/deleted-alerts/viewed',
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    'Не удалось отметить уведомление об отмене сделки'
  );
};