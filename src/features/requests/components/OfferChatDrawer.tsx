import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    Stack,
    SvgIcon,
    TextField,
    Typography
} from '@mui/material';

export type OfferChatMessage = {
    id: string;
    text: string;
    createdAt: string;
    author: 'web' | 'tg';
};

type OfferChatDrawerProps = {
    open: boolean;
    offerId: number | null;
    messages: OfferChatMessage[];
    isSending?: boolean;
    errorMessage?: string | null;
    onClose: () => void;
    onSend: (message: string) => Promise<boolean>;
};

const formatMessageTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

export const OfferChatDrawer = ({
    open,
    offerId,
    messages,
    isSending = false,
    errorMessage,
    onClose,
    onSend
}: OfferChatDrawerProps) => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!open) {
            setMessage('');
        }
    }, [open]);

    const headerLabel = useMemo(() => {
        if (!offerId) {
            return 'Чат по офферу';
        }
        return `Чат по офферу №${offerId}`;
    }, [offerId]);

    const handleSubmit = async () => {
        const trimmed = message.trim();
        if (!trimmed) {
            return;
        }
        const isSuccess = await onSend(trimmed);
        if (isSuccess) {
            setMessage('');
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 420 },
                    borderTopLeftRadius: 16,
                    borderBottomLeftRadius: 16
                }
            }}
            sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', padding: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                    {headerLabel}
                </Typography>
                <IconButton onClick={onClose} aria-label="Закрыть чат">
                    <SvgIcon fontSize="small">
                        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </SvgIcon>
                </IconButton>
            </Box>
            <Divider />
            <Stack spacing={2} sx={{ padding: 2, height: '100%' }}>
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        borderRadius: 2,
                        backgroundColor: 'rgba(16, 63, 133, 0.04)',
                        padding: 2
                    }}
                >
                    {messages.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Сообщений пока нет.
                        </Typography>
                    ) : (
                        <Stack spacing={2} alignItems="stretch">
                            {messages.map((item) => {
                                const isWeb = item.author === 'web';
                                return (
                                <Box
                                    key={item.id}
                                    sx={{
                                        backgroundColor: isWeb ? '#ffffff' : 'rgba(25, 118, 210, 0.08)',
                                        borderRadius: 2,
                                        padding: 1.5,
                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                                        alignSelf: isWeb ? 'flex-end' : 'flex-start',
                                        textAlign: isWeb ? 'right' : 'left'
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        {isWeb ? 'Экономист' : 'Контрагент'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ marginBottom: 0.5 }}>
                                        {item.text}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatMessageTime(item.createdAt)}
                                    </Typography>
                                </Box>
                            );
                            })}
                        </Stack>
                    )}
                </Box>
                {errorMessage && (
                    <Typography variant="body2" color="error">
                        {errorMessage}
                    </Typography>
                )}
                <TextField
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Введите комментарий"
                    multiline
                    minRows={3}
                    disabled={isSending}
                />
                <Button
                    variant="contained"
                    onClick={() => void handleSubmit()}
                    disabled={isSending || !message.trim()}
                    sx={{ alignSelf: 'flex-end', paddingX: 4, boxShadow: 'none' }}
                >
                    {isSending ? 'Отправляем...' : 'Отправить'}
                </Button>
            </Stack>
        </Drawer>
    );
};