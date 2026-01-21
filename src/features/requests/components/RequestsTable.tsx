import { Chip, Stack, Typography } from '@mui/material';
import type { RequestWithOfferStats } from '@shared/api/getRequests';
import { DataTable } from '@shared/components/DataTable';

const columns = [
    { key: 'id', label: 'id' },
    { key: 'description', label: 'Описание' },
    { key: 'status', label: 'Статус' },
    { key: 'deadline', label: 'Прием КП до' },
    { key: 'created', label: 'Открыта' },
    { key: 'closed', label: 'Закрыта' },
    { key: 'offer', label: 'Номер КП' },
    { key: 'creator', label: 'Создатель' },
    { key: 'updated', label: 'Последнее обновление' },
    { key: 'notification', label: 'Уведомление' }
];


const gridTemplate = '0.6fr 2fr 1.2fr 1.2fr 1.1fr 1.1fr 1.1fr 1.2fr 1.3fr 1.1fr';


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
                <Chip label={countSubmitted} size="small" sx={{ backgroundColor: '#2e7d32', color: '#fff' }} />
                <Chip label={countDeleted} size="small" sx={{ backgroundColor: '#c62828', color: '#fff' }} />
            </Stack>
        );
    }

    if (countSubmitted > 0) {
        const label = countSubmitted === 1 ? 'Новое предложение' : `${countSubmitted} новых предложения`;
        return <Chip label={label} size="small" sx={{ backgroundColor: '#2e7d32', color: '#fff' }} />;
    }

    const label = countDeleted === 1 ? 'Отмена сделки' : `${countDeleted} отмены сделки`;
    return <Chip label={label} size="small" sx={{ backgroundColor: '#c62828', color: '#fff' }} />;
};

export const RequestsTable = ({ requests, isLoading, onRowClick }: RequestsTableProps) => {
    return (
        <DataTable
            columns={columns}
            rows={requests}
            gridTemplateColumns={gridTemplate}
            rowKey={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="Заявки не найдены."
            onRowClick={onRowClick}
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