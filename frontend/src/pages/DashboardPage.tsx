import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, CircularProgress, Alert, Grid } from '@mui/material';
import { statsApi, DashboardData } from '../api/statsApi';
import { lookupApi, LookupDataResponse } from '../api/lookupApi'; // Importar lookupApi
import DashboardFilters, { Filters } from '../components/dashboard/DashboardFilters'; // Importar componente y tipo de filtros

// Importar todos los componentes de gráficos
import MontoPorTipologiaChart from '../components/dashboard/MontoPorTipologiaChart';
import ProyectosPorLineaChart from '../components/dashboard/ProyectosPorLineaChart';
import TareasPorUsuarioChart from '../components/dashboard/TareasPorUsuarioChart';
import ProyectosPorUnidadChart from '../components/dashboard/ProyectosPorUnidadChart';
import ProyectosPorSectorChart from '../components/dashboard/ProyectosPorSectorChart';
import SuperficiePorTipologiaChart from '../components/dashboard/SuperficiePorTipologiaChart';

const initialFilters: Filters = {
  ano: '',
  tipologiaId: '',
  estadoId: '',
  unidadId: '',
};

function DashboardPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados para los filtros
    const [lookupOptions, setLookupOptions] = useState<LookupDataResponse | null>(null);
    const [filters, setFilters] = useState<Filters>(initialFilters);

    const fetchData = useCallback(async (currentFilters: Filters) => {
      try {
        setLoading(true);
        setError(null);
        // Obtener los datos de lookup solo la primera vez o si no existen
        if (!lookupOptions) {
          const lookups = await lookupApi.getLookupData();
          setLookupOptions(lookups);
        }
        // Obtener los datos del dashboard con los filtros actuales
        const data = await statsApi.getDashboardData(currentFilters);
        setDashboardData(data);
        console.log("Datos del Dashboard recibidos:", data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido.";
        setError(errorMessage);
        console.error("Error en DashboardPage:", err);
      } finally {
        setLoading(false);
      }
    }, [lookupOptions]); // Dependencia de lookupOptions para evitar recargarlos si ya existen

    useEffect(() => {
        fetchData(filters);
    }, []); // Carga inicial con los filtros por defecto

    const handleApplyFilters = () => {
      fetchData(filters);
    };

    const handleClearFilters = () => {
      setFilters(initialFilters);
      fetchData(initialFilters);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Dashboard de Estadísticas
            </Typography>

            <DashboardFilters
              filters={filters}
              onFilterChange={setFilters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              lookupData={lookupOptions}
            />

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
                        {/* === Categoría Financiero === */}
                        <Grid item xs={12}>
                            <Typography variant="h5" component="h2" gutterBottom>Análisis Financiero</Typography>
                            <hr />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <MontoPorTipologiaChart data={dashboardData.financiero.montoPorTipologia} />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <ProyectosPorLineaChart data={dashboardData.financiero.inversionPorPrograma} />
                        </Grid>

                        {/* === Categoría Personas y Unidades === */}
                        <Grid item xs={12} sx={{ mt: 3 }}>
                            <Typography variant="h5" component="h2" gutterBottom>Análisis de Personas y Unidades</Typography>
                            <hr />
                        </Grid>
                        <Grid item xs={12} md={7} lg={8}>
                            <TareasPorUsuarioChart data={dashboardData.personas.tareasActivasPorUsuario} />
                        </Grid>
                        <Grid item xs={12} md={5} lg={4}>
                            <ProyectosPorUnidadChart data={dashboardData.personas.proyectosPorUnidad} />
                        </Grid>

                        {/* === Categoría Geográfico === */}
                        <Grid item xs={12} sx={{ mt: 3 }}>
                            <Typography variant="h5" component="h2" gutterBottom>Análisis Geográfico</Typography>
                            <hr />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <ProyectosPorSectorChart data={dashboardData.geografico.proyectosPorSector} />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <SuperficiePorTipologiaChart data={dashboardData.geografico.superficiePorTipologia} />
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Container>
    );
}

export default DashboardPage;
