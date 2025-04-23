import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Para enlaces de navegación

function TopAppBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            SECPLAN Gestor Proyectos
          </RouterLink>
        </Typography>
        {/* Aquí podrías añadir botones Login/Logout condicionalmente después */}
        {/* <Button color="inherit">Login</Button> */}
        <Typography variant="caption" sx={{ ml: 2 }}>
          (TopAppBar Rendered) {/* Mensaje de prueba */}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default TopAppBar;