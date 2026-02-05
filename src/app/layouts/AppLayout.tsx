import { Box, Button, Stack, Typography } from '@mui/material';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';

const navLinkStyles = {
  textDecoration: 'none'
};

type SidebarItem = {
  label: string;
  to?: string;
  disabled?: boolean;
};

export const AppLayout = () => {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const roleId = session?.roleId ?? null;
  const sidebarItems: SidebarItem[] = roleId === 1
    ? [
      { label: 'Пользователи', to: '/admin' },
      { label: 'Заявки', to: '/requests' },
      { label: 'Офферы', disabled: true },
      { label: 'Роли', disabled: true }
    ]
    : [{ label: 'Заявки', to: '/requests' }];
  const isRequestsListPage = location.pathname === '/requests';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '260px minmax(0, 1fr)' },
        gap: { xs: 2, lg: 3 },
        p: { xs: 2, md: 3 }
      }}
    >
      <Stack
        component="aside"
        justifyContent="space-between"
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "12px",
          backgroundColor: theme.palette.background.paper,
          p: 2,
          minHeight: { xs: 'auto', lg: 'calc(100vh - 48px)' }
        })}
      >
        <Stack spacing={1.5}>
          <Typography variant="h6" fontWeight={700} sx={{ px: 1 }}>
            Order Web
          </Typography>
          {sidebarItems.map((item) => {
            if (!item.to) {
              return (
                <Button
                  key={item.label}
                  variant="outlined"
                  disabled={item.disabled}
                  sx={{ justifyContent: 'flex-start', px: 2.5, height: 44 }}
                >
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
                      justifyContent: 'flex-start',
                      px: 2.5,
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

        <Button variant="outlined" onClick={logout} sx={{ justifyContent: 'flex-start', px: 2.5, height: 44 }}>
          Выйти
        </Button>
      </Stack>

      <Stack component="section" spacing={2} sx={{ minWidth: 0 }}>
        {isRequestsListPage ? (
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              sx={{ px: 3, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
              onClick={() => navigate('/requests/create')}
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
};