import { Box, Typography } from '@mui/material';
import type { UserListItem } from '@shared/api/getUsers';

type UsersTableProps = {
  users: UserListItem[];
  isLoading?: boolean;
  emptyMessage: string;
  getRoleLabel: (roleId: number) => string;
};

const cellSx = {
  px: 2,
  py: 1,
  minHeight: 42,
  display: 'flex',
  alignItems: 'center'
};

export const UsersTable = ({ users, isLoading, emptyMessage, getRoleLabel }: UsersTableProps) => {
  const rows = users.map((user) => ({
    id: user.user_id,
    password: '—',
    id_role: user.role_id,
    role: getRoleLabel(user.role_id)
  }));

  return (
    <Box
      sx={{
        backgroundColor: '#ececec',
        borderRadius: "12px",
        border: '1px solid #cfcfcf',
        p: { xs: 1.5, md: 2.5 },
        minHeight: 520
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          borderBottom: '1px solid #a7a7a7'
        }}
      >
        {['id', 'password', 'id_role', 'role'].map((header, index) => (
          <Box key={header} sx={{ ...cellSx, borderRight: index !== 3 ? '1px solid #a7a7a7' : 'none' }}>
            <Typography fontWeight={500}>{header}</Typography>
          </Box>
        ))}
      </Box>

      {isLoading ? (
        <Typography sx={{ p: 2 }}>Загрузка...</Typography>
      ) : rows.length === 0 ? (
        <Typography sx={{ p: 2 }}>{emptyMessage}</Typography>
      ) : (
        rows.map((row) => (
          <Box
            key={row.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'
            }}
          >
            {[row.id, row.password, row.id_role, row.role].map((value, index) => (
              <Box key={`${row.id}-${index}`} sx={{ ...cellSx, borderRight: index !== 3 ? '1px solid #a7a7a7' : 'none' }}>
                <Typography>{String(value)}</Typography>
              </Box>
            ))}
          </Box>
        ))
      )}
    </Box>
  );
};
