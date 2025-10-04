import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Quiz,
  People,
  Analytics,
  Person,
  Logout,
  Add,
  Assignment,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  adminOnly?: boolean;
  userOnly?: boolean;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '' },
  { text: 'Quizzes', icon: <Quiz />, path: 'quizzes', adminOnly: true },
  { text: 'Create Quiz', icon: <Add />, path: 'quizzes/create', adminOnly: true },
  { text: 'Users', icon: <People />, path: 'users', adminOnly: true },
  { text: 'Results', icon: <Analytics />, path: 'results', adminOnly: true },
  { text: 'My Quizzes', icon: <Assignment />, path: 'my-quizzes', userOnly: true },
  { text: 'Profile', icon: <Person />, path: 'profile', userOnly: true },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const basePath = user?.role === 'admin' ? '/admin' : '/user';
  const currentPath = location.pathname.replace(basePath, '') || '/';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(`${basePath}/${path}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    if (item.userOnly && user?.role !== 'user') return false;
    return true;
  });

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.125rem',
            }}
          >
            V
          </Box>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Verto Quiz
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ mx: 2 }} />
      <Box sx={{ flex: 1, px: 1, py: 2 }}>
        <List sx={{ '& .MuiListItem-root': { px: 0 } }}>
          {filteredNavItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={currentPath === `/${item.path}`}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    color: '#6366f1',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#6366f1',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: '#64748b',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                color: '#6366f1',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600,
                color: '#0f172a',
                fontSize: '1.125rem',
              }}
            >
              {user?.role === 'admin' ? 'Admin Panel' : 'User Dashboard'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#64748b',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {user?.role === 'admin' ? 'Management Console' : 'Learning Platform'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  color: '#0f172a',
                  fontSize: '0.875rem',
                }}
              >
                {user?.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '0.75rem',
                  textTransform: 'capitalize',
                }}
              >
                {user?.role}
              </Typography>
            </Box>
            <IconButton 
              onClick={handleMenuClick} 
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            border: '1px solid #f1f5f9',
            mt: 1,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleNavigation('profile')}
          sx={{
            borderRadius: 1,
            mx: 1,
            my: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              color: '#6366f1',
              '& .MuiListItemIcon-root': {
                color: '#6366f1',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Person fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={500}>Profile</Typography>
        </MenuItem>
        <MenuItem 
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            mx: 1,
            my: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              '& .MuiListItemIcon-root': {
                color: '#ef4444',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={500}>Logout</Typography>
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          position: 'relative',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: '1400px',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
