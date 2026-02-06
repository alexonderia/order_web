import { Chip, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { RequestWithOfferStats } from '@shared/api/getRequests';
import { DataTable } from '@shared/components/DataTable';

const columns = [
    { key: 'id', label: 'id', minWidth: 60, fraction: 0.45 },
    { key: 'description', label: 'Описание', minWidth: 200, fraction: 2.5 },

    { key: 'status', label: 'Статус', minWidth: 100, fraction: 1.1 },
    { key: 'deadline', label: 'Прием КП до', minWidth: 120, fraction: 1.1 },
    { key: 'created', label: 'Открыта', minWidth: 120, fraction: 1.1 },
    { key: 'closed', label: 'Закрыта', minWidth: 120, fraction: 1.1 },

    { key: 'offer', label: 'Номер КП', minWidth: 100, fraction: 0.9 },
    { key: 'creator', label: 'Создатель', minWidth: 120, fraction: 1.0 },

    { key: 'updated', label: 'Последнее обновление', minWidth: 150, fraction: 1.3 },
    { key: 'notification', label: 'Уведомление', minWidth: 200, fraction: 1.6 },
];



type RequestsTableProps = {
    requests: RequestWithOfferStats[];
    isLoading?: boolean;
    onRowClick?: (request: RequestWithOfferStats) => void;
    chatAlertsMap?: Record<number, number>;
};

const formatDate = (value: string | null, withTime = false) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const options: Intl.DateTimeFormatOptions = withTime
        ? {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
        : {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };

    return new Intl.DateTimeFormat('ru-RU', options).format(date);
};

const NotificationContent = ({
    countSubmitted,
    countDeleted,
    countChatAlerts,
    submittedColor,
    deletedColor
}: {
    countSubmitted: number;
    countDeleted: number;
    countChatAlerts: number;
    submittedColor: string;
    deletedColor: string;
}) => {
    if (countSubmitted <= 0 && countDeleted <= 0 && countChatAlerts <= 0) {
        return null;
    }

    if (countSubmitted > 0 && countDeleted > 0 && countChatAlerts > 0) {
        return (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                    label={countSubmitted}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: submittedColor, color: submittedColor, fontWeight: 600 }}
                />
                <Chip
                    label={countDeleted}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: deletedColor, color: deletedColor, fontWeight: 600 }}
                />
                <Chip
                    label="Новый ответ"
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#d32f2f', color: '#d32f2f', fontWeight: 600 }}
                />
            </Stack>
        );
    }

    if (countSubmitted > 0 && countDeleted > 0) {
        return (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                    label={countSubmitted}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: submittedColor, color: submittedColor, fontWeight: 600 }}
                />
                <Chip
                    label={countDeleted}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: deletedColor, color: deletedColor, fontWeight: 600 }}
                />
            </Stack>
        );
    }

    if (countSubmitted > 0 && countChatAlerts > 0) {
        const label = countSubmitted === 1 ? 'Новое предложение' : `${countSubmitted} новых предложения`;
        return (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                    label={label}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: submittedColor, color: submittedColor, fontWeight: 600 }}
                />
                <Chip
                    label="Новый ответ"
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#d32f2f', color: '#d32f2f', fontWeight: 600 }}
                />
            </Stack>
        );
    }

    if (countDeleted > 0 && countChatAlerts > 0) {
        const label = countDeleted === 1 ? 'Отмена сделки' : `${countDeleted} отмены сделки`;
        return (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                    label={label}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: deletedColor, color: deletedColor, fontWeight: 600 }}
                />
                <Chip
                    label="Новый ответ"
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#d32f2f', color: '#d32f2f', fontWeight: 600 }}
                />
            </Stack>
        );
    }

    if (countSubmitted > 0) {
        const label = countSubmitted === 1 ? 'Новое предложение' : `${countSubmitted} новых предложения`;
        return (
            <Chip
                label={label}
                size="small"
                variant="outlined"
                sx={{ borderColor: submittedColor, color: submittedColor, fontWeight: 600 }}
            />
        );
    }

    if (countChatAlerts > 0) {
        return (
            <Chip
                label="Новый ответ"
                size="small"
                variant="outlined"
                sx={{ borderColor: '#d32f2f', color: '#d32f2f', fontWeight: 600 }}
            />
        );
    }

    const label = countDeleted === 1 ? 'Отмена сделки' : `${countDeleted} отмены сделки`;
    return (
        <Chip
            label={label}
            size="small"
            variant="outlined"
            sx={{ borderColor: deletedColor, color: deletedColor, fontWeight: 600 }}
        />
    );
};

export const RequestsTable = ({ requests, isLoading, onRowClick, chatAlertsMap }: RequestsTableProps) => {
    const theme = useTheme();
    const submittedColor = theme.palette.success.main;
    const deletedColor = theme.palette.error.main;

    return (
        <DataTable
            columns={columns}
            rows={requests}
            rowKey={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="Заявки не найдены."
            onRowClick={onRowClick}
            rowHoverOutlineColor={alpha(theme.palette.primary.main, 0.45)}
            storageKey="requests-table"
            renderRow={(row) => [
                <Typography variant="body2">{row.id}</Typography>,
                <Typography variant="body2">{row.description ?? '-'}</Typography>,
                <Typography variant="body2">{row.status_label ?? row.status ?? '-'}</Typography>,
                <Typography variant="body2">{formatDate(row.deadline_at)}</Typography>,
                <Typography variant="body2">{formatDate(row.created_at)}</Typography>,
                <Typography variant="body2">{formatDate(row.closed_at)}</Typography>,
                <Typography variant="body2">{row.id_offer ?? '-'}</Typography>,
                <Typography variant="body2">{row.id_user_web}</Typography>,
                <Typography variant="body2">{formatDate(row.updated_at, true)}</Typography>,
                <NotificationContent
                    countSubmitted={row.count_submitted ?? 0}
                    countDeleted={row.count_deleted_alert ?? 0}
                    countChatAlerts={chatAlertsMap?.[row.id] ?? row.count_chat_alert ?? 0}
                    submittedColor={submittedColor}
                    deletedColor={deletedColor}
                />
            ]}
        />
    );
};