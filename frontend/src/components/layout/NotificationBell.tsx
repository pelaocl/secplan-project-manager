// frontend/src/components/layout/NotificationBell.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Badge, Menu, Typography, Box, CircularProgress, Divider, Button, List } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { notificationApi } from '../../services/notificationApi';
import { Notificacion } from '../../types';
import NotificationItem from '../NotificationItem';
import { useAuthStore } from '../../store/authStore';
import { socketService } from '../../services/socketService';

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingDropdown, setIsLoadingDropdown] = useState<boolean>(false);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const fetchDropdownNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUserId) {
      setNotifications([]);
      // El unreadCount se actualiza por socket, pero al desloguear o si no hay user, lo reseteamos
      if(!currentUserId) setUnreadCount(0); 
      return;
    }
    setIsLoadingDropdown(true);
    try {
      // Al abrir el dropdown, traemos una lista (puede ser solo no leídas o una mezcla)
      // y el contador actualizado por si acaso.
      const response = await notificationApi.getNotifications(false); // Trae todas (leídas y no leídas)
      setNotifications(response.notifications.slice(0, 10)); // Mostrar solo las últimas N en el dropdown
      setUnreadCount(response.unreadCount); 
    } catch (error) {
      console.error("Error fetching dropdown notifications:", error);
    } finally {
      setIsLoadingDropdown(false);
    }
  }, [isAuthenticated, currentUserId]);

  // Cargar contador inicial al montar o cambiar usuario/estado de autenticación
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
        // Llama a la función que obtiene las notificaciones para el dropdown,
        // la cual también actualiza el unreadCount.
        fetchDropdownNotifications();
    } else {
        // Limpiar si el usuario se desloguea
        setNotifications([]);
        setUnreadCount(0);
    }
  }, [isAuthenticated, currentUserId, fetchDropdownNotifications]);


  // Escuchar evento de Socket.IO para actualizar EL CONTADOR
  useEffect(() => {
    if (!isAuthenticated || !socketService.getSocket() || !currentUserId) return;

    const handleUnreadCountUpdate = (data: { count: number }) => {
        console.log('[NotificationBell] Evento unread_count_updated recibido:', data);
        setUnreadCount(data.count);
        // Si el menú está abierto cuando llega una actualización de contador,
        // podrías querer refrescar la lista visible en el dropdown.
        if (anchorEl) {
            fetchDropdownNotifications();
        }
    };
    
    socketService.on('unread_count_updated', handleUnreadCountUpdate);

    return () => {
        const socket = socketService.getSocket();
        if (socket) {
            socket.off('unread_count_updated', handleUnreadCountUpdate);
        }
    };
  }, [isAuthenticated, currentUserId, anchorEl, fetchDropdownNotifications]);


  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchDropdownNotifications(); // Refresca la lista del dropdown al abrirlo
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationApi.markAsRead(notificationId);
      // El backend debería emitir 'unread_count_updated' si esto cambia el contador.
      // Adicionalmente, refrescamos la lista del dropdown para reflejar el cambio de 'leida' visualmente.
      fetchDropdownNotifications(); 
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
        await notificationApi.markAllAsRead();
        fetchDropdownNotifications(); // Refresca todo
    } catch (error) {
        console.error("Error marking all as read:", error);
    }
  };

  return (
    <>
      <IconButton
        size="large"
        color="inherit"
        aria-controls="notifications-menu"
        aria-haspopup="true"
        onClick={handleClick}
        disabled={!isAuthenticated}
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
        PaperProps={{ style: { maxHeight: 400, width: '350px', overflowY: 'auto' } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', p:1.5, pt:1 }}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Notificaciones</Typography>
            {notifications.length > 0 && unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllAsRead} disabled={isLoadingDropdown}>
                    Marcar todas como leídas
                </Button>
            )}
        </Box>
        <Divider sx={{mb: 0.5}} />
        {isLoadingDropdown && <Box sx={{display: 'flex', justifyContent: 'center', p:2}}><CircularProgress size={24} /></Box>}
        {!isLoadingDropdown && notifications.length === 0 && (
          <Typography sx={{ p: 2, textAlign: 'center' }} color="text.secondary">No tienes notificaciones.</Typography>
        )}
        {!isLoadingDropdown && notifications.length > 0 && (
            <List disablePadding sx={{outline: 'none'}}>
             {notifications.map((notif) => (
                <NotificationItem 
                    key={notif.id} 
                    notification={notif} 
                    onMarkAsRead={handleMarkAsRead}
                />
             ))}
            </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;