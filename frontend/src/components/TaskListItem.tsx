// frontend/src/components/TaskListItem.tsx
import React from 'react';
import { ListItem, ListItemText, Typography, Chip, Paper, Box, IconButton, Tooltip, useTheme, Badge, Grid, Menu, MenuItem, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Task, EstadoTarea, PrioridadTarea } from '../types';
import { useCurrentUser, useCurrentUserRole } from '../store/authStore';

interface TaskListItemProps {
  task: Task;
  onViewDetails: (taskId: number) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  // onUpdateTaskStatus: (taskId: number, newStatus: EstadoTarea) => void; // Futura prop
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

const TaskListItem: React.FC<TaskListItemProps> = ({ task, onViewDetails, onEditTask, onDeleteTask }) => {
  const theme = useTheme();
  const currentUser = useCurrentUser();
  const currentUserRole = useCurrentUserRole();

  const canEditThisTask = React.useMemo(() => { 
    if (!currentUser) return false;
    return currentUserRole === 'ADMIN' || currentUserRole === 'COORDINADOR' || task.creadorId === currentUser.id || task.proyecto?.proyectistaId === currentUser.id;
  }, [currentUser, currentUserRole, task.creadorId, task.proyecto?.proyectistaId]);

  const canDeleteThisTask = React.useMemo(() => { 
    if (!currentUser) return false;
    return currentUserRole === 'ADMIN' || currentUserRole === 'COORDINADOR';
  }, [currentUser, currentUserRole]);
  
  const canChangeStatus = canEditThisTask; 

  const handleViewClick = () => { onViewDetails(task.id); };
  const handleEdit = (e: React.MouseEvent) => { e.stopPropagation(); onEditTask(task); };
  const handleDelete = (e: React.MouseEvent) => { e.stopPropagation(); onDeleteTask(task.id); };

  const [anchorElMore, setAnchorElMore] = React.useState<null | HTMLElement>(null);
  const openMoreMenu = Boolean(anchorElMore);
  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => { event.stopPropagation(); setAnchorElMore(event.currentTarget); };
  const handleMoreClose = (event?: React.MouseEvent) => { event?.stopPropagation(); setAnchorElMore(null); };
  const handleChangeStatus = (newStatus: EstadoTarea) => { console.log(`TODO: Cambiar estado de tarea ${task.id} a ${newStatus}`); alert(`Cambiar estado a ${newStatus} - Funcionalidad Pendiente`); handleMoreClose(); };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 1.5, 
        '&:hover': { boxShadow: theme.shadows[4], backgroundColor: theme.palette.action.hover },
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out',
      }} 
      onClick={handleViewClick}
      role="button"
      tabIndex={0} // Para accesibilidad con teclado
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewClick();}} // Para accesibilidad
      aria-label={`Ver detalles de tarea ${task.titulo}`}
    >
      <ListItem alignItems="flex-start" sx={{ py: 1.5, px: 2 }}>
        <Grid container alignItems="flex-start" spacing={1}>
          
          {/* Columna Principal de Contenido (Título, Asignado, Chips) */}
          <Grid item xs> 
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleViewClick} role="button" tabIndex={0} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewClick();}}>
                  <Typography variant="h6" component="span" noWrap sx={{ fontWeight: 500, flexGrow: 1 }}>
                      {task.titulo}
                  </Typography>
                </Box>
              }
              secondaryTypographyProps={{ component: 'div' }}
              secondary={
                <>
                  <Typography component="div" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1, mt:0.5 }}>
                    Asignado a: {task.asignado?.name || 'N/A'}
                  </Typography>
                  {/* Box solo para Chips y Fecha */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
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
          </Grid>

          {/* Columna para Iconos de Acción (Chat arriba, otros abajo) */}
          <Grid item xs="auto" sx={{ pl: 1 }}> 
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end',justifyContent: 'space-between', height: '100%' /* Para que los botones se distribuyan si hay mucho espacio vertical */ }}>
                {/* Icono de Chat (Arriba) */}
                <Tooltip title={task.tieneMensajesNuevosEnChat ? "Ver Chat (Nuevos mensajes)" : "Ver Chat / Detalles"}>
                    <IconButton 
                        size="small" 
                        onClick={(e) => { e.stopPropagation(); handleViewClick(); }} 
                        aria-label={`Ver chat de tarea ${task.titulo}`}
                        sx={{ mb: (canEditThisTask || canDeleteThisTask || canChangeStatus) ? 4.5 : 0 }} // Margen inferior solo si hay más botones debajo
                    >
                        <Badge 
                            color="error" 
                            variant="dot" 
                            invisible={!task.tieneMensajesNuevosEnChat}
                        >
                            <ChatBubbleOutlineIcon fontSize="small" />
                        </Badge>
                    </IconButton>
                </Tooltip>
                
                {/* Espacio para otros botones de acción (Abajo) */}
                { (canEditThisTask || canDeleteThisTask || canChangeStatus) && (
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.1 /* Empuja hacia abajo si la columna es alta */ }}>
                        {canEditThisTask && (
                            <Tooltip title="Editar Tarea">
                                <IconButton size="small" onClick={handleEdit} aria-label={`Editar tarea ${task.titulo}`}>
                                    <EditIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canDeleteThisTask && (
                            <Tooltip title="Eliminar Tarea">
                                <IconButton size="small" onClick={handleDelete} aria-label={`Eliminar tarea ${task.titulo}`}>
                                    <DeleteOutlineIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canChangeStatus && ( 
                             <Tooltip title="Más acciones">
                                <IconButton size="small" onClick={handleMoreClick} aria-label="Más acciones para la tarea">
                                    <MoreVertIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                )}
            </Box>
          </Grid>
        </Grid>
      </ListItem>

      {/* Menú para "Más Acciones" (sin cambios) */}
      <Menu
        anchorEl={anchorElMore}
        open={openMoreMenu}
        onClose={(event: React.MouseEvent) => handleMoreClose(event as React.MouseEvent<Element, MouseEvent>)}
        onClick={(e) => e.stopPropagation()} 
      >
        <MenuItem disabled sx={{fontWeight: 'bold', color: 'text.primary !important'}}>Cambiar Estado a:</MenuItem>
        <Divider />
        {Object.values(EstadoTarea).filter(estado => estado !== task.estado).map(estado => (
            <MenuItem key={estado} onClick={() => handleChangeStatus(estado)} dense>
                {estado}
            </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default TaskListItem;