import { Box, Button, Stack, Typography } from '@mui/material';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';
import { hasAvailableAction } from '@shared/auth/availableActions';

const navLinkStyles = {
  textDecoration: 'none'
};

type NavItem = {
  label: string;
  to?: string;
  disabled?: boolean;
};

const superadminItems: NavItem[] = [
  { label: 'Пользователи', to: '/admin' },
  { label: 'Заявки', to: '/requests' },
  { label: 'Офферы', disabled: true },
  { label: 'Роли', disabled: true }
];


export const AppLayout = () => {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const roleId = session?.roleId ?? null;
  const isSuperadmin = roleId === 1;
  const isRequestsListPage = location.pathname === '/requests';
  const isRequestDetailsPage = /^\/requests\/\d+$/.test(location.pathname);
  const canCreateRequest = hasAvailableAction(session, '/api/v1/requests', 'POST');
  
  const sidebarButtons = (
    <Stack spacing={1.8}>
      {superadminItems.map((item) => {
        if (!item.to) {
          return (
            <Button key={item.label} variant="outlined" disabled={item.disabled} sx={{ height: 44 }}>
              {item.label}
            </Button>
          );
        }
        return (
          <NavLink key={item.to} to={item.to} style={navLinkStyles}>
            {({ isActive }) => (
              <Button
                variant="outlined"
                sx={(theme) => ({
                  height: 44,
                  width: '100%',
                  backgroundColor: isActive ? theme.palette.primary.light : theme.palette.background.paper
                })}
              >
                {item.label}
              </Button>
            )}
          </NavLink>
        );
      })}
    </Stack>
  );

  if (isSuperadmin) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
          gap: { xs: 2, lg: 2.5 },
          p: { xs: 1.5, md: 2 }
        }}
      >
        <Stack
          component="aside"
          justifyContent="space-between"
          sx={(theme) => ({
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
            p: 2,
            minHeight: { xs: 'auto', lg: 'calc(100vh - 32px)' }
          })}
        >
          {sidebarButtons}

          <Button variant="outlined" onClick={logout} sx={{ height: 44 }}>
            Выйти
          </Button>
        </Stack>
        <Stack component="section" spacing={2} sx={{ minWidth: 0 }}>
          {isRequestsListPage && canCreateRequest ? (
            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                sx={{ px: 3, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                onClick={() => navigate('/requests/create', { state: { backgroundLocation: location } })}
              >
                Создать заявку
              </Button>
            </Stack>
          ) : null}

          <Box component="main">
            <Outlet />
          </Box>
        </Stack>
      </Box>
    );
  }


  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', p: { xs: 1.5, md: 2.5 } }}>
      <Stack component="header" direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        {isRequestDetailsPage ? (
          <Button
            variant="outlined"
            sx={{ px: 4, borderColor: 'primary.main', color: 'primary.main', whiteSpace: 'nowrap' }}
            onClick={() => navigate('/requests')}
          >
            К списку заявок
          </Button>
        ) : isRequestsListPage && canCreateRequest ? (
          <Button
            variant="contained"
            sx={{ px: 3, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
            onClick={() => navigate('/requests/create', { state: { backgroundLocation: location } })}
          >
            Создать заявку
          </Button>
        ) : (
          <Box />
        )}
        <Stack direction="row" spacing={3} alignItems="center">
          <Typography variant="h6">профиль</Typography>
          <Button variant="outlined" onClick={logout}>
            Выйти
          </Button>
        </Stack>
      </Stack>

      <Box component="main">
        <Outlet />
      </Box>
    </Box>
  );
};