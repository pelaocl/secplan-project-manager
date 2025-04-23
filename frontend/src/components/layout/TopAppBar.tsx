import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
// Importa los hooks/selectores necesarios de tu store Zustand
import { useIsAuthenticated, useCurrentUser, useAuthActions } from '../../store/authStore';

function TopAppBar() {
  // Obtiene el estado y las acciones del store
  const isAuthenticated = useIsAuthenticated();
  const currentUser = useCurrentUser();
  const { logout } = useAuthActions(); // Obtiene la acción logout
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Llama a la acción de Zustand para limpiar el estado
    // Opcional: Redirige al usuario a la página de login después de cerrar sesión
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Título/Logo (link a la página principal) */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            SECPLAN Gestor Proyectos
          </RouterLink>
        </Typography>

        {/* Renderizado Condicional: Muestra info de usuario y Logout O botón de Login */}
        {isAuthenticated && currentUser ? (
          // Usuario Autenticado
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ mr: 2 }} title={currentUser.email}> {/* Muestra email en tooltip */}
              {/* Muestra el nombre o email del usuario */}
              Hola, {currentUser.name || currentUser.email} ({currentUser.role}) {/* Muestra el rol también */}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </Box>
        ) : (
          // Usuario No Autenticado
          <Button color="inherit" component={RouterLink} to="/login">
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default TopAppBar;