import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, CircularProgress, Alert } from '@mui/material';
import { projectApi, PaginatedProjectsResponse } from '../services/projectApi';
import { Project } from '../types';
// Importa la NUEVA versión de ProjectListTable
import ProjectListTable from '../components/ProjectListTable';

function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationInfo, setPaginationInfo] = useState({
      total: 0,
      page: 1,
      limit: 10, // Podríamos necesitar más si no paginamos en frontend
      totalPages: 0,
  });

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        // Podrías aumentar el límite si quieres cargar más datos para la tabla simple
        const data: PaginatedProjectsResponse = await projectApi.fetchProjects({
             page: paginationInfo.page,
             // limit: 50, // Ejemplo: cargar más
             limit: paginationInfo.limit,
        });
        console.log("Datos recibidos de la API:", data);
        setProjects(data.projects);
        setPaginationInfo(prev => ({ // Solo actualiza si los datos vienen de la API
            ...prev, // Mantiene página/límite actuales por ahora
            total: data.total,
            // page: data.page, // La API devuelve la página pedida
            // limit: data.limit, // La API devuelve el límite pedido
            totalPages: data.totalPages,
        }));
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar los proyectos.');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  // Dependencias para futura paginación/filtros
  }, [paginationInfo.page, paginationInfo.limit]);

  // El renderizado condicional ahora decide si mostrar la tabla o los mensajes
  const renderContent = () => {
    if (loading) { // Muestra spinner solo mientras carga
      return (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 300 }}> {/* Dale algo de altura al spinner */}
          <CircularProgress />
        </Box>
      );
    }
    if (error) { // Muestra error si existe
      return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
    }
    if (projects.length === 0) { // Muestra mensaje si no hay proyectos
         return <Typography sx={{ mt: 4 }}>No se encontraron proyectos.</Typography>;
    }
    // Si no hay loading, no hay error y hay proyectos, muestra la tabla
    return <ProjectListTable projects={projects} />; // Ya no necesita prop 'loading'
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lista de Proyectos ({loading ? '...' : paginationInfo.total}) {/* Muestra '...' mientras carga */}
        </Typography>

        {/* Renderiza el contenido (spinner, error, tabla o mensaje 'no proyectos') */}
        {renderContent()}

        {/* Paginación Manual (si se implementa después) */}
        {/* <Box display="flex" justifyContent="center" sx={{ mt: 2 }}> ... </Box> */}
      </Box>
    </Container>
  );
}

export default ProjectListPage;