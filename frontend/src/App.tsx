import React from 'react';
import { Box, Container } from '@mui/material';
import AppRoutes from './routes/AppRoutes'; // Importa tus rutas
import TopAppBar from './components/layout/TopAppBar'; // Importa tu barra de navegación

function App() {
  // Estructura básica del Layout
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopAppBar /> {/* Renderiza la barra de navegación */}
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
         {/* Aquí se renderizará el componente de la ruta actual */}
         <AppRoutes />
      </Container>
      {/* Optional Footer */}
      {/* <Box component="footer" sx={{ p: 2, mt: 'auto', backgroundColor: 'grey.200' }}>...</Box> */}
    </Box>
  );
}

export default App;