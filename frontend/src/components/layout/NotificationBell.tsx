// frontend/src/components/layout/NotificationBell.tsx
import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Box, CircularProgress, Divider, Button, List } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { notificationApi, NotificationsResponse } from '../../services/notificationApi';
import { Notificacion } from '../../types';
import NotificationItem from '../NotificationItem'; // El componente que acabamos de crear
import { useAuthStore } from '../../store/authStore'; // Para manejar re-fetch al loguear/desloguear
import { socketService } from '../../services/socketService'; // Para escuchar eventos

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); // Para re-fetch
  const lastFetchedUserId = useRef<number | null | undefined>(null);
  const currentUserId = useAuthStore((state) => state.user?.id);


  const fetchNotifications = async () => {
    if (!isAuthenticated || !currentUserId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch inicial, podrías querer solo las no leídas o una mezcla para el dropdown
      const response = await notificationApi.getNotifications(false); // Trae todas (leídas y no leídas)
      setNotifications(response.notifications.slice(0, 10)); // Mostrar solo las últimas N en el dropdown
      setUnreadCount(response.unreadCount);
      lastFetchedUserId.current = currentUserId;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Podrías mostrar un error en el dropdown
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUserId && currentUserId !== lastFetchedUserId.current) {
        fetchNotifications();
    } else if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        lastFetchedUserId.current = null;
    }
  }, [isAuthenticated, currentUserId]);

  // --- Escuchar eventos de Socket.IO para actualizar notificaciones ---
  useEffect(() => {
    if (!isAuthenticated || !socketService.getSocket()) return;

    // Estos eventos son ejemplos. Tu backend emite 'nueva_tarea_asignada', 'tarea_actualizada', 'nuevo_mensaje_chat'.
    // Idealmente, el backend también emitiría un evento más genérico como 'nueva_notificacion_personal'
    // cuando se crea una Notificacion en la DB para el usuario actual.
    // O, el frontend puede re-fetchear al recibir CUALQUIER evento relevante de tarea/chat.

    const handleGenericNotificationEvent = (eventData: any) => {
        console.log('[NotificationBell] Socket event received, refetching notifications:', eventData);
        fetchNotifications(); // Re-fetch para actualizar contador y lista
    };
    
    // Nos suscribimos a los eventos que ya emite el backend
    socketService.on('nueva_tarea_asignada', handleGenericNotificationEvent);
    socketService.on('tarea_actualizada', handleGenericNotificationEvent);
    socketService.on('tarea_eliminada', handleGenericNotificationEvent);
    socketService.on('nuevo_mensaje_chat', handleGenericNotificationEvent); // Este es a una sala, hay que ser cuidadoso

    // El evento 'nuevo_mensaje_chat' se emite a una sala de tarea.
    // Para que este bell se actualice, el usuario tendría que estar en esa sala O
    // el backend debería enviar una señal individual al usuario afectado por el mensaje.
    // Por ahora, asumimos que un 'nuevo_mensaje_chat' podría ser relevante si el usuario participa.
    // Una mejor solución es un evento socket directo al usuario: `nueva_notificacion_para_ti`.

    return () => {
        const socket = socketService.getSocket();
        if (socket) {
            socket.off('nueva_tarea_asignada', handleGenericNotificationEvent);
            socket.off('tarea_actualizada', handleGenericNotificationEvent);
            socket.off('tarea_eliminada', handleGenericNotificationEvent);
            socket.off('nuevo_mensaje_chat', handleGenericNotificationEvent);
        }
    };
  }, [isAuthenticated]); // Re-suscribirse si cambia el estado de autenticación


  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (unreadCount > 0 || notifications.length === 0) { // Re-fetch si hay no leídas o si está vacío para asegurar datos frescos
        fetchNotifications();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationApi.markAsRead(notificationId);
      fetchNotifications(); // Re-fetch para actualizar la lista y el contador
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
        await notificationApi.markAllAsRead();
        fetchNotifications();
        // handleClose(); // Opcional: cerrar el menú después de marcar todas
    } catch (error) {
        console.error("Error marking all as read:", error);
    }
  };

  return (
    <>
      <IconButton
        size="large"
        color="inherit"
        aria-label="show new notifications"
        aria-controls="notifications-menu"
        aria-haspopup="true"
        onClick={handleClick}
        disabled={!isAuthenticated} // Deshabilitar si no está autenticado
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'notifications-button' }}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '350px',
            overflowY: 'auto'
          },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', p:1.5, pt:1 }}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Notificaciones</Typography>
            {notifications.length > 0 && unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllAsRead} disabled={isLoading}>
                    Marcar todas como leídas
                </Button>
            )}
        </Box>
        <Divider sx={{mb: 0.5}} />
        {isLoading && <Box sx={{display: 'flex', justifyContent: 'center', p:2}}><CircularProgress size={24} /></Box>}
        {!isLoading && notifications.length === 0 && (
          <Typography sx={{ p: 2, textAlign: 'center' }} color="text.secondary">No tienes notificaciones.</Typography>
        )}
        {!isLoading && notifications.length > 0 && (
            <List disablePadding sx={{outline: 'none'}}> {/* Para quitar el foco del menú al hacer clic en item */}
             {notifications.map((notif) => (
                <NotificationItem 
                    key={notif.id} 
                    notification={notif} 
                    onMarkAsRead={() => {
                        handleMarkAsRead(notif.id);
                        // No cerramos el menú aquí para que pueda marcar varias si quiere
                        // handleClose(); 
                    }}
                />
             ))}
            </List>
        )}
        {/* Podrías añadir un link "Ver todas las notificaciones" si tienes una página dedicada */}
      </Menu>
    </>
  );
};

export default NotificationBell;