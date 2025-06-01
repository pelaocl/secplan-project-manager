import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Typography, Container, Box, CircularProgress, Alert, Button, Dialog,
    DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar,
    Stack, TextField, InputAdornment, IconButton, Chip, Tooltip,
    useTheme, useMediaQuery, Pagination 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit'; // Importado para la columna de Acciones
import DeleteIcon from '@mui/icons-material/Delete'; // Importado para la columna de Acciones
import ClearIcon from '@mui/icons-material/Clear';

import { projectApi, PaginatedProjectsResponse } from '../services/projectApi';
import { Project, TipoMoneda, UserRole } from '../types'; // Asegúrate que UserRole esté aquí si lo usas en renderCell de acciones
import ProjectListTable, { ColumnDefinition } from '../components/ProjectListTable';
import { useIsAuthenticated, useCurrentUserRole } from '../store/authStore';
// import { ApiError } from '../services/apiService'; // ApiError no se usa directamente aquí

// --- Helper Functions ---
const formatCurrency = (value: string | number | null | undefined | { toNumber: () => number }, currency: TipoMoneda = 'CLP'): string => { let numericValue: number | null = null; if (value == null) numericValue = null; else if (typeof value === 'object' && value && typeof value.toNumber === 'function') numericValue = value.toNumber(); else { const num = Number(String(value).replace(',', '.')); if (!isNaN(num)) numericValue = num; } if (numericValue === null) return 'N/A'; try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency === 'UF' ? 'CLF' : 'CLP', minimumFractionDigits: currency === 'UF' ? 2 : 0, maximumFractionDigits: currency === 'UF' ? 4 : 0, }).format(numericValue); } catch (e) { return `${currency === 'UF' ? 'UF' : '$'} ${numericValue.toLocaleString('es-CL')}`; } };
const formatDate = (dateString: string | Date | null | undefined): string => { if (!dateString) return 'N/A'; try { const date = (dateString instanceof Date) ? dateString : new Date(dateString); if (isNaN(date.getTime())) return 'Fecha inválida'; return date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { return 'Fecha inválida'; } };

// Hook simple de debounce
function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

function ProjectListPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [paginationInfo, setPaginationInfo] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
    const isAuthenticated = useIsAuthenticated();
    const userRole = useCurrentUserRole();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const loadProjects = useCallback(async (pageToLoad: number, limitToLoad: number) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, any> = { page: pageToLoad, limit: limitToLoad };
            if (debouncedSearchTerm) {
                params.searchText = debouncedSearchTerm;
            }
            console.log(`[ProjectListPage] Calling projectApi.fetchProjects with:`, params); // Log para ver qué se envía
            const data = await projectApi.fetchProjects(params);
            console.log("[ProjectListPage] API Response Data:", JSON.stringify(data, null, 2)); // Para ver la estructura completa
            console.log("[ProjectListPage] Projects from API:", data.projects);
            console.log("[ProjectListPage] Pagination from API:", data.pagination);
            
            console.log("[ProjectListPage] Data received from API:", data); // Log para ver qué se recibe
            setProjects(data.projects);
            setPaginationInfo({ // Actualizar el estado de paginación con lo que devuelve la API
                total: data.pagination.totalItems,
                totalPages: data.pagination.totalPages,
                page: data.pagination.currentPage, // Usar la página actual de la respuesta
                limit: data.pagination.pageSize,
            });
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Ocurrió un error al cargar los proyectos.';
            setError(errorMsg);
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm]); 

    // useEffect para la carga inicial y cuando cambia el término de búsqueda (debounced)
    useEffect(() => {
        console.log("[ProjectListPage] useEffect for debouncedSearchTerm triggered. Loading page 1.");
        // Cuando el término de búsqueda cambia, siempre cargamos la página 1 con el límite actual.
        loadProjects(1, paginationInfo.limit);
    }, [debouncedSearchTerm, paginationInfo.limit, loadProjects]);

    const handleDeleteClick = useCallback((projectId: number, projectName: string) => {
        setProjectToDelete({ id: projectId, name: projectName });
        setShowDeleteConfirm(true);
    }, []); // setProjectToDelete y setShowDeleteConfirm son estables

    const handleCloseConfirmDialog = () => { setShowDeleteConfirm(false); setProjectToDelete(null); };
    const confirmDelete = async () => { if (!projectToDelete) return; setIsDeleting(true); setError(null); try { await projectApi.deleteProject(projectToDelete.id); setSnackbar({ open: true, message: `Proyecto "${projectToDelete.name}" eliminado.`, severity: 'success' }); handleCloseConfirmDialog(); loadProjects(1); } catch (err) { const errorMsg = err instanceof Error ? err.message : 'Error al eliminar.'; setSnackbar({ open: true, message: errorMsg, severity: 'error' }); handleCloseConfirmDialog(); } finally { setIsDeleting(false); } };

    const columns = useMemo((): ColumnDefinition<Project>[] => [
        { id: 'codigoUnico', label: 'Código', minWidth: 90,
            renderCell: (project) => (
                <Chip
                    label={project.codigoUnico || '?'}
                    size="small"
                    variant="filled"
                    sx={{
                        backgroundColor: project.tipologia?.colorChip || theme.palette.grey[300],
                        color: theme.palette.getContrastText(project.tipologia?.colorChip || theme.palette.grey[300]),
                        fontWeight: 'medium',
                    }}/>
            ),
            showOnBreakpoints: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {   id: 'nombre', 
            label: 'Nombre Proyecto', 
            minWidth: 250, dataAccessor: (p) => p.nombre, 
            showOnBreakpoints: ['xs', 'sm', 'md', 'lg', 'xl']
        }, 
        {   id: 'tipologia', 
            label: 'Tipología', 
            minWidth: 130, dataAccessor: (p) => p.tipologia?.nombre || 'N/A', 
            showOnBreakpoints: ['md', 'lg', 'xl']
        },
        {   id: 'estado', 
            label: 'Estado', 
            minWidth: 100,
            renderCell: (project) => (
                <Chip label={project.estado?.nombre || 'N/A'} size="small" variant='outlined' sx={{borderColor: theme.palette.grey[400], color: theme.palette.text.secondary}} /> // Chip color neutro/gris
            ),
            showOnBreakpoints: ['md', 'lg', 'xl']
        },
        {   id: 'unidad', 
            label: 'Unidad', 
            minWidth: 150, dataAccessor: (p) => p.unidad?.nombre || 'N/A', 
            showOnBreakpoints: ['lg', 'xl']
        },
        {   id: 'ano', 
            label: 'Año', 
            align: 'right', 
            minWidth: 80, dataAccessor: (p) => p.ano || 'N/A', 
            showOnBreakpoints: ['xs', 'sm', 'md', 'lg', 'xl']
        },
        {   id: 'monto', 
            label: 'Monto', 
            align: 'right', 
            minWidth: 150,
            renderCell: (project) => formatCurrency(project.monto, project.tipoMoneda),
            showOnBreakpoints: ['xl']
        },
        {   id: 'proyectista', 
            label: 'Proyectista', 
            minWidth: 170, dataAccessor: (p) => p.proyectista?.name || p.proyectista?.email || 'N/A', 
            showOnBreakpoints: ['xl']
        },
        {   id: 'proyectoPriorizado', 
            label: 'Priorizado', 
            align: 'center', 
            minWidth: 100,
            renderCell: (project) => (
                <Tooltip title={project.proyectoPriorizado ? "Proyecto Priorizado" : "No Priorizado"}>
                    <IconButton size="small" sx={{pointerEvents: 'none'}}>
                        {project.proyectoPriorizado ? <StarIcon sx={{ color: theme.palette.warning.main }} /> : <StarBorderIcon sx={{ color: theme.palette.action.disabled }} />}
                    </IconButton>
                </Tooltip>
            ),
            showOnBreakpoints: ['lg', 'xl']
        },
        {   id: 'updatedAt', 
            label: 'Últ. Modif.', 
            align: 'center', 
            minWidth: 120,
            renderCell: (project) => formatDate(project.updatedAt),
            showOnBreakpoints: ['lg', 'xl']
        },

        ...(isAuthenticated ? [{
            id: 'acciones', label: 'Acciones', align: 'center' as const, minWidth: 100, // Reducido minWidth un poco
            renderCell: (project: Project) => (
                <Stack direction="row" spacing={0} justifyContent="center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <Tooltip title="Editar Proyecto">
                        <IconButton component={RouterLink} to={`/projects/${project.id}/edit`} size="small" color="primary" aria-label="editar proyecto">
                            <EditIcon fontSize="inherit" />
                        </IconButton>
                    </Tooltip>
                    {(userRole === 'ADMIN' || userRole === 'COORDINADOR') &&
                        <Tooltip title="Eliminar Proyecto">
                            <IconButton onClick={() => handleDeleteClick(project.id, project.nombre)} size="small" color="error" aria-label="eliminar proyecto">
                                <DeleteIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                    }
                </Stack>
            ),
            showOnBreakpoints: ['md', 'lg', 'xl']
        }] : [])
    ], [isAuthenticated, userRole, theme, handleDeleteClick]);


    const renderContent = () => {
        if (loading && projects.length === 0) { return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: 300 }}><CircularProgress /></Box> ); }
        if (error && projects.length === 0) { return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>; }
        if (projects.length === 0 && !loading && !error) { return <Typography sx={{ mt: 4, textAlign: 'center' }}>No se encontraron proyectos {debouncedSearchTerm && `para "${debouncedSearchTerm}"`}.</Typography>; }
        
        return ( <ProjectListTable
                    projects={projects}
                    columns={columns} // Pasamos todas las columnas, ProjectListTable filtrará por breakpoint
                    isAuthenticated={isAuthenticated}
                 /> );
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 1 }}>
                <Stack direction={{ xs: 'row', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} mb={3} >
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Buscar proyectos (código, nombre...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1, minWidth: { sm: 150},  maxWidth: { sm: 450 }, }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                             endAdornment: searchTerm ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')} aria-label="limpiar búsqueda">
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />

                    {(userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                        <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/projects/new" sx={{ xs: '100%', sm: 'auto' }}>
                            Crear Proyecto
                        </Button>
                    )}
                </Stack>

                <Box sx={{ mt: 0, width: '100%' }}>
                    {renderContent()} {/* Esto renderiza ProjectListTable */}

                    {/* PAGINACIÓN UI */}
                    <Box sx={{display: 'flex', justifyContent: 'center', mt:3}}>
                        <Pagination
                            count={paginationInfo.totalPages}
                            page={paginationInfo.page}
                            onChange={(event, value) => loadProjects(value, paginationInfo.limit)}
                            color="primary"
                            showFirstButton
                            showLastButton
                            disabled={loading && projects.length > 0} // Mantenemos esto
                        />
                    </Box>

                    {/* LOADER */}
                    <Box display="flex" justifyContent="center" sx={{ mt: 2, height: 24 }}> {/* Mantenemos altura fija y margen superior */}
                        <CircularProgress
                            size={24}
                            sx={{ visibility: (loading && projects.length > 0) ? 'visible' : 'hidden' }}
                        />
                    </Box>

                </Box>
            </Box>

            <Dialog open={showDeleteConfirm} onClose={handleCloseConfirmDialog} >
                 <DialogTitle>Confirmar Eliminación</DialogTitle>
                 <DialogContent> <DialogContentText> ¿Estás seguro de eliminar el proyecto "{projectToDelete?.name}" (ID: {projectToDelete?.id})? Esta acción no se puede deshacer. </DialogContentText> </DialogContent>
                 <DialogActions> <Button onClick={handleCloseConfirmDialog} >Cancelar</Button> <Button onClick={confirmDelete} color="error" variant="contained" > {isDeleting ? <CircularProgress size={20} color="inherit"/> : 'Eliminar'} </Button> </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} >
                 <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
}

export default ProjectListPage;