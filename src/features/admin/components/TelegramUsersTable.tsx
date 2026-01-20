import { Box, Typography } from '@mui/material';
import type { TelegramUser } from '@shared/api/getTelegramUsers';

const columns = ['id', 'tg_username', 'real_name', 'id_contacts', 'id_role'];
const gridTemplate = '0.6fr 1.3fr 1.6fr 0.9fr 0.8fr';

const cellSx = {
  paddingY: 1.4,
  paddingX: 1.5,
  borderRight: '1px solid rgba(0,0,0,0.3)',
  borderBottom: '1px solid rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center'
};

type TelegramUsersTableProps = {
  users: TelegramUser[];
  isLoading?: boolean;
};

export const TelegramUsersTable = ({ users, isLoading }: TelegramUsersTableProps) => {
  return (
    <Box
      sx={{
        backgroundColor: '#d9d9d9',
        borderRadius: 2,
        padding: 2,
        border: '1px solid rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column'
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
        </Box>
        {isLoading && (
          <Box sx={{ padding: 2 }}>
            <Typography variant="body2">Загрузка...</Typography>
          </Box>
        )}
        {!isLoading && users.length === 0 && (
          <Box sx={{ padding: 2 }}>
            <Typography variant="body2">Контрагенты не найдены.</Typography>
          </Box>
        )}
        {!isLoading &&
          users.map((user) => (
            <Box
              key={user.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: gridTemplate,
                alignItems: 'stretch',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: '#ffffff'
                }
              }}
            >
              <Box sx={cellSx}>
                <Typography variant="body2">{user.id}</Typography>
              </Box>
              <Box sx={cellSx}>
                <Typography variant="body2">{user.tg_username ?? '-'}</Typography>
              </Box>
              <Box sx={cellSx}>
                <Typography variant="body2">{user.real_name ?? '-'}</Typography>
              </Box>
              <Box sx={cellSx}>
                <Typography variant="body2">{user.id_contacts ?? '-'}</Typography>
              </Box>
              <Box sx={{ ...cellSx, borderRight: 'none' }}>
                <Typography variant="body2">{user.id_role ?? '-'}</Typography>
              </Box>
            </Box>
          ))}
      </Box>
    </Box>
  );
};