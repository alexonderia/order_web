import { Typography } from '@mui/material';
import type { TelegramUser } from '@shared/api/getTelegramUsers';
import { DataTable } from '@shared/components/DataTable';

const columns = [
  { key: 'id', label: 'id' },
  { key: 'tg_username', label: 'tg_username' },
  { key: 'real_name', label: 'real_name' },
  { key: 'id_contacts', label: 'id_contacts' },
  { key: 'id_role', label: 'id_role' }
];
const gridTemplate = '0.6fr 1.3fr 1.6fr 0.9fr 0.8fr';


type TelegramUsersTableProps = {
  users: TelegramUser[];
  isLoading?: boolean;
};

export const TelegramUsersTable = ({ users, isLoading }: TelegramUsersTableProps) => {
  return (
    <DataTable
      columns={columns}
      rows={users}
      gridTemplateColumns={gridTemplate}
      rowKey={(user) => user.id}
      isLoading={isLoading}
      emptyMessage="Контрагенты не найдены."
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