import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  SvgIcon,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';
import { DataTable } from '@shared/components/DataTable';
import { downloadFile } from '@shared/api/fileDownload';
import { getOfferWorkspace } from '@shared/api/getOfferWorkspace';
import type { OfferWorkspace } from '@shared/api/getOfferWorkspace';
import { deleteOfferFile, getOfferMessages, sendOfferMessage, uploadOfferFile } from '@shared/api/offerWorkspaceActions';
import type { OfferWorkspaceMessage } from '@shared/api/offerWorkspaceActions';
import { getOfferContractorInfo } from '@shared/api/getOfferContractorInfo';
import type { OfferContractorInfo } from '@shared/api/getOfferContractorInfo';
import { hasAvailableAction } from '@shared/auth/availableActions';

const statusOptions = [
  { value: 'open', label: 'Открыта', color: '#2e7d32' },
  { value: 'review', label: 'На рассмотрении', color: '#ed6c02' },
  { value: 'closed', label: 'Закрыта', color: '#787878ff' },
  { value: 'cancelled', label: 'Отменена', color: '#d32f2f' }
] as const;

const detailsColumns = [
  { key: 'label', label: 'Параметр' },
  { key: 'value', label: 'Значение' }
];

const formatDate = (value: string | null, withTime = false) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(date);
};

