import { Button, Typography } from '@mui/material';
import type { WebUser } from '@shared/api/getWebUsersByRole';
import { DataTable } from '@shared/components/DataTable';

const columns = [
  { key: 'login', label: 'login' },
  { key: 'id_role', label: 'id_role' },
  { key: 'role', label: 'role' },
  { key: 'actions', label: '' }
];
const gridTemplate = '1.2fr 0.6fr 1fr 1fr';

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
      gridTemplateColumns={gridTemplate}
      rowKey={(user) => user.id}
      isLoading={isLoading}
      emptyMessage="Экономисты не найдены."
      renderRow={(user) => [
        <Typography variant="body2">{user.id}</Typography>,
        <Typography variant="body2">{user.id_role}</Typography>,
        <Typography variant="body2">{getRoleLabel(user.id_role)}</Typography>,
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
      ]}
    />
  );
};