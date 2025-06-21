import React from 'react';
import { Box, Paper, Typography, Checkbox, Tooltip, Chip, Button, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { differenceInDays, isBefore, isToday, isTomorrow } from 'date-fns';
import { Task, EstadoTarea, PrioridadTarea } from '../../types';

// Iconos
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';


interface TaskListItemCardProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: EstadoTarea) => void;
  onViewDetails: (task: Task) => void;
}

// Helper para el color y texto de la fecha de vencimiento
const getDueDateInfo = (dueDate: string | Date | null) => {
    if (!dueDate) return { text: 'Sin fecha', color: 'text.secondary' };

    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isBefore(date, today)) {
        const daysOverdue = differenceInDays(today, date);
        return { text: `Vencida (hace ${daysOverdue} día${daysOverdue > 1 ? 's' : ''})`, color: 'error.main' };
    }
    if (isToday(date)) {
        return { text: 'Vence Hoy', color: 'warning.dark' };
    }
    if (isTomorrow(date)) {
        return { text: 'Vence Mañana', color: 'warning.main' };
    }
    const daysLeft = differenceInDays(date, today);
    return { text: `Vence en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`, color: 'text.secondary' };
};

// Helper para la prioridad
const getPriorityInfo = (priority: PrioridadTarea | null | undefined) => {
    switch (priority) {
        case 'ALTA':
            return { text: 'Alta', color: 'error.main' };
        case 'MEDIA':
            return { text: 'Media', color: 'warning.dark' };
        case 'BAJA':
            return { text: 'Baja', color: 'info.main' };
        default:
            return { text: 'Normal', color: 'text.secondary' };
    }
}

const TaskListItemCard: React.FC<TaskListItemCardProps> = ({ task, onStatusChange, onViewDetails }) => {
  const theme = useTheme();
  const dueDateInfo = getDueDateInfo(task.fechaPlazo);
  const priorityInfo = getPriorityInfo(task.prioridad);

  const isCompleted = task.estado === EstadoTarea.COMPLETADA;

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation(); // Evita que el clic en el checkbox abra el modal
    const newStatus = event.target.checked ? EstadoTarea.COMPLETADA : EstadoTarea.PENDIENTE;
    onStatusChange(task.id, newStatus);
  };
  
  return (
    <Paper
        elevation={2}
        onClick={() => onViewDetails(task)} // <-- Toda la tarjeta abre los detalles
        sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer', // <-- Añadido para indicar que es clickeable
            transition: 'all 0.2s ease-in-out',
            borderLeft: 5,
            borderColor: isCompleted ? 'success.main' : dueDateInfo.color,
            opacity: isCompleted ? 0.7 : 1,
            bgcolor: isCompleted ? theme.palette.action.disabledBackground : 'background.paper',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
            }
        }}
    >
        <Tooltip title={isCompleted ? "Marcar como pendiente" : "Marcar como completada"}>
            {/* Envolvemos el Checkbox para capturar el clic y detener la propagación */}
            <Box onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isCompleted}
                    onChange={handleCheckboxChange}
                    sx={{ p: 0.5 }}
                />
            </Box>
        </Tooltip>
        
        <Box flexGrow={1}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 'medium', 
                textDecoration: isCompleted ? 'line-through' : 'none',
                color: isCompleted ? 'text.secondary' : 'text.primary',
              }}
            >
                {task.titulo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                En proyecto: {' '}
                <RouterLink 
                  to={`/projects/${task.proyecto?.id}`} 
                  onClick={(e) => e.stopPropagation()} // <-- Detiene la propagación del clic en el enlace
                  style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
                >
                    {task.proyecto?.nombre || 'N/A'}
                </RouterLink>
            </Typography>
        </Box>
        
        <Box display={{ xs: 'none', md: 'flex' }} alignItems="center" gap={3} flexShrink={0}>
             <Tooltip title={`Prioridad: ${priorityInfo.text}`}>
                <Chip
                    icon={<FlagIcon sx={{ color: `${priorityInfo.color} !important` }} />}
                    label={priorityInfo.text}
                    size="small"
                    variant="outlined"
                />
             </Tooltip>
            
             <Tooltip title={`Fecha de vencimiento: ${task.fechaPlazo ? new Date(task.fechaPlazo).toLocaleDateString('es-CL') : 'N/A'}`}>
                <Box display="flex" alignItems="center" gap={1} sx={{ color: dueDateInfo.color, fontWeight: 'medium' }}>
                    <CalendarTodayIcon sx={{ fontSize: '1rem' }} />
                    <Typography variant="caption">{dueDateInfo.text}</Typography>
                </Box>
             </Tooltip>
        </Box>

        {/* El botón "Detalles" y el de "Solicitar Plazo" se han eliminado para simplificar la UI.
            Estas acciones se pueden realizar dentro del modal de detalles. */}
    </Paper>
  );
};

export default TaskListItemCard;
