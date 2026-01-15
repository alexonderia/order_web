import { Box, Chip, Stack, Typography } from '@mui/material';

const columns = [
    'id',
    'Описание',
    'Статус',
    'Прием КП до',
    'Открыта',
    'Закрыта',
    'Номер КП',
    'Создатель',
    'Последнее обновление',
    'Уведомление'
];

const rows = [
    {
        id: '1245',
        description: 'Запрос на поставку',
        status: 'В работе',
        proposalUntil: '12.08.2024',
        opened: '10.08.2024',
        closed: '-',
        proposalNumber: 'KP-232',
        author: 'Иванов И.',
        updated: '11.08.2024 12:45',
        notification: 'info'
    },
    {
        id: '1246',
        description: 'Доп. позиции',
        status: 'Новое',
        proposalUntil: '13.08.2024',
        opened: '11.08.2024',
        closed: '-',
        proposalNumber: 'KP-233',
        author: 'Петров П.',
        updated: '11.08.2024 14:15',
        notification: 'success'
    },
    {
        id: '1247',
        description: 'Повторный запрос',
        status: 'Закрыта',
        proposalUntil: '08.08.2024',
        opened: '01.08.2024',
        closed: '09.08.2024',
        proposalNumber: 'KP-229',
        author: 'Сидоров С.',
        updated: '09.08.2024 09:10',
        notification: 'error'
    }
];

const gridTemplate = '0.6fr 2fr 1.2fr 1.2fr 1.1fr 1.1fr 1.1fr 1.2fr 1.3fr 1.1fr';

const cellSx = {
    paddingY: 1.4,
    paddingX: 1.5,
    borderRight: '1px solid rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center'
};

export const RequestsTable = () => {
    return (
        <Box
            sx={{
                backgroundColor: '#d9d9d9',
                borderRadius: 3,
                padding: 2,
                border: '1px solid rgba(0,0,0,0.3)',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplate,
                    alignItems: 'stretch'
                }}
            >
                {columns.map((column) => (
                    <Box key={column} sx={{ ...cellSx, fontWeight: 600 }}>
                        <Typography variant="body2">{column}</Typography>
                    </Box>
                ))}
                {rows.map((row) => (
                    <Box
                        key={row.id}
                        sx={{
                            display: 'contents'
                        }}
                    >
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.id}</Typography>
                        </Box>
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.description}</Typography>
                        </Box>
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.status}</Typography>
                        </Box>
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.proposalUntil}</Typography>
                        </Box>
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.opened}</Typography>
                        </Box>
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.closed}</Typography>
                        </Box>
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.proposalNumber}</Typography>
                        </Box>
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.author}</Typography>
                        </Box>
                        <Box sx={cellSx}>
                            <Typography variant="body2">{row.updated}</Typography>
                        </Box>
                        <Box sx={{ ...cellSx, borderRight: 'none' }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {row.notification === 'info' && (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip label="5" size="small" sx={{ backgroundColor: '#2e7d32', color: '#fff' }} />
                                        <Chip label="5" size="small" sx={{ backgroundColor: '#c62828', color: '#fff' }} />
                                    </Stack>
                                )}
                                {row.notification === 'success' && (
                                    <Chip label="Новое предложение" size="small" sx={{ backgroundColor: '#2e7d32', color: '#fff' }} />
                                )}
                                {row.notification === 'error' && (
                                    <Chip label="Отмена сделки" size="small" sx={{ backgroundColor: '#c62828', color: '#fff' }} />
                                )}
                            </Stack>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};