// frontend/src/pages/ProjectDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Chip, Divider, Button, Stack, Tooltip, IconButton, useTheme, List
} from '@mui/material';

// --- Iconos ---
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import StairsIcon from '@mui/icons-material/Stairs';
import ArticleIcon from '@mui/icons-material/Article';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// --- Servicios y Tipos ---
import { projectApi } from '../services/projectApi';
import { taskApi } from '../services/taskApi';
import { lookupApi } from '../services/lookupApi'; 
import { 
    Project, 
    TipoMoneda, 
    Task, 
    EstadoTarea,
    PrioridadTarea,
    FormOptionsResponse, 
    CreateTaskFrontendInput,
    UpdateTaskFrontendInput,
    TaskFormValues,
    ChatMessage, 
    UserProjectTeamMember 
} from '../types';
import ProjectMap from '../components/ProjectMap';
import IconDetailItem from '../components/IconDetailItem';
import SectionPaper from '../components/layout/SectionPaper';
import { ApiError } from '../services/apiService';
import { useAuthStore, useIsAuthenticated, useCurrentUserRole } from '../store/authStore';
import TaskListItem from '../components/TaskListItem'; 
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema } from '../schemas/taskFormSchema';
import TaskForm from '../components/TaskForm';
import { Snackbar } from '@mui/material';
import TaskDetailModal from '../components/TaskDetailModal';
import { socketService } from '../services/socketService';

