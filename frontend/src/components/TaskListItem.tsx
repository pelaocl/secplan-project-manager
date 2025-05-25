// frontend/src/components/TaskListItem.tsx
import React from 'react';
import { ListItem, ListItemText, Typography, Chip, Paper, Box, IconButton, Tooltip, useTheme, Badge } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit'; // Para un futuro botón de editar
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Para indicar chat o ver chat
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; // Ícono para el punto indicador
import { Task, EstadoTarea, PrioridadTarea } from '../types'; // Asegúrate que estos tipos y enums estén en ../types

interface TaskListItemProps {
  task: Task;
  onViewDetails: (taskId: number) => void; // Para manejar el clic y abrir detalles/chat
  // onEdit?: (taskId: number) => void; // Para un futuro botón de editar directo
}

// Helpers para colores de estado/prioridad (puedes moverlos a un archivo de utils si los usas en más sitios)
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

const TaskListItem: React.FC<TaskListItemProps> = ({ task, onViewDetails /*, onEdit */ }) => {
  const theme = useTheme(); // Para acceder a los colores del tema
  const handleViewClick = () => {
    onViewDetails(task.id);
  };

  // const handleEditClick = (e: React.MouseEvent) => {
  //   e.stopPropagation(); // Evita que el click en el botón active el onClick del Paper
  //   onEdit?.(task.id);
  // };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 1.5, 
        '&:hover': { boxShadow: 4, backgroundColor: 'action.hover' },
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out',
      }} 
      onClick={handleViewClick}
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

          secondaryTypographyProps={{ component: 'div' }} // Indica a MUI que el contenedor del 'secondary' sea un div

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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1 }}>
            <Tooltip title={task.tieneNotificacionesChatNoLeidasParaUsuarioActual ? "Ver Chat (Nuevos mensajes)" : "Ver Chat / Detalles"}>
                 <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewClick(); }} aria-label={`Ver chat de tarea ${task.titulo}`}> {/* Detener propagación para que onClick del Paper no se llame dos veces si el Paper también tiene onClick */}
                    {/* --- INDICADOR DE CHAT NO LEÍDO CON BADGE --- */}
                    <Badge 
                        color="error" 
                        variant="dot" 
                        invisible={!task.tieneNotificacionesChatNoLeidasParaUsuarioActual}
                        sx={{
                            '& .MuiBadge-dot': { // Estilos para el punto del badge
                                minWidth: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                // Podrías ajustar la posición del badge si es necesario
                                // transform: 'scale(1) translate(50%, -50%)', 
                            }
                        }}
                    >
                        <ChatBubbleOutlineIcon fontSize="small" />
                    </Badge>

                </IconButton>
            </Tooltip>
        </Box>
      </ListItem>
    </Paper>
  );
};

export default TaskListItem;