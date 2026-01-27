import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

export type CreateRequestFormData = {
    description: string;
    deadlineAt: string;
    file: File | null;
};

type CreateRequestPageProps = {
    onClose?: () => void;
    onSubmit?: (data: CreateRequestFormData) => Promise<void>;
    isSubmitting?: boolean;
    errorMessage?: string | null;
};

export const CreateRequestPage = ({
    onClose,
    onSubmit,
    isSubmitting = false,
    errorMessage
}: CreateRequestPageProps) => {
    const todayDate = useMemo(() => {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
    }, []);
    const [description, setDescription] = useState('');
    const [deadlineAt, setDeadlineAt] = useState(todayDate);
    const [fileName, setFileName] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!onSubmit) {
            return;
        }

        await onSubmit({
            description,
            deadlineAt,
            file
        });
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: { xs: 2, md: 4 }
            }}
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={(theme) => ({
                    width: { xs: '100%', sm: 560 },
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    padding: { xs: 3, sm: 4 },
                    boxShadow: '0 16px 32px rgba(15, 35, 75, 0.08)'
                })}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" fontWeight={600}>
                        Новая заявка
                    </Typography>
                    <IconButton
                        aria-label="Закрыть"
                        onClick={onClose}
                        sx={{ color: 'text.primary' }}
                    >
                        <Typography component="span" fontSize={28} lineHeight={1}>
                            ×
                        </Typography>
                    </IconButton>
                </Stack>
                <TextField
                    placeholder="Описание заявки"
                    multiline
                    minRows={5}
                    fullWidth
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: 3,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3
                        }
                    }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={3} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={500}>
                        Сбор КП до
                    </Typography>
                    <TextField
                        type="date"
                        value={deadlineAt}
                        onChange={(event) => setDeadlineAt(event.target.value)}
                        inputProps={{ min: todayDate }}
                        sx={(theme) => ({
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            borderRadius: 999,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 999,
                                backgroundColor: 'transparent'
                            }
                        })}
                    />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2} alignItems="center">
                    <Button
                        variant="outlined"
                        component="label"
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            paddingX: 3,
                            borderColor: 'primary.main',
                            color: 'primary.main'
                        }}
                    >
                        <Box component="span" sx={{ marginRight: 1 }}>
                            🔗
                        </Box>
                        Прикрепить файл
                        <input
                            type="file"
                            hidden
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                setFileName(file ? file.name : '');
                                setFile(file ?? null);
                            }}
                        />
                    </Button>
                    <Typography variant="body2" color="#3a3a3a">
                        {fileName || 'Файл не выбран'}
                    </Typography>
                </Stack>
                {!file ? (
                    <Typography mt={1} variant="caption" color="text.secondary">
                        Файл обязателен для отправки заявки.
                    </Typography>
                ) : null}
                <Button
                    variant="contained"
                    fullWidth
                    type="submit"
                    disabled={isSubmitting || !file}
                    sx={(theme) => ({
                        marginTop: 3,
                        borderRadius: 999,
                        textTransform: 'none',
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        backgroundColor: theme.palette.primary.main,
                        paddingY: 1.2,
                        fontSize: 18,
                        boxShadow: 'none',
                        '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                            boxShadow: 'none'
                        }
                    })}
                >
                    {isSubmitting ? 'Создание...' : 'Создать заявку'}
                </Button>
                {errorMessage ? (
                    <Typography mt={2} color="error" textAlign="center">
                        {errorMessage}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
};