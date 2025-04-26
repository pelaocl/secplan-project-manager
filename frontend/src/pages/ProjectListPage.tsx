// ========================================================================
// INICIO: Contenido COMPLETO y MODIFICADO para ProjectListPage.tsx
// COPIA Y PEGA TODO ESTE BLOQUE EN TU ARCHIVO
// ========================================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography, Container, Box, CircularProgress, Alert, Button, Dialog,
    DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar
} from '@mui/material'; // <-- Añadidos componentes de Dialog y Snackbar
import { projectApi, PaginatedProjectsResponse } from '../services/projectApi';
import { Project } from '../types';
import ProjectListTable from '../components/ProjectListTable';
import { useIsAuthenticated } from '../store/authStore';
import { ApiError } from '../services/apiService'; // <-- Importa ApiError si existe

function ProjectListPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Conserva un objeto para paginación, aunque no implementemos los controles aún
    const [paginationInfo, setPaginationInfo] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
    const isAuthenticated = useIsAuthenticated(); // Obtiene estado de autenticación

    // --- Estados para el Borrado ---
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    // --- Carga de Proyectos (envuelto en useCallback) ---
    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError(null); // Limpia error antes de cargar
        console.log("[ProjectListPage] Loading projects for page:", paginationInfo.page);
        try {
            const params = { page: paginationInfo.page, limit: paginationInfo.limit };
            // Llama a la API (asumiendo que fetchProjects devuelve PaginatedProjectsResponse)
            const data = await projectApi.fetchProjects(params);
            console.log("[ProjectListPage] Data received from API:", data);
            setProjects(data.projects);
            // Actualiza info de paginación basado en la respuesta
            setPaginationInfo(prev => ({
                ...prev,
                total: data.pagination.totalItems,
                totalPages: data.pagination.totalPages,
                page: data.pagination.currentPage, // Asegura que la página actual se refleje
                limit: data.pagination.pageSize,
            }));
        } catch (err) {
            console.error("[ProjectListPage] Error fetching projects:", err);
            const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error al cargar los proyectos.';
            setError(errorMsg);
            setSnackbar({ open: true, message: errorMsg, severity: 'error' }); // Muestra error en snackbar también
        } finally {
            setLoading(false);
        }
    // Dependencias: Solo se vuelve a cargar si cambia la página o el límite
    }, [paginationInfo.page, paginationInfo.limit]);

    // Efecto para cargar proyectos al montar o al cambiar página/límite
    useEffect(() => {
        loadProjects();
    }, [loadProjects]); // Llama a la función envuelta en useCallback

    // --- Funciones para Borrado ---
    const handleDeleteClick = (projectId: number, projectName: string) => {
        console.log(`[ProjectListPage] Delete requested for project ID: ${projectId}, Name: ${projectName}`);
        setProjectToDelete({ id: projectId, name: projectName });
        setShowDeleteConfirm(true);
    };

    const handleCloseConfirmDialog = () => {
        setShowDeleteConfirm(false);
        setProjectToDelete(null);
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;

        console.log(`[ProjectListPage] Confirming delete for project ID: ${projectToDelete.id}`);
        setIsDeleting(true);
        setError(null); // Limpia errores previos de borrado

        try {
            // Llama a la función de API para borrar (¡Necesita existir en projectApi!)
            await projectApi.deleteProject(projectToDelete.id);

            console.log(`[ProjectListPage] Project ID: ${projectToDelete.id} deleted successfully.`);
            setSnackbar({ open: true, message: `Proyecto "${projectToDelete.name}" eliminado correctamente.`, severity: 'success' });

            // Cierra el diálogo y refresca la lista
            handleCloseConfirmDialog();
            loadProjects(); // Vuelve a cargar los proyectos para actualizar la lista

        } catch (err) {
            console.error(`[ProjectListPage] Error deleting project ID: ${projectToDelete.id}:`, err);
            const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error al eliminar el proyecto.';
            setError(errorMsg); // Podrías mostrar este error en el diálogo o un alert general
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
             // Podrías dejar el diálogo abierto en caso de error si quieres reintentar
             // handleCloseConfirmDialog();
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Renderizado ---
    const renderContent = () => {
        // Muestra loader solo si está cargando y aún no hay proyectos mostrados
        if (loading && projects.length === 0) {
            return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 300 }}><CircularProgress /></Box> );
        }
        // Muestra error de carga principal si ocurrió
        if (error && projects.length === 0) {
             return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
        }
        // Muestra mensaje si no hay proyectos (y no está cargando ni hubo error)
        if (projects.length === 0 && !loading && !error) {
             return <Typography sx={{ mt: 4 }}>No se encontraron proyectos.</Typography>;
        }

        // Renderiza la tabla pasando la prop onDeleteClick
        return (
            <ProjectListTable
                projects={projects}
                isAuthenticated={isAuthenticated}
                onDeleteClick={handleDeleteClick} // <-- Pasa el handler
            />
        );
    };

    return (
        <Container maxWidth="xl"> {/* Usa xl para más espacio en tablas */}
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Lista de Proyectos ({paginationInfo.total})
                </Typography>
                {/* Aquí podrías añadir botones de filtro o creación */}
                <Box sx={{ mt: 4, width: '100%' }}>
                    {renderContent()}
                    {/* Muestra un loader más pequeño sobre la tabla si está recargando */}
                    {loading && projects.length > 0 && (
                         <Box display="flex" justifyContent="center" sx={{ mt: 2 }}><CircularProgress size={24} /></Box>
                    )}
                    {/* Aquí irían controles de paginación si los implementas */}
                </Box>
            </Box>

            {/* Diálogo de Confirmación de Borrado */}
            <Dialog
                open={showDeleteConfirm}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Confirmar Eliminación
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        ¿Estás seguro de que quieres eliminar el proyecto?
                        <Typography component="span" display="block" variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                            {projectToDelete?.name} (ID: {projectToDelete?.id})
                        </Typography>
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                    {/* Muestra error específico de borrado aquí si ocurrió */}
                    {error && isDeleting && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog} color="secondary" disabled={isDeleting}>
                        Cancelar
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" autoFocus disabled={isDeleting}>
                        {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar para mensajes de éxito/error */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                 {/* Snackbar necesita un Alert adentro para mostrar severidad */}
                 <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                     {snackbar.message}
                 </Alert>
            </Snackbar>

        </Container>
    );
}

export default ProjectListPage;
// ========================================================================
// FIN: Contenido COMPLETO y MODIFICADO para ProjectListPage.tsx
// ========================================================================