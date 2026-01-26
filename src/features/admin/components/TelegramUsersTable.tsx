import { Typography } from '@mui/material';
import type { TelegramUser } from '@shared/api/getTelegramUsers';
import { DataTable } from '@shared/components/DataTable';

const columns = [
  { key: 'id', label: 'id', minWidth: 60, fraction: 0.4 },
  { key: 'tg_username', label: 'tg_username', minWidth: 150, fraction: 1.3 },
  { key: 'real_name', label: 'real_name', minWidth: 170, fraction: 1.6 },
  { key: 'id_contacts', label: 'id_contacts', minWidth: 120, fraction: 0.9 },
  { key: 'id_role', label: 'id_role', minWidth: 100, fraction: 0.8 }
]


type TelegramUsersTableProps = {
  users: TelegramUser[];
  isLoading?: boolean;
};

export const TelegramUsersTable = ({ users, isLoading }: TelegramUsersTableProps) => {
  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey={(user) => user.id}
      isLoading={isLoading}
      emptyMessage="Контрагенты не найдены."
      storageKey="telegram-users-table"
      renderRow={(user) => [
        <Typography variant="body2">{user.id}</Typography>,
        <Typography variant="body2">{user.tg_username ?? '-'}</Typography>,
        <Typography variant="body2">{user.real_name ?? '-'}</Typography>,
        <Typography variant="body2">{user.id_contacts ?? '-'}</Typography>,
        <Typography variant="body2">{user.id_role ?? '-'}</Typography>
      ]}
    />
  );
};