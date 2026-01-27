import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { LoginWebUserPayload } from '@shared/api/loginWebUser';
import type { RegisterWebUserPayload } from '@shared/api/registerWebUser';

type AuthCardProps = {
    onRegister: (payload: RegisterWebUserPayload) => Promise<void>;
    onLogin: (payload: LoginWebUserPayload) => Promise<void>;
    isSubmitting: boolean;
    errorMessage?: string | null;
};

export const AuthCard = ({ onRegister, onLogin, isSubmitting, errorMessage }: AuthCardProps) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        void onRegister({ login, password });
    };

    const handleLogin = () => {
        void onLogin({ login, password });
    };

    return (
        <Paper
            elevation={0}
            sx={(theme) => ({
                width: { xs: '90%', sm: 420 },
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                padding: { xs: 4, sm: 6 }
            })}
        >
            <Stack spacing={4} alignItems="center">
                <Typography variant="h5" fontWeight={600} color="text.primary">
                    Авторизация
                </Typography>
                <Stack spacing={2.5} width="100%" alignItems="center">
                    <TextField
                        fullWidth
                        label="Логин"
                        variant="outlined"
                        value={login}
                        onChange={(event) => setLogin(event.target.value)}
                        InputProps={{
                            sx: (theme) => ({
                                borderRadius: 999,
                                backgroundColor: theme.palette.primary.light
                            })
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Пароль"
                        type="password"
                        variant="outlined"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        InputProps={{
                            sx: (theme) => ({
                                borderRadius: 999,
                                backgroundColor: theme.palette.primary.light
                            })
                        }}
                    />
                </Stack>
                <Stack spacing={2} width="100%" alignItems="center">
                    <Button
                        variant="outlined"
                        sx={(theme) => ({
                            width: '100%',
                            borderRadius: 999,
                            textTransform: 'none',
                            backgroundColor: theme.palette.background.paper,
                            paddingY: 1.3
                        })}
                        onClick={handleLogin}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Вход...' : 'Вход'}
                    </Button>
                    <Button
                        variant="outlined"
                        sx={(theme) => ({
                            width: '100%',
                            borderRadius: 999,
                            textTransform: 'none',
                            backgroundColor: theme.palette.primary.light,
                            paddingY: 1.3
                        })}
                        onClick={handleRegister}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Регистрация...' : 'Регистрация'}
                    </Button>
                </Stack>
                {errorMessage ? (
                    <Typography variant="body2" color="error" textAlign="center">
                        {errorMessage}
                    </Typography>
                ) : null}
                <Box sx={{ height: 4 }} />
            </Stack>
        </Paper>
    );
};