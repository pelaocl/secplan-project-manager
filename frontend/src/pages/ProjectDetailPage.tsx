// frontend/src/pages/ProjectDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Chip, Divider, Button, Stack, Tooltip, IconButton, useTheme, List // SvgIcon no se usaba
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
    // User, // No se usa directamente aquí si los objetos vienen completos
    Task, 
    EstadoTarea,
    PrioridadTarea,
    FormOptionsResponse, 
    CreateTaskFrontendInput,
    TaskFormValues,
    // ChatMessage // No se usa directamente aquí
} from '../types';
import ProjectMap from '../components/ProjectMap';
import IconDetailItem from '../components/IconDetailItem';
import SectionPaper from '../components/layout/SectionPaper';
import { ApiError } from '../services/apiService';
import { useAuthStore, useIsAuthenticated, useCurrentUserRole } from '../store/authStore'; // useAuthStore para currentUser
import TaskListItem from '../components/TaskListItem'; 
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema } from '../schemas/taskFormSchema';
import TaskForm from '../components/TaskForm';
import { Snackbar } from '@mui/material'; // Ya estaba
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
    const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
    const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
    
    const [errorProject, setErrorProject] = useState<string | null>(null);
    const [errorTasks, setErrorTasks] = useState<string | null>(null);
    // const [errorLookups, setErrorLookups] = useState<string | null>(null); // Opcional si quieres error específico para lookups

    const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);
    const [taskFormError, setTaskFormError] = useState<string | null>(null);
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState<boolean>(false);
    const [taskDetailErrorState, setTaskDetailErrorState] = useState<string | null>(null);
    
    const isAuthenticated = useIsAuthenticated();
    const userRole = useCurrentUserRole();
    const currentUser = useAuthStore((state) => state.user); // Para el userId
    const projectIdNum = id ? parseInt(id, 10) : NaN;

    const taskFormMethods = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            titulo: '', descripcion: null, asignadoId: null, 
            fechaPlazo: null, prioridad: null, estado: EstadoTarea.PENDIENTE,
            // participantesIds: [], // Este campo no está en tu TaskFormValues del schema
        }
    });

    const loadPageData = useCallback(async (isFullLoad: boolean = true) => {
        if (isNaN(projectIdNum)) {
            setErrorProject("ID de proyecto inválido.");
            setLoadingProject(false); setLoadingTasks(false); setLoadingLookups(false);
            return;
        }

        console.log(`[ProjectDetailPage] loadPageData - isFullLoad: ${isFullLoad}, projectId: ${projectIdNum}`);

        if (isFullLoad) {
            setLoadingProject(true); 
            setLoadingLookups(true);
            setErrorProject(null); 
            // setErrorLookups(null); // Si tuvieras estado de error para lookups
        }
        setLoadingTasks(true); // Siempre se setea al intentar cargar/recargar tareas
        setErrorTasks(null);

        try {
            const promisesToFetch = [];

            if (isFullLoad) {
                promisesToFetch.push(projectApi.getProjectById(projectIdNum));
                promisesToFetch.push(lookupApi.getFormOptions());
            }
            // Las tareas siempre se intentan cargar/recargar
            promisesToFetch.push(taskApi.getTasksByProjectId(projectIdNum));
            
            const results = await Promise.all(promisesToFetch);

            let currentIndex = 0;
            if (isFullLoad) {
                setProject(results[currentIndex++]);
                setLookupOptions(results[currentIndex++]);
            }
            setTasks(results[currentIndex++]);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocurrió un error al cargar datos.";
            console.error("[ProjectDetailPage] Error en loadPageData:", errorMessage, err);
            if (isFullLoad) {
                setErrorProject(errorMessage);
                // setErrorLookups(errorMessage);
            }
            setErrorTasks(errorMessage); // Si falla el Promise.all, todas las cargas fallaron
        } finally {
            if (isFullLoad) {
                setLoadingProject(false);
                setLoadingLookups(false);
            }
            setLoadingTasks(false);
        }
    }, [projectIdNum]);

    // Efecto para carga inicial y cuando cambia el projectIdNum
    useEffect(() => {
        if (projectIdNum) {
            console.log(`[ProjectDetailPage] Efecto de carga inicial/proyecto cambiado. ID: ${projectIdNum}`);
            loadPageData(true); // Carga completa
        }
    }, [projectIdNum, loadPageData]); // loadPageData está memoizada con projectIdNum

    // Efecto para Socket.IO: refrescar lista de tareas si cambian notificaciones del usuario actual
    useEffect(() => {
        if (!isAuthenticated || !socketService.getSocket() || !projectIdNum || !currentUser?.id) {
            return;
        }

        const handleTaskListRefreshNeeded = (eventData?: {count: number}) => {
            console.log(`[ProjectDetailPage] Evento 'unread_count_updated' recibido. Recargando lista de tareas para proyecto ${projectIdNum}. Data:`, eventData);
            // Solo recargamos las tareas, ya que el contador global se actualiza en NotificationBell,
            // y el indicador de "chat no leído" en la tarea depende de esta lista de tareas.
            setLoadingTasks(true);
            taskApi.getTasksByProjectId(projectIdNum)
                .then(fetchedTasks => {
                    setTasks(fetchedTasks);
                    setErrorTasks(null);
                })
                .catch(err => {
                    const errorMsg = err instanceof Error ? err.message : "Error recargando tareas tras evento socket.";
                    setErrorTasks(errorMsg);
                    console.error("[ProjectDetailPage] Error recargando tareas (socket):", errorMsg);
                })
                .finally(() => {
                    setLoadingTasks(false);
                });
        };
        
        socketService.on('unread_count_updated', handleTaskListRefreshNeeded);

        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('unread_count_updated', handleTaskListRefreshNeeded);
            }
            console.log("[ProjectDetailPage] Limpiando listener de socket 'unread_count_updated'.");
        };
    }, [isAuthenticated, projectIdNum, currentUser?.id]); // No incluir loadPageData aquí para evitar bucles si no es necesario

    const handlePrint = () => { console.log("TODO: Imprimir ficha ID:", project?.id); alert("Impresión no implementada."); };
    
    const handleOpenNewTaskModal = () => {
        taskFormMethods.reset({ 
            titulo: '', descripcion: null, asignadoId: null, 
            fechaPlazo: null, prioridad: null, estado: EstadoTarea.PENDIENTE,
        });
        setTaskFormError(null); 
        setIsNewTaskModalOpen(true);
    };

    const handleCloseNewTaskModal = () => { setIsNewTaskModalOpen(false); };

    const onNewTaskSubmit: SubmitHandler<TaskFormValues> = async (data) => {
        if (!project) return;
        setIsSubmittingTask(true);
        setTaskFormError(null);
        try {
            const dataToSubmit: CreateTaskFrontendInput = {
                ...data,
                fechaPlazo: data.fechaPlazo ? new Date(data.fechaPlazo).toISOString() : null,
            };
            await taskApi.createTask(project.id, dataToSubmit);
            setSnackbarMessage("¡Tarea creada exitosamente!");
            handleCloseNewTaskModal();
            // Recargar solo tareas después de crear una
            setLoadingTasks(true);
            taskApi.getTasksByProjectId(projectIdNum)
                .then(setTasks)
                .catch(err => setTasksError(err instanceof Error ? err.message : "Error recargando tareas."))
                .finally(() => setLoadingTasks(false));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Error al crear la tarea.";
            console.error("Error creando tarea:", err);
            setTaskFormError(errorMsg);
        } finally {
            setIsSubmittingTask(false);
        }
    };
    
    const handleViewTaskDetails = async (taskId: number) => {
        if (!project || isNaN(projectIdNum)) return;
        setLoadingTaskDetail(true);
        setTaskDetailErrorState(null);
        try {
            const detailedTask = await taskApi.getTaskById(projectIdNum, taskId);
            setSelectedTaskForDetail(detailedTask);
            setIsTaskDetailModalOpen(true);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Error al cargar los detalles de la tarea.";
            console.error("Error cargando detalles de la tarea:", err);
            setTaskDetailErrorState(errorMsg);
            setSnackbarMessage(errorMsg); 
        } finally {
            setLoadingTaskDetail(false);
        }
    };

    // Renderizado condicional principal
    if (loadingProject && !project) { 
        return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: '70vh' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando datos del proyecto...</Typography></Box> ); 
    }
    if (errorProject && !project) { 
        return ( <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>{errorProject}</Alert><Button startIcon={<ArrowBackIcon />} sx={{mt: 2}} onClick={() => navigate('/')}> Volver al Listado </Button></Container> ); 
    }
    if (!project) { 
        return ( <Container maxWidth="md"><Typography sx={{ mt: 4 }}>No se encontró el proyecto o ID inválido.</Typography><Button startIcon={<ArrowBackIcon />} sx={{mt: 2}} onClick={() => navigate('/')}> Volver al Listado </Button></Container> ); 
    }

    const canManageTasks = isAuthenticated && (userRole === 'ADMIN' || userRole === 'COORDINADOR');

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            {/* Banner */}
            <Box sx={{ boxShadow: theme.shadows[3], height: { xs: '250px', sm: '300px', md: '350px' }, position: 'relative', overflow: 'hidden', mb: 3, borderRadius: (theme.shape.borderRadius || 12) / 10, }} >
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <ProjectMap locationPoint={project.location_point} areaPolygon={project.area_polygon} />
                </Box>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)' }} />
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, p: { xs: 2, md: 3 }, color: 'common.white', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>{project.nombre}</Typography>
                    <Chip label={project.codigoUnico || '?'} size="medium" sx={{ backgroundColor: project.tipologia?.colorChip || 'rgba(255,255,255,0.3)', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', textShadow: '1px 1px 1px rgba(0,0,0,0.4)', border: '3px solid rgba(255,255,255,1)', px: 2, py: 2.3 }} />
                </Box>
                <Box sx={{ position: 'absolute', top: 0, left: 35, right: 0, zIndex: 3, p: { xs: 1, sm: 2 }, display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="contained" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', color: 'white', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.6)' } }}>Volver</Button>
                    {isAuthenticated && (
                        <Stack direction="row" spacing={1}>
                            <Button variant="contained" size="small" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'rgba(80,80,80,1)', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.4)' } }}>Imprimir</Button>
                            <Button component={Link} to={`/projects/${project.id}/edit`} variant="contained" size="small" color="primary" startIcon={<EditIcon />}>Editar</Button>
                        </Stack>
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>
                {isAuthenticated && (
                    <Grid item xs={12} md={lookupOptions && project.descripcion ? 8 : 12}> {/* Ajustar ancho */}
                        <SectionPaper elevation={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" gutterBottom component="div">Bitácora de Tareas</Typography>
                                {canManageTasks && lookupOptions && (
                                    <Button variant="contained" color="primary" size="small" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenNewTaskModal} aria-label="Crear nueva tarea">
                                        Nueva Tarea
                                    </Button>
                                )}
                                {/* Loader para botón si lookups están cargando pero el usuario puede gestionar tareas */}
                                {canManageTasks && !lookupOptions && loadingLookups && <CircularProgress size={20} />}
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {loadingTasks && <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress size={24} /><Typography variant="caption" sx={{ml:1}}>Cargando tareas...</Typography></Box>}
                            {errorTasks && !loadingTasks && <Alert severity="error" sx={{mt: 1, mb: 1}}>{errorTasks}</Alert>}
                            {!loadingTasks && !errorTasks && ( tasks.length > 0 ? ( <List disablePadding>{tasks.map((task) => ( <TaskListItem key={task.id} task={task} onViewDetails={() => handleViewTaskDetails(task.id)} />))}</List>) : (<Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 2}}>No hay tareas registradas.</Typography>))}
                        </SectionPaper>
                    </Grid>
                )}
                
                {/* Columna para Descripción del Proyecto o Detalles/Chat de Tarea */}
                <Grid item xs={12} md={isAuthenticated && lookupOptions ? 4 : (project.descripcion ? 12 : 0) }>
                    {project.descripcion && ( // Mostrar siempre si hay descripción
                        <SectionPaper elevation={2} sx={{height: isAuthenticated && lookupOptions ? 'calc(100% - 0px)' : 'auto' /* Ocupar altura si hay bitácora al lado */}}>
                            <Typography variant="h6" gutterBottom>Descripción del Proyecto</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box 
                                className="quill-content-display" 
                                sx={{ 
                                    maxHeight: isAuthenticated && lookupOptions ? 'calc(80vh - 200px)' : 'none', // Limitar altura si está al lado de la bitácora
                                    overflowY: 'auto', 
                                    lineHeight: 1.5, 
                                    '& h1': { my: theme.spacing(1.5), fontSize: '1.5rem' }, 
                                    '& h2': { my: theme.spacing(1.2), fontSize: '1.3rem' }, 
                                    '& h3': { my: theme.spacing(1), fontSize: '1.15rem' }, 
                                    '& p': { mb: theme.spacing(0.8) }, 
                                    '& ul, & ol': { pl: theme.spacing(2.5), mb: theme.spacing(0.8) }, 
                                    '& a': { color: theme.palette.primary.main }, 
                                    '& img': { maxWidth: '100%', height: 'auto', my: theme.spacing(1), borderRadius: theme.shape.borderRadius } 
                                }} 
                                dangerouslySetInnerHTML={{ __html: project.descripcion }} />
                        </SectionPaper>
                    )}
                </Grid>
                            
                <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Información Básica</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={BusinessIcon} label="Unidad Municipal" value={project.unidad?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CategoryIcon} label="Tipología" value={project.tipologia?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={InfoOutlinedIcon} label="Estado Actual" value={project.estado?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CalendarTodayIcon} label="Año Iniciativa" value={project.ano?.toString()} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Programa" value={project.programa?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Línea Financ." value={project.lineaFinanciamiento?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Ref. (${project.tipoMoneda})`} value={formatCurrency(project.monto, project.tipoMoneda)} /> </Grid> {isAuthenticated && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Proyectista" value={project.proyectista ? `${project.proyectista.name || '?'} (${project.proyectista.email})` : null} /> </Grid>} {isAuthenticated && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Formulador" value={project.formulador ? `${project.formulador.name || '?'} (${project.formulador.email})` : null} /> </Grid>} {isAuthenticated && project.colaboradores && project.colaboradores.length > 0 && ( <Grid item xs={12} md={4}> <IconDetailItem icon={GroupsIcon} label="Nº Colaboradores" value={project.colaboradores.length.toString()} /> </Grid> )} </Grid> </SectionPaper> </Grid>
                <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Ubicación y Superficies</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} md={6}> <IconDetailItem icon={TravelExploreIcon} label="Sector" value={project.sector?.nombre} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={SquareFootIcon} label="Sup. Terreno (m²)" value={project.superficieTerreno?.toLocaleString('es-CL')} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={SquareFootIcon} label="Sup. Edificación (m²)" value={project.superficieEdificacion?.toLocaleString('es-CL')} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={LocationOnIcon} label="Dirección" value={project.direccion} /> </Grid> </Grid> </SectionPaper> </Grid>
                {isAuthenticated && (project.montoAdjudicado != null || project.lineaFinanciamiento || project.codigoExpediente || project.fechaPostulacion || project.proyectoPriorizado != null || project.createdAt) && ( <> <Grid item xs={12} md={8}> <SectionPaper elevation={2} sx={{ height: '100%' }}> <Typography variant="h6" gutterBottom>Detalles Financiamiento</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} sm={6}> <IconDetailItem icon={ArticleIcon} label="Línea" value={project.lineaFinanciamiento?.nombre} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={ArticleIcon} label="Programa" value={project.programa?.nombre} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={StairsIcon} label="Etapa Actual" value={project.etapaActualFinanciamiento?.nombre} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Adj. (${project.tipoMoneda})`} value={formatCurrency(project.montoAdjudicado, project.tipoMoneda)} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="Cód. Expediente" value={project.codigoExpediente} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="ID Licitación" value={project.codigoLicitacion} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={EventIcon} label="Fecha Postulación" value={formatDate(project.fechaPostulacion)} /> </Grid> </Grid> </SectionPaper> </Grid> <Grid item xs={12} md={4}> <SectionPaper elevation={2} sx={{ height: '100%' }}> <Typography variant="h6" gutterBottom>Estado y Fechas</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12}> <IconDetailItem icon={project.proyectoPriorizado ? CheckBoxIcon : CheckBoxOutlineBlankIcon} label="Priorizado" value={project.proyectoPriorizado ? 'Sí' : 'No'} /> </Grid> <Grid item xs={12}> <IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /> </Grid> <Grid item xs={12}> <IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /> </Grid> </Grid> </SectionPaper> </Grid> </> )}
                {!isAuthenticated && ( <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Fechas</Typography> <Divider sx={{ mb: 3 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} md={6}> <IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /> </Grid> </Grid> </SectionPaper> </Grid> )}
            </Grid>

            {lookupOptions && project && (
                <Dialog open={isNewTaskModalOpen} onClose={handleCloseNewTaskModal} maxWidth="md" fullWidth>
                    <DialogTitle>Crear Nueva Tarea para "{project.nombre}"</DialogTitle>
                    <FormProvider {...taskFormMethods}>
                        <form onSubmit={taskFormMethods.handleSubmit(onNewTaskSubmit)}>
                            <DialogContent>
                                <DialogContentText sx={{mb:2}}>Completa los detalles de la nueva tarea. La descripción puede incluir texto enriquecido.</DialogContentText>
                                {taskFormError && <Alert severity="error" sx={{ mb: 2 }}>{taskFormError}</Alert>}
                                <TaskForm 
                                    isSubmitting={isSubmittingTask} 
                                    lookupOptions={lookupOptions} 
                                    // Props de RHF como control, errors, etc., se obtienen de FormProvider en TaskForm
                                />
                            </DialogContent>
                            <DialogActions sx={{pb:2, pr:2}}>
                                <Button onClick={handleCloseNewTaskModal} color="secondary" disabled={isSubmittingTask}>Cancelar</Button>
                                <Button type="submit" variant="contained" disabled={isSubmittingTask}>{isSubmittingTask ? <CircularProgress size={24} /> : "Crear Tarea"}</Button>
                            </DialogActions>
                        </form>
                    </FormProvider>
                </Dialog>
            )}

            {selectedTaskForDetail && project && ( // Asegurarse que project exista para TaskDetailModal si lo necesita
                <TaskDetailModal
                    task={selectedTaskForDetail}
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
        </Container>
    );
}

export default ProjectDetailPage;