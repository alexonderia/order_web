import type { ReactNode } from 'react';
import { Box, Button, Chip, MenuItem, Select, Stack, SvgIcon, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { RequestDetailsOffer } from '@shared/api/getRequestDetails';
import { DataTable } from '@shared/components/DataTable';

export type OfferDecisionStatus = 'accepted' | 'rejected' | '';

export type OfferStatusOption = {
    value: OfferDecisionStatus;
    label: string;
};

type OffersTableProps = {
    offers: RequestDetailsOffer[];
    statusMap: Record<number, OfferDecisionStatus>;
    isLoading?: boolean;
    errorMessage?: string | null;
    statusOptions: OfferStatusOption[];
    onStatusChange: (offerId: number, value: OfferDecisionStatus) => void;
    onOpenChat: (offerId: number) => void;
    onDownloadFile: (downloadUrl: string, fileName: string) => void;
};

type NotificationStyle = {
    borderColor: string;
    icon: ReactNode;
};

const columns = [
    { key: 'status', label: '', minWidth: 60, fraction: 0.3 },
    { key: 'offerId', label: 'Номер КП', minWidth: 100, fraction: 0.8 },
    { key: 'counterparty', label: 'Контрагент', minWidth: 160, fraction: 1.4 },
    { key: 'contacts', label: 'Контакты', minWidth: 200, fraction: 1.6 },
    { key: 'createdAt', label: 'Дата создания', minWidth: 120, fraction: 1.1 },
    { key: 'updatedAt', label: 'Дата изменения', minWidth: 120, fraction: 1.1 },
    { key: 'file', label: 'КП', minWidth: 150, fraction: 1.1 },
    { key: 'statusSelect', label: 'Статус', minWidth: 140, fraction: 1 },
    { key: 'chat', label: 'Чат', minWidth: 150, fraction: 1 }
];


const formatDate = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
};

const getFileLabelWithHint = (value: string, max = 18) => {
    if (value.length <= max) {
        return value;
    }

    return `${value.slice(0, max - 1)}…`;
};

const getContactInfo = (offer: RequestDetailsOffer) => {
    const parts = [
        offer.tg_username ? `Telegram: ${offer.tg_username}` : null,
        offer.phone ? `Телефон: ${offer.phone}` : null,
        offer.mail ? `Email: ${offer.mail}` : null,
        offer.address ? `Адрес: ${offer.address}` : null,
        offer.note ? `Комментарий: ${offer.note}` : null
    ].filter(Boolean) as string[];

    return parts.length > 0 ? parts : ['-'];
};

const getNotificationStyle = (status: string | null, palette: { divider: string; text: string }): NotificationStyle => {
    if (status === 'accepted') {
        return {
            borderColor: '#2e7d32',
            icon: (
                <SvgIcon fontSize="small" sx={{ color: '#2e7d32' }}>
                    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </SvgIcon>
            )
        };
    }

    if (status === 'submitted') {
        return {
            borderColor: '#2e7d32',
            icon: (
                <SvgIcon fontSize="small" sx={{ color: '#2e7d32' }}>
                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </SvgIcon>
            )
        };
    }

    if (status === 'deleted') {
        return {
            borderColor: '#c62828',
            icon: (
                <SvgIcon fontSize="small" sx={{ color: '#c62828' }}>
                    <path d="M11 15h2v2h-2zm0-10h2v8h-2z" />
                </SvgIcon>
            )
        };
    }

    if (status === 'rejected') {
        return {
            borderColor: '#787878',
            icon: (
                <SvgIcon fontSize="small" sx={{ color: '#787878' }}>
                    <path d="M19 13H5V11H19V13Z" />
                </SvgIcon>
            )
        };
    }

    return {
        borderColor: palette.divider,
        icon: (
            <SvgIcon fontSize="small" sx={{ color: palette.text }}>
                <path d="M19 13H5V11H19V13Z" />
            </SvgIcon>
        )
    };
};

const hasNewChatAnswer = (offer: RequestDetailsOffer) =>
    Boolean(offer.offer_chat_stats?.status_web && !offer.offer_chat_stats?.status_tg);

export const OffersTable = ({
    offers,
    statusMap,
    isLoading,
    errorMessage,
    statusOptions,
    onStatusChange,
    onOpenChat,
    onDownloadFile
}: OffersTableProps) => {
    const theme = useTheme();
    const statusContent = errorMessage ? <Typography color="error">{errorMessage}</Typography> : undefined;
    const notificationPalette = {
        divider: theme.palette.divider,
        text: theme.palette.text.primary
    };

    return (
        <DataTable
            columns={columns}
            rows={offers}
            rowKey={(offer) => offer.offer_id}
            isLoading={isLoading}
            emptyMessage="Офферы пока не получены."
            statusContent={statusContent}
            storageKey="offers-table"
            renderRow={(offer) => {
                const notificationStyle = getNotificationStyle(offer.status, notificationPalette);
                const contactInfo = getContactInfo(offer);
                const counterparty = offer.real_name ?? offer.tg_username ?? '-';
                const currentStatus = statusMap[offer.offer_id] ?? '';

                return [
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                border: `1px solid ${notificationStyle.borderColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'transparent',
                                fontWeight: 700
                            }}
                        >
                            {notificationStyle.icon}
                        </Box>
                    </Box>,
                    <Typography variant="body2">{offer.offer_id}</Typography>,
                    <Typography variant="body2">{counterparty}</Typography>,
                    <Stack spacing={0.5}>
                        {contactInfo.map((item) => (
                            <Typography key={item} variant="body2">
                                {item}
                            </Typography>
                        ))}
                    </Stack>,
                    <Typography variant="body2">{formatDate(offer.created_at)}</Typography>,
                    <Typography variant="body2">{formatDate(offer.updated_at)}</Typography>,
                    offer.files.length > 0 ? (
                        <Stack direction="row" flexWrap="wrap" gap={0.7}>
                            {offer.files.map((file) => (
                                <Tooltip key={file.id} title={file.name} arrow>
                                    <Chip
                                        label={getFileLabelWithHint(file.name)}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            borderRadius: 999,
                                            backgroundColor: '#fff',
                                            cursor: 'pointer',
                                            maxWidth: 180,
                                            '& .MuiChip-label': {
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }
                                        }}
                                        onClick={() => onDownloadFile(file.download_url, file.name)}
                                    />
                                </Tooltip>
                            ))}
                        </Stack>
                    ) : (
                        <Typography variant="body2">-</Typography>
                    ),
                    <Select
                        size="small"
                        value={currentStatus}
                        displayEmpty
                        onChange={(event) => onStatusChange(offer.offer_id, event.target.value as OfferDecisionStatus)}
                        disabled={offer.status === 'deleted'}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">
                            <Typography variant="body2" color="text.secondary">
                                Выберите
                            </Typography>
                        </MenuItem>
                        {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>,
                    <Stack spacing={1} alignItems="flex-start">
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onOpenChat(offer.offer_id)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Открыть чат
                        </Button>
                        {hasNewChatAnswer(offer) && (
                            <Typography variant="caption" color="error">
                                Новый ответ — откройте чат
                            </Typography>
                        )}
                    </Stack>
                ];
            }}
        />
    );
};