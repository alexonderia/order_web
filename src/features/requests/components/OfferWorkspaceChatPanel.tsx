import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  SvgIcon,
  TextField,
  Typography
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import type { OfferWorkspaceMessage } from '@shared/api/offerWorkspaceActions';

const chatSchema = z.object({
  text: z.string().trim().min(1, 'Введите сообщение').max(3000, 'Максимум 3000 символов'),
  files: z.array(z.instanceof(File)).default([])
});

type ChatFormValues = z.infer<typeof chatSchema>;

const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const mergeUniqueFiles = (currentFiles: File[], addedFiles: File[]) => {
  const fileMap = new Map<string, File>();
  [...currentFiles, ...addedFiles].forEach((file) => fileMap.set(getFileKey(file), file));
  return Array.from(fileMap.values());
};

const formatTime = (value: string | null) => {
  if (!value) return '--:--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatDayLabel = (iso: string | null) => {
  if (!iso) return 'Без даты';

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Без даты';

  const today = startOfDay(new Date());
  const msgDay = startOfDay(d);

  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000);

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
};

const MessageStatusIcon = ({ status }: { status: OfferWorkspaceMessage['status'] }) => {
  const isDouble = status === 'received' || status === 'read';
  const isRead = status === 'read';

  const color = isRead ? 'primary.main' : 'text.secondary';

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ml: 0.5,
        color,
        opacity: status === 'send' ? 0.85 : 1
      }}
      aria-label={`message-status-${status}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <path
          d="M6.6 12.6l3.1 3.1 7.7-7.7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {isDouble ? (
          <path
            d="M10.2 12.6l3.1 3.1 7.7-7.7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        ) : null}
      </svg>
    </Box>
  );
};

type OfferWorkspaceChatPanelProps = {
  offerId: number;
  isOpen: boolean;
  onToggleOpen: (next: boolean) => void;
  messages: OfferWorkspaceMessage[];
  sessionLogin?: string;
  canSendMessage: boolean;
  canSendMessageWithAttachments: boolean;
  isSending: boolean;
  onSendMessage: (text: string, files: File[]) => Promise<void>;
  onMessageInputFocus: () => Promise<void> | void;
  onDownloadAttachment: (downloadUrl: string, name: string) => void;
};

export const OfferWorkspaceChatPanel = ({
  offerId,
  isOpen,
  onToggleOpen,
  messages,
  sessionLogin,
  canSendMessage,
  canSendMessageWithAttachments,
  isSending,
  onSendMessage,
  onMessageInputFocus,
  onDownloadAttachment
}: OfferWorkspaceChatPanelProps) => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { text: '', files: [] }
  });

  const attachedFiles = watch('files');
  const messageText = watch('text');

  const sortedMessages = React.useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
    );
  }, [messages]);

  const handleRemoveAttachedFile = (fileToRemove: File) => {
    const nextFiles = attachedFiles.filter((file) => getFileKey(file) !== getFileKey(fileToRemove));
    setValue('files', nextFiles, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };

  const onSubmitMessage = async (values: ChatFormValues) => {
    if (!canSendMessage) return;

    const trimmedText = values.text.trim();
    if (!trimmedText) return;

    await onSendMessage(trimmedText, values.files);
    reset({ text: '', files: [] });
  };

  return (
    <Paper
      sx={{
        width: { xs: '100%', lg: isOpen ? 430 : 72 },
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
      {isOpen ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
              Чат по офферу №{offerId}
            </Typography>
            <IconButton onClick={() => onToggleOpen(false)} aria-label="Скрыть чат">
              <SvgIcon fontSize="small">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </SvgIcon>
            </IconButton>
          </Box>
          <Divider />

          <Stack spacing={1} sx={{ p: 2, height: '100%' }}>
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                borderRadius: 2,
                backgroundColor: 'rgba(16, 63, 133, 0.04)',
                p: 2
              }}
            >
              {sortedMessages.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Сообщений пока нет.
                </Typography>
              ) : (
                <Stack spacing={0} alignItems="stretch">
                  {sortedMessages.map((item, idx) => {
                    const ownMessage = item.user_id === sessionLogin;

                    const prev = idx > 0 ? sortedMessages[idx - 1] : null;

                    const showDateDivider = !prev
                      ? true
                      : (() => {
                          const a = new Date(prev.created_at ?? '');
                          const b = new Date(item.created_at ?? '');
                          if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
                          return !isSameDay(a, b);
                        })();

                    const isGroupedWithPrev = Boolean(
                      prev &&
                        prev.user_id === item.user_id &&
                        isSameDay(new Date(prev.created_at ?? ''), new Date(item.created_at ?? ''))
                    );

                    return (
                      <Box key={item.id}>
                        {showDateDivider ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                            <Box
                              sx={(theme) => ({
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                                color: theme.palette.text.secondary,
                                backgroundColor: alpha(theme.palette.common.white, 0.75),
                                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                              })}
                            >
                              {formatDayLabel(item.created_at)}
                            </Box>
                          </Box>
                        ) : null}

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: ownMessage ? 'flex-end' : 'flex-start',
                            mt: showDateDivider ? 0.9 : isGroupedWithPrev ? 0.25 : 0.9
                          }}
                        >
                          <Box
                            sx={(theme) => {
                              const R = 18;
                              const CUT = 6;
                              const top = isGroupedWithPrev ? 10 : R;

                              return {
                                maxWidth: '82%',
                                px: 1.6,
                                py: 1.1,

                                borderRadius: `${R}px`,
                                borderTopLeftRadius: ownMessage ? `${top}px` : `${CUT}px`,
                                borderTopRightRadius: ownMessage ? `${CUT}px` : `${top}px`,
                                borderBottomLeftRadius: `${R}px`,
                                borderBottomRightRadius: `${R}px`,

                                backgroundColor: ownMessage ? '#8f4aa6' : theme.palette.background.paper,
                                color: ownMessage ? 'rgba(255,255,255,0.96)' : theme.palette.text.primary,

                                boxShadow: ownMessage
                                  ? `0 6px 18px ${alpha(theme.palette.primary.main, 0.18)}`
                                  : '0 1px 4px rgba(0,0,0,0.06)',

                                overflowWrap: 'anywhere'
                              };
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                mb: item.attachments.length > 0 ? 0.8 : 0.4,
                                lineHeight: 1.32,
                                whiteSpace: 'pre-wrap'
                              }}
                            >
                              {item.text}
                            </Typography>

                            {item.attachments.length > 0 ? (
                              <Stack spacing={0.5} sx={{ mb: 0.75 }}>
                                {item.attachments.map((attachment) => (
                                  <Chip
                                    key={attachment.id}
                                    size="small"
                                    label={attachment.name}
                                    variant="outlined"
                                    onClick={() => onDownloadAttachment(attachment.download_url, attachment.name)}
                                    sx={(theme) => ({
                                      alignSelf: ownMessage ? 'flex-end' : 'flex-start',
                                      borderColor: ownMessage ? alpha('#ffffff', 0.35) : theme.palette.divider,
                                      color: ownMessage ? 'rgba(255,255,255,0.92)' : theme.palette.text.primary,
                                      backgroundColor: ownMessage ? alpha('#000', 0.12) : theme.palette.background.default,
                                      '& .MuiChip-label': { color: 'inherit' }
                                    })}
                                  />
                                ))}
                              </Stack>
                            ) : null}

                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: 0.6,
                                mt: 0.2
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 12,
                                  lineHeight: 1,
                                  color: ownMessage ? alpha('#fff', 0.82) : 'text.secondary'
                                }}
                              >
                                {formatTime(item.created_at)}
                              </Typography>

                              {ownMessage ? <MessageStatusIcon status={item.status} /> : null}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmitMessage)}>
              <TextField
                placeholder="Введите комментарий"
                multiline
                minRows={3}
                fullWidth
                disabled={!canSendMessage || isSending}
                error={Boolean(errors.text)}
                helperText={errors.text?.message}
                {...register('text')}
                onFocus={() => void onMessageInputFocus()}
              />

              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {attachedFiles.map((file) => (
                  <Chip
                    key={getFileKey(file)}
                    label={file.name}
                    size="small"
                    onDelete={() => handleRemoveAttachedFile(file)}
                  />
                ))}
              </Stack>

              {canSendMessageWithAttachments ? (
                <Button variant="text" component="label" disabled={isSending} sx={{ mt: 1, px: 0 }}>
                  Прикрепить файлы
                  <Controller
                    control={control}
                    name="files"
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={(event) => {
                          const nextFiles = Array.from(event.target.files ?? []);
                          onChange(mergeUniqueFiles(value ?? [], nextFiles));
                          event.target.value = '';
                        }}
                      />
                    )}
                  />
                </Button>
              ) : null}

              <Button
                type="submit"
                sx={{ mt: 1, alignSelf: 'flex-end', minWidth: 140, px: 4, boxShadow: 'none' }}
                variant="contained"
                disabled={!canSendMessage || isSending || !messageText.trim()}
              >
                {isSending ? 'Отправляем...' : 'Отправить'}
              </Button>
            </Box>
          </Stack>
        </>
      ) : (
        <Box sx={{ p: 1 }}>
          <Button variant="text" size="small" onClick={() => onToggleOpen(true)}>
            Чат
          </Button>
        </Box>
      )}
    </Paper>
  );
};
