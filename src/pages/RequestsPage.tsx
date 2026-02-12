import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RequestsTable } from '@features/requests/components/RequestsTable';
import { getOffers } from '@shared/api/getOffers';
import { getRequests } from '@shared/api/getRequests';
import type { RequestWithOfferStats } from '@shared/api/getRequests';
import { getOpenRequests } from '@shared/api/getOpenRequests';
import { getRequestEconomists } from '@shared/api/getRequestEconomists';
import { updateRequestDetails } from '@shared/api/updateRequestDetails';
import { useAuth } from '@app/providers/AuthProvider';
import { hasAvailableAction } from '@shared/auth/availableActions';

export const RequestsPage = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const userLogin = session?.login ?? '';
    const [requests, setRequests] = useState<RequestWithOfferStats[]>([]);
    const [ownerOptions, setOwnerOptions] = useState<Array<{ id: string; label: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [chatAlertsMap, setChatAlertsMap] = useState<Record<number, number>>({});
    const pollIntervalMs = 10000;
    const canLoadOnlyOpenRequests = useMemo(
        () => session?.roleId === 5 && hasAvailableAction(session, '/api/v1/requests/open', 'GET'),
        [session]
    );


    const canEditOwner = useMemo(() => session?.roleId === 1 || session?.roleId === 3, [session?.roleId]);

    const fetchRequests = useCallback(
        async (showLoading: boolean) => {
            if (showLoading) {
                setIsLoading(true);
            }
            setErrorMessage(null);
            try {
                const data = canLoadOnlyOpenRequests ? await getOpenRequests() : await getRequests();
                setRequests(data.requests);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Ошибка загрузки заявок');
            } finally {
                if (showLoading) {
                    setIsLoading(false);
                }
            }
        },
        [canLoadOnlyOpenRequests]
    );

    const fetchOwners = useCallback(async () => {
        if (!canEditOwner) {
            setOwnerOptions([]);
            return;
        }

        try {
            const economists = await getRequestEconomists();
            const options = economists.map((item) => ({
                id: item.user_id,
                label: `${item.full_name?.trim() || item.user_id} (${item.role})`
            }));
            setOwnerOptions(options);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Ошибка загрузки списка ответственных');
        }
    }, [canEditOwner]);

    useEffect(() => {
        void fetchRequests(true);
        const intervalId = window.setInterval(() => {
            void fetchRequests(false);
        }, pollIntervalMs);
        return () => window.clearInterval(intervalId);
    }, [fetchRequests, pollIntervalMs]);

    useEffect(() => {
        void fetchOwners();
    }, [fetchOwners]);
    
    useEffect(() => {
        let isMounted = true;
        const loadChatAlerts = async () => {
            if (requests.length === 0) {
                if (isMounted) {
                    setChatAlertsMap({});
                }
                return;
            }
            const results = await Promise.allSettled(
                requests.map((request) => getOffers({ requestId: request.id, userLogin }))
            );
            const nextAlerts: Record<number, number> = {};
            results.forEach((result, index) => {
                if (result.status !== 'fulfilled') {
                    return;
                }
                const offerList = result.value.offers ?? [];
                const alertCount = offerList.filter(
                    (offer) => offer.offer_chat_stats?.status_web && !offer.offer_chat_stats?.status_tg
                ).length;
                if (alertCount > 0) {
                    nextAlerts[requests[index].id] = alertCount;
                }
            });
            if (isMounted) {
                setChatAlertsMap(nextAlerts);
            }
        };
        void loadChatAlerts();
        return () => {
            isMounted = false;
        };
    }, [requests, userLogin]);

    const handleOwnerChange = async (request: RequestWithOfferStats, ownerUserId: string) => {
        if (!canEditOwner || ownerUserId === request.id_user) {
            return;
        }

        const previousOwner = request.id_user;
        setRequests((prev) =>
            prev.map((item) =>
                item.id === request.id
                    ? {
                        ...item,
                        id_user: ownerUserId
                    }
                    : item
            )
        );

        try {
            await updateRequestDetails({
                requestId: request.id,
                owner_user_id: ownerUserId
            });
        } catch (error) {
            setRequests((prev) =>
                prev.map((item) =>
                    item.id === request.id
                        ? {
                            ...item,
                            id_user: previousOwner
                        }
                        : item
                )
            );
            setErrorMessage(error instanceof Error ? error.message : 'Не удалось изменить ответственного');
        }
    };

    return (
        <Box>
            {errorMessage && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {errorMessage}
                </Typography>
            )}
            <RequestsTable
                requests={requests}
                isLoading={isLoading}
                onRowClick={(request) => navigate(`/requests/${request.id}`, { state: { request } })}
                chatAlertsMap={chatAlertsMap}
                ownerOptions={ownerOptions}
                canEditOwner={canEditOwner}
                onOwnerChange={(request, ownerUserId) => void handleOwnerChange(request, ownerUserId)}
            />
        </Box>
    );
};