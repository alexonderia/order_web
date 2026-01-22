import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { EconomistsTable } from '@features/admin/components/EconomistsTable';
import { TelegramUsersTable } from '@features/admin/components/TelegramUsersTable';
import { EditEconomistDialog } from '@features/admin/components/EditEconomistDialog';
import type { WebUser } from '@shared/api/getWebUsersByRole';
import { getWebUsersByRole } from '@shared/api/getWebUsersByRole';
import { getTelegramUsers } from '@shared/api/getTelegramUsers';
import type { TelegramUser } from '@shared/api/getTelegramUsers';

const ECONOMIST_ROLE_ID = 2;

type AdminPageProps = {
  onLogout: () => void;
};

export const AdminPage = ({ onLogout }: AdminPageProps) => {
  const [activeTab, setActiveTab] = useState<'economists' | 'contractors'>('contractors');
  const [economists, setEconomists] = useState<WebUser[]>([]);
  const [contractors, setContractors] = useState<TelegramUser[]>([]);
  const [isLoadingEconomists, setIsLoadingEconomists] = useState(false);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEconomist, setSelectedEconomist] = useState<WebUser | null>(null);
  const pollIntervalMs = 10000;

  const roleOptions = useMemo(
    () => [
      { id: 1, label: 'Администратор' },
      { id: 2, label: 'Экономист' }
    ],
    []
  );

  const getRoleLabel = useCallback(
    (roleId: number) => roleOptions.find((role) => role.id === roleId)?.label ?? `Роль ${roleId}`,
    [roleOptions]
  );

  const fetchEconomists = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoadingEconomists(true);
    }
    setErrorMessage(null);
    try {
      const data = await getWebUsersByRole(ECONOMIST_ROLE_ID);
      setEconomists(data.users);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка загрузки экономистов');
    } finally {
      if (showLoading) {
        setIsLoadingEconomists(false);
      }
    }
  }, []);

  const fetchContractors = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoadingContractors(true);
    }
    setErrorMessage(null);
    try {
      const data = await getTelegramUsers();
      setContractors(data.users);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка загрузки контрагентов');
    } finally {
      if (showLoading) {
        setIsLoadingContractors(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchEconomists(true);
    void fetchContractors(true);
    const intervalId = window.setInterval(() => {
      void fetchEconomists(false);
      void fetchContractors(false);
    }, pollIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [fetchEconomists, fetchContractors, pollIntervalMs]);

  const handleSaved = async () => {
    setSelectedEconomist(null);
    await fetchEconomists(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', padding: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              paddingX: 4,
              borderColor: '#1f1f1f',
              color: '#1f1f1f',
              backgroundColor: activeTab === 'contractors' ? '#d9d9d9' : 'transparent'
            }}
            onClick={() => setActiveTab('contractors')}
          >
            Контрагенты
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              paddingX: 4,
              borderColor: '#1f1f1f',
              color: '#1f1f1f',
              backgroundColor: activeTab === 'economists' ? '#d9d9d9' : 'transparent'
            }}
            onClick={() => setActiveTab('economists')}
          >
            Экономисты
          </Button>
        </Stack>
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
          onClick={onLogout}
        >
          Выйти
        </Button>
      </Stack>
      {errorMessage && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Typography>
      )}
      {activeTab === 'contractors' ? (
        <TelegramUsersTable users={contractors} isLoading={isLoadingContractors} />
      ) : (
        <EconomistsTable
          users={economists}
          isLoading={isLoadingEconomists}
          getRoleLabel={getRoleLabel}
          onEdit={(user) => setSelectedEconomist(user)}
        />
      )}
      <EditEconomistDialog
        open={Boolean(selectedEconomist)}
        user={selectedEconomist}
        roleOptions={roleOptions}
        onClose={() => setSelectedEconomist(null)}
        onSaved={handleSaved}
      />
    </Box>
  );
};