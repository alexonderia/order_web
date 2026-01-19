import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { RequestsTable } from '@features/requests/components/RequestsTable';
import { getRequests } from '@shared/api/getRequests';
import type { RequestWithOfferStats } from '@shared/api/getRequests';

type RequestsPageProps = {
    onCreateRequest?: () => void;
    userLogin: string;
};

export const RequestsPage = ({ onCreateRequest, userLogin }: RequestsPageProps) => {
    const [requests, setRequests] = useState<RequestWithOfferStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const data = await getRequests({ id_user_web: userLogin });
                setRequests(data.requests);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Ошибка загрузки заявок');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, [userLogin]);
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
                    onClick={onCreateRequest}
                >
                    Создать заявку
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
            {errorMessage && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {errorMessage}
                </Typography>
            )}
            <RequestsTable requests={requests} isLoading={isLoading} />
        </Box>
    );
};