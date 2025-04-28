// frontend/src/App.tsx (Restaurado a la normalidad)
import React from 'react';
import { Box } from '@mui/material'; // Importa solo lo necesario
import AppRoutes from './routes/AppRoutes';
import TopAppBar from './components/layout/TopAppBar';

function App() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <TopAppBar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    py: 4,
                    px: 3,
                    width: '100%',
                    boxSizing: 'border-box'
                 }}
            >
                <AppRoutes /> {/* Solo renderiza AppRoutes aquí */}
             </Box>
         </Box>
    );
}
export default App;