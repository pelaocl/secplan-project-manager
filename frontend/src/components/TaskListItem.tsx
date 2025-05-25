// frontend/src/components/TaskListItem.tsx
import React from 'react';
import { ListItem, ListItemText, Typography, Chip, Paper, Box, IconButton, Tooltip, useTheme, Badge } from '@mui/material';
// EditIcon no se está usando en este snippet, puedes quitarlo si no planeas añadir el botón de editar aquí
// import EditIcon from '@mui/icons-material/Edit'; 
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
// FiberManualRecordIcon no es necesario si usamos el Badge con variant="dot"
// import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; 
import { Task, EstadoTarea, PrioridadTarea } from '../types';

interface TaskListItemProps {
  task: Task; // Asegúrate que este tipo Task incluya tieneNotificacionesChatNoLeidasParaUsuarioActual?: boolean;
  onViewDetails: (taskId: number) => void;
}

// Helpers para colores (sin cambios)
export const getEstadoTareaColor = (estado?: EstadoTarea): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (estado) {
    case EstadoTarea.PENDIENTE: return 'warning';
    case EstadoTarea.EN_PROGRESO: return 'info';
    case EstadoTarea.COMPLETADA: return 'success';
    case EstadoTarea.EN_REVISION: return 'secondary';
    case EstadoTarea.CANCELADA: return 'error';
    default: return 'default';
  }
};

export const getPrioridadTareaColor = (prioridad?: PrioridadTarea): "default" | "error" | "warning" | "info" => {
    switch (prioridad) {
        case PrioridadTarea.ALTA: return 'error';
        case PrioridadTarea.MEDIA: return 'warning';
        case PrioridadTarea.BAJA: return 'info';
        default: return 'default';
    }
};

const TaskListItem: React.FC<TaskListItemProps> = ({ task, onViewDetails }) => {
  const theme = useTheme();
  const handleViewClick = () => {
    onViewDetails(task.id);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 1.5, 
        '&:hover': { boxShadow: theme.shadows[4], backgroundColor: theme.palette.action.hover }, // Usar theme.shadows
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out',
      }} 
      onClick={handleViewClick} // Click en todo el Paper para ver detalles
      role="button"
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewClick();}}
      aria-label={`Ver detalles de tarea ${task.titulo}`}
    >
      <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 2 }}>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" component="div" noWrap sx={{ mb: 0.5, fontWeight: 500 }}>
                  {task.titulo}
              </Typography>
            </Box>
          }
          secondaryTypographyProps={{ component: 'div' }}
          secondary={
            <>
              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Asignado a: {task.asignado?.name || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Tooltip title={`Estado: ${task.estado || 'N/A'}`}>
                    <Chip size="small" label={task.estado || 'N/A'} color={getEstadoTareaColor(task.estado)} />
                </Tooltip>
                {task.prioridad && (
                    <Tooltip title={`Prioridad: ${task.prioridad}`}>
                        <Chip size="small" label={task.prioridad} color={getPrioridadTareaColor(task.prioridad)} />
                    </Tooltip>
                )}
                {task.fechaPlazo && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        Vence: {new Date(task.fechaPlazo).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Typography>
                )}
              </Box>
            </>
          }
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1, mt: -0.5 /* Ajuste para alinear mejor con el título */ }}>
            <Tooltip title={task.tieneMensajesNuevosEnChat  ? "Ver Chat (Nuevos mensajes)" : "Ver Chat / Detalles"}>
                {/* El IconButton ahora solo contiene el Badge y el Icono de Chat */}
                {/* El onClick del IconButton llama a handleViewClick para mantener la misma acción */}
                <IconButton 
                    size="small" 
                    onClick={(e) => { 
                        e.stopPropagation(); // Evita que el clic se propague al Paper si ya lo maneja handleViewClick
                        handleViewClick(); 
                    }} 
                    aria-label={`Ver chat de tarea ${task.titulo}`}
                >
                    <Badge 
                        color="error" 
                        variant="dot" 
                        invisible={!task.tieneMensajesNuevosEnChat} // Usa tu flag aquí
                        // Estilos opcionales para el punto del badge si necesitas ajustarlo
                        // sx={{
                        //     '& .MuiBadge-dot': {
                        //         minWidth: '8px',
                        //         height: '8px',
                        //         borderRadius: '50%',
                        //         transform: 'scale(1) translate(50%, -50%)', // Ejemplo de posicionamiento
                        //         top: '2px', // Ejemplo
                        //         right: '2px', // Ejemplo
                        //     }
                        // }}
                    >
                        <ChatBubbleOutlineIcon fontSize="small" />
                    </Badge>
                </IconButton>
            </Tooltip>
            {/* Aquí podrías añadir el botón de Editar Tarea si lo deseas */}
            {/* {onEdit && (
                <Tooltip title="Editar Tarea">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(task.id); }} aria-label={`Editar tarea ${task.titulo}`} sx={{ mt: 0.5 }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )} */}
        </Box>
      </ListItem>
    </Paper>
  );
};

export default TaskListItem;