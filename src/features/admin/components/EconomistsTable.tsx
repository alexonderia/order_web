import { Box, Button, Typography } from '@mui/material';
import type { WebUser } from '@shared/api/getWebUsersByRole';

const columns = ['login', 'id_role', 'role', ''];
const gridTemplate = '1.2fr 0.6fr 1fr 1fr';

const cellSx = {
  paddingY: 1.4,
  paddingX: 1.5,
  borderRight: '1px solid rgba(0,0,0,0.3)',
  borderBottom: '1px solid rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center'
};

type EconomistsTableProps = {
  users: WebUser[];
  isLoading?: boolean;
  getRoleLabel: (roleId: number) => string;
  onEdit: (user: WebUser) => void;
};

export const EconomistsTable = ({ users, isLoading, getRoleLabel, onEdit }: EconomistsTableProps) => {
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
          {columns.map((column, index) => (
            <Box key={`${column}-${index}`} sx={{ ...cellSx, fontWeight: 600 }}>
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
            <Typography variant="body2">Экономисты не найдены.</Typography>
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
                <Typography variant="body2">{user.id_role}</Typography>
              </Box>
              <Box sx={cellSx}>
                <Typography variant="body2">{getRoleLabel(user.id_role)}</Typography>
              </Box>
              <Box sx={{ ...cellSx, borderRight: 'none' }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    borderColor: '#1f1f1f',
                    color: '#1f1f1f'
                  }}
                  onClick={() => onEdit(user)}
                >
                  Изменить
                </Button>
              </Box>
            </Box>
          ))}
      </Box>
    </Box>
  );
};