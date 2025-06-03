// frontend/src/components/layout/TopAppBar.tsx
import React, { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, Stack, Avatar, /* Chip, */ Tooltip, IconButton, Menu, MenuItem, useTheme // Chip no se usaba aquí
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
// import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // No se usaba, PersonIcon se usa en Avatar
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person'; // Para el Avatar fallback

// Importa los hooks/selectores necesarios de tu store Zustand
import { useIsAuthenticated, useCurrentUser, useAuthActions, useCurrentUserRole } from '../../store/authStore';
// import { UserRole } from '../../types'; // UserRole no se usa directamente aquí si useCurrentUserRole lo devuelve bien

// --- AÑADIR IMPORT PARA NOTIFICATIONBELL ---
import NotificationBell from './NotificationBell'; 
// -----------------------------------------


// Helper para obtener iniciales del nombre (simple)
const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 0 || names[0] === '') return '?'; // Manejar string vacío o solo espacios
    
    if (names.length > 1 && names[0] && names[names.length - 1]) {
        const firstInitial = names[0][0];
        const lastInitial = names[names.length - 1][0];
        if (firstInitial && lastInitial) { // Asegurarse de que las iniciales no sean undefined
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
        <AppBar position="static" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}> {/* Asegurar que esté sobre el drawer si tienes uno */}
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        SECPLAN - Gestor de Proyectos
                    </RouterLink>
                </Typography>

                {isAuthenticated && currentUser ? (
                    <Stack direction="row" spacing={1} alignItems="center"> {/* Reducido spacing a 1 para acomodar campana */}
                        
                        {/* --- CAMPANA DE NOTIFICACIONES AÑADIDA AQUÍ --- */}
                        <NotificationBell />
                        {/* ---------------------------------------------- */}

                        <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
                            {currentUser.name || currentUser.email}
                        </Typography>

                        <Tooltip title="Opciones de Usuario">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        fontSize: '0.875rem',
                                        // Usar primary o un color que contraste bien con el AppBar
                                        bgcolor: theme.palette.primary.dark, // O 'secondary.main' etc.
                                        color: theme.palette.primary.contrastText 
                                    }}
                                >
                                    {getInitials(currentUser.name) || <PersonIcon />}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                            MenuListProps={{ sx: { py: 0.5 } }} // Añade un poco de padding al MenuList
                        >
                            {(userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                                <MenuItem onClick={goToAdminPanel} sx={{fontSize: '0.9rem', py:1}}>
                                    <AdminPanelSettingsIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: 'action.active' }} />
                                    Panel Admin
                                </MenuItem>
                            )}
                            {/* Puedes añadir un Divider aquí si hay más items */}
                            {/* { (userRole === 'ADMIN' || userRole === 'COORDINADOR') && <Divider sx={{my:0.5}} /> } */}
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