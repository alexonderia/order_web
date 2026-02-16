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

  [...currentFiles, ...addedFiles].forEach((file) => {
    fileMap.set(getFileKey(file), file);
  });

  return Array.from(fileMap.values());
};

const formatTime = (value: string | null) => {
  if (!value) {
    return '--:--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const MessageStatusIcon = ({ status }: { status: OfferWorkspaceMessage['status'] }) => {
  if (status === 'send') {
    return (
      <SvgIcon sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.9 }}>
        <path d="M1.73 12.91 0.32 11.5l5.2-5.2 1.41 1.41z" />
      </SvgIcon>
    );
  }

  const color = status === 'read' ? 'primary.main' : 'text.secondary';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', position: 'relative', width: 16, height: 16 }}>
      <SvgIcon sx={{ fontSize: 16, color, opacity: status === 'read' ? 1 : 0.8, position: 'absolute', left: -3 }}>
        <path d="M1.73 12.91 0.32 11.5l5.2-5.2 1.41 1.41z" />
      </SvgIcon>
      <SvgIcon sx={{ fontSize: 16, color, opacity: status === 'read' ? 1 : 0.8, position: 'absolute', left: 3 }}>
        <path d="M1.73 12.91 0.32 11.5l5.2-5.2 1.41 1.41z" />
      </SvgIcon>
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
    defaultValues: {
      text: '',
      files: []
    }
  });

  const attachedFiles = watch('files');
  const messageText = watch('text');

  const handleRemoveAttachedFile = (fileToRemove: File) => {
    const nextFiles = attachedFiles.filter((file) => getFileKey(file) !== getFileKey(fileToRemove));
    setValue('files', nextFiles, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  const onSubmitMessage = async (values: ChatFormValues) => {
    if (!canSendMessage) {
      return;
    }

    const trimmedText = values.text.trim();
    if (!trimmedText) {
      return;
    }

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
                    const ownMessage = item.user_id === sessionLogin;
                    return (
                      <Box
                        key={item.id}
                        sx={(theme) => ({
                          backgroundColor: ownMessage ? alpha(theme.palette.primary.main, 0.14) : theme.palette.background.paper,
                          color: theme.palette.text.primary,
                          border: `1px solid ${ownMessage ? alpha(theme.palette.primary.main, 0.35) : theme.palette.divider}`,
                          borderRadius: 2.5,
                          px: 1.6,
                          py: 1,
                          alignSelf: ownMessage ? 'flex-end' : 'flex-start',
                          textAlign: 'left',
                          maxWidth: '82%',
                          minWidth: 140,
                          boxShadow: ownMessage ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.14)}` : '0 1px 4px rgba(0,0,0,0.06)'
                        })}
                      >
                        <Typography variant="body1" sx={{ mb: item.attachments.length > 0 ? 0.8 : 0.35, lineHeight: 1.32 }}>
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
                                  borderColor: ownMessage ? alpha(theme.palette.primary.main, 0.45) : theme.palette.divider,
                                  color: theme.palette.text.primary,
                                  backgroundColor: ownMessage ? alpha(theme.palette.primary.main, 0.06) : theme.palette.background.default,
                                  '& .MuiChip-label': {
                                    color: 'inherit'
                                  }
                                })}
                              />
                            ))}
                          </Stack>
                        ) : null}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.7, mt: 0.2 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatTime(item.created_at)}
                          </Typography>
                          {ownMessage ? <MessageStatusIcon status={item.status} /> : null}
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
                  <Chip key={getFileKey(file)} label={file.name} size="small" onDelete={() => handleRemoveAttachedFile(file)} />
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
