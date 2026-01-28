import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { notifyOfferComment } from '@shared/api/notifyOfferComment';
import { getOfferComments } from '@shared/api/getOfferComments';
import type { RequestWithOfferStats } from '@shared/api/getRequests';
import { getRequests } from '@shared/api/getRequests';
import { getDownloadUrl } from '@shared/api/fileDownload';
import { markDeletedAlertViewed } from '@shared/api/markDeletedAlertViewed';
import { OfferChatDrawer } from '@features/requests/components/OfferChatDrawer';
import type { OfferChatMessage } from '@features/requests/components/OfferChatDrawer';
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
    const pollIntervalMs = 10000;
    const [activeOfferChatId, setActiveOfferChatId] = useState<number | null>(null);
    const [offerChatMessages, setOfferChatMessages] = useState<Record<number, OfferChatMessage[]>>({});
    const [chatError, setChatError] = useState<string | null>(null);
    const [isSendingComment, setIsSendingComment] = useState(false);

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

    const fetchOffers = useCallback(
        async (showLoading: boolean) => {
            if (showLoading) {
                setOffersLoading(true);
            }
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
                if (showLoading) {
                    setOffersLoading(false);
                }
            }
        },
        [request.id, userLogin]
    );

    const fetchRequestDetails = useCallback(async () => {
        try {
            const data = await getRequests({ id_user_web: userLogin });
            const nextRequest = data.requests.find((item) => item.id === request.id);
            if (!nextRequest) {
                return;
            }
            setRequestDetails(nextRequest);
            const hasLocalChanges = status !== baselineStatus || deadline !== baselineDeadline;
            if (!hasLocalChanges) {
                const nextStatus =
                    (statusOptions.find((o) => o.value === nextRequest.status)?.value ?? 'open') as RequestStatus;
                const nextDeadline = toDateInputValue(nextRequest.deadline_at);
                setStatus(nextStatus);
                setBaselineStatus(nextStatus);
                setDeadline(nextDeadline);
                setBaselineDeadline(nextDeadline);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Не удалось обновить заявку');
        }
    }, [baselineDeadline, baselineStatus, deadline, request.id, status, userLogin]);

    useEffect(() => {
        void fetchOffers(true);
        void fetchRequestDetails();
        const intervalId = window.setInterval(() => {
            void fetchOffers(false);
            void fetchRequestDetails();
        }, pollIntervalMs);
        return () => window.clearInterval(intervalId);
    }, [fetchOffers, fetchRequestDetails, pollIntervalMs]);
    
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
                deadline_at: deadlineChanged ? `${deadline}T23:59:59` : null
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

    const handleOpenChat = async (offerId: number) => {
        setActiveOfferChatId(offerId);
        setChatError(null);
        try {
            const response = await getOfferComments({ offerId, userLogin });
            const nextMessages = response.comments.flatMap((comment) => {
                const createdAt = comment.created_at ?? new Date().toISOString();
                const messages: OfferChatMessage[] = [
                    {
                        id: `comment-${comment.id}`,
                        text: comment.comment,
                        createdAt,
                        author: 'web'
                    }
                ];
                if (comment.answer) {
                    messages.push({
                        id: `answer-${comment.id}`,
                        text: comment.answer,
                        createdAt: comment.answered_at ?? createdAt,
                        author: 'tg'
                    });
                }
                return messages;
            });
            setOfferChatMessages((prev) => ({
                ...prev,
                [offerId]: nextMessages
            }));
        } catch (error) {
            setChatError(error instanceof Error ? error.message : 'Не удалось загрузить чат по офферу');
        }
    };

    const handleCloseChat = () => {
        setActiveOfferChatId(null);
        setChatError(null);
    };

    const handleSendComment = async (comment: string) => {
        if (!activeOfferChatId) {
            return false;
        }
        setIsSendingComment(true);
        setChatError(null);
        try {
            const response = await notifyOfferComment({
                id_user_web: userLogin,
                offer_id: activeOfferChatId,
                comment
            });
            const createdAt = response.comment?.created_at ?? new Date().toISOString();
            setOfferChatMessages((prev) => ({
                ...prev,
                [activeOfferChatId]: [
                    ...(prev[activeOfferChatId] ?? []),
                    {
                        id: `${activeOfferChatId}-${createdAt}-${Math.random().toString(16).slice(2)}`,
                        text: response.comment?.comment ?? comment,
                        createdAt,
                        author: 'web'
                    }
                ]
            }));
            return true;
        } catch (error) {
            setChatError(error instanceof Error ? error.message : 'Не удалось отправить комментарий');
            return false;
        } finally {
            setIsSendingComment(false);
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
        <Box sx={{ minHeight: '100vh', padding: { xs: 2, md: 4 }, backgroundColor: 'background.default' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Button
                    variant="outlined"
                    sx={{ paddingX: 4, borderColor: 'primary.main', color: 'primary.main' }}
                    onClick={onBack}
                >
                    К списку заявок
                </Button>
                <Button
                    variant="outlined"
                    sx={(theme) => ({
                        paddingX: 4,
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        backgroundColor: theme.palette.primary.light
                    })}
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
                            backgroundColor: 'background.paper'
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
                    variant="contained"
                    sx={{ paddingX: 4, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                    onClick={() => void handleSave()}
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
                sx={(theme) => ({
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    padding: { xs: 2, md: 3 },
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }
                })}
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
                            sx={(theme) => ({
                                paddingX: 3,
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                backgroundColor: theme.palette.background.paper,
                                width: 'fit-content'
                            })}
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
                            sx={(theme) => ({
                                paddingX: 3,
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                backgroundColor: theme.palette.background.paper,
                                width: 'fit-content'
                            })}
                            disabled
                        >
                            Скачать файл заявки
                        </Button>

                    )}
                    {hasDeletedAlert && (
                        <Button
                            variant="contained"
                            sx={(theme) => ({
                                paddingX: 3,
                                width: 'fit-content',
                                backgroundColor: theme.palette.error.main,
                                color: theme.palette.error.contrastText,
                                boxShadow: 'none',

                                '&:hover': {
                                    backgroundColor: theme.palette.error.dark,
                                    boxShadow: 'none'
                                },

                                '&:disabled': {
                                    backgroundColor: theme.palette.error.light,
                                    color: theme.palette.error.contrastText
                                }
                            })}
                            onClick={() => void handleDeletedAlertViewed()}
                            disabled={isClearingDeletedAlert}
                        >
                            {isClearingDeletedAlert ? 'Отмечаем...' : 'Уведомлен об отмене сделки'}
                        </Button>

                    )}
                </Stack>
                <DataTable
                    columns={detailsColumns}
                    rows={detailsRows}
                    rowKey={(row) => row.id}
                    showHeader={false}
                    enableColumnControls={false}
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
                    onStatusChange={(offerId, value) => void handleOfferStatusChange(offerId, value)}
                    onOpenChat={(offerId) => void handleOpenChat(offerId)}
                />
            </Box>
            <OfferChatDrawer
                open={Boolean(activeOfferChatId)}
                offerId={activeOfferChatId}
                messages={activeOfferChatId ? offerChatMessages[activeOfferChatId] ?? [] : []}
                isSending={isSendingComment}
                errorMessage={chatError}
                onClose={handleCloseChat}
                onSend={handleSendComment}
            />
        </Box>
    );
};