import { Box } from '@mui/material';
import { AuthCard } from '@features/auth/components/AuthCard';
import type { RegisterWebUserPayload } from '@shared/api/registerWebUser';

type AuthPageProps = {
    onRegister: (payload: RegisterWebUserPayload) => Promise<void>;
    isSubmitting: boolean;
    errorMessage?: string | null;
};

export const AuthPage = ({ onRegister, isSubmitting, errorMessage }: AuthPageProps) => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 3
            }}
        >
            <AuthCard onRegister={onRegister} isSubmitting={isSubmitting} errorMessage={errorMessage} />
        </Box>
    );
};