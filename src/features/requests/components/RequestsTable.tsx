import { Box, Chip, Stack, Typography } from '@mui/material';
import type { RequestWithOfferStats } from '@shared/api/getRequests';

const columns = [
    'id',
    'Описание',
    'Статус',
    'Прием КП до',
    'Открыта',
    'Закрыта',
    'Номер КП',
    'Создатель',
    'Последнее обновление',
    'Уведомление'
];


const gridTemplate = '0.6fr 2fr 1.2fr 1.2fr 1.1fr 1.1fr 1.1fr 1.2fr 1.3fr 1.1fr';

const cellSx = {
    paddingY: 1.4,
    paddingX: 1.5,
    borderRight: '1px solid rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center'
};

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
        <Box
            sx={{
                backgroundColor: '#d9d9d9',
                borderRadius: 2,
                padding: 2,
                border: '1px solid rgba(0,0,0,0.3)',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplate,
                    alignItems: 'stretch',
                }}
            >
                {columns.map((column) => (
                    <Box key={column} sx={{ ...cellSx, fontWeight: 600 }}>
                        <Typography variant="body2">{column}</Typography>
                    </Box>
                ))}
                {isLoading && (
                    <Box sx={{ gridColumn: `1 / span ${columns.length}`, padding: 2 }}>
                        <Typography variant="body2">Загрузка...</Typography>
                    </Box>
                )}
                {!isLoading &&
                    requests.map((row) => (
                        <Box
                            key={row.id}
                            sx={{
                                display: 'contents'
                            }}
                        >
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{row.id}</Typography>
                            </Box>
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{row.description ?? '-'}</Typography>
                            </Box>
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{row.status ?? '-'}</Typography>
                            </Box>
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{formatDate(row.deadline_at)}</Typography>
                            </Box>
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{formatDate(row.created_at)}</Typography>
                            </Box>
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{formatDate(row.closed_at)}</Typography>
                            </Box>
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{row.id_offer ?? '-'}</Typography>
                            </Box>
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{row.id_user_web}</Typography>
                            </Box>
                            <Box
                                sx={{ ...cellSx, cursor: onRowClick ? 'pointer' : 'default' }}
                                onClick={() => onRowClick?.(row)}
                            >
                                <Typography variant="body2">{formatDate(row.updated_at, true)}</Typography>
                            </Box>
                            <Box sx={{ ...cellSx, borderRight: 'none' }}>
                                <NotificationContent
                                    countSubmitted={row.count_submitted ?? 0}
                                    countDeleted={row.count_deleted_alert ?? 0}
                                />
                            </Box>
                        </Box>
                    ))
                }
            </Box>
        </Box>
    );
};