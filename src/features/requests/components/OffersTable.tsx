import type { ReactNode } from 'react';
import { Box, MenuItem, Select, Stack, SvgIcon, Typography } from '@mui/material';
import type { OfferDetails } from '@shared/api/getOffers';
import { getDownloadUrl } from '@shared/api/fileDownload';
import { DataTable } from '@shared/components/DataTable';

export type OfferDecisionStatus = 'accepted' | 'rejected' | '';

export type OfferStatusOption = {
    value: OfferDecisionStatus;
    label: string;
};

type OffersTableProps = {
    offers: OfferDetails[];
    statusMap: Record<number, OfferDecisionStatus>;
    isLoading?: boolean;
    errorMessage?: string | null;
    statusOptions: OfferStatusOption[];
    onStatusChange: (offerId: number, value: OfferDecisionStatus) => void;
};

type NotificationStyle = {
    backgroundColor: string;
    icon: ReactNode;
};

const columns = [
    { key: 'status', label: '' },
    { key: 'offerId', label: 'Номер КП' },
    { key: 'counterparty', label: 'Контрагент' },
    { key: 'contacts', label: 'Контакты' },
    { key: 'createdAt', label: 'Дата создания' },
    { key: 'updatedAt', label: 'Дата изменения' },
    { key: 'file', label: 'КП' },
    { key: 'statusSelect', label: 'Статус' }
];

const gridTemplate = '0.4fr 0.8fr 1.4fr 1.6fr 1.1fr 1.1fr 1fr 1fr';

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

const getContactInfo = (offer: OfferDetails) => {
    const parts = [
        offer.tg_username ? `Telegram: ${offer.tg_username}` : null,
        offer.phone ? `Телефон: ${offer.phone}` : null,
        offer.mail ? `Email: ${offer.mail}` : null,
        offer.address ? `Адрес: ${offer.address}` : null,
        offer.note ? `Комментарий: ${offer.note}` : null
    ].filter(Boolean) as string[];

    return parts.length > 0 ? parts : ['-'];
};

const getNotificationStyle = (status: string | null): NotificationStyle => {
    if (status === 'accepted') {
        return {
            backgroundColor: '#2e7d32',
            icon: (
                <SvgIcon fontSize="small" sx={{ color: '#fff' }}>
                    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </SvgIcon>
            )
        };
    }

    if (status === 'submitted') {
        return {
            backgroundColor: '#2e7d32',
            icon: (
                <SvgIcon fontSize="small" sx={{ color: '#fff' }}>
                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </SvgIcon>
            )
        };
    }

    if (status === 'deleted') {
        return {
            backgroundColor: '#c62828',
            icon: (
                <SvgIcon fontSize="small" sx={{ color: '#fff' }}>
                    <path d="M11 15h2v2h-2zm0-10h2v8h-2z" />
                </SvgIcon>
            )
        };
    }

    if (status === 'rejected') {
        return {
            backgroundColor: '#787878ff',
            icon: (
                <SvgIcon fontSize="small" sx={{ color: '#fff' }}>
                    <path d="M19 13H5V11H19V13Z" />
                </SvgIcon>
            )
        };
    }

    return { backgroundColor: '#ffffffff', icon: null };
};

export const OffersTable = ({
    offers,
    statusMap,
    isLoading,
    errorMessage,
    statusOptions,
    onStatusChange
}: OffersTableProps) => {
    const statusContent = errorMessage ? <Typography color="error">{errorMessage}</Typography> : undefined;

    return (
        <DataTable
            columns={columns}
            rows={offers}
            gridTemplateColumns={gridTemplate}
            rowKey={(offer) => offer.offer_id}
            isLoading={isLoading}
            emptyMessage="Офферы пока не получены."
            statusContent={statusContent}
            renderRow={(offer) => {
                const notificationStyle = getNotificationStyle(offer.status);
                const fileUrl = getDownloadUrl(offer.id_file, offer.file_path);
                const contactInfo = getContactInfo(offer);
                const counterparty = offer.real_name ?? offer.tg_username ?? '-';
                const currentStatus = statusMap[offer.offer_id] ?? '';

                return [
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Box
                            sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 2,
                                backgroundColor: notificationStyle.backgroundColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
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
                    fileUrl ? (
                        <Typography
                            component="a"
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            variant="body2"
                            sx={{ color: '#1f1f1f', textDecoration: 'underline' }}
                        >
                            Скачать
                        </Typography>
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
                    </Select>
                ];
            }}
        />
    );
};