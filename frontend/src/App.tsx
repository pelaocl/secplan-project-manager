import React from 'react';
import { Box } from '@mui/material'; // Quitamos Container de aquí
import AppRoutes from './routes/AppRoutes';
import TopAppBar from './components/layout/TopAppBar';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopAppBar />
      {/* CORREGIDO: Usamos Box en lugar de Container para permitir ancho completo */}
      <Box
        component="main"
        // Añadimos padding directamente al Box si queremos espacios laterales
        sx={{
            flexGrow: 1, // Para que ocupe el espacio vertical restante
            py: 4,      // Padding vertical (igual a my: 4 anterior)
            px: 3,      // Padding horizontal (ejemplo, ajustar al gusto)
            width: '100%', // Asegura que ocupe todo el ancho disponible
            boxSizing: 'border-box' // Incluye padding en el ancho total
         }}
      >
         <AppRoutes /> {/* Las rutas se renderizarán dentro de este Box */}
      </Box>
      {/* Optional Footer */}
    </Box>
  );
}

export default App;