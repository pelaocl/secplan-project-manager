// frontend/src/pages/ProjectDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback añadido
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, Typography, CircularProgress, Alert, Paper, Grid, Chip, Divider, Button, Stack, Tooltip, IconButton, SvgIcon, useTheme, List // List añadido
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Para "Nueva Tarea"

// --- Servicios y Tipos ---
import { projectApi } from '../services/projectApi';
import { taskApi } from '../services/taskApi';
import { Project, TipoMoneda, User, Task, EstadoTarea, PrioridadTarea } from '../types'; // <-- Task y Enums de Tarea añadidos
import ProjectMap from '../components/ProjectMap';
import IconDetailItem from '../components/IconDetailItem';
import SectionPaper from '../components/layout/SectionPaper';
import { ApiError } from '../services/apiService';
import { useIsAuthenticated, useCurrentUserRole } from '../store/authStore'; // <-- useCurrentUserRole añadido
import TaskListItem from '../components/TaskListItem'; 
import { lookupApi } from '../services/lookupApi'; 
import { /* ..., */ FormOptionsResponse } from '../types';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskFormSchema, TaskFormValues } from '../schemas/taskFormSchema';
import TaskForm from '../components/TaskForm'; // Tu componente de formulario de tareas
import { Snackbar } from '@mui/material'; // Para mensajes de éxito/error
import TaskDetailModal from '../components/TaskDetailModal';

