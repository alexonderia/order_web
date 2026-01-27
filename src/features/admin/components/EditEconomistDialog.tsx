import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useEffect, useMemo, useState } from 'react';
import type { WebUser } from '@shared/api/getWebUsersByRole';
import { updateWebUserPassword } from '@shared/api/updateWebUserPassword';
import { updateWebUserRole } from '@shared/api/updateWebUserRole';

export type RoleOption = {
  id: number;
  label: string;
};

type EditEconomistDialogProps = {
  open: boolean;
  user: WebUser | null;
  roleOptions: RoleOption[];
  onClose: () => void;
  onSaved: () => void;
};

export const EditEconomistDialog = ({
  open,
  user,
  roleOptions,
  onClose,
  onSaved
}: EditEconomistDialogProps) => {
  const [roleId, setRoleId] = useState<number | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setRoleId(user.id_role);
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
  }, [user, open]);

  const canSubmit = useMemo(() => {
    if (!user) {
      return false;
    }
    const roleChanged = roleId !== null && roleId !== user.id_role;
    const passwordProvided = currentPassword || newPassword || confirmPassword;
    return roleChanged || passwordProvided;
  }, [user, roleId, currentPassword, newPassword, confirmPassword]);

  const handleSave = async () => {
    if (!user) {
      return;
    }

    setErrorMessage(null);
    const roleChanged = roleId !== null && roleId !== user.id_role;
    const passwordProvided = currentPassword || newPassword || confirmPassword;

    if (!roleChanged && !passwordProvided) {
      setErrorMessage('Укажите изменения роли или пароля.');
      return;
    }

    if (passwordProvided) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setErrorMessage('Заполните все поля для смены пароля.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Новые пароли не совпадают.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (roleChanged && roleId !== null) {
        await updateWebUserRole({ login: user.id, role_id: roleId });
      }
      if (passwordProvided) {
        await updateWebUserPassword({
          login: user.id,
          current_password: currentPassword,
          new_password: newPassword
        });
      }
      onSaved();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось сохранить изменения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        Редактирование экономиста
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="role-select-label">Текущая роль</InputLabel>
            <Select
              labelId="role-select-label"
              value={roleId ?? ''}
              label="Текущая роль"
              onChange={(event) => setRoleId(Number(event.target.value))}
              input={<OutlinedInput label="Текущая роль" />}
            >
              {roleOptions.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Изменение пароля
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                type="password"
                label="Текущий пароль"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <TextField
                fullWidth
                type="password"
                label="Новый пароль"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <TextField
                fullWidth
                type="password"
                label="Повторите новый пароль"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </Stack>
          </Box>
          {errorMessage && (
            <Typography color="error" variant="body2">
              {errorMessage}
            </Typography>
          )}
          <Button
            variant="outlined"
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            onClick={() => void handleSave()}
            disabled={isSubmitting || !canSubmit}
          >
            Сохранить изменения
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};