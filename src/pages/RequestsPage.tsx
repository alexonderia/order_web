import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { RequestsTable } from '@features/requests/components/RequestsTable';
import { getOffers } from '@shared/api/getOffers';
import { getRequests } from '@shared/api/getRequests';
import type { RequestWithOfferStats } from '@shared/api/getRequests';
import { useAuth } from '@app/providers/AuthProvider';

export const RequestsPage = () => {
    const { session, logout } = useAuth();
    const navigate = useNavigate();
    const userLogin = session?.login ?? '';
    const [requests, setRequests] = useState<RequestWithOfferStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [chatAlertsMap, setChatAlertsMap] = useState<Record<number, number>>({});
    const pollIntervalMs = 10000;

    const fetchRequests = useCallback(
        async (showLoading: boolean) => {
            if (!userLogin) {
                setErrorMessage('Не удалось определить пользователя');
                return;
            }
            if (showLoading) {
                setIsLoading(true);
            }
            setErrorMessage(null);
            try {
                const data = await getRequests({ id_user_web: userLogin });
                setRequests(data.requests);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Ошибка загрузки заявок');
            } finally {
                if (showLoading) {
                    setIsLoading(false);
                }
            }
        },
        [userLogin]
    );

    useEffect(() => {
        void fetchRequests(true);
        const intervalId = window.setInterval(() => {
            void fetchRequests(false);
        }, pollIntervalMs);
        return () => window.clearInterval(intervalId);
    }, [fetchRequests, pollIntervalMs]);
    
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

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Button
                    variant="contained"
                    sx={{ paddingX: 4, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                    onClick={() => navigate('/requests/create')}
                >
                    Создать заявку
                </Button>
                <Button
                    variant="outlined"
                    sx={(theme) => ({
                        paddingX: 4,
                        backgroundColor: theme.palette.primary.light
                    })}
                    onClick={logout}
                >
                    Выйти
                </Button>
            </Stack>
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
            />
        </Box>
    );
};