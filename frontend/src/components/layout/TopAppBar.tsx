// ========================================================================
// INICIO: Contenido COMPLETO y CORREGIDO para TopAppBar.tsx (v3 - Posición Menú)
// ========================================================================
import React, { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, Stack, Avatar, Chip, Tooltip, IconButton, Menu, MenuItem, useTheme
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // O el icono que prefieras
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Para el item de menú
// Importa los hooks/selectores necesarios de tu store Zustand
import { useIsAuthenticated, useCurrentUser, useAuthActions, useCurrentUserRole } from '../../store/authStore';
import { UserRole } from '../../types';

// Helper para obtener iniciales del nombre (simple)
const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    } else if (names.length === 1 && names[0].length > 0) {
        return names[0][0].toUpperCase();
    }
    return '?';
};

function TopAppBar() {
    const theme = useTheme(); // Accede al tema si necesitas colores específicos
    const isAuthenticated = useIsAuthenticated();
    const currentUser = useCurrentUser();
    const { logout } = useAuthActions();
    const navigate = useNavigate();
    const userRole = useCurrentUserRole();

    // Estado para el Menú de Usuario
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = () => {
        handleCloseUserMenu(); // Cierra el menú primero
        logout();
        navigate('/login');
    };

    // Navega al panel de admin (que redirige a la primera pestaña)
    const goToAdminPanel = () => {
        navigate('/admin'); // Navega a la ruta padre del layout admin
        handleCloseUserMenu();
    };


    return (
        <AppBar position="static" elevation={1}>
            <Toolbar>
                {/* Título/Logo */}
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        SECPLAN Gestor Proyectos
                    </RouterLink>
                </Typography>

                {/* Info Usuario y Logout / Botón Login */}
                {isAuthenticated && currentUser ? (
                    // Vista Usuario Autenticado
                    <Stack direction="row" spacing={1.5} alignItems="center">

                        {/* TODO: Placeholder para futuros Badges de Rol/Etiqueta */}
                        {/* <Stack direction="row" spacing={0.5}>...</Stack> */}

                        {/* Nombre Usuario */}
                        <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500 }}>
                            {currentUser.name || currentUser.email}
                        </Typography>

                        {/* Icono Usuario Clickable */}
                        <Tooltip title="Opciones">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        fontSize: '0.875rem',
                                        bgcolor: 'secondary.light', // Puedes usar un color del tema
                                        color: 'secondary.contrastText'
                                    }}
                                >
                                    {getInitials(currentUser.name)}
                                </Avatar>
                            </IconButton>
                        </Tooltip>

                        {/* Menú de Usuario (Posición Corregida) */}
                        <Menu
                            // Quitamos sx={{ mt: '45px' }}
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            // Origen del ancla: Debajo y a la derecha del botón
                            anchorOrigin={{
                                vertical: 'bottom', // <-- Debajo del icono
                                horizontal: 'right',
                            }}
                            keepMounted
                            // Origen de la transformación: Esquina superior derecha del menú
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            {/* Item Panel Admin (Condicional) */}
                            {(userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                                <MenuItem onClick={goToAdminPanel}> {/* Llama a la función de navegación */}
                                    <AdminPanelSettingsIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                    <Typography textAlign="center">Panel Admin</Typography>
                                </MenuItem>
                            )}
                            {/* Puedes añadir más items aquí (ej. Mi Perfil) */}

                            {/* Item Logout */}
                            <MenuItem onClick={handleLogout}>
                                <LogoutIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                <Typography textAlign="center">Cerrar Sesión</Typography>
                            </MenuItem>
                        </Menu>

                    </Stack>
                ) : (
                    // Vista Usuario No Autenticado
                    <Button color="inherit" component={RouterLink} to="/login">
                        Login
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default TopAppBar;
// ========================================================================
// FIN: Contenido COMPLETO y CORREGIDO para TopAppBar.tsx (v3 - Posición Menú)
// ========================================================================