// --- Helper Functions ---
const formatCurrency = (value: string | number | null | undefined | { toNumber: () => number }, currency: TipoMoneda = 'CLP'): string => { let numericValue: number | null = null; if (value == null) numericValue = null; else if (typeof value === 'object' && value && typeof value.toNumber === 'function') numericValue = value.toNumber(); else { const num = Number(String(value).replace(',', '.')); if (!isNaN(num)) numericValue = num; } if (numericValue === null) return 'N/A'; try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency === 'UF' ? 'CLF' : 'CLP', minimumFractionDigits: currency === 'UF' ? 2 : 0, maximumFractionDigits: currency === 'UF' ? 4 : 0, }).format(numericValue); } catch (e) { console.error("Error formatting currency:", e); return `${currency === 'UF' ? 'UF' : '$'} ${numericValue.toLocaleString('es-CL')}`; } };
const formatDate = (dateString: string | Date | null | undefined): string => { if (!dateString) return 'N/A'; try { const date = (dateString instanceof Date) ? dateString : new Date(dateString); if (isNaN(date.getTime())) return 'Fecha inválida'; return date.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch (e) { console.error("Error formatting date:", e); return 'Fecha inválida'; } };
// -------------------------------------

// --- Componente Principal ---
function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Loading para datos del proyecto
    const [error, setError] = useState<string | null>(null); // Error para datos del proyecto

    // --- NUEVOS ESTADOS PARA TAREAS ---
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState<boolean>(true);
    const [tasksError, setTasksError] = useState<string | null>(null);
    // --- FIN NUEVOS ESTADOS ---

    // --- NUEVO ESTADO PARA LOOKUPOPTIONS ---
    const [lookupOptions, setLookupOptions] = useState<FormOptionsResponse | null>(null);
    const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
    // --- FIN NUEVO ESTADO ---

    const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false); // Para el estado de envío del form de tarea
    const [taskFormError, setTaskFormError] = useState<string | null>(null); // Para errores específicos del form de tarea
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    
    const isAuthenticated = useIsAuthenticated();
    const userRole = useCurrentUserRole();

    const projectIdNum = id ? parseInt(id, 10) : NaN;

    // --- useForm PARA EL FORMULARIO DE TAREAS ---
    const taskFormMethods = useForm<TaskFormValues>({
        resolver: zodResolver(taskFormSchema),
            defaultValues: {
                titulo: '',
                descripcion: null,
                asignadoId: null,
                fechaPlazo: null,
                prioridad: null, 
                estado: EstadoTarea.PENDIENTE, // Default
            }
    });
    // --- FIN useForm ---

    // --- NUEVOS ESTADOS PARA EL MODAL DE DETALLE DE TAREA ---
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState<boolean>(false);
    const [taskDetailError, setTaskDetailError] = useState<string | null>(null);
    // --- FIN NUEVOS ESTADOS ---

    const loadPageData = useCallback(async () => {
        if (isNaN(projectIdNum)) {
            setError("ID de proyecto inválido.");
            setLoading(false);
            setLoadingTasks(false);
            setLoadingLookups(false); // <--- Maneja el nuevo estado de carga
            return;
        }
        setLoading(true);
        setLoadingTasks(true);
        setLoadingLookups(true); // <--- Inicia carga de lookups
        setError(null);
        setTasksError(null);
    
        try {
            // Cargar proyecto, tareas y lookupOptions en paralelo
            const [fetchedProject, fetchedTasks, fetchedLookups] = await Promise.all([
                projectApi.getProjectById(projectIdNum),
                taskApi.getTasksByProjectId(projectIdNum),
                lookupApi.getFormOptions()
            ]);
            
            setProject(fetchedProject);
            setTasks(fetchedTasks);
            setLookupOptions(fetchedLookups);
    
        } catch (err) { 
            // --- MODIFICACIÓN AQUÍ ---
            const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido al cargar datos para la página del proyecto.";
            console.error("[ProjectDetailPage] Error en loadPageData (mensaje):", errorMessage);

            // Opcional: Loguear más detalles del error de forma segura si es una ApiError
            if (err instanceof ApiError && err.data) {
                console.error("[ProjectDetailPage] ApiError data:", JSON.stringify(err.data, null, 2));
            } else if (err instanceof Error && !(err instanceof ApiError)) {
                // Para errores estándar, el stack puede ser útil, pero pruébalo con cuidado
                // console.error("[ProjectDetailPage] Error stack:", err.stack);
            }
            // --- FIN MODIFICACIÓN ---

            // Lógica para establecer los estados de error
            if (err instanceof ApiError && err.status === 404) {
                 // Podríamos verificar si el error 404 fue específicamente para el proyecto
                 // o para las tareas/lookups. Por ahora, un mensaje general está bien.
                 setError(`No se pudieron cargar todos los datos para el proyecto ID ${projectIdNum}. Uno de los recursos podría no existir.`);
            } else {
                setError(errorMessage);
            }
            setTasksError(errorMessage); // También puedes establecer un error específico para tareas si lo deseas
            // Podrías tener un setLookupOptionsError(errorMessage) si tienes ese estado
        } finally {
            setLoading(false);
            setLoadingTasks(false);
            setLoadingLookups(false);
        }
    }, [projectIdNum]);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]); // useEffect ahora depende de la función memoizada loadPageData

    const handlePrint = () => { console.log("TODO: Imprimir ficha ID:", project?.id); alert("Impresión no implementada."); }

    // --- HANDLERS PARA EL MODAL DE NUEVA TAREA ---
    const handleOpenNewTaskModal = () => {
        taskFormMethods.reset({ // Resetea el formulario a sus valores por defecto
            titulo: '',
            descripcion: null,
            asignadoId: null,
            fechaPlazo: null,
            prioridad: null,
            estado: EstadoTarea.PENDIENTE,
        });
        setTaskFormError(null); // Limpia errores previos del modal
        setIsNewTaskModalOpen(true);
    };

    const handleCloseNewTaskModal = () => {
        setIsNewTaskModalOpen(false);
    };

    const onNewTaskSubmit: SubmitHandler<TaskFormValues> = async (data) => {
        if (!project) return;
        setIsSubmittingTask(true);
        setTaskFormError(null);
        try {
            // La descripción ya es HTML de Quill, la sanitización ocurre antes de la llamada API si es necesario
            // (Ya lo configuramos en ProjectCreate/EditPage, aquí asumimos que TaskFormValues.descripcion está listo o se sanitiza en taskApi.createTask si es la estrategia)
            // Por ahora, asumimos que el HTML del editor es lo que se envía. La sanitización DOMPurify debería estar en el submit de ProjectCreate/EditPage.
            // Para el chat/tareas, la sanitización se haría en chatMessageService/taskService antes de guardar, o en el frontend antes de enviar.
            // Por coherencia, la sanitización debería ocurrir justo antes de la llamada a la API.
            
            const dataToSubmit: CreateTaskFrontendInput = {
                ...data,
                // Asegúrate que fechaPlazo se envíe en formato ISO string si es necesario,
                // o que taskApi.createTask lo maneje. Zod ya lo valida como Date.
                // Si taskApi espera un string, conviértelo:
                fechaPlazo: data.fechaPlazo ? new Date(data.fechaPlazo).toISOString() : null,
                // descripcion: data.descripcion ? DOMPurify.sanitize(data.descripcion, {...config...}) : null, // SANITIZAR AQUÍ SI ES NECESARIO
            };

            await taskApi.createTask(project.id, dataToSubmit);
            setSnackbarMessage("¡Tarea creada exitosamente!");
            handleCloseNewTaskModal();
            loadPageData(); // Recargar datos para ver la nueva tarea
        } catch (err) {
            console.error("Error creando tarea:", err);
            const errorMsg = err instanceof Error ? err.message : "Error al crear la tarea.";
            setTaskFormError(errorMsg);
        } finally {
            setIsSubmittingTask(false);
        }
    };
    // --- FIN HANDLERS MODAL ---

    const handleViewTaskDetails = async (taskId: number) => {
        if (!project) return; // Asegurarse que project exista para tener projectIdNum

        console.log(`Cargando detalles para tarea ID: ${taskId} del proyecto ID: ${project.id}`);
        setLoadingTaskDetail(true);
        setTaskDetailError(null);
        try {
            // projectIdNum ya está definido en el scope de ProjectDetailPage
            const detailedTask = await taskApi.getTaskById(projectIdNum, taskId);
            setSelectedTaskForDetail(detailedTask);
            setIsTaskDetailModalOpen(true);
        } catch (err) {
            console.error("Error cargando detalles de la tarea:", err);
            const errorMsg = err instanceof Error ? err.message : "Error al cargar los detalles de la tarea.";
            setTaskDetailError(errorMsg); 
            // Podrías mostrar este error en un Snackbar o un Alert pequeño
            setSnackbarMessage(errorMsg); // Reutilizando el snackbarMessage existente
        } finally {
            setLoadingTaskDetail(false);
        }
    };

    if (loading || loadingTasks || loadingLookups && !project) { 
        return ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: '70vh' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando datos del proyecto...</Typography></Box> ); 
    }
    // Si el proyecto no cargó pero los otros sí, o si hay un error general
    if (error && !project) { 
        return ( <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert><Button startIcon={<ArrowBackIcon />} sx={{mt: 2}} onClick={() => navigate('/')}> Volver al Listado </Button></Container> ); 
    }
    if (!project) { 
        return ( <Container maxWidth="md"><Typography sx={{ mt: 4 }}>No se encontró el proyecto o ID inválido.</Typography><Button startIcon={<ArrowBackIcon />} sx={{mt: 2}} onClick={() => navigate('/')}> Volver al Listado </Button></Container> ); 
    }

    const canManageTasks = isAuthenticated && (userRole === 'ADMIN' || userRole === 'COORDINADOR');

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>

            {/* 1. Banner (Sin cambios) */}
            <Box
                sx={{ boxShadow: theme.shadows[3], height: { xs: '250px', sm: '300px', md: '350px' }, position: 'relative', overflow: 'hidden', mb: 3, borderRadius: (theme.shape.borderRadius || 12) / 10 }}
            >
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

            {/* Contenedor Grid Principal para las secciones */}
            <Grid container spacing={3}>
                 
                 {/* --- SECCIÓN DE BITÁCORA DE TAREAS (ACTUALIZADA) --- */}
                 {isAuthenticated && (
                    <Grid item xs={12} md={12}>
                        <SectionPaper elevation={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" gutterBottom component="div">
                                    Bitácora de Tareas
                                </Typography>
                                {canManageTasks && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddCircleOutlineIcon />}
                                        onClick={handleOpenNewTaskModal}
                                        aria-label="Crear nueva tarea"
                                    >
                                        Nueva Tarea
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {loadingTasks && !project && <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress /></Box>} {/* Loader si el proyecto aún no carga */}
                            {loadingTasks && project && <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress size={24} /><Typography variant="caption" sx={{ml:1}}>Cargando tareas...</Typography></Box>} {/* Loader más pequeño si el proyecto ya cargó */}
                            
                            {tasksError && !loadingTasks && <Alert severity="error" sx={{mt: 1, mb: 1}}>{tasksError}</Alert>}
                            
                            {!loadingTasks && !tasksError && (
                                tasks.length > 0 ? (
                                    <List disablePadding>
                                        {tasks.map((task) => (
                                            <TaskListItem 
                                                key={task.id} 
                                                task={task} 
                                                onViewDetails={() => handleViewTaskDetails(task.id)}
                                            />
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 2}}>
                                        No hay tareas registradas para este proyecto aún.
                                    </Typography>
                                )
                            )}
                        </SectionPaper>
                    </Grid>
                 )}
                 {/* --- FIN SECCIÓN DE BITÁCORA DE TAREAS --- */}

                 {/* Placeholder para columna de detalles de tarea/chat */}
                 
                <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Información Básica</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={BusinessIcon} label="Unidad Municipal" value={project.unidad?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CategoryIcon} label="Tipología" value={project.tipologia?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={InfoOutlinedIcon} label="Estado Actual" value={project.estado?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={CalendarTodayIcon} label="Año Iniciativa" value={project.ano?.toString()} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Programa" value={project.programa?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={ArticleIcon} label="Línea Financ." value={project.lineaFinanciamiento?.nombre} /> </Grid> <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Ref. (${project.tipoMoneda})`} value={formatCurrency(project.monto, project.tipoMoneda)} /> </Grid> {isAuthenticated && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Proyectista" value={project.proyectista ? `${project.proyectista.name || '?'} (${project.proyectista.email})` : null} /> </Grid>} {isAuthenticated && <Grid item xs={12} sm={6} md={4}> <IconDetailItem icon={PersonIcon} label="Formulador" value={project.formulador ? `${project.formulador.name || '?'} (${project.formulador.email})` : null} /> </Grid>} {isAuthenticated && project.colaboradores && project.colaboradores.length > 0 && ( <Grid item xs={12} md={4}> <IconDetailItem icon={GroupsIcon} label="Nº Colaboradores" value={project.colaboradores.length.toString()} /> </Grid> )} </Grid> </SectionPaper> </Grid>
                {project.descripcion && ( <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Descripción del Proyecto</Typography> <Divider sx={{ mb: 2 }} /> <Box className="quill-content-display" sx={{ lineHeight: 1.5, '& h1': { my: theme.spacing(2), fontSize: '1.75rem', fontWeight: 'bold' }, '& h2': { my: theme.spacing(1.5), fontSize: '1.5rem', fontWeight: 'bold' }, '& h3': { my: theme.spacing(1), fontSize: '1.25rem', fontWeight: 'bold' }, '& p': { mb: theme.spacing(1) }, '& ul, & ol': { pl: theme.spacing(3), mb: theme.spacing(1) }, '& a': { color: theme.palette.primary.main, textDecoration: 'underline' }, '& img': { maxWidth: '100%', height: 'auto', my: theme.spacing(1), borderRadius: theme.shape.borderRadius, display: 'block', }, }} dangerouslySetInnerHTML={{ __html: project.descripcion }} /> </SectionPaper> </Grid> )}
                <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Ubicación y Superficies</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} md={6}> <IconDetailItem icon={TravelExploreIcon} label="Sector" value={project.sector?.nombre} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={SquareFootIcon} label="Sup. Terreno (m²)" value={project.superficieTerreno?.toLocaleString('es-CL')} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={SquareFootIcon} label="Sup. Edificación (m²)" value={project.superficieEdificacion?.toLocaleString('es-CL')} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={LocationOnIcon} label="Dirección" value={project.direccion} /> </Grid> </Grid> </SectionPaper> </Grid>
                {isAuthenticated && (project.montoAdjudicado != null || project.lineaFinanciamiento || project.codigoExpediente || project.fechaPostulacion || project.proyectoPriorizado != null || project.createdAt) && ( <> <Grid item xs={12} md={8}> <SectionPaper elevation={2} sx={{ height: '100%' }}> <Typography variant="h6" gutterBottom>Detalles Financiamiento</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} sm={6}> <IconDetailItem icon={ArticleIcon} label="Línea" value={project.lineaFinanciamiento?.nombre} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={ArticleIcon} label="Programa" value={project.programa?.nombre} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={StairsIcon} label="Etapa Actual" value={project.etapaActualFinanciamiento?.nombre} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={AttachMoneyIcon} label={`Monto Adj. (${project.tipoMoneda})`} value={formatCurrency(project.montoAdjudicado, project.tipoMoneda)} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="Cód. Expediente" value={project.codigoExpediente} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={FolderZipIcon} label="ID Licitación" value={project.codigoLicitacion} /> </Grid> <Grid item xs={12} sm={6}> <IconDetailItem icon={EventIcon} label="Fecha Postulación" value={formatDate(project.fechaPostulacion)} /> </Grid> </Grid> </SectionPaper> </Grid> <Grid item xs={12} md={4}> <SectionPaper elevation={2} sx={{ height: '100%' }}> <Typography variant="h6" gutterBottom>Estado y Fechas</Typography> <Divider sx={{ mb: 2.5 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12}> <IconDetailItem icon={project.proyectoPriorizado ? CheckBoxIcon : CheckBoxOutlineBlankIcon} label="Priorizado" value={project.proyectoPriorizado ? 'Sí' : 'No'} /> </Grid> <Grid item xs={12}> <IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /> </Grid> <Grid item xs={12}> <IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /> </Grid> </Grid> </SectionPaper> </Grid> </> )}
                {!isAuthenticated && ( <Grid item xs={12}> <SectionPaper elevation={2}> <Typography variant="h6" gutterBottom>Fechas</Typography> <Divider sx={{ mb: 3 }} /> <Grid container spacing={3} alignItems="flex-start"> <Grid item xs={12} md={6}> <IconDetailItem icon={HistoryIcon} label="Fecha Creación" value={formatDate(project.createdAt)} /> </Grid> <Grid item xs={12} md={6}> <IconDetailItem icon={HistoryIcon} label="Última Modificación" value={formatDate(project.updatedAt)} /> </Grid> </Grid> </SectionPaper> </Grid> )}

            </Grid> {/* Fin Grid Principal Contenido */}

            {/* --- MODAL PARA NUEVA TAREA --- */}
            {lookupOptions && ( // Solo renderiza el Dialog si lookupOptions está disponible
                <Dialog open={isNewTaskModalOpen} onClose={handleCloseNewTaskModal} maxWidth="md" fullWidth>
                    <DialogTitle>Crear Nueva Tarea para "{project.nombre}"</DialogTitle>
                    <FormProvider {...taskFormMethods}> {/* Proveedor para TaskForm */}
                        <form onSubmit={taskFormMethods.handleSubmit(onNewTaskSubmit)}>
                            <DialogContent>
                                {taskFormError && <Alert severity="error" sx={{ mb: 2 }}>{taskFormError}</Alert>}
                                <DialogContentText sx={{mb:2}}>
                                    Completa los detalles de la nueva tarea. La descripción puede incluir texto enriquecido.
                                </DialogContentText>
                                <TaskForm 
                                    isSubmitting={isSubmittingTask}
                                    lookupOptions={lookupOptions} // Pasa las lookupOptions cargadas
                                />
                            </DialogContent>
                            <DialogActions sx={{pb:2, pr:2}}>
                                <Button onClick={handleCloseNewTaskModal} color="secondary" disabled={isSubmittingTask}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="contained" disabled={isSubmittingTask}>
                                    {isSubmittingTask ? <CircularProgress size={24} /> : "Crear Tarea"}
                                </Button>
                            </DialogActions>
                        </form>
                    </FormProvider>
                </Dialog>
            )}
            {/* --- FIN MODAL --- */}

            {/* --- MODAL PARA DETALLE DE TAREA --- */}
            {selectedTaskForDetail && ( // Renderiza solo si hay una tarea seleccionada
                <TaskDetailModal
                    task={selectedTaskForDetail}
                    open={isTaskDetailModalOpen}
                    onClose={() => {
                        setIsTaskDetailModalOpen(false);
                        setSelectedTaskForDetail(null); // Limpia la tarea seleccionada al cerrar
                    }}
                    // No necesitamos pasar projectUsers si task.creador y task.asignado ya tienen name/email
                />
            )}
            {/* --- FIN MODAL --- */}

            {/* Snackbar para mensajes de éxito (ya lo tenías para nueva tarea) */}
            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={4000}
                onClose={() => setSnackbarMessage(null)}
                // message={snackbarMessage} // Si usas Alert dentro, no necesitas message prop
            >
                <Alert onClose={() => setSnackbarMessage(null)} severity={taskDetailError ? "error" : "success"} variant="filled" sx={{ width: '100%' }}>
                    {snackbarMessage || taskDetailError}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default ProjectDetailPage;