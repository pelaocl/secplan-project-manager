import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import AppRoutes from './routes/AppRoutes';
import TopAppBar from './components/layout/TopAppBar';
import { useAuthStore } from './store/authStore';
// --- INICIO DE MODIFICACIÓN: Importar el nuevo Provider ---
import { TaskModalProvider } from './context/TaskModalContext';
// --- FIN DE MODIFICACIÓN ---

function App() {
    const connectSocketOnRehydrate = useAuthStore((state) => state.actions.connectSocketOnRehydrate);
    const isLoadingAuth = useAuthStore((state) => state.isLoading);

    useEffect(() => {
        connectSocketOnRehydrate();
    }, [connectSocketOnRehydrate]);

    if (isLoadingAuth) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="100vh"
            >
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando aplicación...</Typography>
            </Box>
        );
    }

    return (
        // --- INICIO DE MODIFICACIÓN: Envolver la aplicación con el Provider ---
        <TaskModalProvider>
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
                    <AppRoutes />
                </Box>
            </Box>
        </TaskModalProvider>
        // --- FIN DE MODIFICACIÓN ---
    );
}
export default App;