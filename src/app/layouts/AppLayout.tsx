import { Box, Button, Stack, Typography } from '@mui/material';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';

const navLinkStyles = {
  textDecoration: 'none'
};

export const AppLayout = () => {
  const { session, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const roleId = session?.roleId ?? null;
  const navItems = roleId === 1
    ? [
        { label: 'Пользователи', to: '/admin' },
        { label: 'Заявки', to: '/requests' }
      ]
    : [{ label: 'Заявки', to: '/requests' }];
  const isRequestsListPage = location.pathname === '/requests';

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'background.default',
          padding: { xs: 2, md: 3 }
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={2}
          sx={(theme) => ({
            padding: { xs: 2, sm: 2.5 },
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 10px 24px rgba(15, 35, 75, 0.08)'
          })}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Order Web
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} style={navLinkStyles}>
                  {({ isActive }) => (
                    <Button
                      variant="outlined"
                      sx={(theme) => ({
                        paddingX: 3,
                        backgroundColor: isActive ? theme.palette.primary.light : undefined
                      })}
                    >
                      {item.label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1}>
            {isRequestsListPage ? (
              <Button
                variant="contained"
                sx={{ paddingX: 3, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                onClick={() => navigate('/requests/create')}
              >
                Создать заявку
              </Button>
            ) : null}
            <Button
              variant="outlined"
              sx={(theme) => ({
                paddingX: 3,
                backgroundColor: theme.palette.primary.light
              })}
              onClick={logout}
            >
              Выйти
            </Button>
          </Stack>
        </Stack>
      </Box>
      <Box component="main" sx={{ padding: { xs: 2, md: 4 } }}>
        <Outlet />
      </Box>
    </Box>
  );
};
