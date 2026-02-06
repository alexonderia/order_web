import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { createRequest } from '@shared/api/createRequest';

const schema = z.object({
  description: z.string().max(3000, 'Максимум 3000 символов').optional(),
  deadlineAt: z.string().min(1, 'Укажите дату сбора КП'),
  files: z.array(z.instanceof(File)).min(1, 'Добавьте хотя бы один файл')
});

type FormValues = z.infer<typeof schema>;

export const CreateRequestPage = () => {
    const navigate = useNavigate();
    const todayDate = useMemo(() => {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
    }, []);
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        control,
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            description: '',
            deadlineAt: todayDate,
            files: []
        }
    });

    const files = watch('files');

    const onSubmit = async (values: FormValues) => {
        setIsSubmittingRequest(true);
        setErrorMessage(null);
        try {
            await createRequest({
                description: values.description?.trim() || null,
                deadline_at: `${values.deadlineAt}T00:00:00`,
                files: values.files
            });
            navigate('/requests');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Ошибка создания заявки');
        } finally {
            setIsSubmittingRequest(false);
        }
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
                onSubmit={handleSubmit(onSubmit)}
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
                    <IconButton aria-label="Закрыть" onClick={() => navigate('/requests')} sx={{ color: 'text.primary' }}>
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
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                    {...register('description')}
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
                        error={Boolean(errors.deadlineAt)}
                        helperText={errors.deadlineAt?.message}
                        inputProps={{ min: todayDate }}
                        {...register('deadlineAt')}
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

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2} alignItems="flex-start">
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
                        Прикрепить файлы
                        <Controller
                            control={control}
                            name="files"
                            render={({ field: { onChange } }) => (
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    onChange={(event) => onChange(Array.from(event.target.files ?? []))}
                                />
                            )}
                        />
                    </Button>
                    <Stack spacing={0.5}>
                        {files.length > 0 ? files.map((file) => <Typography key={file.name}>{file.name}</Typography>) : <Typography variant="body2">Файлы не выбраны</Typography>}
                        {errors.files ? <Typography variant="caption" color="error">{errors.files.message}</Typography> : null}
                    </Stack>
                </Stack>

                <Button
                    variant="contained"
                    fullWidth
                    type="submit"
                    disabled={isSubmittingRequest}
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
                    {isSubmittingRequest ? 'Создание...' : 'Создать заявку'}
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