import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Typography, 
    Container, 
    Box, 
    CircularProgress, 
    Alert, 
    Stack,
    ToggleButtonGroup, 
    ToggleButton, 
    Divider, 
    Tooltip, 
    TextField, 
    InputAdornment, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem,
    Paper,
    Grid
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import SearchIcon from '@mui/icons-material/Search';
import { View } from 'react-big-calendar';
import { taskApi } from '../services/taskApi';
import { Task, EstadoTarea } from '../types';
import TaskListItemCard from '../components/tasks/TaskListItemCard';
import TaskDetailModal from '../components/TaskDetailModal';
import KanbanView from '../components/tasks/KanbanView';
import CalendarView from '../components/tasks/CalendarView';
import { isBefore, parseISO, differenceInDays } from 'date-fns';
import { useDebounce } from '../hooks/useDebounce';

type TaskFilter = 'all' | 'active' | 'upcoming' | 'overdue' | 'completed';
type TaskView = 'list' | 'kanban' | 'calendar';

function MyTasksPage() {
    const [masterTaskList, setMasterTaskList] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [loadingModal, setLoadingModal] = useState<boolean>(false);

    const [activeFilter, setActiveFilter] = useState<TaskFilter>('active');
    const [currentView, setCurrentView] = useState<TaskView>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [calendarDate, setCalendarDate] = useState<Date>(new Date());
    const [calendarView, setCalendarView] = useState<View>('month');

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedTasks = await taskApi.getMyTasks(); 
            setMasterTaskList(fetchedTasks);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar las tareas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const uniqueProjects = useMemo(() => {
        const projectsMap = new Map<number, { id: number; nombre: string }>();
        masterTaskList.forEach(task => {
            if (task.proyecto) {
                projectsMap.set(task.proyecto.id, { id: task.proyecto.id, nombre: task.proyecto.nombre });
            }
        });
        return Array.from(projectsMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [masterTaskList]);

    const filteredTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let tasksToFilter = masterTaskList.filter(task => {
            if (debouncedSearchTerm && !task.titulo.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
                return false;
            }
            if (selectedProjectId && task.proyecto?.id !== selectedProjectId) {
                return false;
            }
            return true;
        });

        switch (activeFilter) {
            case 'upcoming':
                return tasksToFilter.filter(t => {
                    if (!t.fechaPlazo) return false;
                    const dueDate = parseISO(t.fechaPlazo.toString());
                    const daysUntilDue = differenceInDays(dueDate, today);
                    return daysUntilDue >= 0 && daysUntilDue <= 7 && t.estado !== EstadoTarea.COMPLETADA && t.estado !== EstadoTarea.CANCELADA;
                });
            case 'overdue':
                return tasksToFilter.filter(t => 
                    !!t.fechaPlazo && isBefore(parseISO(t.fechaPlazo.toString()), today) && t.estado !== EstadoTarea.COMPLETADA && t.estado !== EstadoTarea.CANCELADA);
            case 'completed':
                return tasksToFilter.filter(t => t.estado === EstadoTarea.COMPLETADA);
            case 'active':
                return tasksToFilter.filter(t => t.estado !== EstadoTarea.COMPLETADA && t.estado !== EstadoTarea.CANCELADA);
            case 'all':
            default:
                return tasksToFilter;
        }
    }, [masterTaskList, activeFilter, debouncedSearchTerm, selectedProjectId]);

    const handleFilterChange = (event: React.MouseEvent<HTMLElement>, newFilter: TaskFilter | null,) => {
        if (newFilter !== null) setActiveFilter(newFilter);
    };

    const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: TaskView | null) => {
        if (newView !== null) setCurrentView(newView);
    };

    const handleCalendarNavigate = useCallback((newDate: Date) => { setCalendarDate(newDate); }, []);
    const handleCalendarViewChange = useCallback((newView: View) => { setCalendarView(newView); }, []);

    const handleStatusChange = async (taskId: number, newStatus: EstadoTarea) => {
        const originalTasks = masterTaskList;
        setMasterTaskList(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, estado: newStatus } : t));
        try {
            const taskToUpdate = originalTasks.find(t => t.id === taskId);
            if (!taskToUpdate?.proyecto?.id) throw new Error("No se encontró el ID del proyecto para la tarea.");
            await taskApi.updateTask(taskToUpdate.proyecto.id, taskId, { estado: newStatus });
        } catch (error) {
            console.error("Error al actualizar el estado de la tarea:", error);
            setMasterTaskList(originalTasks);
        }
    };

    const handleViewDetails = async (task: Task) => {
        if (!task.proyecto?.id) { setError("No se puede abrir la tarea."); return; }
        setLoadingModal(true);
        try {
            const detailedTask = await taskApi.getTaskById(task.proyecto.id, task.id);
            setSelectedTask(detailedTask);
        } catch (error) {
            setError("No se pudieron cargar los detalles de la tarea.");
        } finally {
            setLoadingModal(false);
        }
    };

    const handleCloseModal = () => { setSelectedTask(null); loadTasks(); };

    const renderContent = () => {
        if (loading) return (<Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 4, height: '50vh' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Cargando tus tareas...</Typography></Box>);
        if (error) return (<Alert severity="error" sx={{ mt: 2 }}>Error al cargar las tareas: {error}</Alert>);
        if (filteredTasks.length === 0) {
            let message = "No hay tareas que coincidan con los filtros actuales.";
            if (activeFilter === 'active' && !debouncedSearchTerm && !selectedProjectId) message = "¡Felicidades! No tienes tareas activas.";
            return (<Typography sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>{message}</Typography>);
        }
        switch (currentView) {
            case 'kanban': return <KanbanView tasks={filteredTasks} onTaskStatusChange={handleStatusChange} />;
            case 'calendar': return <CalendarView tasks={filteredTasks} onViewDetails={handleViewDetails} date={calendarDate} view={calendarView} onNavigate={handleCalendarNavigate} onView={handleCalendarViewChange} />;
            case 'list': default: return (<Stack spacing={1.5} sx={{ mt: 2 }}>{filteredTasks.map((task) => (<TaskListItemCard key={task.id} task={task} onStatusChange={handleStatusChange} onViewDetails={handleViewDetails} />))}</Stack>);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>Mis Tareas</Typography>
                <ToggleButtonGroup value={currentView} exclusive onChange={handleViewChange} aria-label="selector de vista de tareas" size="small">
                    <ToggleButton value="list" aria-label="vista de lista"><Tooltip title="Vista de Lista"><ViewListIcon /></Tooltip></ToggleButton>
                    <ToggleButton value="kanban" aria-label="vista kanban"><Tooltip title="Vista Kanban"><ViewKanbanIcon /></Tooltip></ToggleButton>
                    <ToggleButton value="calendar" aria-label="vista calendario"><Tooltip title="Vista de Calendario"><CalendarViewMonthIcon /></Tooltip></ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Paper sx={{ p: 2, mt: 3, mb: 3, borderRadius: 2 }} variant="outlined">
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5} lg={4}>
                        <TextField fullWidth size="small" variant="outlined" placeholder="Buscar por título de tarea..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }}/>
                    </Grid>
                    <Grid item xs={12} md={4} lg={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filtrar por Proyecto</InputLabel>
                            <Select value={selectedProjectId} label="Filtrar por Proyecto" onChange={(e) => setSelectedProjectId(e.target.value as number | '')}>
                                <MenuItem value=""><em>Todos los Proyectos</em></MenuItem>
                                {uniqueProjects.map(p => (<MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3} lg={5} sx={{ display: 'flex', justifyContent: {xs: 'flex-start', md: 'flex-end'} }}>
                        <ToggleButtonGroup value={activeFilter} exclusive onChange={handleFilterChange} aria-label="filtros de tareas" size="small" sx={{ flexWrap: 'wrap' }}>
                            <ToggleButton value="all" aria-label="todas las tareas">Todas</ToggleButton>
                            <ToggleButton value="active" aria-label="tareas activas">Activas</ToggleButton>
                            <ToggleButton value="upcoming" aria-label="próximas a vencer">Próximas</ToggleButton>
                            <ToggleButton value="overdue" aria-label="tareas vencidas">Vencidas</ToggleButton>
                            <ToggleButton value="completed" aria-label="tareas completadas">Completadas</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Paper>
            {renderContent()}
            {selectedTask && (<TaskDetailModal task={selectedTask} open={!!selectedTask} onClose={handleCloseModal} />)}
            {loadingModal && (<CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%', zIndex: (theme) => theme.zIndex.drawer + 2 }} />)}
        </Container>
    );
}

export default MyTasksPage;
