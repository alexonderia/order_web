import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@app/providers/AuthProvider';
import { registerUser } from '@shared/api/registerUser';

const schema = z.object({
  login: z.string().min(3, 'Минимум 3 символа'),
  password: z.string().min(6, 'Минимум 6 символов'),
  role_id: z.number({ required_error: 'Выберите роль' })
});

type FormValues = z.infer<typeof schema>;

export const AdminPage = () => {
  const { session } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => [
      { id: 1, label: 'Администратор' },
      { id: 2, label: 'Экономист' }
    ],
    []
  );

  const canCreateUser =
    session?.availableAction?.href === '/api/v1/users/register' &&
    session.availableAction.method.toUpperCase() === 'POST';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      login: '',
      password: '',
      role_id: roleOptions[0]?.id ?? 1
    }
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    reset();
  };

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await registerUser(values);
      setSuccessMessage(`Пользователь ${response.data.user_id} создан.`);
      reset();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось создать пользователя');
    }
  };


  return (
    <Stack spacing={3}>
      <Paper sx={{ padding: { xs: 3, md: 4 }, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            Администрирование
          </Typography>
          <Typography color="text.secondary">
            Управляйте пользователями системы. Доступные действия приходят от backend.
          </Typography>
          {canCreateUser ? (
            <Button
              variant="contained"
              sx={{ alignSelf: 'flex-start', boxShadow: 'none' }}
              onClick={() => setIsDialogOpen(true)}
            >
              Добавить пользователя
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Нет доступных действий для создания пользователей.
            </Typography>
          )}
        </Stack>
      </Paper>

      <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Создать пользователя</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Роль"
              select
              error={Boolean(errors.role_id)}
              helperText={errors.role_id?.message}
              defaultValue={roleOptions[0]?.id ?? 1}
              {...register('role_id', { valueAsNumber: true })}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Логин"
              error={Boolean(errors.login)}
              helperText={errors.login?.message}
              {...register('login')}
            />
            <TextField
              label="Пароль"
              type="password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password')}
            />
            {errorMessage ? (
              <Typography color="error" variant="body2">
                {errorMessage}
              </Typography>
            ) : null}
            {successMessage ? (
              <Typography color="primary" variant="body2">
                {successMessage}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: 3 }}>
          <Button variant="outlined" onClick={handleClose}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};