// frontend/src/components/TaskDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, Chip, Divider, CircularProgress, Alert, useTheme, Paper, IconButton as MuiIconButton, Tooltip, List, ListItem // List, ListItem para participantes
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery'; // Para detectar tamaño de pantalla

import CloseIcon from '@mui/icons-material/Close';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import ChatIcon from '@mui/icons-material/Chat'; // Icono para el panel de chat colapsado
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';


import { Task, EstadoTarea, PrioridadTarea, UserProjectTeamMember } from '../types';
import IconDetailItem from './IconDetailItem';
import { getEstadoTareaColor, getPrioridadTareaColor } from './TaskListItem';
import TaskChat from './TaskChat';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, open, onClose }) => {
  
    const theme = useTheme();
  // Usamos un breakpoint de MUI (md: 900px). Puedes ajustarlo.
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md')); 
  
  const sidebarFixedWidth = { xs: '100%', sm: '320px', md: '360px' }; // Ancho de la sidebar en modo normal
  const chatAreaFlexGrow = 1;
  const collapsedPaneWidth = '56px'; // Ancho de un panel cuando está colapsado
  const transitionStyle = 'width 0.2s ease-in-out, padding 0.2s ease-in-out';

  // Estado para controlar qué panel está activo en pantallas pequeñas
  // 'chat' (chat expandido, descripción colapsada) o 'description' (descripción expandida, chat colapsado)
  const [activePaneSmallScreen, setActivePaneSmallScreen] = useState<'chat' | 'description'>('chat');

  useEffect(() => {
    // Si la pantalla se vuelve grande, siempre mostrar ambas columnas
    if (isLargeScreen) {
        // No necesitamos un estado 'activePane' para pantallas grandes, se muestran ambas
    } else {
        // En pantallas pequeñas, por defecto mostrar el chat
        setActivePaneSmallScreen('chat');
    }
  }, [isLargeScreen]);


  if (!task) {
    return null; 
  }
  console.log("[TaskDetailModal] Task data received:", JSON.stringify(task, null, 2)); // <--- AÑADE ESTE LOG

  const initialLastRead = task.chatStatuses?.[0]?.lastReadTimestamp || null;

  const formatDate = (dateString?: string | Date | null, includeTime = false): string => { /* ... tu función formatDate ... */ if (!dateString) return 'N/A'; try { const date = (dateString instanceof Date) ? dateString : new Date(dateString); if (isNaN(date.getTime())) return 'Fecha inválida'; const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }; if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; } return date.toLocaleDateString('es-CL', options); } catch (e) { return 'Fecha inválida'; } };
  const participantesAdicionales = task.participantes?.filter(p => p.id !== task.asignadoId && p.id !== task.creadorId) || [];

  const sidebarWidth = '320px'; // Ancho de la sidebar en pantallas grandes

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth 
        PaperProps={{
            sx: {
                height: { xs: 'calc(100vh - 32px)', sm: 'calc(100vh - 64px)', md: '85vh' }, // Más altura en xs y sm
                maxHeight: { md: '750px' }, // Altura máxima para desktop
                display: 'flex',
                flexDirection: 'column',
                borderRadius: {sm: '12px'}, // Bordes redondeados en sm+
                m: { xs: 1, sm: 2, md: 4} // Margen para que no pegue a los bordes en móvil
            }
        }}
    >
      <DialogTitle sx={{ py: 1.5, px: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>{task.titulo}</Typography>
            <Typography variant="caption" color="text.secondary" component="div">
                ID: {task.id} | En: {task.proyecto?.nombre || 'N/A'} ({task.proyecto?.codigoUnico || 'N/A'})
            </Typography>
        </Box>
        <MuiIconButton onClick={onClose} size="small" aria-label="Cerrar modal"><CloseIcon /></MuiIconButton>
      </DialogTitle>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: {xs: 1, sm: 1.5}, p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'action.hover', flexShrink: 0, fontSize: '0.75rem' }}>
        <IconDetailItem dense icon={AssignmentTurnedInIcon} label="Estado" valueComponent={task.estado ? <Chip sx={{fontSize:'0.65rem', height:'20px'}} label={task.estado} color={getEstadoTareaColor(task.estado)} /> : 'N/A'} />
        <IconDetailItem dense icon={PriorityHighIcon} label="Prioridad" valueComponent={task.prioridad ? <Chip sx={{fontSize:'0.65rem', height:'20px'}} label={task.prioridad} color={getPrioridadTareaColor(task.prioridad)} /> : 'N/A'} />
        <IconDetailItem dense icon={PersonOutlineIcon} label="Asignado" value={task.asignado?.name || task.asignado?.email || 'N/A'} />
        <IconDetailItem dense icon={EventNoteIcon} label="Plazo" value={task.fechaPlazo ? formatDate(task.fechaPlazo) : 'N/A'} />
      </Box>

      <DialogContent sx={{ flexGrow: 1, display: 'flex', p: 0, overflow: 'hidden' }}>
        {/* --- Columna Izquierda (Info/Descripción) --- */}
        <Box 
            sx={{
                width: isLargeScreen ? sidebarFixedWidth : (activePaneSmallScreen === 'description' ? '100%' : collapsedPaneWidth),
                borderRight: isLargeScreen ? `1px solid ${theme.palette.divider}` : 'none',
                p: (isLargeScreen || activePaneSmallScreen === 'description') ? 2 : 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: (isLargeScreen || activePaneSmallScreen === 'description') ? theme.palette.background.default : 'transparent',
                transition: transitionStyle,
                // Controlar visibilidad del contenido interno, no del Box en sí para la animación
            }}
        >
            {(isLargeScreen || activePaneSmallScreen === 'description') ? (
                <> {/* CONTENIDO EXPANDIDO DE LA SIDEBAR IZQUIERDA */}
                    {!isLargeScreen && (
                        <Box sx={{display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 0.5}}>
                            <Tooltip title="Ver Chat">
                                <Button 
                                    size="small" 
                                    onClick={() => setActivePaneSmallScreen('chat')} 
                                    variant="outlined"
                                    endIcon={<ChevronRightIcon />} // Icono para indicar que se va a la derecha (chat)
                                >
                                    Chat Grupal
                                </Button>
                            </Tooltip>
                        </Box>
                    )}
                    {participantesAdicionales.length > 0 && (
                        <Box mb={2} flexShrink={0}>
                            <Typography variant="overline" /* ... */> <PeopleOutlineIcon /* ... *//> Participantes</Typography>
                            <Paper variant="outlined" sx={{ maxHeight: '120px', overflowY: 'auto', p: 1 }}>
                                {/* ... tu lista de participantes ... */}
                            </Paper>
                        </Box>
                    )}
                    <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="overline" /* ... */><DescriptionIcon /* ... *//> Descripción</Typography>
                        {task.descripcion ? (
                            <Paper variant="outlined" sx={{ p: 1.5, flexGrow: 1, overflowY: 'auto', /* ... */ }}>
                                <Box className="tiptap-content-display" /* ... */ dangerouslySetInnerHTML={{ __html: task.descripcion }} />
                            </Paper>
                        ) : (<Typography variant="body2" /* ... */>No hay descripción.</Typography>)}
                    </Box>
                </>
            ) : ( // VISTA COLAPSADA DE LA SIDEBAR IZQUIERDA (cuando el chat está activo en pantalla pequeña)
                <Tooltip title="Ver Descripción y Participantes" placement="right">
                    <MuiIconButton 
                        onClick={() => setActivePaneSmallScreen('description')} 
                        sx={{ m: 'auto', display:'flex', flexDirection:'column', p:1, width:'100%', height:'100%', borderRadius:0, justifyContent:'center' }}
                        aria-label="Mostrar descripción"
                    >
                        <DescriptionIcon />
                        <Typography variant="caption" sx={{writingMode: 'vertical-rl', textOrientation: 'mixed', mt:0.5, lineHeight:1}}>INFORMACIÓN DE LA TAREA</Typography>
                    </MuiIconButton>
                </Tooltip>
            )}
        </Box>

        {/* --- Columna Derecha (Chat) --- */}
        <Box sx={{
            flexGrow: 1, // Ocupa el espacio restante en pantallas grandes
            p: (isLargeScreen || activePaneSmallScreen === 'chat') ? {xs: 1, sm: 2} : 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: transitionStyle,
            width: isLargeScreen ? 'auto' : (activePaneSmallScreen === 'chat' ? '100%' : collapsedPaneWidth),
            borderLeft: !isLargeScreen && activePaneSmallScreen === 'description' ? `1px solid ${theme.palette.divider}` : 'none', // Borde si la descripción está expandida
        }}>
            {(isLargeScreen || activePaneSmallScreen === 'chat') ? (
                <> {/* CONTENIDO EXPANDIDO DEL CHAT */}
                    {!isLargeScreen && (
                        <Box sx={{display: 'flex', justifyContent: 'flex-start', width: '100%', mb: 0.5}}>
                            <Tooltip title="Ver Info y Descripción">
                                <Button 
                                    size="small" 
                                    onClick={() => setActivePaneSmallScreen('description')} 
                                    variant="outlined"
                                    startIcon={<ChevronLeftIcon />} // Icono para indicar que se va a la izquierda (descripción)
                                >
                                    Información de la tarea
                                </Button>
                            </Tooltip>
                        </Box>
                    )}
                    <TaskChat 
                        projectId={task.proyecto!.id}
                        taskId={task.id} 
                        initialMessages={task.mensajes || []}
                        initialLastReadTimestamp={initialLastRead}
                    />
                </>
            ) : ( // VISTA COLAPSADA DEL CHAT (cuando la descripción está activa en pantalla pequeña)
                <Tooltip title="Ver Chat" placement="left">
                    <MuiIconButton 
                        onClick={() => setActivePaneSmallScreen('chat')} 
                        sx={{ m: 'auto', display:'flex', flexDirection:'column', p:1, width:'100%', height:'100%', borderRadius:0, justifyContent:'center' }}
                        aria-label="Mostrar chat"
                    >
                        <ChatIcon />
                        <Typography variant="caption" sx={{writingMode: 'vertical-rl', textOrientation: 'mixed', mt:0.5, lineHeight:1}}>CHAT GRUPAL</Typography>
                    </MuiIconButton>
                </Tooltip>
            )}
        </Box>
    </DialogContent>

      <DialogActions sx={{ py: 1, px: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'action.hover', justifyContent: 'space-between', flexShrink:0 }}>
        <Box sx={{textAlign: 'left'}}>
            <Typography variant="caption" color="text.secondary" display="block">Creador: {task.creador?.name || task.creador?.email || 'N/A'}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">Creación: {formatDate(task.fechaCreacion, true)} | Últ. Act: {formatDate(task.fechaActualizacion, true)}</Typography>
        </Box>
        <Button onClick={onClose} variant="outlined" size="small">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailModal;