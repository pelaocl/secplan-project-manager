import React, { useState, useCallback } from 'react';
import { IconButton, Badge, Menu, Typography, Box, CircularProgress, Divider, Button, List } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { notificationApi } from '../../services/notificationApi';
import { Notificacion, CategoriaNotificacion } from '../../types';
import NotificationItem from '../NotificationItem';
// --- INICIO DE MODIFICACIÓN: Importar el hook correcto y quitar socketService ---
import { useAuthStore, useSystemUnreadCount } from '../../store/authStore';

const NotificationBell: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<Notificacion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // --- INICIO DE MODIFICACIÓN: Usar el contador directamente desde el store global ---
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const systemUnreadCount = useSystemUnreadCount(); // <-- Este es el contador reactivo y único que necesitamos
    // --- FIN DE MODIFICACIÓN ---

    // Esta función ahora solo trae la lista de notificaciones para mostrarla en el menú
    const fetchDropdownNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            // Pedimos solo las notificaciones de SISTEMA
            const response = await notificationApi.getNotifications(false, CategoriaNotificacion.SISTEMA);
            setNotifications(response.notifications.slice(0, 10)); 
            // Ya no necesitamos actualizar un contador local aquí.
        } catch (error) {
            console.error("Error fetching system notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // --- INICIO DE MODIFICACIÓN: Eliminar los useEffect redundantes ---
    // Se elimina el useEffect que escuchaba al socket, ya que esa lógica ahora está centralizada.
    // Se elimina el useEffect que obtenía el contador al montar.
    // --- FIN DE MODIFICACIÓN ---

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
            // El backend ya emitió un evento de socket que actualizó nuestro estado global.
            // Solo necesitamos refrescar la lista local para que cambie el estilo del item a "leído".
            fetchDropdownNotifications(); 
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };
    
    const handleMarkAllAsRead = async () => {
        try {
            // Le decimos al backend que marque todas las de SISTEMA como leídas
            await notificationApi.markAllAsRead(CategoriaNotificacion.SISTEMA);
            fetchDropdownNotifications();
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
                {/* --- INICIO DE MODIFICACIÓN: Usar el contador del store --- */}
                <Badge badgeContent={systemUnreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
                {/* --- FIN DE MODIFICACIÓN --- */}
            </IconButton>
            <Menu
                id="notifications-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{ style: { maxHeight: 400, width: '350px', overflowY: 'auto' } }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', p:1.5, pt:1 }}>
                    <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Notificaciones</Typography>
                    {notifications.length > 0 && systemUnreadCount > 0 && (
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
                    <List disablePadding>
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