// --- Helper Functions ---
const formatCurrency = (value: string | number | null | undefined | { toNumber: () => number }, currency: TipoMoneda = 'CLP'): string => { let numericValue: number | null = null; if (value == null) numericValue = null; else if (typeof value === 'object' && value && typeof value.toNumber === 'function') numericValue = value.toNumber(); else { const num = Number(String(value).replace(',', '.')); if (!isNaN(num)) numericValue = num; } if (numericValue === null) return 'N/A'; try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency === 'UF' ? 'CLF' : 'CLP', minimumFractionDigits: currency === 'UF' ? 2 : 0, maximumFractionDigits: currency === 'UF' ? 4 : 0, }).format(numericValue); } catch (e) { console.error("Error formatting currency:", e); return `${currency === 'UF' ? 'UF' : '$'} ${numericValue.toLocaleString('es-CL')}`; } };
const formatDate = (dateString: string | Date | null | undefined): string => { if (!dateString) return 'N/A'; try { const date = (dateString instanceof Date) ? dateString : new Date(dateString); if (isNaN(date.getTime())) return 'Fecha inválida'; return date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { console.error("Error formatting date:", e); return 'Fecha inválida'; } };
// -------------------------------------

function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    
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
    const currentUser = useAuthStore((state) => state.user);
    const projectIdNum = id ? parseInt(id, 10) : NaN;

    const taskFormMethods = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            titulo: '', descripcion: null, asignadoId: null, 
            fechaPlazo: null, prioridad: null, estado: EstadoTarea.PENDIENTE,
        }
    });

    const loadPageData = useCallback(async (isFullLoad: boolean = true) => {
        if (isNaN(projectIdNum)) {
            setErrorProject("ID de proyecto inválido.");
            setLoadingProject(false); 
            setLoadingTasks(false);
            setLoadingLookups(false);
            return;
        }
    
        console.log(`[ProjectDetailPage] loadPageData - isFullLoad: ${isFullLoad}, projectId: ${projectIdNum}, Auth: ${isAuthenticated}`);
    
        if (isFullLoad) {
            setLoadingProject(true); 
            setErrorProject(null); 
            if (isAuthenticated) { // Solo activar loader de lookups si se van a pedir
                setLoadingLookups(true);
            }
        }
        // Activar loader de tareas si está autenticado y vamos a pedirlas
        if (isAuthenticated && (isFullLoad || !isFullLoad /*para el caso de refresh de tareas*/)) {
            setLoadingTasks(true); 
            setErrorTasks(null);
        } else if (!isAuthenticated) {
            // Limpiar y desactivar loaders si no está autenticado
            setTasks([]); 
            setLookupOptions(null);
            setLoadingTasks(false); 
            setLoadingLookups(false);
        }
    
        try {
            // 1. Cargar/Recargar Proyecto si es full load o si aún no existe en el estado.
            // 'project' (el estado) no es una dependencia de este useCallback, se accede a su valor actual.
            if (isFullLoad) { // En una carga completa, siempre intentamos obtener el proyecto
                console.log(`[ProjectDetailPage] Cargando detalles del proyecto ID: ${projectIdNum}`);
                const fetchedProject = await projectApi.getProjectById(projectIdNum, currentUser?.id);
                setProject(fetchedProject);
            }
    
            // 2. Si está autenticado, cargar/recargar tareas y (solo si es necesario) lookupOptions
            if (isAuthenticated) {
                if (isFullLoad) { // Carga completa para usuario autenticado
                    const [fetchedTasks, fetchedLookups] = await Promise.all([
                        taskApi.getTasksByProjectId(projectIdNum),
                        lookupApi.getFormOptions() // Solo en full load
                    ]);
                    setTasks(fetchedTasks);
                    setLookupOptions(fetchedLookups);
                } else { // Carga parcial (solo tareas) para usuario autenticado
                    console.log(`[ProjectDetailPage] Recargando solo tareas para proyecto ID: ${projectIdNum}`);
                    const fetchedTasks = await taskApi.getTasksByProjectId(projectIdNum);
                    setTasks(fetchedTasks);
                }
            } else if (isFullLoad && !isAuthenticated) {
                 // Si es carga completa pero no está autenticado, solo necesitamos el proyecto (ya cargado arriba)
                 // Aseguramos que tasks y lookups estén vacíos/null
                 setTasks([]);
                 setLookupOptions(null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocurrió un error al cargar datos.";
            console.error("[ProjectDetailPage] Error en loadPageData:", errorMessage);
            if (err instanceof ApiError && err.data) console.error("[ProjectDetailPage] ApiError data:", JSON.stringify(err.data, null, 2));
    
            if (isFullLoad) setErrorProject(errorMessage); // Si falla full load, error de proyecto
            if (isAuthenticated) setErrorTasks(errorMessage); // Si auth y falla (tareas o lookups), error de tareas
        } finally {
            setLoadingProject(false); 
            if (isAuthenticated) { 
                setLoadingTasks(false); 
                setLoadingLookups(false); 
            }
        }
    // Dependencias CLAVE: Estas harán que loadPageData se re-memoice solo si cambian.
    // No incluir 'project', 'tasks', 'lookupOptions' que son establecidos por esta función.
    }, [projectIdNum, isAuthenticated, currentUser?.id]); 

    useEffect(() => {
        if (projectIdNum) {
            console.log(`[ProjectDetailPage] useEffect[projectIdNum, isAuthenticated, loadPageData]: Carga completa disparada. ID: ${projectIdNum}, Auth: ${isAuthenticated}`);
            loadPageData(true); // Carga completa
        } else {
            // Limpiar estados si no hay projectIdNum (ej. el usuario navega fuera o ID es inválido)
            setProject(null);
            setTasks([]);
            setLookupOptions(null);
            setErrorProject("ID de proyecto no especificado.");
            setLoadingProject(false); setLoadingTasks(false); setLoadingLookups(false);
        }
    // Este efecto se ejecuta si projectIdNum cambia, o si isAuthenticated cambia (porque loadPageData cambiará su referencia)
    }, [projectIdNum, isAuthenticated, loadPageData]); 

    useEffect(() => {
        if (!isAuthenticated || !socketService.getSocket() || !currentUser?.id || !project) {
            // console.log("[ProjectDetailPage] Socket useEffect: Condiciones no cumplidas para suscribir.");
            return;
        }
        // Asegurar que los listeners solo se apliquen al proyecto actual que se está viendo
        if (project.id !== projectIdNum) {
            // console.log(`[ProjectDetailPage] Socket useEffect: project.id (<span class="math-inline">\{project\.id\}\) no coincide con projectIdNum \(</span>{projectIdNum}). No suscribiendo.`);
            return;
        }
    
        const handleTaskChatStatusUpdate = (data: { taskId: number; tieneMensajesNuevosEnChat: boolean }) => {
            // Solo actualiza si la tarea pertenece al proyecto actual
            if (tasks.find(t => t.id === data.taskId && t.proyectoId === project.id)) { // find es más eficiente que some si luego usas map
                console.log('[ProjectDetailPage] Evento task_chat_status_updated recibido:', data);
                setTasks(currentTasks => 
                    currentTasks.map(t => 
                        t.id === data.taskId 
                        ? { ...t, tieneMensajesNuevosEnChat: data.tieneMensajesNuevosEnChat } 
                        : t
                    )
                );
            }
        };
    
        const handleGlobalNotificationUpdate = (eventData?: {count: number}) => {
            console.log(`[ProjectDetailPage] Evento 'unread_count_updated' recibido por proyecto ${project.id}. Recargando lista de tareas (parcial). Data:`, eventData);
            loadPageData(false); // Llama a recargar solo tareas
        };
    
        console.log(`[ProjectDetailPage] Socket: Suscribiendo listeners para proyecto ${project.id}`);
        socketService.on('task_chat_status_updated', handleTaskChatStatusUpdate);
        socketService.on('unread_count_updated', handleGlobalNotificationUpdate);
    
        return () => {
            console.log(`[ProjectDetailPage] Socket: Limpiando listeners para proyecto ${project.id}`);
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('task_chat_status_updated', handleTaskChatStatusUpdate);
                socket.off('unread_count_updated', handleGlobalNotificationUpdate);
            }
        };
    // Dependencias clave: si cambian, se re-suscribe a los eventos.
    // setTasks es estable. loadPageData cambia si projectIdNum o isAuthenticated cambian.
    // 'tasks' se incluye porque handleTaskChatStatusUpdate lo lee para la condición .some().
    }, [isAuthenticated, currentUser?.id, project, projectIdNum, tasks, setTasks, loadPageData]);

    const handlePrint = () => { console.log("TODO: Imprimir ficha ID:", project?.id); alert("Impresión no implementada."); };
    const handleOpenNewTaskModal = () => { taskFormMethods.reset({ titulo: '', descripcion: null, asignadoId: null, fechaPlazo: null, prioridad: null, estado: EstadoTarea.PENDIENTE, }); setTaskFormError(null); setIsNewTaskModalOpen(true); };
    const handleCloseNewTaskModal = () => { setIsNewTaskModalOpen(false); };
    const onNewTaskSubmit: SubmitHandler<TaskFormValues> = async (data) => { if (!project || isNaN(projectIdNum) || !isAuthenticated) return; setIsSubmittingTask(true); setTaskFormError(null); try { const dataToSubmit: CreateTaskFrontendInput = { ...data, fechaPlazo: data.fechaPlazo ? new Date(data.fechaPlazo).toISOString() : null, }; await taskApi.createTask(project.id, dataToSubmit); setSnackbarMessage("¡Tarea creada exitosamente!"); handleCloseNewTaskModal(); loadPageData(false); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Error al crear la tarea."; console.error("[ProjectDetailPage] Error creando tarea:", errorMsg); setTaskFormError(errorMsg); } finally { setIsSubmittingTask(false); } };
    const handleOpenEditTaskModal = async (taskToEdit: Task) => { if (!project || !lookupOptions || !isAuthenticated) return; setLoadingTaskDetail(true); try { const freshTask = await taskApi.getTaskById(project.id, taskToEdit.id); taskFormMethods.reset({ titulo: freshTask.titulo, descripcion: freshTask.descripcion || null, asignadoId: freshTask.asignadoId || null, fechaPlazo: freshTask.fechaPlazo ? new Date(freshTask.fechaPlazo) : null, prioridad: freshTask.prioridad || null, estado: freshTask.estado, }); setEditingTask(freshTask); setIsEditTaskModalOpen(true); setTaskFormError(null); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Error al cargar tarea para editar."; setSnackbarMessage(errorMsg); } finally { setLoadingTaskDetail(false); } };
    const handleCloseEditTaskModal = () => { setIsEditTaskModalOpen(false); setEditingTask(null); };
    const onEditTaskSubmit: SubmitHandler<TaskFormValues> = async (data) => { if (!project || !editingTask || !isAuthenticated) return; setIsSubmittingTask(true); setTaskFormError(null); try { const dataToSubmit: UpdateTaskFrontendInput = { ...data, fechaPlazo: data.fechaPlazo ? new Date(data.fechaPlazo).toISOString() : null, }; await taskApi.updateTask(project.id, editingTask.id, dataToSubmit); setSnackbarMessage("¡Tarea actualizada exitosamente!"); handleCloseEditTaskModal(); loadPageData(false); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Error al actualizar la tarea."; console.error("[ProjectDetailPage] Error actualizando tarea:", errorMsg); setTaskFormError(errorMsg); } finally { setIsSubmittingTask(false); } };
    const handleDeleteTask = (taskId: number) => { console.log(`TODO: Confirmar para eliminar tarea ID: ${taskId} del proyecto ${projectIdNum}`); alert(`Eliminar tarea ${taskId} - Pendiente confirmación`); };
    const handleViewTaskDetails = async (taskId: number) => { if (!project || isNaN(projectIdNum) || !isAuthenticated) return; setLoadingTaskDetail(true); setTaskDetailErrorState(null); try { const detailedTask = await taskApi.getTaskById(projectIdNum, taskId); setSelectedTaskForDetail(detailedTask); setIsTaskDetailModalOpen(true); } catch (err) { const errorMsg = err instanceof Error ? err.message : "Error al cargar detalles."; setTaskDetailErrorState(errorMsg); setSnackbarMessage(errorMsg); } finally { setLoadingTaskDetail(false); } };

    // --- Lógica de Renderizado Principal ---
    // Primero los loaders y errores que impiden mostrar cualquier cosa del proyecto
    if (loadingProject && !project && !errorProject) { 
        return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: '70vh' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando proyecto...</Typography></Box> ); 
    }
    if (errorProject && !project) { 
        return ( <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>{errorProject}</Alert><Button startIcon={<ArrowBackIcon />} sx={{mt: 2}} onClick={() => navigate('/')}> Volver al Listado </Button></Container> ); 
    }
    if (!project) { // Si después de cargar, project sigue siendo null (y no hay errorProject explícito)
        return ( <Container maxWidth="md"><Typography sx={{ mt: 4 }}>No se encontró el proyecto o ID inválido.</Typography><Button startIcon={<ArrowBackIcon />} sx={{mt: 2}} onClick={() => navigate('/')}> Volver al Listado </Button></Container> ); 
    }

    // --- DEFINICIÓN DE VARIABLES PARA CONDICIONALES JSX (AHORA QUE 'project' EXISTE) ---
    const canManageTasks = isAuthenticated && (userRole === 'ADMIN' || userRole === 'COORDINADOR');
    const showBitacoraSection = isAuthenticated && lookupOptions && !errorTasks;

    // Usamos 'project.' aquí porque ya hemos pasado los guards que aseguran que 'project' no es null
    const showInternalFinancialDetails = isAuthenticated && 
        (project.montoAdjudicado !== undefined || 
         project.codigoExpediente !== undefined || 
         project.codigoLicitacion !== undefined || 
         project.fechaPostulacion !== undefined);

    const showFechasForGuest = !isAuthenticated && (project.createdAt || project.updatedAt);

    const canRenderNewTaskModal = !!(isAuthenticated && lookupOptions && project && isNewTaskModalOpen);
    const canRenderEditTaskModal = !!(isAuthenticated && lookupOptions && editingTask && project && isEditTaskModalOpen);
    const canRenderTaskDetailModal = !!(isAuthenticated && selectedTaskForDetail && project && isTaskDetailModalOpen);
    // --- FIN DEFINICIÓN DE VARIABLES ---

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            {/* Banner */}
            <Box sx={{ boxShadow: theme.shadows[3], height: { xs: '250px', sm: '300px', md: '350px' }, position: 'relative', overflow: 'hidden', mb: 3, borderRadius: theme.shape.borderRadius ? (theme.shape.borderRadius / 10) : '2px', }} >
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <ProjectMap locationPoint={project.location_point} areaPolygon={project.area_polygon} />
                </Box>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0) 100%)', borderRadius: 'inherit' }} />
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, p: { xs: 2, md: 3 }, color: 'common.white', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>{project.nombre}</Typography>
                    {project.tipologia && <Chip label={project.codigoUnico || '?'} size="medium" sx={{ backgroundColor: project.tipologia.colorChip || 'rgba(255,255,255,0.3)', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', textShadow: '1px 1px 1px rgba(0,0,0,0.4)', border: '3px solid rgba(255,255,255,1)', px: 2, py: 2.3 }} />}
                </Box>
                <Box sx={{ position: 'absolute', top: 0, left: theme.spacing(1), right: theme.spacing(1), zIndex: 3, p: { xs: 1, sm: 1.5 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button variant="contained" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', color: 'white', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.65)' } }}>Volver</Button>
                    <Stack direction="row" spacing={1}>
                        {project && ( <Button variant="contained" size="small" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: 'rgba(50,50,50,1)', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.5)' } }}>Imprimir</Button> )}
                        {isAuthenticated && (project.proyectistaId === currentUser?.id || userRole === 'ADMIN' || userRole === 'COORDINADOR') && (
                            <Button component={Link} to={`/projects/${project.id}/edit`} variant="contained" size="small" color="primary" startIcon={<EditIcon />}>Editar</Button>
                        )}
                    </Stack>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Sección Bitácora de Tareas */}
                {showBitacoraSection && (
                    <Grid item xs={12} md={(project.descripcion) ? 12 : 12}>
                        <SectionPaper elevation={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" gutterBottom component="div">Bitácora de Tareas</Typography>
                                {canManageTasks && ( <Button variant="contained" color="primary" size="small" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenNewTaskModal}>Nueva Tarea</Button> )}
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {loadingTasks && <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress size={24} /><Typography variant="caption" sx={{ml:1}}>Cargando tareas...</Typography></Box>}
                            {!loadingTasks && ( tasks.length > 0 ? ( <List disablePadding>{tasks.map((task) => ( <TaskListItem key={task.id} task={task} onViewDetails={() => handleViewTaskDetails(task.id)} onEditTask={handleOpenEditTaskModal} onDeleteTask={handleDeleteTask} />))}</List>) : (<Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 2}}>No hay tareas registradas.</Typography>))}
                        </SectionPaper>
                    </Grid>
                )}
                {isAuthenticated && errorTasks && !loadingTasks && !lookupOptions && ( 
                     <Grid item xs={12} md={(project.descripcion && showBitacoraSection) ? 8 : 12}>
                        <Alert severity="warning" sx={{width: '100%'}}>No se pudo cargar la bitácora de tareas: {errorTasks}</Alert>
                    </Grid>
                )}
                
                {/* Columna para Descripción del Proyecto */}
                <Grid item xs={12} md={showBitacoraSection ? 12 : (project.descripcion ? 12 : 0) }>
                    {project.descripcion && (
                        <SectionPaper elevation={2} sx={{height: showBitacoraSection ? '100%' : 'auto' }}>
                            <Typography variant="h6" gutterBottom>Descripción del Proyecto</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box className="tiptap-content-display" sx={{ maxHeight: showBitacoraSection ? 'calc(80vh - 200px)' : 'none', overflowY: 'auto', lineHeight: 1.6, '& h1': { my: theme.spacing(2), fontSize: '1.6rem', fontWeight: 500 }, '& h2': { my: theme.spacing(1.5), fontSize: '1.4rem', fontWeight: 500 }, '& h3': { my: theme.spacing(1.2), fontSize: '1.2rem', fontWeight: 500 }, '& p': { mb: theme.spacing(1.5) }, '& ul, & ol': { pl: theme.spacing(3), mb: theme.spacing(1.5) }, '& a': { color: theme.palette.primary.main }, '& img': { maxWidth: '100%', height: 'auto', my: theme.spacing(1.5), borderRadius: theme.shape.borderRadius } }} dangerouslySetInnerHTML={{ __html: project.descripcion }} />
                        </SectionPaper>
                    )}
                    {isAuthenticated && !project.descripcion && lookupOptions && !errorTasks && (
                        <SectionPaper elevation={2} sx={{height: '100%'}}><Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py:2}}>No se ha proporcionado una descripción.</Typography></SectionPaper>
                    )}
                </Grid>
                            
                {/* Información Básica (Pública y condicionalmente interna) */}
                <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Información Básica</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> 
                    {project.unidad?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={BusinessIcon} label="Unidad Municipal" value={project.unidad.nombre} /> </Grid> }
                    {project.tipologia?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CategoryIcon} label="Tipología" value={project.tipologia.nombre} /> </Grid> }
                    {project.estado?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={InfoOutlinedIcon} label="Estado Actual" value={project.estado.nombre} /> </Grid> }
                    {project.ano != null && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CalendarTodayIcon} label="Año Iniciativa" value={project.ano.toString()} /> </Grid>}
                    {project.programa?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Programa" value={project.programa.nombre} /> </Grid>}
                    {project.lineaFinanciamiento?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Línea Financ." value={project.lineaFinanciamiento.nombre} /> </Grid>}
                    {project.etapaActualFinanciamiento?.nombre && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={StairsIcon} label="Etapa Actual" value={project.etapaActualFinanciamiento.nombre} /> </Grid>}
                    {project.monto != null && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Ref. (${project.tipoMoneda})`} value={formatCurrency(project.monto, project.tipoMoneda)} /> </Grid>}
                    {project.proyectoPriorizado != null && <Grid item xs={12} sm={6} md={4}><IconDetailItem icon={project.proyectoPriorizado ? CheckBoxIcon : CheckBoxOutlineBlankIcon} label="Priorizado" value={project.proyectoPriorizado ? 'Sí' : 'No'} /></Grid> }
                    
                    {isAuthenticated && project.proyectista && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Proyectista" value={`${project.proyectista.name || '?'} (${project.proyectista.email})`} /> </Grid>}
                    {isAuthenticated && project.formulador && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Formulador" value={`${project.formulador.name || '?'} (${project.formulador.email})`} /> </Grid>}
                    {isAuthenticated && project.colaboradores && project.colaboradores.length > 0 && ( <Grid item xs={12} md={4}> <IconDetailItem icon={GroupsIcon} label="Colaboradores" value={project.colaboradores.map(c => c.name || c.email).join(', ')} /> </Grid> )}
                </Grid> </SectionPaper> </Grid>
                
                {/* Ubicación y Superficies (Pública) */}
                <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Ubicación y Superficies</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> 
                    {project.sector?.nombre && <Grid item xs={12} md={6}> <IconDetailItem icon={TravelExploreIcon} label="Sector" value={project.sector.nombre} /> </Grid>}
                    {project.superficieTerreno != null && <Grid item xs={12} md={6}> <IconDetailItem icon={SquareFootIcon} label="Sup. Terreno (m²)" value={project.superficieTerreno.toLocaleString('es-CL')} /> </Grid>}
                    {project.superficieEdificacion != null && <Grid item xs={12} md={6}> <IconDetailItem icon={SquareFootIcon} label="Sup. Edificación (m²)" value={project.superficieEdificacion.toLocaleString('es-CL')} /> </Grid>}
                    {project.direccion && <Grid item xs={12} md={6}> <IconDetailItem icon={LocationOnIcon} label="Dirección" value={project.direccion} /> </Grid>}
                </Grid></SectionPaper></Grid>
                
                {/* SECCIÓN FINANCIERA DETALLADA (Interna) Y FECHAS DE CREACIÓN/MOD (Públicas, pero aquí agrupadas para Autenticados) */}
                {isAuthenticated && (showInternalFinancialDetails || project.createdAt || project.updatedAt) && ( 
                    <>
                        {showInternalFinancialDetails && (
                            <Grid item xs={12} md={(project.createdAt || project.updatedAt) ? 8 : 12}> 
                                <SectionPaper elevation={2} sx={{ height: '100%' }}> 
                                    <Typography variant="h6" gutterBottom>Detalles Financiamiento (Interno)</Typography> 
                                    <Divider sx={{ mb: 2.5 }} /> 
                                    <Grid container spacing={3} alignItems="flex-start"> 
                                        {project.montoAdjudicado !== undefined && <Grid item xs={12} sm={6}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Adj. (${project.tipoMoneda})`} value={formatCurrency(project.montoAdjudicado, project.tipoMoneda)} /> </Grid> }
                                        {project.codigoExpediente && <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="Cód. Expediente" value={project.codigoExpediente} /> </Grid>}
                                        {project.codigoLicitacion && <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="ID Licitación" value={project.codigoLicitacion} /> </Grid>}
                                        {project.fechaPostulacion && <Grid item xs={12} sm={6}> <IconDetailItem icon={EventIcon} label="Fecha Postulación" value={formatDate(project.fechaPostulacion)} /> </Grid>}
                                    </Grid> 
                                </SectionPaper> 
                            </Grid>
                        )}
                        {(project.createdAt || project.updatedAt) && (
                            <Grid item xs={12} md={showInternalFinancialDetails ? 4 : 12}> 
                                <SectionPaper elevation={2} sx={{ height: '100%' }}> 
                                    <Typography variant="h6" gutterBottom>Fechas Registro</Typography> <Divider sx={{ mb: 2.5 }} /> 
                                    <Grid container spacing={3} alignItems="flex-start"> 
                                        {project.createdAt && <Grid item xs={12}> <IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /> </Grid> }
                                        {project.updatedAt && <Grid item xs={12}> <IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /> </Grid> }
                                    </Grid> 
                                </SectionPaper> 
                            </Grid> 
                        )}
                    </> 
                )}
                {/* FECHAS PARA INVITADOS (Público, solo si no está autenticado) */}
                {showFechasForGuest && ( 
                    <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Fechas</Typography> <Divider sx={{ mb: 3 }} /> <Grid container spacing={3} alignItems="flex-start"> 
                        {project.createdAt && <Grid item xs={12} md={6}> <IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /> </Grid>}
                        {project.updatedAt && <Grid item xs={12} md={6}> <IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /> </Grid>}
                    </Grid> </SectionPaper> </Grid> 
                )}
            </Grid>

            {/* Modales */}
            {canRenderNewTaskModal && (
                <Dialog open={isNewTaskModalOpen} onClose={handleCloseNewTaskModal} maxWidth="md" fullWidth>
                    <DialogTitle>Crear Nueva Tarea para "{project!.nombre}"</DialogTitle>
                    <FormProvider {...taskFormMethods}>
                        <form onSubmit={taskFormMethods.handleSubmit(onNewTaskSubmit)}>
                            <DialogContent>
                                <DialogContentText sx={{mb:2}}>Completa los detalles de la nueva tarea. La descripción puede incluir texto enriquecido.</DialogContentText>
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
            {canRenderEditTaskModal && (
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
            {canRenderTaskDetailModal && (
                <TaskDetailModal
                    task={selectedTaskForDetail!}
                    open={isTaskDetailModalOpen}
                    onClose={() => { setIsTaskDetailModalOpen(false); setSelectedTaskForDetail(null); }}
                    // projectId={project.id} // Pasado para consistencia si TaskDetailModal lo necesita
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
        </Container>
    );
}

export default ProjectDetailPage;