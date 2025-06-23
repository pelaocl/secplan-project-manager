import React, { useState, useMemo, useCallback } from 'react';
import { IconButton, Badge, Menu, Typography, Box, CircularProgress, Divider, Button, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTaskModal } from '../../context/TaskModalContext'; // <-- Importar el hook del modal global
import { notificationApi } from '../../services/notificationApi';
import { Notificacion, CategoriaNotificacion } from '../../types';
import { useAuthStore, useChatUnreadCount } from '../../store/authStore';

// Interfaz para las notificaciones agrupadas
interface GroupedNotification {
    projectId: number;
    taskId: number;
    taskName: string;
    projectCode: string;
    projectName: string;
    unreadCount: number;
    latestDate: Date;
}

const ChatNotificationBell: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<Notificacion[]>([]);
    const chatUnreadCount = useChatUnreadCount();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { openTaskModal } = useTaskModal(); // <-- Usar el hook del modal
    
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    const groupedNotifications = useMemo((): GroupedNotification[] => {
        if (!notifications.length) return [];
        const groups: Record<string, GroupedNotification> = {};
        const notificationRegex = /en la tarea "([^"]+)" del proyecto \[([^\]]+)\] (.*)\.$/;

        notifications.forEach(notif => {
            if (!notif.urlDestino) return;
            const urlParts = notif.urlDestino.split('/');
            const taskId = parseInt(urlParts[urlParts.length - 1], 10);
            const projectId = parseInt(urlParts[urlParts.length - 3], 10);
            
            if (isNaN(taskId) || isNaN(projectId)) return;

            const taskIdStr = String(taskId);

            if (!groups[taskIdStr]) {
                const match = notif.mensaje.match(notificationRegex);
                groups[taskIdStr] = {
                    projectId,
                    taskId,
                    taskName: match ? match[1] : `Tarea ID: ${taskId}`,
                    projectCode: match ? match[2] : 'N/A',
                    projectName: match ? match[3] : 'Proyecto Desconocido',
                    unreadCount: 0,
                    latestDate: new Date(0),
                };
            }

            if (!notif.leida) {
                groups[taskIdStr].unreadCount++;
            }
            const notifDate = new Date(notif.fechaCreacion);
            if (notifDate > groups[taskIdStr].latestDate) {
                groups[taskIdStr].latestDate = notifDate;
            }
        });

        // Filtrar solo los grupos que tienen notificaciones no leídas
        return Object.values(groups)
            .filter(g => g.unreadCount > 0)
            .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());

    }, [notifications]);

    const fetchChatNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const response = await notificationApi.getNotifications(true, CategoriaNotificacion.CHAT);
            setNotifications(response.notifications);
        } catch (error) {
            console.error("Error fetching chat notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        fetchChatNotifications();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleItemClick = (projectId: number, taskId: number) => {
        handleClose();
        openTaskModal(projectId, taskId);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead(CategoriaNotificacion.CHAT);
            fetchChatNotifications();
        } catch (error) {
            console.error("Error marking all chat notifications as read:", error);
        }
    };
    
    return (
        <>
            <IconButton size="large" color="inherit" onClick={handleClick} disabled={!isAuthenticated}>
                <Badge badgeContent={chatUnreadCount} color="error">
                    <ChatBubbleOutlineIcon />
                </Badge>
            </IconButton>
            <Menu
                id="chat-notifications-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{ style: { maxHeight: 400, width: '380px', overflowY: 'auto' } }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', p:1.5, pt:1 }}>
                    <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Actividad de Chat</Typography>
                    {groupedNotifications.length > 0 && chatUnreadCount > 0 && (
                        <Button size="small" onClick={handleMarkAllAsRead} disabled={isLoading}>
                            Marcar todas como leídas
                        </Button>
                    )}
                </Box>
                <Divider sx={{mb: 0.5}} />
                {isLoading && <Box sx={{display: 'flex', justifyContent: 'center', p:2}}><CircularProgress size={24} /></Box>}
                {!isLoading && groupedNotifications.length === 0 && (
                    <Typography sx={{ p: 2, textAlign: 'center' }} color="text.secondary">No tienes actividad reciente en chats.</Typography>
                )}
                {!isLoading && groupedNotifications.length > 0 && (
                    <List disablePadding>
                       {groupedNotifications.map((group) => (
                           <ListItem
                               key={group.taskId}
                               button
                               onClick={() => handleItemClick(group.projectId, group.taskId)}
                           >
                               <ListItemAvatar>
                                   <Badge
                                       badgeContent={group.unreadCount}
                                       color="error"
                                       invisible={group.unreadCount === 0}
                                   >
                                       <Avatar sx={{ bgcolor: 'primary.light' }}>
                                           <ChatBubbleOutlineIcon />
                                       </Avatar>
                                   </Badge>
                               </ListItemAvatar>
                               <ListItemText
                                   primary={group.taskName}
                                   secondary={
                                       <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                           <Chip label={group.projectCode} size="small" sx={{ mr: 1, height: 'auto' }} />
                                           <Typography component="span" variant="caption" color="text.secondary" noWrap>
                                               {group.projectName}
                                           </Typography>
                                       </Box>
                                   }
                                   primaryTypographyProps={{ 
                                       fontWeight: 'bold', 
                                       noWrap: true,
                                   }}
                               />
                           </ListItem>
                       ))}
                    </List>
                )}
            </Menu>
        </>
    );
};

export default ChatNotificationBell;
