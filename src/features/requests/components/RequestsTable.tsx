import { Chip, Stack, Typography } from '@mui/material';
import type { RequestWithOfferStats } from '@shared/api/getRequests';
import { DataTable } from '@shared/components/DataTable';

const columns = [
    { key: 'id', label: 'id', minWidth: 80, fraction: 0.6 },
    { key: 'description', label: 'Описание', minWidth: 240, fraction: 2 },
    { key: 'status', label: 'Статус', minWidth: 140, fraction: 1.2 },
    { key: 'deadline', label: 'Прием КП до', minWidth: 150, fraction: 1.2 },
    { key: 'created', label: 'Открыта', minWidth: 130, fraction: 1.1 },
    { key: 'closed', label: 'Закрыта', minWidth: 130, fraction: 1.1 },
    { key: 'offer', label: 'Номер КП', minWidth: 120, fraction: 1.1 },
    { key: 'creator', label: 'Создатель', minWidth: 140, fraction: 1.2 },
    { key: 'updated', label: 'Последнее обновление', minWidth: 170, fraction: 1.3 },
    { key: 'notification', label: 'Уведомление', minWidth: 200, fraction: 1.1 }
];


type RequestsTableProps = {
    requests: RequestWithOfferStats[];
    isLoading?: boolean;
    onRowClick?: (request: RequestWithOfferStats) => void;
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

const NotificationContent = ({ countSubmitted, countDeleted }: { countSubmitted: number; countDeleted: number }) => {
    if (countSubmitted <= 0 && countDeleted <= 0) {
        return null;
    }

    if (countSubmitted > 0 && countDeleted > 0) {
        return (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                 <Chip
                    label={countSubmitted}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#2e7d32', color: '#2e7d32', fontWeight: 600 }}
                />
                <Chip
                    label={countDeleted}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#c62828', color: '#c62828', fontWeight: 600 }}
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
                sx={{ borderColor: '#2e7d32', color: '#2e7d32', fontWeight: 600 }}
            />
        );
    }

    const label = countDeleted === 1 ? 'Отмена сделки' : `${countDeleted} отмены сделки`;
    return (
        <Chip
            label={label}
            size="small"
            variant="outlined"
            sx={{ borderColor: '#c62828', color: '#c62828', fontWeight: 600 }}
        />
    );
};

export const RequestsTable = ({ requests, isLoading, onRowClick }: RequestsTableProps) => {
    return (
        <DataTable
            columns={columns}
            rows={requests}
            rowKey={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="Заявки не найдены."
            onRowClick={onRowClick}
            storageKey="requests-table"
            renderRow={(row) => [
                <Typography variant="body2">{row.id}</Typography>,
                <Typography variant="body2">{row.description ?? '-'}</Typography>,
                <Typography variant="body2">{row.status ?? '-'}</Typography>,
                <Typography variant="body2">{formatDate(row.deadline_at)}</Typography>,
                <Typography variant="body2">{formatDate(row.created_at)}</Typography>,
                <Typography variant="body2">{formatDate(row.closed_at)}</Typography>,
                <Typography variant="body2">{row.id_offer ?? '-'}</Typography>,
                <Typography variant="body2">{row.id_user_web}</Typography>,
                <Typography variant="body2">{formatDate(row.updated_at, true)}</Typography>,
                <NotificationContent
                    countSubmitted={row.count_submitted ?? 0}
                    countDeleted={row.count_deleted_alert ?? 0}
                />
            ]}
        />
    );
};