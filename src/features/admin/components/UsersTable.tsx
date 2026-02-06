import { Typography } from '@mui/material';
import type { UserListItem } from '@shared/api/getUsers';
import { DataTable } from '@shared/components/DataTable';

const columns = [
  { key: 'id', label: 'id', minWidth: 120, fraction: 1 },
  { key: 'password', label: 'password', minWidth: 180, fraction: 1.4 },
  { key: 'id_role', label: 'id_role', minWidth: 120, fraction: 1 },
  { key: 'role', label: 'role', minWidth: 180, fraction: 1.4 }
];

type UsersTableProps = {
  users: UserListItem[];
  isLoading?: boolean;
  emptyMessage: string;
  getRoleLabel: (roleId: number) => string;
};

type UserRow = {
  id: string;
  password: string;
  id_role: number;
  role: string;
};

export const UsersTable = ({ users, isLoading, emptyMessage, getRoleLabel }: UsersTableProps) => {
  const rows: UserRow[] = users.map((user) => ({
    id: user.user_id,
    password: '—',
    id_role: user.role_id,
    role: getRoleLabel(user.role_id)
  }));

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      storageKey="users-table"
      renderRow={(row) => [
        <Typography variant="body2">{row.id}</Typography>,
        <Typography variant="body2">{row.password}</Typography>,
        <Typography variant="body2">{row.id_role}</Typography>,
        <Typography variant="body2">{row.role}</Typography>
      ]}
    />
  );
};
