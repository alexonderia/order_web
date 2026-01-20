import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import { updateRequest } from '@shared/api/updateRequest';
import { apiConfig } from '@shared/api/client';
import { getOffers } from '@shared/api/getOffers';
import { updateOfferStatus } from '@shared/api/updateOfferStatus';
import type { RequestWithOfferStats } from '@shared/api/getRequests';
import type { OfferDetails } from '@shared/api/getOffers';

type RequestDetailsPageProps = {
    request: RequestWithOfferStats;
    userLogin: string;
    onBack?: () => void;
};

type RequestStatus = 'open' | 'review' | 'closed' | 'cancelled';

type OfferDecisionStatus = 'accepted' | 'rejected' | '';

type OfferStatusOption = {
    value: OfferDecisionStatus;
    label: string;
};

const statusOptions = [
    { value: 'open', label: 'Открыта', color: '#2e7d32' },
    { value: 'review', label: 'На рассмотрении', color: '#ed6c02' },
    { value: 'closed', label: 'Закрыта', color: '#787878ff' },
    { value: 'cancelled', label: 'Отменена', color: '#d32f2f' }
] as const;

const offerStatusOptions: OfferStatusOption[] = [
    { value: 'accepted', label: 'Принято' },
    { value: 'rejected', label: 'Отказано' }
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

const toDateInputValue = (value: string | null) => {
    if (!value) return '';
    // берём только дату до 'T'
    const [datePart] = value.split('T');
    return datePart ?? '';
};

const getFileUrl = (filePath: string | null) => {
    if (!filePath) {
        return null;
    }

    const baseUrl = apiConfig.baseUrl.trim();
    if (!baseUrl) {
        return `/${filePath}`;
    }

    return `${baseUrl.replace(/\/$/, '')}/${filePath.replace(/^\//, '')}`;
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

const normalizeOfferStatus = (value: string | null): OfferDecisionStatus => {
    if (value === 'accepted' || value === 'rejected') {
        return value;
    }

    return '';
};

const getNotificationStyle = (status: string | null) => {
    if (status === 'accepted') {
        return { backgroundColor: '#2e7d32', label: '✓' };
    }

    if (status === 'submitted') {
        return { backgroundColor: '#ed6c02', label: '+' };
    }

    if (status === 'deleted') {
        return { backgroundColor: '#c62828', label: '!' };
    }

    if (status === 'rejected') {
        return { backgroundColor: '#787878ff', label: '-' };
    }

    return { backgroundColor: '#ffffffff', label: ' '};
};

export const RequestDetailsPage = ({ request, userLogin, onBack }: RequestDetailsPageProps) => {
    const initialStatus = (statusOptions.find((o) => o.value === request.status)?.value ?? 'open') as RequestStatus;

    const [status, setStatus] = useState<RequestStatus>(initialStatus);
    const [baselineStatus, setBaselineStatus] = useState<RequestStatus>(initialStatus);
    const isRequestStatus = (value: unknown): value is RequestStatus =>
        value === 'open' || value === 'review' || value === 'closed' || value === 'cancelled';

    const [deadline, setDeadline] = useState<string>(toDateInputValue(request.deadline_at));
    const [baselineDeadline, setBaselineDeadline] = useState<string>(toDateInputValue(request.deadline_at));
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [offers, setOffers] = useState<OfferDetails[]>([]);
    const [offersStatusMap, setOffersStatusMap] = useState<Record<number, OfferDecisionStatus>>({});
    const [offersLoading, setOffersLoading] = useState(false);
    const [offersError, setOffersError] = useState<string | null>(null);

    const statusConfig = useMemo(
        () => statusOptions.find((option) => option.value === status) ?? statusOptions[0],
        [status]
    );

    useEffect(() => {
        const fetchOffers = async () => {
            setOffersLoading(true);
            setOffersError(null);
            try {
                const data = await getOffers({ requestId: request.id, userLogin });
                setOffers(data.offers ?? []);
                const nextStatusMap = data.offers.reduce<Record<number, OfferDecisionStatus>>((acc, offer) => {
                    acc[offer.offer_id] = normalizeOfferStatus(offer.status);
                    return acc;
                }, {});
                setOffersStatusMap(nextStatusMap);
            } catch (error) {
                setOffersError(error instanceof Error ? error.message : 'Не удалось загрузить офферы');
            } finally {
                setOffersLoading(false);
            }
        };

        fetchOffers();
    }, [request.id, userLogin]);

    const handleSave = async () => {
        const statusChanged = status !== baselineStatus;
        const deadlineChanged = deadline !== baselineDeadline;

        if (!statusChanged && !deadlineChanged) {
            setErrorMessage('Нет изменений для сохранения');
            setSuccessMessage(null);
            return;
        }

        if (deadlineChanged && !deadline) {
            setErrorMessage('Укажите дату дедлайна');
            setSuccessMessage(null);
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const payload = {
                id_user_web: userLogin,
                request_id: request.id,
                status: statusChanged ? status : null,
                deadline_at: deadlineChanged ? `${deadline}T00:00:00` : null
            };

            const response = await updateRequest(payload);
            const nextStatus = response.request?.status;
            if (isRequestStatus(nextStatus)) {
                setBaselineStatus(nextStatus);
                setStatus(nextStatus);
            }
            if (response.request?.deadline_at) {
                const nextDeadline = toDateInputValue(response.request.deadline_at);
                setBaselineDeadline(nextDeadline);
                setDeadline(nextDeadline);
            }
            setSuccessMessage('Изменения сохранены');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Не удалось сохранить изменения');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOfferStatusChange = async (offerId: number, value: OfferDecisionStatus) => {
        const previousStatus = offersStatusMap[offerId] ?? '';

        setOffersStatusMap((prev) => ({
            ...prev,
            [offerId]: value
        }));

        if (!value) {
            return;
        }

        try {
            const response = await updateOfferStatus({
                id_user_web: userLogin,
                offer_id: offerId,
                status: value
            });
            setOffers((prev) =>
                prev.map((offer) =>
                    offer.offer_id === offerId
                        ? { ...offer, status: response.offer.status }
                        : offer
                )
            );
            setOffersStatusMap((prev) => ({
                ...prev,
                [offerId]: normalizeOfferStatus(response.offer.status)
            }));
        } catch (error) {
            setOffersStatusMap((prev) => ({
                ...prev,
                [offerId]: previousStatus
            }));
            setOffersError(error instanceof Error ? error.message : 'Не удалось обновить статус оффера');
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', padding: { xs: 2, md: 4 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Button
                    variant="outlined"
                    sx={{
                        borderRadius: 999,
                        textTransform: 'none',
                        paddingX: 4,
                        borderColor: '#1f1f1f',
                        color: '#1f1f1f'
                    }}
                    onClick={onBack}
                >
                    К списку заявок
                </Button>
                <Button
                    variant="outlined"
                    sx={{
                        borderRadius: 999,
                        textTransform: 'none',
                        paddingX: 4,
                        borderColor: '#1f1f1f',
                        color: '#1f1f1f',
                        backgroundColor: '#d9d9d9'
                    }}
                >
                    Выйти
                </Button>
            </Stack>

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                mb={3}
            >
                <Typography variant="h6" fontWeight={600}>

                    Номер заявки: {request.id}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                        sx={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            backgroundColor: statusConfig.color
                        }}
                    />
                    <Select
                        size="small"
                        value={status}
                        onChange={(event) => setStatus(event.target.value as RequestStatus)}
                        sx={{
                            minWidth: 200,
                            borderRadius: 999,
                            backgroundColor: '#fff'
                        }}
                    >
                        {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>
                <Button
                    variant="outlined"
                    sx={{
                        borderRadius: 999,
                        textTransform: 'none',
                        paddingX: 4,
                        borderColor: '#1f1f1f',
                        color: '#1f1f1f',
                        backgroundColor: '#d9d9d9'
                    }}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
            </Stack>
            {errorMessage && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {errorMessage}
                </Typography>
            )}
            {successMessage && (
                <Typography color="success.main" sx={{ mb: 2 }}>
                    {successMessage}
                </Typography>
            )}

            <Box
                sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.3)',
                    padding: { xs: 2, md: 3 },
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }
                }}
            >
                <TextField
                    value={request.description ?? ''}
                    placeholder="Описание заявки"
                    multiline
                    minRows={6}
                    InputProps={{
                        readOnly: true
                    }}
                    sx={{
                        borderRadius: 3
                    }}
                />
                <Box
                    sx={{
                        border: '1px solid rgba(0,0,0,0.3)',
                        borderRadius: 1,
                        overflow: 'hidden'
                    }}
                >
                    {[
                        { label: 'Создатель заявки', value: request.id_user_web },
                        { label: 'Создана', value: formatDate(request.created_at) },
                        { label: 'Закрыта', value: formatDate(request.closed_at) },
                        { label: 'Номер КП', value: request.id_offer ?? '-' },
                        {
                            label: 'Дедлайн сбора КП',
                            value: (
                                <TextField
                                    type="date"
                                    size="small"
                                    value={deadline}
                                    onChange={(event) => setDeadline(event.target.value)}
                                    sx={{ minWidth: 150 }}
                                />
                            )
                        },
                        { label: 'Последнее изменение', value: formatDate(request.updated_at) }
                    ].map((row, index) => (
                        <Box
                            key={row.label}
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                borderBottom:
                                    index === 5 ? 'none' : '1px solid rgba(0,0,0,0.3)'
                            }}
                        >
                            <Box sx={{ padding: 1.2 }}>
                                <Typography variant="body2">{row.label}</Typography>
                            </Box>
                            <Box
                                sx={{
                                    padding: 1.2,
                                    borderLeft: '1px solid rgba(0,0,0,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start'
                                }}
                            >
                                {typeof row.value === 'string' || typeof row.value === 'number' ? (
                                    <Typography variant="body2">{row.value}</Typography>
                                ) : (
                                    row.value
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box
                sx={{
                    marginTop: 4,
                    backgroundColor: '#d9d9d9',
                    borderRadius: 2,
                    padding: 2,
                    border: '1px solid rgba(0,0,0,0.3)'
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '0.4fr 0.8fr 1.4fr 1.6fr 1.1fr 1.1fr 1fr 1fr',
                        borderBottom: '1px solid rgba(0,0,0,0.3)'
                    }}
                >
                    {[
                        '',
                        'Номер КП',
                        'Контрагент',
                        'Контакты',
                        'Дата создания',
                        'Дата изменения',
                        'КП',
                        'Статус'
                    ].map((column) => (
                        <Box key={column} sx={{ padding: 1, fontWeight: 600 }}>
                            <Typography variant="body2">{column}</Typography>
                        </Box>
                    ))}
                </Box>
                {offersLoading && (
                    <Box sx={{ padding: 2 }}>
                        <Typography variant="body2">Загрузка офферов...</Typography>
                    </Box>
                )}
                {offersError && !offersLoading && (
                    <Box sx={{ padding: 2 }}>
                        <Typography color="error">{offersError}</Typography>
                    </Box>
                )}
                {!offersLoading && !offersError && offers.length === 0 && (
                    <Box sx={{ padding: 2 }}>
                        <Typography variant="body2">Офферы пока не получены.</Typography>
                    </Box>
                )}
                {!offersLoading && !offersError &&
                    offers.map((offer, index) => {
                        const currentStatus = offersStatusMap[offer.offer_id] ?? '';
                        const notificationStyle = getNotificationStyle(offer.status);
                        const fileUrl = getFileUrl(offer.file_path);
                        const contactInfo = getContactInfo(offer);
                        const counterparty = offer.real_name ?? offer.tg_username ?? '-';
                        return (
                            <Box
                                key={offer.offer_id}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '0.4fr 0.8fr 1.4fr 1.6fr 1.1fr 1.1fr 1fr 1fr',
                                    borderBottom:
                                        index === offers.length - 1
                                            ? 'none'
                                            : '1px solid rgba(0,0,0,0.3)'
                                }}
                            >
                                <Box sx={{ padding: 1, display: 'flex', justifyContent: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 2,
                                            backgroundColor: notificationStyle.backgroundColor,
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700
                                        }}
                                    >
                                        {notificationStyle.label}
                                    </Box>
                                </Box>
                                <Box sx={{ padding: 1 }}>
                                    <Typography variant="body2">{offer.offer_id}</Typography>
                                </Box>
                                <Box sx={{ padding: 1 }}>
                                    <Typography variant="body2">{counterparty}</Typography>
                                </Box>
                                <Box sx={{ padding: 1 }}>
                                    <Stack spacing={0.5}>
                                        {contactInfo.map((item) => (
                                            <Typography key={item} variant="body2">
                                                {item}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Box>
                                <Box sx={{ padding: 1 }}>
                                    <Typography variant="body2">{formatDate(offer.created_at)}</Typography>
                                </Box>
                                <Box sx={{ padding: 1 }}>
                                    <Typography variant="body2">{formatDate(offer.updated_at)}</Typography>
                                </Box>
                                <Box sx={{ padding: 1 }}>
                                    {fileUrl ? (
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
                                    )}
                                </Box>
                                <Box sx={{ padding: 1 }}>
                                    <Select
                                        size="small"
                                        value={currentStatus}
                                        displayEmpty
                                        onChange={(event) =>
                                            handleOfferStatusChange(
                                                offer.offer_id,
                                                event.target.value as OfferDecisionStatus
                                            )
                                        }
                                        sx={{ minWidth: 140 }}
                                    >
                                        <MenuItem value="">
                                            <Typography variant="body2" color="text.secondary">
                                                Выберите
                                            </Typography>
                                        </MenuItem>
                                        {offerStatusOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            </Box>
                        );
                    })
                }
            </Box>
        </Box>
    );
};