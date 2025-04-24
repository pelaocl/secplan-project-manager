import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, CircularProgress, Alert } from '@mui/material';
import { projectApi, PaginatedProjectsResponse } from '../services/projectApi';
import { Project } from '../types';
import ProjectListTable from '../components/ProjectListTable';
import { useIsAuthenticated } from '../store/authStore';

function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationInfo, setPaginationInfo] = useState({ /* ... */ total: 0, page: 1, limit: 10, totalPages: 0 });
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page: paginationInfo.page, limit: paginationInfo.limit };
        const data: PaginatedProjectsResponse = await projectApi.fetchProjects(params);
        // Log original (lo mantenemos por ahora)
        console.log("Datos recibidos de la API (useEffect):", data);
        setProjects(data.projects);
        setPaginationInfo(prev => ({ ...prev, total: data.total, totalPages: data.totalPages }));
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar los proyectos.');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, [paginationInfo.page, paginationInfo.limit]);

  const renderContent = () => {
    if (loading && projects.length === 0) {
      return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 300 }}><CircularProgress /></Box> );
    }
    if (error) {
      return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
    }
    if (projects.length === 0 && !loading) {
         return <Typography sx={{ mt: 4 }}>No se encontraron proyectos.</Typography>;
    }

    // --- ¡NUEVO LOG AQUÍ! ---
    // Logueamos el estado 'projects' justo antes de pasarlo como prop
    console.log("ProjectListPage: Rendering ProjectListTable with projects state:", projects);
    // -------------------------

    // Renderiza la tabla si hay proyectos
    return <ProjectListTable projects={projects} isAuthenticated={isAuthenticated} />;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lista de Proyectos ({loading ? '...' : paginationInfo.total})
        </Typography>
        <Box sx={{ mt: 4, width: '100%' }}>
            {renderContent()}
        </Box>
      </Box>
    </Container>
  );
}

export default ProjectListPage;