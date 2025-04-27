// ========================================================================
// INICIO: Contenido MODIFICADO para TopAppBar.tsx (Fase 1: Layout y Menú Usuario)
// ========================================================================
import React, { useState } from 'react'; // Importa useState
import {
    AppBar, Toolbar, Typography, Button, Box, Stack, Avatar, Chip, Tooltip, IconButton, Menu, MenuItem // <-- Añadidos Menu, MenuItem
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Icono genérico para usuario
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
// Importa los hooks/selectores necesarios de tu store Zustand
import { useIsAuthenticated, useCurrentUser, useAuthActions, useCurrentUserRole } from '../../store/authStore';
// Quitamos UserRole y theme si no se usan directamente aquí por ahora

// Helper para obtener iniciales (sin cambios)
const getInitials = (name?: string | null): string => { if (!name) return '?'; const names = name.split(' '); if (names.length > 1) { return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase(); } else if (names.length === 1 && names[0].length > 0) { return names[0][0].toUpperCase(); } return '?'; };

function TopAppBar() {
    const isAuthenticated = useIsAuthenticated();
    const currentUser = useCurrentUser();
    const userRole = useCurrentUserRole();
    const { logout } = useAuthActions();
    const navigate = useNavigate();

    // --- Estado para el Menú de Usuario ---
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };
    // -------------------------------------

    const handleLogout = () => {
        handleCloseUserMenu(); // Cierra el menú primero
        logout();
        navigate('/login');
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
                    // --- Vista Usuario Autenticado (NUEVO LAYOUT) ---
                    <Stack direction="row" spacing={1.5} alignItems="center">

                        {/* TODO: Aquí iría el mapeo de Badges de Rol (Fase 2) */}
                        {/* <Stack direction="row" spacing={0.5}> ... badges ... </Stack> */}

                        {/* Nombre Usuario */}
                        <Typography sx={{ display: { xs: 'none', sm: 'block' } }}> {/* Oculta nombre en pantallas muy pequeñas si es necesario */}
                            {currentUser.name || currentUser.email}
                        </Typography>

                        {/* Icono Usuario Clickable */}
                        <Tooltip title="Opciones de Usuario">
                            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                {/* Usamos Avatar con iniciales */}
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        fontSize: '0.875rem',
                                        // Podríamos añadir un color de fondo o borde si quisiéramos,
                                        // pero por ahora lo dejamos simple.
                                        // bgcolor: 'secondary.main'
                                    }}
                                >
                                    {getInitials(currentUser.name)}
                                </Avatar>
                                {/* Alternativa: Usar un icono genérico */}
                                {/* <AccountCircleIcon sx={{ color: 'white' }} /> */}
                            </IconButton>
                        </Tooltip>

                        {/* Menú de Usuario */}
                        <Menu
                            sx={{ mt: '65px' }} // Ajusta el margen superior si es necesario
                            id="menu-appbar"
                            anchorEl={anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorElUser)}
                            onClose={handleCloseUserMenu}
                        >
                            {/* --- NUEVO: Acceso al Panel de Control --- */}
                            {(userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                                <MenuItem onClick={() => { navigate('/panel-control'); handleCloseUserMenu(); }}>
                                    <AdminPanelSettingsIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                    <Typography textAlign="center">Panel de Control</Typography>
                                </MenuItem>
                            )}
                            {/* ----------------------------------------- */}

                            {/* TODO: Añadir aquí item "Mi Perfil/Configuración" */}

                            {/* MenuItem para Logout */}
                            <MenuItem onClick={handleLogout}>
                                <LogoutIcon sx={{ mr: 1, fontSize: '1.2rem' }} /> {/* Icono dentro del menú */}
                                <Typography textAlign="center">Cerrar Sesión</Typography>
                            </MenuItem>
                        </Menu>

                    </Stack>
                ) : (
                    // --- Vista Usuario No Autenticado (Sin cambios) ---
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
// FIN: Contenido MODIFICADO para TopAppBar.tsx (Fase 1: Layout y Menú Usuario)
// ========================================================================