import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress, Alert, Grid } from '@mui/material';
import { statsApi, DashboardData } from '../api/statsApi'; // Importamos el nuevo servicio y tipo
import MontoPorTipologiaChart from '../components/dashboard/MontoPorTipologiaChart';
import ProyectosPorLineaChart from '../components/dashboard/ProyectosPorLineaChart';
import TareasPorUsuarioChart from '../components/dashboard/TareasPorUsuarioChart';
import ProyectosPorUnidadChart from '../components/dashboard/ProyectosPorUnidadChart';

function DashboardPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await statsApi.getDashboardData();
                setDashboardData(data);
                console.log("Datos del Dashboard recibidos en el frontend:", data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
                setError(errorMessage);
                console.error("Error en DashboardPage:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // El array vacío asegura que esto se ejecute solo una vez al montar el componente

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard de Estadísticas
            </Typography>

            {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '50vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Cargando datos del dashboard...</Typography>
                </Box>
            )}

            {error && !loading && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Error al cargar los datos del dashboard: {error}
                </Alert>
            )}

            {!loading && !error && dashboardData && (
                <Box>
                    <Grid container spacing={3}>
                        {/* --- Categoría Financiero --- */}
                        <Grid item xs={12}>
                            <Typography variant="h5" component="h2" gutterBottom>Análisis Financiero</Typography>
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <MontoPorTipologiaChart data={dashboardData.financiero.montoPorTipologia} />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <ProyectosPorLineaChart data={dashboardData.financiero.proyectosPorLineaFinanciamiento} />
                        </Grid>

                        {/* --- Categoría Personas --- */}
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="h5" component="h2" gutterBottom>Análisis de Personas y Unidades</Typography>
                        </Grid>
                        <Grid item xs={12} md={12} lg={12}>
                            <TareasPorUsuarioChart data={dashboardData.personas.tareasActivasPorUsuario} />
                        </Grid>
                        <Grid item xs={12} md={12} lg={12}> {/* Ajustado para el nuevo gráfico */}
                            <ProyectosPorUnidadChart data={dashboardData.personas.proyectosPorUnidad} />
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Container>
    );
}

export default DashboardPage;