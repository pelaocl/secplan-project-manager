// frontend/src/components/NotificationItem.tsx
import React from 'react';
import { ListItem, ListItemText, Typography, IconButton, Tooltip, Badge, Box } from '@mui/material';
import { Notificacion, TipoNotificacion } from '../types';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Para marcar como leída
import { useNavigate } from 'react-router-dom';

// Iconos para tipos de notificación (ejemplos, puedes expandir)
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; // TAREA_NUEVA/COMPLETADA
import ChatIcon from '@mui/icons-material/Chat'; // NUEVO_MENSAJE
import InfoIcon from '@mui/icons-material/Info'; // TAREA_ACTUALIZADA u otros

interface NotificationItemProps {
  notification: Notificacion;
  onMarkAsRead: (notificationId: number) => void;
}

const getNotificationIcon = (tipo: TipoNotificacion) => {
    switch (tipo) {
        case TipoNotificacion.NUEVA_TAREA_ASIGNADA:
        case TipoNotificacion.TAREA_COMPLETADA:
            return <AssignmentTurnedInIcon fontSize="small" sx={{opacity: 0.7}} />;
        case TipoNotificacion.NUEVO_MENSAJE_TAREA:
            return <ChatIcon fontSize="small" sx={{opacity: 0.7}} />;
        case TipoNotificacion.TAREA_ACTUALIZADA_ESTADO:
        case TipoNotificacion.TAREA_ACTUALIZADA_INFO:
        default:
            return <InfoIcon fontSize="small" sx={{opacity: 0.7}} />;
    }
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.leida) {
      onMarkAsRead(notification.id);
    }
    if (notification.urlDestino) {
      navigate(notification.urlDestino);
    }
  };

  return (
    <ListItem
      onClick={handleClick}
      button // Hace que el ListItem sea clickeable
      sx={{ 
        backgroundColor: notification.leida ? 'transparent' : 'action.hover',
        borderLeft: notification.leida ? 'none' : (theme) => `3px solid ${theme.palette.primary.main}`,
        mb: 0.5,
        borderRadius: 1,
      }}
      secondaryAction={
        !notification.leida ? (
          <Tooltip title="Marcar como leída">
            <IconButton edge="end" aria-label="mark as read" onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }}>
              <CheckCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5 }}>
          {getNotificationIcon(notification.tipo)}
      </Box>
      <ListItemText
        primary={
            <Typography variant="body2" sx={{ fontWeight: notification.leida ? 'normal' : 'bold' }}>
                {notification.mensaje}
            </Typography>
        }
        secondary={new Date(notification.fechaCreacion).toLocaleString('es-CL', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })}
      />
    </ListItem>
  );
};

export default NotificationItem;