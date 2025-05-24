// frontend/src/components/TaskDetailModal.tsx (Archivo Nuevo)
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, Chip, Divider, CircularProgress, Alert, useTheme, Paper
} from '@mui/material';
import { Task, EstadoTarea, PrioridadTarea, UserOption } from '../types'; // Asegúrate que UserOption esté definida
import IconDetailItem from './IconDetailItem'; // Reutiliza tu componente
import { getEstadoTareaColor, getPrioridadTareaColor } from './TaskListItem'; // Reutiliza helpers de color

// Importa iconos que necesites
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info'; // Para estado
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'; // Para prioridad
import NotesIcon from '@mui/icons-material/Notes'; // Para descripción
import UpdateIcon from '@mui/icons-material/Update'; // Para fecha de actualización
import ScheduleIcon from '@mui/icons-material/Schedule'; // Para fecha plazo
import TaskChat from './TaskChat';

interface TaskDetailModalProps {
  task: Task | null; // La tarea a mostrar
  open: boolean;
  onClose: () => void;
  // Opcional: Pasar usuarios del proyecto para mostrar nombres si no vienen completos en task.creador/asignado
  // projectUsers?: UserOption[]; 
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, open, onClose /*, projectUsers */ }) => {
  const theme = useTheme();

  if (!task) {
    // No debería pasar si se controla bien la apertura del modal, pero es una salvaguarda
    return null; 
  }

  const formatDate = (dateString?: string | Date | null): string => {
    if (!dateString) return 'N/A';
    try {
        const date = (dateString instanceof Date) ? dateString : new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Fecha inválida';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            {task.titulo}
        </Typography>
        <Typography variant="caption" color="text.secondary">
            Tarea ID: {task.id} | En proyecto: {task.proyecto?.nombre || 'N/A'} ({task.proyecto?.codigoUnico || 'N/A'})
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{mb: 2}}>
            <Grid item xs={12} sm={6}>
                <IconDetailItem icon={InfoIcon} label="Estado" value={task.estado} 
                    valueComponent={task.estado ? <Chip size="small" label={task.estado} color={getEstadoTareaColor(task.estado)} /> : 'N/A'}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <IconDetailItem icon={PriorityHighIcon} label="Prioridad" value={task.prioridad} 
                    valueComponent={task.prioridad ? <Chip size="small" label={task.prioridad} color={getPrioridadTareaColor(task.prioridad)} /> : 'N/A'}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <IconDetailItem icon={PersonIcon} label="Creado por" value={task.creador?.name || task.creador?.email || 'N/A'} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <IconDetailItem icon={PersonIcon} label="Asignado a" value={task.asignado?.name || task.asignado?.email || 'N/A'} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <IconDetailItem icon={CalendarTodayIcon} label="Fecha Creación" value={formatDate(task.fechaCreacion)} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <IconDetailItem icon={UpdateIcon} label="Última Actualización" value={formatDate(task.fechaActualizacion)} />
            </Grid>
            {task.fechaPlazo && (
                <Grid item xs={12} sm={6}>
                    <IconDetailItem icon={ScheduleIcon} label="Fecha Plazo" value={formatDate(task.fechaPlazo)} />
                </Grid>
            )}
        </Grid>

        {task.descripcion && (
            <Box mb={3}>
                <Typography variant="h6" gutterBottom sx={{fontSize: '1.1rem', fontWeight: 'medium'}}>Descripción:</Typography>
                <Paper variant="outlined" sx={{p: 2, '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 }}}>
                    <Box
                        className="quill-content-display"
                        sx={{
                            lineHeight: 1.6,
                            '& h1': { my: 1.5, fontSize: '1.5rem' }, '& h2': { my: 1, fontSize: '1.3rem' }, '& h3': { my: 0.5, fontSize: '1.15rem' },
                            '& p': { mb: 1 }, '& ul, & ol': { pl: 2.5, mb: 1 },
                        }}
                        dangerouslySetInnerHTML={{ __html: task.descripcion }}
                    />
                </Paper>
            </Box>
        )}
        
        {/* --- SECCIÓN DE CHAT ACTUALIZADA --- */}
        <Box mt={3} id="task-chat-section" sx={{ /* Podrías querer dar una altura fija al contenedor del chat si es necesario */ }}>
            <Typography variant="h6" gutterBottom sx={{fontSize: '1.1rem', fontWeight: 'medium', mb:1.5}}>
                Chat de la Tarea
            </Typography>
            <TaskChat 
                projectId={task.proyecto.id}
                taskId={task.id} 
                initialMessages={task.mensajes || []} // task.mensajes viene del getTaskById
            />
        </Box>
        {/* --- FIN SECCIÓN CHAT --- */}

      </DialogContent>
      <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 2, justifyContent: 'space-between' }}>
        <Box>
            {/* TODO: Botón Editar Tarea (condicional por permisos) */}
            {/* <Button onClick={() => console.log("EDITAR TAREA ID:", task.id)} color="primary">Editar Tarea</Button> */}
        </Box>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailModal;