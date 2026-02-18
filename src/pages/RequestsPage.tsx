import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RequestsTable } from '@features/requests/components/RequestsTable';
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
        if (canLoadOnlyOpenRequests) {
            setChatAlertsMap({});
            return;
        }

        const nextAlerts = requests.reduce<Record<number, number>>((acc, request) => {
            const alertCount = request.count_chat_alert ?? 0;
            if (alertCount > 0) {
                acc[request.id] = alertCount;
            }
        return acc;
        }, {});

        setChatAlertsMap(nextAlerts);
    }, [canLoadOnlyOpenRequests, requests]);

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
                onRowClick={(request) =>
                    navigate(
                        canLoadOnlyOpenRequests ? `/requests/${request.id}/contractor` : `/requests/${request.id}`,
                        canLoadOnlyOpenRequests ? undefined : { state: { request } }
                    )
                }
                chatAlertsMap={chatAlertsMap}
                ownerOptions={ownerOptions}
                canEditOwner={canEditOwner}
                onOwnerChange={(request, ownerUserId) => void handleOwnerChange(request, ownerUserId)}
            />
        </Box>
    );
};