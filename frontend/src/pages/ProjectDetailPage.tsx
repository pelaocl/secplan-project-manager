// frontend/src/pages/ProjectDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'; // Renombrado Link a RouterLink
import {
    Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Chip, Divider, Button, Stack, Tooltip, IconButton, useTheme, List, ListItemButton, ListItemIcon, ListItemText, Collapse, Hidden, useMediaQuery
} from '@mui/material';

// --- Iconos ---
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // Usado para Estado Actual
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // Usado para Año
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FolderZipIcon from '@mui/icons-material/FolderZip'; // Usado para Código Expediente, Licitación
import StairsIcon from '@mui/icons-material/Stairs'; // Usado para Etapa Actual
import ArticleIcon from '@mui/icons-material/Article'; // Usado para Programa, Línea Financ.
import EventIcon from '@mui/icons-material/Event'; // Usado para Fecha Postulación
import HistoryIcon from '@mui/icons-material/History'; // Usado para Fecha Creación/Modificación
import TravelExploreIcon from '@mui/icons-material/TravelExplore'; // Usado para Sector
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey'; // Para Código Único
import UpdateIcon from '@mui/icons-material/Update'; // Para Última Modificación
import DescriptionIcon from '@mui/icons-material/Description'; // Para Descripción del Proyecto (menú)
import ListAltIcon from '@mui/icons-material/ListAlt'; // Para Tareas (menú)
import InfoIcon from '@mui/icons-material/Info'; // Para Información Básica (menú)
import MyLocationIcon from '@mui/icons-material/MyLocation'; // Para Ubicación y Superficie (menú)
import ImageIcon from '@mui/icons-material/Image'; // Para placeholder de imagen del proyecto

// --- Servicios y Tipos ---
import { projectApi } from '../services/projectApi';
import { taskApi } from '../services/taskApi';
import { lookupApi } from '../services/lookupApi';
import {
    Project,
    TipoMoneda,
    Task,
    EstadoTarea,
    // PrioridadTarea, // No se usa directamente aquí, sino en TaskListItem
    FormOptionsResponse,
    CreateTaskFrontendInput,
    UpdateTaskFrontendInput,
    TaskFormValues,
    // ChatMessage, // No se usa directamente aquí
    // UserProjectTeamMember // Se accede a través de project.proyectista, etc.
} from '../types';
import ProjectMap from '../components/ProjectMap';
import IconDetailItem from '../components/IconDetailItem';
// SectionPaper ya no se usará como wrapper principal de secciones
import { ApiError } from '../services/apiService';
import { useAuthStore, useIsAuthenticated, useCurrentUserRole, useCurrentUser } from '../store/authStore'; // Añadido useCurrentUser
import TaskListItem from '../components/TaskListItem';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema } from '../schemas/taskFormSchema';
import TaskForm from '../components/TaskForm';
import { Snackbar } from '@mui/material';
import TaskDetailModal from '../components/TaskDetailModal';
import { socketService } from '../services/socketService';