export const OfferWorkspacePage = () => {
  const { id } = useParams<{ id: string }>();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const offerId = Number(id ?? 0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [workspace, setWorkspace] = useState<OfferWorkspace | null>(null);
  const [contractorInfo, setContractorInfo] = useState<OfferContractorInfo | null>(null);
  const [messages, setMessages] = useState<OfferWorkspaceMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const loadWorkspace = useCallback(async () => {
    if (!Number.isFinite(offerId) || offerId <= 0) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [workspaceResponse, messagesResponse] = await Promise.all([getOfferWorkspace(offerId), getOfferMessages(offerId)]);
      setWorkspace(workspaceResponse);
      setMessages(messagesResponse);
      if (workspaceResponse.offer.contractor_user_id) {
        try {
          const contractor = await getOfferContractorInfo(workspaceResponse.offer.contractor_user_id);
          setContractorInfo(contractor);
        } catch {
          setContractorInfo(null);
        }
      } else {
        setContractorInfo(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка загрузки workspace оффера');
    } finally {
      setIsLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    void loadWorkspace();
    const interval = window.setInterval(() => {
      void getOfferMessages(offerId)
        .then(setMessages)
        .catch(() => undefined);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [loadWorkspace, offerId]);

  const statusConfig = useMemo(
    () => statusOptions.find((item) => item.value === workspace?.request.status) ?? statusOptions[0],
    [workspace?.request.status]
  );

  const canUpload = useMemo(
    () => hasAvailableAction({ availableActions: workspace?.availableActions ?? [] }, `/api/v1/offers/${offerId}/files`, 'POST'),
    [workspace?.availableActions, offerId]
  );
  const canDeleteFile = useMemo(
    () =>
      hasAvailableAction(
        { availableActions: workspace?.availableActions ?? [] },
        `/api/v1/offers/${offerId}/files/{file_id}`,
        'DELETE'
      ) || hasAvailableAction({ availableActions: workspace?.availableActions ?? [] }, `/api/v1/offers/${offerId}/files/1`, 'DELETE'),
    [workspace?.availableActions, offerId]
  );
  const canSendMessage = useMemo(
    () => hasAvailableAction({ availableActions: workspace?.availableActions ?? [] }, `/api/v1/offers/${offerId}/messages`, 'POST'),
    [workspace?.availableActions, offerId]
  );

  const detailsRows = [
    { id: 'created', label: 'Создана', value: formatDate(workspace?.request.created_at ?? null) },
    { id: 'closed', label: 'Закрыта', value: formatDate(workspace?.request.closed_at ?? null) },
    {
      id: 'offer',
      label: 'Номер КП',
      value: workspace?.request.id_offer ?? workspace?.request.chosen_offer_id ?? '-'
    },
    {
      id: 'owner',
      label: 'Ответственный',
      value: workspace?.request.owner_user_id ?? '-'
    },
    { id: 'deadline', label: 'Дедлайн сбора КП', value: formatDate(workspace?.request.deadline_at ?? null) },
    { id: 'updated', label: 'Последнее изменение', value: formatDate(workspace?.request.updated_at ?? null) }
  ];

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !workspace) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      await uploadOfferFile(offerId, file);
      const nextWorkspace = await getOfferWorkspace(offerId);
      setWorkspace(nextWorkspace);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось загрузить файл');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!workspace) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteOfferFile(offerId, fileId);
      const nextWorkspace = await getOfferWorkspace(offerId);
      setWorkspace(nextWorkspace);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось удалить файл');
    }
  };

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    try {
      await sendOfferMessage(offerId, trimmed);
      setMessage('');
      const nextMessages = await getOfferMessages(offerId);
      setMessages(nextMessages);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось отправить сообщение');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <Typography>Загрузка...</Typography>;
  }

  if (!workspace) {
    return <Typography color="text.secondary">Workspace оффера недоступен.</Typography>;
  }

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      sx={{
        height: { xs: 'auto', lg: '100vh' },
        minHeight: { xs: 'auto', lg: '100vh' },
        alignItems: 'stretch',
        overflow: { lg: 'hidden' }
      }}
    >
      <Box
        sx={{
          flex: 1,
          p: 2.5,
          backgroundColor: 'rgba(16, 63, 133, 0.06)',
          overflowY: { xs: 'visible', lg: 'auto' }
        }}
      >
        {errorMessage ? (
          <Typography color="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Typography>
        ) : null}

        <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            sx={{ px: 4, borderColor: 'primary.main', color: 'primary.main', whiteSpace: 'nowrap' }}
            onClick={() => navigate('/requests')}
          >
            К списку заявок
          </Button>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6">профиль</Typography>
            <Button variant="outlined" onClick={logout}>
              Выйти
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
            Номер заявки: {workspace.request.request_id}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'nowrap' }}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: statusConfig.color
              }}
            />
            <Select
              size="small"
              value={statusConfig.value}
              disabled
              sx={{ minWidth: 200, borderRadius: 999, backgroundColor: 'background.paper' }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>

        <Box
          sx={(theme) => ({
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            padding: { xs: 2, md: 2.5 },
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }
          })}
        >
          <Stack spacing={2}>
            <TextField
              value={workspace.request.description ?? ''}
              multiline
              minRows={6}
              InputProps={{ readOnly: true }}
              sx={{ borderRadius: 3 }}
            />
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Файлы заявки
              </Typography>
              {workspace.request.files.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {workspace.request.files.map((file) => (
                    <Chip
                      key={file.id}
                      label={file.name}
                      variant="outlined"
                      sx={{ borderRadius: 999, backgroundColor: '#fff' }}
                      onClick={() => void downloadFile(file.download_url, file.name)}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2">Файлы не прикреплены</Typography>
              )}
            </Stack>
          </Stack>

          <DataTable
            columns={detailsColumns}
            rows={detailsRows}
            rowKey={(row) => row.id}
            showHeader={false}
            enableColumnControls={false}
            renderRow={(row) => [
              <Typography variant="body2">{row.label}</Typography>,
              <Typography variant="body2">{row.value}</Typography>
            ]}
          />
        </Box>

        <Paper sx={{ mt: 2.5, p: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Информация о контрагенте
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="body2">ИНН: {contractorInfo?.inn ?? workspace.company_contacts?.inn ?? '-'}</Typography>
              <Typography variant="body2">Наименование компании: {contractorInfo?.company_name ?? workspace.company_contacts?.company_name ?? '-'}</Typography>
              <Typography variant="body2">Телефон: {contractorInfo?.company_phone ?? workspace.company_contacts?.phone ?? '-'}</Typography>
              <Typography variant="body2">E-mail: {contractorInfo?.company_mail ?? workspace.company_contacts?.mail ?? '-'}</Typography>
              <Typography variant="body2">Адрес: {contractorInfo?.address ?? workspace.company_contacts?.address ?? '-'}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, width: { xs: '100%', md: 260 } }}>
              <Typography variant="body2">Дополнительная информация</Typography>
              <Typography variant="body2" color="text.secondary">
                {contractorInfo?.note ?? workspace.company_contacts?.note ?? '-'}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5, width: { xs: '100%', md: 220 } }}>
              <Typography variant="body2">ФИО: {contractorInfo?.full_name ?? workspace.profile?.full_name ?? '-'}</Typography>
              <Typography variant="body2">Телефон: {contractorInfo?.phone ?? workspace.profile?.phone ?? '-'}</Typography>
              <Typography variant="body2">E-mail: {contractorInfo?.mail ?? workspace.profile?.mail ?? '-'}</Typography>
            </Paper>
          </Stack>
        </Paper>

        <Paper sx={{ mt: 2.5, p: 2, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="h6">Номер КП: {workspace.offer.offer_id}</Typography>
            <Chip label={workspace.offer.status} color="success" size="small" />
          </Stack>
          <Stack spacing={1} sx={{ mb: 1.5 }}>
            <Typography variant="body2">Создана: {formatDate(workspace.offer.created_at)}</Typography>
            <Typography variant="body2">Последнее изменение: {formatDate(workspace.offer.updated_at)}</Typography>
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            {workspace.offer.files.length === 0 ? (
              <Typography color="text.secondary">Файлы оффера не прикреплены.</Typography>
            ) : (
              workspace.offer.files.map((file) => (
                <Chip
                  label={file.name}
                  variant="outlined"
                  onClick={() => void downloadFile(file.download_url, file.name)}
                  onDelete={canDeleteFile ? () => void handleDeleteFile(file.id) : undefined}
                />
              ))
            )}
          </Stack>

          <input ref={fileInputRef} type="file" hidden onChange={(event) => void handleUpload(event)} />
          {canUpload ? (
            <Button sx={{ mt: 1.5 }} variant="outlined" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
              {isUploading ? 'Загрузка...' : 'Прикрепить файл'}
            </Button>
          ) : null}
        </Paper>
      </Box>

      <Paper
        sx={{
          width: { xs: '100%', lg: isChatOpen ? 430 : 72 },
          borderRadius: 0,
          borderLeft: { lg: '1px solid #d6dbe4' },
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: { xs: 420, lg: '100%' },
          height: { lg: '100%' },
          transition: 'width 0.2s ease'
        }}
      >

        {isChatOpen ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                Чат по офферу №{workspace.offer.offer_id}
              </Typography>
              <IconButton onClick={() => setIsChatOpen(false)} aria-label="Скрыть чат">
                <SvgIcon fontSize="small">
                  <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </SvgIcon>
              </IconButton>
            </Box>
            <Divider />

            <Stack spacing={2} sx={{ p: 2, height: '100%' }}>
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  borderRadius: 2,
                  backgroundColor: 'rgba(16, 63, 133, 0.04)',
                  p: 2
                }}
              >
                {messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Сообщений пока нет.
                  </Typography>
                ) : (
                  <Stack spacing={2} alignItems="stretch">
                    {messages.map((item) => {
                      const ownMessage = item.user_id === session?.login;
                      const isEconomistView = session?.roleId === 1 || session?.roleId === 3;
                      const ownLabel = isEconomistView ? 'Экономист' : 'Контрагент';
                      const peerLabel = isEconomistView ? 'Контрагент' : 'Экономист';

                      return (
                        <Box
                          key={item.id}
                          sx={{
                            backgroundColor: ownMessage ? '#ffffff' : 'rgba(25, 118, 210, 0.08)',
                            borderRadius: 2,
                            p: 1.5,
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                            alignSelf: ownMessage ? 'flex-end' : 'flex-start',
                            textAlign: ownMessage ? 'right' : 'left',
                            maxWidth: '85%'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {ownMessage ? ownLabel : peerLabel}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {item.text}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.created_at, true)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              <TextField
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Введите комментарий"
                multiline
                minRows={3}
                disabled={!canSendMessage || isSending}
              />

              <Button
                sx={{ alignSelf: 'flex-end', minWidth: 140, px: 4, boxShadow: 'none' }}
                variant="contained"
                disabled={!canSendMessage || isSending || !message.trim()}
                onClick={() => void handleSendMessage()}
              >
                {isSending ? 'Отправляем...' : 'Отправить'}
              </Button>
            </Stack>
          </>
        ) : (
          <Box sx={{ p: 1 }}>
            <Button variant="text" size="small" onClick={() => setIsChatOpen(true)}>
              Чат
            </Button>
          </Box>
        )}
      </Paper>
    </Stack>
  );
};