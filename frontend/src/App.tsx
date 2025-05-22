// frontend/src/App.tsx
import React, { useEffect } from 'react'; // Añadido useEffect
import { Box, CircularProgress, Typography } from '@mui/material';
import AppRoutes from './routes/AppRoutes';
import TopAppBar from './components/layout/TopAppBar';
import { useAuthStore } from './store/authStore'; // Importar el store completo

function App() {
    // Obtener la acción y el estado de carga del store
    const connectSocketOnRehydrate = useAuthStore((state) => state.actions.connectSocketOnRehydrate);
    const isLoadingAuth = useAuthStore((state) => state.isLoading);

    useEffect(() => {
        // Esta función se llamará una vez cuando App se monte.
        // La acción connectSocketOnRehydrate internamente revisará
        // si hay un token y el usuario está autenticado (después de la rehidratación de Zustand)
        // y conectará el socket si es necesario, luego pondrá isLoading a false.
        connectSocketOnRehydrate();
    }, [connectSocketOnRehydrate]); // El linter de React podría pedir esta dependencia

    // Muestra un loader mientras el store de auth se inicializa y
    // se intenta la conexión del socket si hay sesión persistida.
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
    );
}
export default App;