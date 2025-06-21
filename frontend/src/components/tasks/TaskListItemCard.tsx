import React, { useState } from 'react';
import { Box, Paper, Typography, Tooltip, Chip, useTheme, Menu, MenuItem, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { differenceInDays, isBefore, isToday, isTomorrow } from 'date-fns';
import { Task, EstadoTarea, PrioridadTarea } from '../../types';

// Importar los iconos necesarios
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

// --- Helpers (sin cambios) ---

const getStatusInfo = (status: EstadoTarea, theme: any) => {
    switch (status) {
        case EstadoTarea.PENDIENTE:
            return { text: 'Pendiente', color: theme.palette.text.primary, bgColor: theme.palette.grey[300] };
        case EstadoTarea.EN_REVISION:
            return { text: 'En Revisión', color: theme.palette.secondary.contrastText, bgColor: theme.palette.secondary.main };
        case EstadoTarea.COMPLETADA:
            return { text: 'Completada', color: theme.palette.success.contrastText, bgColor: theme.palette.success.main };
        default:
            return { text: 'Desconocido', color: theme.palette.text.secondary, bgColor: theme.palette.grey[200] };
    }
};

const getDueDateInfo = (task: Task) => {
    if (task.estado === EstadoTarea.COMPLETADA) {
        return { label: 'COMPLETADA', value: <CheckCircleOutlineIcon sx={{ fontSize: '1.8rem' }} />, color: 'success.contrastText', bgColor: 'success.light' };
    }
    if (!task.fechaPlazo) {
        return { label: 'VENCIMIENTO', value: <EventAvailableIcon sx={{ fontSize: '1.8rem' }} />, color: 'text.secondary', bgColor: 'grey.200' };
    }
    const date = new Date(task.fechaPlazo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isBefore(date, today)) {
        const days = Math.max(1, differenceInDays(today, date));
        return { label: 'VENCIDA', value: `${days} día${days > 1 ? 's' : ''}`, color: 'error.contrastText', bgColor: 'error.main' };
    }
    if (isToday(date)) {
        return { label: 'VENCE', value: 'Hoy', color: 'warning.contrastText', bgColor: 'warning.dark' };
    }
    const daysLeft = differenceInDays(date, today);
    if (daysLeft <= 3) {
      return { label: 'VENCE EN', value: `${daysLeft} día${daysLeft > 1 ? 's' : ''}`, color: 'warning.contrastText', bgColor: 'warning.main' };
    }
    return { label: 'VENCE EN', value: `${daysLeft} días`, color: 'text.primary', bgColor: 'grey.200' };
};

const getPriorityColor = (priority: PrioridadTarea | null | undefined, theme: any): string => {
    switch (priority) {
        case 'ALTA': return theme.palette.error.main;
        case 'MEDIA': return theme.palette.warning.main;
        case 'BAJA': return theme.palette.info.main;
        default: return theme.palette.grey[400];
    }
};

interface TaskListItemCardProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: EstadoTarea) => void;
  onViewDetails: (task: Task) => void;
}

const TaskListItemCard: React.FC<TaskListItemCardProps> = ({ task, onStatusChange, onViewDetails }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const dueDateInfo = getDueDateInfo(task);
  const priorityColor = getPriorityColor(task.prioridad, theme);
  const statusInfo = getStatusInfo(task.estado, theme);
  const isCompleted = task.estado === EstadoTarea.COMPLETADA;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };
  
  const handleStatusChange = (newStatus: EstadoTarea) => {
    onStatusChange(task.id, newStatus);
    handleMenuClose();
  };
  
  return (
    <Paper
        elevation={2}
        onClick={() => onViewDetails(task)}
        sx={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0.5,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            opacity: isCompleted ? 0.8 : 1,
            borderLeft: `5px solid ${priorityColor}`,
            '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[6] },
            overflow: 'hidden',
            borderRadius: 2
        }}
    >
        <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography 
              variant="body1" 
              sx={{ fontWeight: 'medium', color: isCompleted ? 'text.secondary' : 'text.primary' }}
            >
                {task.titulo}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                    label={task.proyecto?.codigoUnico || '?'}
                    size="small"
                    sx={{
                        bgcolor: task.proyecto?.tipologia?.colorChip || theme.palette.grey[300],
                        color: theme.palette.getContrastText(task.proyecto?.tipologia?.colorChip || theme.palette.grey[300]),
                        fontWeight: 'bold', fontSize: '0.7rem'
                    }}
                />
                <Typography variant="caption" color="text.secondary" noWrap>
                    {task.proyecto?.nombre || 'N/A'}
                </Typography>
            </Box>
        </Box>
        
        {/* === Contenedor para las 2 Cajas de Estado (ahora siempre visible) === */}
        <Box display="flex" alignItems="center" flexShrink={0}>
             {/* CAJA 1: Estado (Botón) */}
            <Tooltip title="Cambiar Estado">
                <Button 
                    onClick={handleMenuClick}
                    sx={{
                        bgcolor: statusInfo.bgColor,
                        color: statusInfo.color,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        // Ancho responsivo
                        minWidth: {
                            xs: '80px',  // Móviles
                            sm: '100px', // Tablets en vertical
                            md: '120px', // Tablets en horizontal
                            lg: '130px'  // Desktops
                          },
                        borderRadius: 0,
                        '&:hover': { bgcolor: statusInfo.bgColor, filter: 'brightness(0.95)' }
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {statusInfo.text}
                    </Typography>
                </Button>
            </Tooltip>

             {/* CAJA 2: Vencimiento */}
            <Tooltip title={`Fecha de vencimiento: ${task.fechaPlazo ? new Date(task.fechaPlazo).toLocaleDateString('es-CL') : 'N/A'}`}>
                <Box sx={{ 
                    bgcolor: dueDateInfo.bgColor, 
                    color: dueDateInfo.color, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    p: 1, 
                    // Ancho responsivo
                    minWidth: {
                        xs: '80px',  // Móviles
                        sm: '100px', // Tablets en vertical
                        md: '160px', // Tablets en horizontal
                        lg: '180px'  // Desktops
                      }
                }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8, fontSize: '0.6rem' }}>
                        {dueDateInfo.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        {dueDateInfo.value}
                    </Typography>
                </Box>
            </Tooltip>
        </Box>

        {/* Menú para cambiar el estado de la tarea */}
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
        >
            {[EstadoTarea.PENDIENTE, EstadoTarea.EN_REVISION, EstadoTarea.COMPLETADA].map((estado) => (
                <MenuItem 
                    key={estado} 
                    onClick={() => handleStatusChange(estado)}
                    disabled={task.estado === estado}
                >
                    {estado.replace('_', ' ')}
                </MenuItem>
            ))}
        </Menu>
    </Paper>
  );
};

export default TaskListItemCard;
