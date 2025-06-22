//frontend/src/components/layout/TopAppBar.tsx
import React, { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, Stack, Avatar, Tooltip, IconButton, Menu, MenuItem, useTheme
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// --- Iconos ---
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import ChecklistIcon from '@mui/icons-material/Checklist';

// --- Store de Autenticación ---
import { useIsAuthenticated, useCurrentUser, useAuthActions, useCurrentUserRole } from '../../store/authStore';

// --- Otros Componentes ---
import NotificationBell from './NotificationBell';
import ChatNotificationBell from './ChatNotificationBell';
// --- Helper para Iniciales ---
const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 0 || names[0] === '') return '?';
    
    if (names.length > 1 && names[0] && names[names.length - 1]) {
        const firstInitial = names[0][0];
        const lastInitial = names[names.length - 1][0];
        if (firstInitial && lastInitial) {
            return `${firstInitial}${lastInitial}`.toUpperCase();
        } else if (firstInitial) {
            return firstInitial.toUpperCase();
        }
    } else if (names.length === 1 && names[0].length > 0) {
        return names[0][0].toUpperCase();
    }
    return '?';
};

function TopAppBar() {
    const theme = useTheme();
    const isAuthenticated = useIsAuthenticated();
    const currentUser = useCurrentUser();
    const { logout } = useAuthActions();
    const navigate = useNavigate();
    const userRole = useCurrentUserRole();

    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = () => {
        handleCloseUserMenu();
        logout();
        navigate('/login');
    };

    const goToAdminPanel = () => {
        navigate('/admin');
        handleCloseUserMenu();
    };

    return (
        <AppBar position="static" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                {/* --- INICIO: NUEVO MENÚ DE NAVEGACIÓN A LA IZQUIERDA --- */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* Botón de Inicio */}
                    <Tooltip title="Ir al Listado de Proyectos">
                        <IconButton component={RouterLink} to="/" color="inherit" aria-label="ir a inicio">
                            <HomeIcon />
                        </IconButton>
                    </Tooltip>
                    
                    {/* Botón de Mis Tareas (para todos los usuarios logueados) */}
                    {isAuthenticated && (
                         <Button
                            component={RouterLink}
                            to="/mis-tareas"
                            color="inherit"
                            startIcon={<ChecklistIcon />}
                            sx={{
                                '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
                                minWidth: { xs: 'auto' },
                                px: { xs: 1, sm: 2 }
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                Mis Tareas
                            </Box>
                        </Button>
                    )}
                    
                    {/* Botón de Estadísticas (condicional y responsivo) */}
                    {(userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                        <Button
                            component={RouterLink}
                            to="/dashboard"
                            color="inherit"
                            startIcon={<DashboardIcon />}
                            sx={{
                                // Oculta el texto en 'xs', lo muestra desde 'sm'
                                '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, // Quita margen del icono si no hay texto
                                minWidth: { xs: 'auto' }, // Permite que el botón se encoja a solo el icono
                                px: { xs: 1, sm: 2 } // Ajusta padding para el modo icono
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                ESTADISTICAS
                            </Box>
                        </Button>
                    )}
                    {/* Aquí podrías añadir el botón "Mis Tareas" en el futuro */}
                </Box>
                {/* --- FIN: NUEVO MENÚ DE NAVEGACIÓN --- */}


                {/* --- Espaciador que empuja el menú de usuario a la derecha --- */}
                <Box sx={{ flexGrow: 1 }} />


                {/* --- Menú de Usuario a la Derecha --- */}
                {isAuthenticated && currentUser ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ChatNotificationBell />
                        <NotificationBell />
                        
                        <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
                            {currentUser.name || currentUser.email}
                        </Typography>

                        <Tooltip title="Opciones de Usuario">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: theme.palette.primary.dark, color: theme.palette.primary.contrastText }}>
                                    {getInitials(currentUser.name) || <PersonIcon />}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                            MenuListProps={{ sx: { py: 0.5 } }}
                        >
                            {(userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                                <MenuItem onClick={goToAdminPanel} sx={{fontSize: '0.9rem', py:1}}>
                                    <AdminPanelSettingsIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: 'action.active' }} />
                                    Panel Admin
                                </MenuItem>
                            )}
                            <MenuItem onClick={handleLogout} sx={{fontSize: '0.9rem', py:1}}>
                                <LogoutIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: 'action.active' }} />
                                Cerrar Sesión
                            </MenuItem>
                        </Menu>
                    </Stack>
                ) : (
                    <Button color="inherit" component={RouterLink} to="/login">
                        Login
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default TopAppBar;
