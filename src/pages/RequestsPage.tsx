import { Box, Button, Stack } from '@mui/material';
import { RequestsTable } from '@features/requests/components/RequestsTable';

type RequestsPageProps = {
    onCreateRequest?: () => void;
};

export const RequestsPage = ({ onCreateRequest }: RequestsPageProps) => {
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
            <RequestsTable />
        </Box>
    );
};