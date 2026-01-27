import { Button, Typography } from '@mui/material';
import type { WebUser } from '@shared/api/getWebUsersByRole';
import { DataTable } from '@shared/components/DataTable';

const columns = [
  { key: 'login', label: 'login', minWidth: 160, fraction: 1.2 },
  { key: 'id_role', label: 'id_role', minWidth: 100, fraction: 0.6 },
  { key: 'role', label: 'role', minWidth: 160, fraction: 1 },
  { key: 'actions', label: '', minWidth: 140, fraction: 1 }
];

type EconomistsTableProps = {
  users: WebUser[];
  isLoading?: boolean;
  getRoleLabel: (roleId: number) => string;
  onEdit: (user: WebUser) => void;
};

export const EconomistsTable = ({ users, isLoading, getRoleLabel, onEdit }: EconomistsTableProps) => {
  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey={(user) => user.id}
      isLoading={isLoading}
      emptyMessage="Экономисты не найдены."
      storageKey="economists-table"
      renderRow={(user) => [
        <Typography variant="body2">{user.id}</Typography>,
        <Typography variant="body2">{user.id_role}</Typography>,
        <Typography variant="body2">{getRoleLabel(user.id_role)}</Typography>,
        <Button
          variant="outlined"
          size="small"
          sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          onClick={() => onEdit(user)}
        >
          Изменить
        </Button>
      ]}
    />
  );
};