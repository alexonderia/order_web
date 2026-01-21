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
import { getOffers } from '@shared/api/getOffers';
import { updateOfferStatus } from '@shared/api/updateOfferStatus';
import type { RequestWithOfferStats } from '@shared/api/getRequests';
import { getDownloadUrl } from '@shared/api/fileDownload';
import { markDeletedAlertViewed } from '@shared/api/markDeletedAlertViewed';
import { OffersTable } from '@features/requests/components/OffersTable';
import type { OfferDecisionStatus, OfferStatusOption } from '@features/requests/components/OffersTable';
import type { OfferDetails } from '@shared/api/getOffers';
import { DataTable } from '@shared/components/DataTable';

type RequestDetailsPageProps = {
    request: RequestWithOfferStats;
    userLogin: string;
    onLogout?: () => void;
    onBack?: () => void;
};

type RequestStatus = 'open' | 'review' | 'closed' | 'cancelled';


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


const normalizeOfferStatus = (value: string | null): OfferDecisionStatus => {
    if (value === 'accepted' || value === 'rejected') {
        return value;
    }

    return '';
};

const detailsColumns = [
    { key: 'label', label: 'Параметр' },
    { key: 'value', label: 'Значение' }
];

export const RequestDetailsPage = ({ request, userLogin, onBack, onLogout }: RequestDetailsPageProps) => {
    const [requestDetails, setRequestDetails] = useState<RequestWithOfferStats>(request);
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
    const [isClearingDeletedAlert, setIsClearingDeletedAlert] = useState(false);

    const [offers, setOffers] = useState<OfferDetails[]>([]);
    const [offersStatusMap, setOffersStatusMap] = useState<Record<number, OfferDecisionStatus>>({});
    const [offersLoading, setOffersLoading] = useState(false);
    const [offersError, setOffersError] = useState<string | null>(null);

    const statusConfig = useMemo(
        () => statusOptions.find((option) => option.value === status) ?? statusOptions[0],
        [status]
    );
    const requestFileUrl = useMemo(
        () =>
            requestDetails.file?.download_url ??
            getDownloadUrl(requestDetails.file?.id ?? requestDetails.id_file, requestDetails.file_path ?? null),
        [requestDetails.file?.download_url, requestDetails.file?.id, requestDetails.id_file, requestDetails.file_path]
    );
    const hasDeletedAlert = (requestDetails.count_deleted_alert ?? 0) > 0;

    const todayDate = useMemo(() => {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
    }, []);

    useEffect(() => {
        setRequestDetails(request);
    }, [request]);

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

        if (deadlineChanged && deadline && deadline < todayDate) {
            setErrorMessage('Дедлайн не может быть раньше текущей даты');
            setSuccessMessage(null);
            return;
        }

        if (deadlineChanged && status !== 'open' && baselineDeadline && deadline > baselineDeadline) {
            setErrorMessage('Нельзя продлить дедлайн, если заявка не в статусе "Открыта"');
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
            setRequestDetails((prev) => ({
                ...prev,
                status: response.request?.status ?? prev.status,
                deadline_at: response.request?.deadline_at ?? prev.deadline_at,
                updated_at: response.request?.updated_at ?? prev.updated_at
            }));
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

    const handleDeletedAlertViewed = async () => {
        if (!hasDeletedAlert) {
            return;
        }

        setIsClearingDeletedAlert(true);
        setErrorMessage(null);
        try {
            const response = await markDeletedAlertViewed({
                id_user_web: userLogin,
                request_id: requestDetails.id
            });
            setRequestDetails((prev) => ({
                ...prev,
                count_deleted_alert: response.request_offer_stats.count_deleted_alert,
                updated_at: response.request_offer_stats.updated_at ?? prev.updated_at
            }));
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Не удалось отметить уведомление');
        } finally {
            setIsClearingDeletedAlert(false);
        }
    };

    const detailsRows = [
        { id: 'creator', label: 'Создатель заявки', value: requestDetails.id_user_web },
        { id: 'created', label: 'Создана', value: formatDate(requestDetails.created_at) },
        { id: 'closed', label: 'Закрыта', value: formatDate(requestDetails.closed_at) },
        { id: 'offer', label: 'Номер КП', value: requestDetails.id_offer ?? '-' },
        {
            id: 'deadline',
            label: 'Дедлайн сбора КП',
            value: (
                <TextField
                    type="date"
                    size="small"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    inputProps={{ min: todayDate }}
                    sx={{ minWidth: 150 }}
                />
            )
        },
        { id: 'updated', label: 'Последнее изменение', value: formatDate(requestDetails.updated_at) }
    ];

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
                    onClick={onLogout}
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

                    Номер заявки: {requestDetails.id}
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
                <Stack spacing={2}>
                    <TextField
                        value={requestDetails.description ?? ''}
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
                    {requestFileUrl ? (
                        <Button
                            variant="outlined"
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                paddingX: 3,
                                borderColor: '#1f1f1f',
                                color: '#1f1f1f',
                                backgroundColor: '#ffffff',
                                width: 'fit-content'
                            }}
                            component="a"
                            href={requestFileUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Скачать файл заявки
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                paddingX: 3,
                                borderColor: '#1f1f1f',
                                color: '#1f1f1f',
                                backgroundColor: '#ffffff',
                                width: 'fit-content'
                            }}
                            disabled
                        >
                            Скачать файл заявки
                        </Button>

                    )}
                    {hasDeletedAlert && (
                        <Button
                            variant="contained"
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                paddingX: 3,
                                width: 'fit-content',
                                backgroundColor: '#d32f2f',
                                color: '#ffffff',
                                boxShadow: 'none',

                                '&:hover': {
                                    backgroundColor: '#b71c1c', // нормальный hover
                                    boxShadow: 'none'
                                },

                                '&:disabled': {
                                    backgroundColor: '#ef9a9a',
                                    color: '#ffffff'
                                }
                            }}
                            onClick={handleDeletedAlertViewed}
                            disabled={isClearingDeletedAlert}
                        >
                            {isClearingDeletedAlert ? 'Отмечаем...' : 'Уведомлен об отмене сделки'}
                        </Button>

                    )}
                </Stack>
                <DataTable
                    columns={detailsColumns}
                    rows={detailsRows}
                    gridTemplateColumns="1fr 1fr"
                    rowKey={(row) => row.id}
                    showHeader={false}
                    renderRow={(row) => [
                        <Typography variant="body2">{row.label}</Typography>,
                        typeof row.value === 'string' || typeof row.value === 'number' ? (
                            <Typography variant="body2">{row.value}</Typography>
                        ) : (
                            row.value
                        )
                    ]}
                />

            </Box>
            <Box sx={{ marginTop: 4 }}>
                <OffersTable
                    offers={offers}
                    statusMap={offersStatusMap}
                    isLoading={offersLoading}
                    errorMessage={offersError}
                    statusOptions={offerStatusOptions}
                    onStatusChange={handleOfferStatusChange}
                />
            </Box>
        </Box>
    );
};