// --- Helper Functions (sin cambios) ---
const formatCurrency = (value: string | number | null | undefined | { toNumber: () => number }, currency: TipoMoneda = 'CLP'): string => { let numericValue: number | null = null; if (value == null) numericValue = null; else if (typeof value === 'object' && value && typeof value.toNumber === 'function') numericValue = value.toNumber(); else { const num = Number(String(value).replace(',', '.')); if (!isNaN(num)) numericValue = num; } if (numericValue === null) return 'N/A'; try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency === 'UF' ? 'CLF' : 'CLP', minimumFractionDigits: currency === 'UF' ? 2 : 0, maximumFractionDigits: currency === 'UF' ? 4 : 0, }).format(numericValue); } catch (e) { console.error("Error formatting currency:", e); return `${currency === 'UF' ? 'UF' : '$'} ${numericValue.toLocaleString('es-CL')}`; } };
const formatDate = (dateString: string | Date | null | undefined): string => { if (!dateString) return 'N/A'; try { const date = (dateString instanceof Date) ? dateString : new Date(dateString); if (isNaN(date.getTime())) return 'Fecha inválida'; return date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { console.error("Error formatting date:", e); return 'Fecha inválida'; } };
// -------------------------------------

// Definición de las secciones para el menú y contenido
type ProjectSection = 'tareas' | 'descripcion' | 'infoBasica' | 'ubicacion';

function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // Para responsividad del menú

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lookupOptions, setLookupOptions] = useState<FormOptionsResponse | null>(null);

    const [loadingProject, setLoadingProject] = useState<boolean>(true);
    const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
    const [loadingLookups, setLoadingLookups] = useState<boolean>(false);

    const [errorProject, setErrorProject] = useState<string | null>(null);
    const [errorTasks, setErrorTasks] = useState<string | null>(null);

    const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);
    const [taskFormError, setTaskFormError] = useState<string | null>(null);
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState<boolean>(false);
    const [taskDetailErrorState, setTaskDetailErrorState] = useState<string | null>(null);

    const isAuthenticated = useIsAuthenticated();
    const userRole = useCurrentUserRole();
    const currentUser = useCurrentUser(); // Usar el hook importado
    const projectIdNum = id ? parseInt(id, 10) : NaN;

    // --- 1. Función para Determinar la Sección Inicial ---
    const determineInitialActiveSection = useCallback((): ProjectSection => {
        // Condición para acceso a tareas (actualmente, si está autenticado)
        // Podrías hacer esta condición más específica si es necesario (ej. por rol)
        const canAccessTasks = isAuthenticated;

        //if (canAccessTasks) {
        //    return 'tareas';
        //}
        return 'infoBasica';
    }, [isAuthenticated]); // Depende de isAuthenticated

    // Estado para la sección activa en el panel derecho
    const [activeSection, setActiveSection] = useState<ProjectSection>(determineInitialActiveSection());
    const [hasSetInitialSection, setHasSetInitialSection] = useState<boolean>(false);

    // Estado para el filtro de tareas
    const [taskFilter, setTaskFilter] = useState<'all' | 'mine'>('all');


    const taskFormMethods = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            titulo: '', descripcion: null, asignadoId: null,
            fechaPlazo: null, prioridad: null, estado: EstadoTarea.PENDIENTE,
        }
    });

    // --- Lógica de carga de datos (loadPageData, useEffects) - Sin cambios en su lógica interna ---
    // (Se asume que esta parte es robusta y funciona como antes)
    const loadPageData = useCallback(async (isFullLoad: boolean = true) => {
        if (isNaN(projectIdNum)) {
            setErrorProject("ID de proyecto inválido.");
            setLoadingProject(false); setLoadingTasks(false); setLoadingLookups(false);
            return;
        }
        if (isFullLoad) {
            setLoadingProject(true); setErrorProject(null);
            if (isAuthenticated) { setLoadingLookups(true); }
        }
        if (isAuthenticated && (isFullLoad || !isFullLoad)) {
            setLoadingTasks(true); setErrorTasks(null);
        } else if (!isAuthenticated) {
            setTasks([]); setLookupOptions(null);
            setLoadingTasks(false); setLoadingLookups(false);
        }
        try {
            if (isFullLoad) {
                const fetchedProject = await projectApi.getProjectById(projectIdNum, currentUser?.id);
                setProject(fetchedProject);
                 // Por defecto, si el usuario es guest y hay imagen, mostrarla, si no, info básica.
                 // Si es autenticado, podríamos dirigirlo a 'tareas' o 'descripción' si es más relevante,
                 // pero 'infoBasica' es un buen default general.
            }
            if (isAuthenticated) {
                if (isFullLoad) {
                    const [fetchedTasks, fetchedLookups] = await Promise.all([
                        taskApi.getTasksByProjectId(projectIdNum),
                        lookupApi.getFormOptions()
                    ]);
                    setTasks(fetchedTasks);
                    setLookupOptions(fetchedLookups);
                } else {
                    const fetchedTasks = await taskApi.getTasksByProjectId(projectIdNum);
                    setTasks(fetchedTasks);
                }
            } else if (isFullLoad && !isAuthenticated) {
                setTasks([]);
                setLookupOptions(null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocurrió un error al cargar datos.";
            if (isFullLoad) setErrorProject(errorMessage);
            if (isAuthenticated) setErrorTasks(errorMessage);
        } finally {
            setLoadingProject(false);
            if (isAuthenticated) { setLoadingTasks(false); setLoadingLookups(false); }
        }
    }, [projectIdNum, isAuthenticated, currentUser?.id]);

    useEffect(() => {
        if (projectIdNum) {
            loadPageData(true); // Carga los datos del proyecto

            // Re-evalúa y establece la sección activa si el estado de autenticación ha cambiado
            // o para asegurar la correcta al cargar un nuevo proyecto.
            const newInitialSection = determineInitialActiveSection();
            if (activeSection !== newInitialSection) { // Solo actualiza si es diferente para evitar re-renders innecesarios
                setActiveSection(newInitialSection);
            }
        } else {
            setProject(null); 
            setTasks([]); 
            setLookupOptions(null);
            setErrorProject("ID de proyecto no especificado.");
            setLoadingProject(false); 
            setLoadingTasks(false); 
            setLoadingLookups(false);
            setHasSetInitialSection(true);
        }
    }, [projectIdNum, isAuthenticated, loadPageData, determineInitialActiveSection]);

    useEffect(() => {
        // Solo actuar si:
        // 1. Tenemos datos del proyecto (`project` no es null).
        // 2. No hay error cargando el proyecto.
        // 3. El proyecto ya terminó de cargar (`!loadingProject`).
        // 4. Aún no hemos establecido la sección inicial (`!hasSetInitialSection`).
        if (project && !errorProject && !loadingProject && !hasSetInitialSection) {
            // La condición para "acceso a la bitácora de tareas" es si el usuario está autenticado,
            // ya que así se define si el ítem "Tareas" aparece en el menú.
            if (isAuthenticated) {
                setActiveSection('infoBasica'); // Para usuarios autenticados
            } else {
                setActiveSection('infoBasica'); // Para usuarios no autenticados (invitados)
            }
            setHasSetInitialSection(true); // Marcar que la sección inicial ya fue establecida
        }
    }, [project, errorProject, loadingProject, isAuthenticated, hasSetInitialSection, setActiveSection, setHasSetInitialSection]);

    useEffect(() => {
        if (!isAuthenticated || !socketService.getSocket() || !currentUser?.id || !project) return;
        if (project.id !== projectIdNum) return;

        const handleTaskChatStatusUpdate = (data: { taskId: number; tieneMensajesNuevosEnChat: boolean }) => {
            if (tasks.find(t => t.id === data.taskId && t.proyectoId === project.id)) {
                setTasks(currentTasks =>
                    currentTasks.map(t =>
                        t.id === data.taskId
                            ? { ...t, tieneMensajesNuevosEnChat: data.tieneMensajesNuevosEnChat }
                            : t
                    )
                );
            }
        };
        const handleGlobalNotificationUpdate = () => {
            loadPageData(false); // Recargar solo tareas
        };
        socketService.on('task_chat_status_updated', handleTaskChatStatusUpdate);
        socketService.on('unread_count_updated', handleGlobalNotificationUpdate);
        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('task_chat_status_updated', handleTaskChatStatusUpdate);
                socket.off('unread_count_updated', handleGlobalNotificationUpdate);
            }
        };
    }, [isAuthenticated, currentUser?.id, project, projectIdNum, tasks, setTasks, loadPageData]);


    // --- Handlers para acciones (sin cambios en su lógica interna) ---
    const handlePrint = () => { console.log("TODO: Imprimir ficha ID:", project?.id); alert("Impresión no implementada."); };
    const handleOpenNewTaskModal = () => { taskFormMethods.reset({ titulo: '', descripcion: null, asignadoId: null, fechaPlazo: null, prioridad: null, estado: EstadoTarea.PENDIENTE, }); setTaskFormError(null); setIsNewTaskModalOpen(true); };
    const handleCloseNewTaskModal = () => { setIsNewTaskModalOpen(false); };
    const onNewTaskSubmit: SubmitHandler<TaskFormValues> = async (data) => { if (!project || isNaN(projectIdNum) || !isAuthenticated) return; setIsSubmittingTask(true); setTaskFormError(null); try { const dataToSubmit: CreateTaskFrontendInput = { ...data, fechaPlazo: data.fechaPlazo ? new Date(data.fechaPlazo).toISOString() : null, }; await taskApi.createTask(project.id, dataToSubmit); setSnackbarMessage("¡Tarea creada exitosamente!"); handleCloseNewTaskModal(); loadPageData(false); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Error al crear la tarea."; setTaskFormError(errorMsg); } finally { setIsSubmittingTask(false); } };
    const handleOpenEditTaskModal = async (taskToEdit: Task) => { if (!project || !lookupOptions || !isAuthenticated) return; setLoadingTaskDetail(true); try { const freshTask = await taskApi.getTaskById(project.id, taskToEdit.id); taskFormMethods.reset({ titulo: freshTask.titulo, descripcion: freshTask.descripcion || null, asignadoId: freshTask.asignadoId || null, fechaPlazo: freshTask.fechaPlazo ? new Date(freshTask.fechaPlazo) : null, prioridad: freshTask.prioridad || null, estado: freshTask.estado, }); setEditingTask(freshTask); setIsEditTaskModalOpen(true); setTaskFormError(null); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Error al cargar tarea para editar."; setSnackbarMessage(errorMsg); } finally { setLoadingTaskDetail(false); } };
    const handleCloseEditTaskModal = () => { setIsEditTaskModalOpen(false); setEditingTask(null); };
    const onEditTaskSubmit: SubmitHandler<TaskFormValues> = async (data) => { if (!project || !editingTask || !isAuthenticated) return; setIsSubmittingTask(true); setTaskFormError(null); try { const dataToSubmit: UpdateTaskFrontendInput = { ...data, fechaPlazo: data.fechaPlazo ? new Date(data.fechaPlazo).toISOString() : null, }; await taskApi.updateTask(project.id, editingTask.id, dataToSubmit); setSnackbarMessage("¡Tarea actualizada exitosamente!"); handleCloseEditTaskModal(); loadPageData(false); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Error al actualizar la tarea."; setTaskFormError(errorMsg); } finally { setIsSubmittingTask(false); } };
    const handleDeleteTask = (taskId: number) => { console.log(`TODO: Confirmar para eliminar tarea ID: ${taskId} del proyecto ${projectIdNum}`); alert(`Eliminar tarea ${taskId} - Pendiente confirmación`); };
    const handleViewTaskDetails = async (taskId: number) => { if (!project || isNaN(projectIdNum) || !isAuthenticated) return; setLoadingTaskDetail(true); setTaskDetailErrorState(null); try { const detailedTask = await taskApi.getTaskById(projectIdNum, taskId); setSelectedTaskForDetail(detailedTask); setIsTaskDetailModalOpen(true); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Error al cargar detalles."; setTaskDetailErrorState(errorMsg); setSnackbarMessage(errorMsg); } finally { setLoadingTaskDetail(false); } };
    

    // --- Estados de Carga y Error Globales ---
    if (loadingProject && !project && !errorProject) {
        return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: '70vh' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando proyecto...</Typography></Box> );
    }
    if (errorProject && !project) {
        return ( <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>{errorProject}</Alert><Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate('/')}> Volver al Listado </Button></Container> );
    }
    if (!project) {
        return ( <Container maxWidth="md"><Typography sx={{ mt: 4 }}>No se encontró el proyecto o ID inválido.</Typography><Button startIcon={<ArrowBackIcon />} sx={{ mt: 2 }} onClick={() => navigate('/')}> Volver al Listado </Button></Container> );
    }

    // --- Variables de Permisos y Visibilidad (ahora que 'project' existe) ---
    const canManageProject = isAuthenticated && (userRole === 'ADMIN' || userRole === 'COORDINADOR' || project.proyectistaId === currentUser?.id);
    const canManageTasks = isAuthenticated && (userRole === 'ADMIN' || userRole === 'COORDINADOR');
    const showTasksSectionInMenu = isAuthenticated; // Tareas solo visibles si está autenticado
    
    // Filtrado de tareas para la sección "Tareas"
    const filteredTasks = tasks.filter(task => {
        if (taskFilter === 'mine') {
            return task.asignadoId === currentUser?.id || task.creadorId === currentUser?.id;
        }
        return true;
    });

    // --- NUEVA ESTRUCTURA DE RENDERIZADO ---
    const TopBar = (
        <Box
            sx={{
                p: 1.5, // Padding interno del TopBar
                position: 'sticky',
                top: 0,
                zIndex: theme.zIndex.appBar,
                // ESTA ES LA LÍNEA QUE PROBABLEMENTE QUIERES ELIMINAR O MODIFICAR:
                borderBottom: `1px solid ${theme.palette.divider}`, 
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Tooltip title="Volver al listado">
                    <IconButton onClick={() => navigate('/')} sx={{ color: 'text.secondary' /* o 'primary.main' o 'action.active' */ }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Tooltip>
                <Chip // Chip para el Código Único
                    label={project.codigoUnico || '?'}
                    size="medium" // O 'medium' si quieres más énfasis
                    sx={{
                        backgroundColor: project.tipologia?.colorChip || theme.palette.grey[400],
                        color: theme.palette.getContrastText(project.tipologia?.colorChip || theme.palette.grey[400]),
                        fontWeight: 'bold',
                        fontSize: '1.3rem',
                        mr: 1.5,
                        ml: 1,
                        // Este chip ahora está en una fila con fondo claro, los colores deberían funcionar bien.
                    }}
                />
                <Typography
                    variant={isSmallScreen ? "h6" : "h5"}
                    component="h1"
                    sx={{
                        fontWeight: 'bold',
                        textAlign: 'left',
                        textTransform: 'uppercase',
                        color: 'primary.main',
                        flexGrow: 1,                // Mantenemos flexGrow para que ocupe el espacio disponible
                        ml: 1,                      // Margen izquierdo para separarlo un poco del botón "Volver"
                        mr: 2,                      // Margen derecho para separarlo de los botones de acción
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={project.nombre.toUpperCase()} // También puedes poner el title en mayúsculas
                >
                    {project.nombre} 
                    {/* El textTransform en sx se encarga de la visualización, 
                        pero no cambia el valor de project.nombre en sí */}
                </Typography>
                
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Imprimir Ficha (Pendiente)">
                        <Button 
                            variant="outlined" 
                            size="small"
                            color="secondary"
                            startIcon={<PrintIcon />} 
                            onClick={handlePrint}
                            //sx={{ 
                            //    color: 'primary.contrastText', 
                            //    borderColor: 'action.disabled',
                            //    '&:hover': {
                            //        backgroundColor: 'rgba(255,255,255,0.1)',
                            //        borderColor: 'primary.contrastText',
                            //    }
                            //}}
                        >
                           {!isSmallScreen && "Imprimir"}
                        </Button>
                    </Tooltip>
                    {canManageProject && (
                        <Tooltip title="Editar Proyecto">
                             <Button 
                                component={RouterLink} // Usar RouterLink
                                to={`/projects/${project.id}/edit`} 
                                variant="contained" 
                                size="small" 
                                color="primary" // Un color que contraste
                                startIcon={<EditIcon />}
                                sx={{
                                    // color: 'primary.main', bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark'}
                                }}
                            >
                                {!isSmallScreen && "Editar"}
                            </Button>
                        </Tooltip>
                    )}
                </Stack>
            </Box>
            <Grid
                container
                spacing={isSmallScreen ? 0.5 : 1}
                // Ajusta justifyContent según tu preferencia final (ej. 'space-between')
                justifyContent={isSmallScreen ? "space-around" : "space-around"} 
                alignItems="center"
                sx={{
                    // Aplicar el nuevo color terciario y su texto de contraste
                    bgcolor: theme.palette.tertiary.main,
                    color: theme.palette.tertiary.contrastText, 
                    
                    borderRadius: 2, // El redondeo se verá bien con un fondo
                    py: 0.75,         // Padding vertical, puedes ajustarlo
                    px: isSmallScreen ? 1 : 1.5, // Padding horizontal
                    flexWrap: 'wrap',
                    mt: 2, // Añadir un margen superior para separar de la fila del título
                }}
            >
                {/* Para los IconDetailItem, necesitamos asegurar que su texto y iconos usen el contrastText */}
                <Grid item xs={6} sm="auto" sx={{ flexGrow: { xs: 1, sm:0 } }}> {/* flexGrow para que en xs ocupen mejor el espacio */}
                    <IconDetailItem dense icon={VpnKeyIcon} label="Código Único" value={project.codigoUnico}
                        sx={{ 
                            '& .MuiSvgIcon-root': { color: theme.palette.tertiary.contrastText, fontSize: '1rem' },
                            '& .MuiTypography-caption': { color: theme.palette.tertiary.contrastText, opacity: 0.8 },
                            '& .MuiTypography-subtitle2, & .MuiTypography-body2': { color: theme.palette.tertiary.contrastText } 
                        }} />
                </Grid>
                <Grid item xs={6} sm="auto" sx={{ flexGrow: { xs: 1, sm:0 } }}>
                    <IconDetailItem dense icon={CalendarTodayIcon} label="Año" value={project.ano?.toString() || 'N/A'}
                        sx={{
                            '& .MuiSvgIcon-root': { color: theme.palette.tertiary.contrastText, fontSize: '1rem' },
                            '& .MuiTypography-caption': { color: theme.palette.tertiary.contrastText, opacity: 0.8 },
                            '& .MuiTypography-subtitle2, & .MuiTypography-body2': { color: theme.palette.tertiary.contrastText }
                        }} />
                </Grid>
                <Grid item xs={6} sm="auto" sx={{ flexGrow: { xs: 1, sm:0 } }}>
                    <IconDetailItem dense icon={InfoOutlinedIcon} label="Estado Actual" value={project.estado?.nombre || 'N/A'}
                        sx={{
                            '& .MuiSvgIcon-root': { color: theme.palette.tertiary.contrastText, fontSize: '1rem' },
                            '& .MuiTypography-caption': { color: theme.palette.tertiary.contrastText, opacity: 0.8 },
                            '& .MuiTypography-subtitle2, & .MuiTypography-body2': { color: theme.palette.tertiary.contrastText }
                        }} />
                </Grid>
                <Grid item xs={6} sm="auto" sx={{ flexGrow: { xs: 1, sm:0 } }}>
                    <IconDetailItem dense icon={UpdateIcon} label="Última Actualización" value={formatDate(project.updatedAt)}
                        sx={{
                            '& .MuiSvgIcon-root': { color: theme.palette.tertiary.contrastText, fontSize: '1rem' },
                            '& .MuiTypography-caption': { color: theme.palette.tertiary.contrastText, opacity: 0.8 },
                            '& .MuiTypography-subtitle2, & .MuiTypography-body2': { color: theme.palette.tertiary.contrastText }
                        }} />
                </Grid>
            </Grid>
        </Box>
    );

    const menuItems = [
        ...(showTasksSectionInMenu ? [{ id: 'tareas' as ProjectSection, label: 'Tareas', icon: <ListAltIcon /> }] : []),
        { id: 'infoBasica' as ProjectSection, label: 'Información Básica', icon: <InfoIcon /> },
        { id: 'descripcion' as ProjectSection, label: 'Descripción del Proyecto', icon: <DescriptionIcon /> },
        { id: 'ubicacion' as ProjectSection, label: 'Ubicación y Superficie', icon: <MyLocationIcon /> },
    ];

    const LeftMenu = (
        <Box
            elevation={1}
            square={isSmallScreen} // Aunque no se mostrará en small screens si está oculto
            sx={{
                width: 280, // Ancho fijo en pantallas grandes
                position: 'sticky', // Para que se quede fijo al hacer scroll en la página
                top: 125, // AJUSTA ESTO a la altura real de tu TopBar.
                          // Esto hace que el menú se "pegue" después de que el TopBar haya pasado.
                alignSelf: 'flex-start', // Necesario para que sticky funcione correctamente en un contenedor flex.
                maxHeight: `calc(100vh - 135px)`, // Altura máxima = viewport - TopBar - un pequeño margen.
                                                 // Esto es para que el menú TENGA SU PROPIO SCROLL si es muy largo.
                overflowY: 'auto', // Scroll interno para el menú si excede maxHeight.
                borderRight: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                flexShrink: 0,
                // En smallScreen, este componente no se renderiza en el layout de dos columnas,
                // así que estas propiedades de sticky y maxHeight son para la vista de escritorio.
            }}
        >
            <List component="nav" sx={{p: isSmallScreen ? 0.5 : 3}}>
                {menuItems.map((item) => (
                    <ListItemButton
                        key={item.id}
                        selected={activeSection === item.id}
                        onClick={() => {
                            if (!isSmallScreen) setActiveSection(item.id);
                            // En small screen, el click podría hacer scroll a la sección si quisiéramos
                        }}
                        sx={{ 
                            mb: 0.5,
                            borderRadius: 1,
                            '&.Mui-selected': {
                                backgroundColor: 'primary.light', // Color más suave para seleccionado
                                color: 'primary.contrastText',
                                '& .MuiListItemIcon-root': {
                                    color: 'primary.contrastText',
                                },
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                }
                            },
                             '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                            }
                        }}
                    >
                        <ListItemIcon sx={{minWidth: 36}}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} primaryTypographyProps={{variant: 'subtitle2', fontWeight: activeSection === item.id && !isSmallScreen ? 'bold' : 'normal'}} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );

    const renderSectionContent = (sectionId: ProjectSection) => {
        switch (sectionId) {
            case 'tareas':
                if (!showTasksSectionInMenu) return null;
                return (
                    <Paper elevation={0} sx={{ p: {xs: 1.5, sm:2, md: 3}, borderRadius: 2 }}>
                        {/* EL TÍTULO "Bitácora de Tareas" SE HA ELIMINADO.
                            Este Box ahora contendrá los filtros a la izquierda y el botón "Nueva Tarea" a la derecha.
                        */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            {/* Contenedor para los botones de filtro (lado izquierdo) */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    variant={taskFilter === 'all' ? 'contained' : 'outlined'} 
                                    onClick={() => setTaskFilter('all')} 
                                    size="small"
                                >
                                    Todas
                                </Button>
                                <Button 
                                    variant={taskFilter === 'mine' ? 'contained' : 'outlined'} 
                                    onClick={() => setTaskFilter('mine')} 
                                    size="small"
                                >
                                    Mis Tareas
                                </Button>
                            </Box>

                            {/* Botón "Nueva Tarea" (lado derecho, condicional) */}
                            {canManageTasks && ( 
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    size="small" 
                                    startIcon={<AddCircleOutlineIcon />} 
                                    onClick={handleOpenNewTaskModal}
                                >
                                    Nueva Tarea
                                </Button> 
                            )}
                        </Box>
                        
                        {/* El Box original solo para filtros ya no es necesario, se fusionó arriba. */}

                        <Divider sx={{ mb: 2 }} />
                        
                        {/* Lógica para mostrar loaders, errores o la lista de tareas */}
                        {loadingTasks && <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress size={24} /><Typography variant="caption" sx={{ml:1}}>Cargando tareas...</Typography></Box>}
                        {errorTasks && <Alert severity="warning">No se pudo cargar la bitácora de tareas: {errorTasks}</Alert>}
                        {!loadingTasks && !errorTasks && ( 
                            filteredTasks.length > 0 ? ( 
                                <List disablePadding>{filteredTasks.map((task) => ( <TaskListItem key={task.id} task={task} onViewDetails={() => handleViewTaskDetails(task.id)} onEditTask={handleOpenEditTaskModal} onDeleteTask={handleDeleteTask} />))}</List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 2}}>No hay tareas registradas para el filtro actual.</Typography>
                            )
                        )}
                    </Paper>
                );
                case 'descripcion':
                    return (
                         <Paper elevation={0} sx={{ p: {xs: 1.5, sm:2, md: 3}, borderRadius: 2, minHeight: '300px' }}>
                            <Typography variant="h5" component="h2" gutterBottom sx={{fontWeight: 'medium'}}>Descripción del Proyecto</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {project.descripcion ? (
                                <Box
                                    className="tiptap-content-display" // Clase para posibles estilos globales
                                    sx={{
                                        // --- CONFIGURACIÓN GENERAL DE PÁRRAFOS Y LÍNEAS ---
                                        lineHeight: 1, // Controla el interlineado general
                                        '& p': { 
                                            mb: theme.spacing(1.5), // Margen inferior de los párrafos (ej. 12px si theme.spacing(1)=8px)
                                            textIndent: theme.spacing(5),
                                            lineHeight: 2,
                                            // Aquí podrías añadir:
                                            // textIndent: theme.spacing(2), // Si quieres sangría en la primera línea
                                            // '&:first-of-type': { textIndent: 0 }, // Para no aplicar sangría al primer párrafo
                                        },
                
                                        // --- ENCABEZADOS (HEADERS) ---
                                        '& h1': { 
                                            my: theme.spacing(3),  // Margen vertical (arriba y abajo) para h1
                                            fontSize: '1.8rem', 
                                            fontWeight: 'bold',    // <--- CAMBIO AQUÍ (antes era 500)
                                        },
                                        '& h2': { 
                                            my: theme.spacing(2.5), // Margen vertical para h2
                                            fontSize: '1.5rem', 
                                            fontWeight: 'bold',    // <--- CAMBIO AQUÍ
                                        },
                                        '& h3': { 
                                            my: theme.spacing(2),   // Margen vertical para h3
                                            fontSize: '1.3rem', 
                                            fontWeight: 'bold',    // <--- CAMBIO AQUÍ
                                        },
                                        // Puedes añadir estilos para '& h4', '& h5', '& h6' de forma similar si los usas:
                                        // '& h4': { my: theme.spacing(1.5), fontSize: '1.1rem', fontWeight: 'bold' },
                                        
                                        // --- LISTAS ---
                                        '& ul, & ol': { 
                                            pl: theme.spacing(3),    // Padding izquierdo para listas
                                            mb: theme.spacing(1.5),  // Margen inferior para listas
                                            // listStylePosition: 'inside', // Opcional, para cómo se muestran los bullets/números
                                        },
                                        '& li': {
                                            mb: theme.spacing(0.5), // Espaciado entre ítems de lista
                                        },
                
                                        // --- ENLACES ---
                                        '& a': { 
                                            color: theme.palette.primary.main, 
                                            textDecoration: 'underline',
                                            '&:hover': {
                                                color: theme.palette.primary.dark,
                                            }
                                        },
                
                                        // --- IMÁGENES ---
                                        '& img': { 
                                            maxWidth: '100%',       // Para que sean responsivas
                                            height: 'auto',         // Mantener proporción
                                            my: theme.spacing(2.5), // Margen vertical para imágenes
                                            borderRadius: theme.shape.borderRadius / 4, // Bordes redondeados
                                            boxShadow: theme.shadows[3],          // Sombra sutil
                                            display: 'block',       // Para que los márgenes my funcionen bien
                                            marginLeft: 'auto',     // Para centrar imágenes si son más pequeñas que el contenedor
                                            marginRight: 'auto',
                                        },
                                        
                                        // --- OTROS ELEMENTOS COMUNES ---
                                        '& blockquote': {
                                            borderLeft: `4px solid ${theme.palette.grey[300]}`,
                                            pl: theme.spacing(2),
                                            ml: 0, // Resetea margen por defecto si es necesario
                                            my: theme.spacing(2),
                                            fontStyle: 'italic',
                                            color: theme.palette.text.secondary,
                                        },
                                        '& hr': {
                                            my: theme.spacing(3),
                                            borderColor: theme.palette.divider,
                                        }
                                        // Añade aquí cualquier otro selector para elementos HTML que Tiptap pueda generar
                                    }}
                                    dangerouslySetInnerHTML={{ __html: project.descripcion }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py:2}}>No se ha proporcionado una descripción para este proyecto.</Typography>
                            )}
                        </Paper>
                    );

            case 'infoBasica':
                return (
                     <Paper elevation={0} sx={{ p: {xs: 1.5, sm:2, md: 3}, borderRadius: 2 }}>
                        
                        <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[3], minHeight: '300px', display:'flex', alignItems:'center', justifyContent:'center', background: theme.palette.grey[200] }}>
                            {/* ASUMO que tendrás un campo 'project.imagenUrl' en tu tipo Project */}
                            {project.imagenUrl ? (
                                <img 
                                    src={project.imagenUrl as string} // Casting si sabes que es string
                                    alt={`Imagen de ${project.nombre}`} 
                                    style={{ width: '100%', height: 'auto', maxHeight: '450px', display:'block', objectFit: 'contain' }} // 'contain' para ver toda la imagen
                                />
                            ) : project.location_point || project.area_polygon ? (
                                <ProjectMap 
                                    key={`map-for-${sectionId}`}
                                    locationPoint={project.location_point} 
                                    areaPolygon={project.area_polygon} 
                                    mapHeight="400px" 
                                />
                            ) : (
                                <Box sx={{textAlign: 'center', p:3, color: theme.palette.text.secondary}}>
                                    <ImageIcon sx={{fontSize: 60, mb:1}}/>
                                    <Typography>No hay imagen ni ubicación geográfica definida para este proyecto.</Typography>
                                </Box>
                            )}
                        </Box>

                        <Typography variant="h6" component="h3" gutterBottom sx={{fontWeight: 'normal', mt: 3, mb:1.5, borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5}}>Detalles Generales</Typography>
                        <Grid container spacing={2.5}>
                            {project.unidad?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={BusinessIcon} label="Unidad Municipal" value={project.unidad.nombre} /> </Grid> }
                            {project.tipologia?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CategoryIcon} label="Tipología" valueComponent={<Chip size="small" label={project.tipologia.nombre} sx={{bgcolor: project.tipologia.colorChip, color: theme.palette.getContrastText(project.tipologia.colorChip || theme.palette.primary.main)}} />} /> </Grid> }
                            {project.programa?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Programa" value={project.programa.nombre} /> </Grid>}
                            {project.lineaFinanciamiento?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Línea Financ." value={project.lineaFinanciamiento.nombre} /> </Grid>}
                            {project.etapaActualFinanciamiento?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={StairsIcon} label="Etapa Actual" value={project.etapaActualFinanciamiento.nombre} /> </Grid>}
                            {project.monto != null && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Ref. (${project.tipoMoneda})`} value={formatCurrency(project.monto, project.tipoMoneda)} /> </Grid>}
                            {project.proyectoPriorizado != null && <Grid item xs={12} sm={6} md={4}><IconDetailItem icon={project.proyectoPriorizado ? CheckBoxIcon : CheckBoxOutlineBlankIcon} label="Priorizado" value={project.proyectoPriorizado ? 'Sí' : 'No'} valueComponent={project.proyectoPriorizado ? <Chip size="small" label="Sí" color="success"/> : <Chip size="small" label="No"/>} /></Grid> }
                            
                            {isAuthenticated && project.proyectista && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Proyectista" value={`${project.proyectista.name || '?'} (${project.proyectista.email})`} /> </Grid>}
                            {isAuthenticated && project.formulador && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Formulador" value={`${project.formulador.name || '?'} (${project.formulador.email})`} /> </Grid>}
                            {isAuthenticated && project.colaboradores && project.colaboradores.length > 0 && ( <Grid item xs={12} md={4}> <IconDetailItem icon={GroupsIcon} label="Colaboradores" value={project.colaboradores.map(c => c.name || c.email).join(', ')} /> </Grid> )}
                        </Grid>
                        
                        {isAuthenticated && (project.montoAdjudicado !== undefined || project.codigoExpediente || project.codigoLicitacion || project.fechaPostulacion) && (
                            <>
                                <Typography variant="h6" component="h3" gutterBottom sx={{fontWeight: 'normal', mt: 3, mb:1.5, borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5}}>Detalles Financiamiento (Interno)</Typography>
                                <Grid container spacing={2.5}>
                                    {project.montoAdjudicado !== undefined && <Grid item xs={12} sm={6}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Adj. (${project.tipoMoneda})`} value={formatCurrency(project.montoAdjudicado, project.tipoMoneda)} /> </Grid> }
                                    {project.codigoExpediente && <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="Cód. Expediente" value={project.codigoExpediente} /> </Grid>}
                                    {project.codigoLicitacion && <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="ID Licitación" value={project.codigoLicitacion} /> </Grid>}
                                    {project.fechaPostulacion && <Grid item xs={12} sm={6}> <IconDetailItem icon={EventIcon} label="Fecha Postulación" value={formatDate(project.fechaPostulacion)} /> </Grid>}
                                </Grid>
                            </>
                        )}
                         <Typography variant="h6" component="h3" gutterBottom sx={{fontWeight: 'normal', mt: 3, mb:1.5, borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5}}>Registro</Typography>
                         <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={6}><IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /></Grid>
                            <Grid item xs={12} sm={6}><IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /></Grid>
                         </Grid>

                    </Paper>
                );
            case 'ubicacion':
                return (
                    <Paper elevation={0} sx={{ p: {xs: 1.5, sm:2, md: 3}, borderRadius: 2, minHeight: '400px', position: 'relative' }}>
                        <Box sx={{ height: isSmallScreen ? '350px' : '500px', borderRadius: 2, overflow: 'hidden', boxShadow: theme.shadows[2], mb: 2}}>
                            <ProjectMap 
                                key={`map-for-${sectionId}`}
                                locationPoint={project.location_point} 
                                areaPolygon={project.area_polygon}
                                mapHeight="100%"
                            />
                        </Box>
                        {/* Información flotante o debajo */}
                        <Paper elevation={1} sx={{ p:1.5, borderRadius: 1.5, mt: -1, position:'relative', zIndex:1 /*Para que esté sobre la sombra del mapa si es necesario*/ }}>
                            <Grid container spacing={2}>
                                {project.sector?.nombre && <Grid item xs={12} sm={6} md={3}> <IconDetailItem dense icon={TravelExploreIcon} label="Sector" value={project.sector.nombre} /> </Grid>}
                                {project.direccion && <Grid item xs={12} sm={6} md={3}> <IconDetailItem dense icon={LocationOnIcon} label="Dirección" value={project.direccion} /> </Grid>}
                                {project.superficieTerreno != null && <Grid item xs={12} sm={6} md={3}> <IconDetailItem dense icon={SquareFootIcon} label="Sup. Terreno (m²)" value={project.superficieTerreno.toLocaleString('es-CL')} /> </Grid>}
                                {project.superficieEdificacion != null && <Grid item xs={12} sm={6} md={3}> <IconDetailItem dense icon={SquareFootIcon} label="Sup. Edif. (m²)" value={project.superficieEdificacion.toLocaleString('es-CL')} /> </Grid>}
                            </Grid>
                        </Paper>
                    </Paper>
                );
            default:
                return <Alert severity="info">Selecciona una sección del menú.</Alert>;
        }
    };

    const RightPanelContent = (
        <Box
            component="main"
            sx={{
                flexGrow: 1, // Ocupa el espacio restante horizontalmente en pantallas grandes
                // Sin height fijo, sin overflowY: 'auto' aquí. El scroll será de la página.
                width: '100%', // Para asegurar que en modo apilado ocupe el ancho.
            }}
        >
            {isSmallScreen ? (
                // En pantallas pequeñas, apilar todas las secciones
                <Stack spacing={2} sx={{ p: 1.5 }}>
                    {menuItems.map(item => (
                        // Renderiza la sección solo si es visible según la lógica del menú (ej. tareas para auth)
                        (item.id === 'tareas' && !showTasksSectionInMenu) ? null : (
                            <Box key={item.id} id={`section-${item.id}`}>
                                {renderSectionContent(item.id)}
                            </Box>
                        )
                    ))}
                </Stack>
            ) : (
                // En pantallas grandes, mostrar solo la sección activa
                renderSectionContent(activeSection)
            )}
        </Box>
    );

    return (
        <Container
            maxWidth="xl" // O el maxWidth que hayas elegido
            sx={{
                display: 'flex',
                flexDirection: 'column',
                //minHeight: '100vh', // Asegura que la página ocupe al menos el alto de la ventana
                                   // pero puede crecer si el contenido es más largo.
                //py: 2, // Padding vertical opcional para el Container, puedes quitarlo si TopBar maneja su propio padding.
            }}
        >
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden'/* Prevenir doble scrollbar en body */}}>
            {TopBar}
            <Box sx={{
                display: 'flex',
                flexDirection: isSmallScreen ? 'column' : 'row', // Columna en pequeño, Fila en grande
                // Ya no necesitamos overflow: 'hidden' aquí, el scroll será manejado por el navegador.
            }}>
                {!isSmallScreen && LeftMenu /* Mostrar menú lateral solo en pantallas grandes */}
                {RightPanelContent /* El panel derecho (o contenido apilado) */}
            </Box>

            {/* Modales (sin cambios en su lógica, solo en las condiciones de renderizado si cambian las variables) */}
            {isAuthenticated && lookupOptions && project && isNewTaskModalOpen && (
                <Dialog open={isNewTaskModalOpen} onClose={handleCloseNewTaskModal} maxWidth="md" fullWidth>
                    <DialogTitle>Crear Nueva Tarea para "{project!.nombre}"</DialogTitle>
                    <FormProvider {...taskFormMethods}>
                        <form onSubmit={taskFormMethods.handleSubmit(onNewTaskSubmit)}>
                            <DialogContent>
                                <DialogContentText sx={{mb:2}}>Completa los detalles de la nueva tarea.</DialogContentText>
                                {taskFormError && <Alert severity="error" sx={{ mb: 2 }}>{taskFormError}</Alert>}
                                <TaskForm isSubmitting={isSubmittingTask} lookupOptions={lookupOptions!} />
                            </DialogContent>
                            <DialogActions sx={{pb:2, pr:2}}>
                                <Button onClick={handleCloseNewTaskModal} color="secondary" disabled={isSubmittingTask}>Cancelar</Button>
                                <Button type="submit" variant="contained" disabled={isSubmittingTask}>{isSubmittingTask ? <CircularProgress size={24} /> : "Crear Tarea"}</Button>
                            </DialogActions>
                        </form>
                    </FormProvider>
                </Dialog>
            )}
            {isAuthenticated && lookupOptions && editingTask && project && isEditTaskModalOpen && (
                 <Dialog open={isEditTaskModalOpen} onClose={handleCloseEditTaskModal} maxWidth="md" fullWidth>
                    <DialogTitle>Editar Tarea: "{editingTask!.titulo}"</DialogTitle>
                    <FormProvider {...taskFormMethods}>
                        <form onSubmit={taskFormMethods.handleSubmit(onEditTaskSubmit)}>
                            <DialogContent>
                                <DialogContentText sx={{mb:2}}>Modifica los detalles de la tarea.</DialogContentText>
                                {taskFormError && <Alert severity="error" sx={{ mb: 2 }}>{taskFormError}</Alert>}
                                <TaskForm isSubmitting={isSubmittingTask} lookupOptions={lookupOptions!} />
                            </DialogContent>
                            <DialogActions sx={{pb:2, pr:2}}>
                                <Button onClick={handleCloseEditTaskModal} color="secondary" disabled={isSubmittingTask}>Cancelar</Button>
                                <Button type="submit" variant="contained" disabled={isSubmittingTask}>{isSubmittingTask ? <CircularProgress size={24} /> : "Guardar Cambios"}</Button>
                            </DialogActions>
                        </form>
                    </FormProvider>
                </Dialog>
            )}
            {isAuthenticated && selectedTaskForDetail && project && isTaskDetailModalOpen && (
                <TaskDetailModal
                    task={selectedTaskForDetail!}
                    open={isTaskDetailModalOpen}
                    onClose={() => { setIsTaskDetailModalOpen(false); setSelectedTaskForDetail(null); }}
                />
            )}
            <Snackbar
                open={!!snackbarMessage || !!taskDetailErrorState}
                autoHideDuration={6000}
                onClose={() => {setSnackbarMessage(null); setTaskDetailErrorState(null);}}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => {setSnackbarMessage(null); setTaskDetailErrorState(null);}}
                    severity={taskDetailErrorState ? "error" : (snackbarMessage && snackbarMessage.toLowerCase().includes("error") ? "error" : "success")}
                    variant="filled" sx={{ width: '100%' }}
                >
                    {snackbarMessage || taskDetailErrorState}
                </Alert>
            </Snackbar>
        </Box>
    </Container>
    );
}

export default ProjectDetailPage;