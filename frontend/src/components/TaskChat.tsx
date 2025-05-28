// frontend/src/components/TaskChat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, CircularProgress, Paper, Typography, IconButton, Alert, useTheme, Fab, Divider, Chip as MuiChip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DOMPurify from 'dompurify';

import { ChatMessage, UserPayload } from '../types';
import { useCurrentUser } from '../store/authStore';
import ChatMessageItem from './ChatMessageItem';
import { chatMessageService } from '../services/chatMessageApi';
import { socketService } from '../services/socketService';
import { notificationApi } from '../services/notificationApi';
import { taskApi } from '../services/taskApi';
import TiptapEditor from './TiptapEditor';

interface TaskChatProps {
  projectId: number;
  taskId: number;
  initialMessages: ChatMessage[];
  initialLastReadTimestamp?: string | Date | null;
}

const TaskChat: React.FC<TaskChatProps> = ({ projectId, taskId, initialMessages, initialLastReadTimestamp }) => {
  const theme = useTheme();
  const currentUser = useCurrentUser();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessageContent, setNewMessageContent] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const [firstUnreadMessageIdOnLoad, setFirstUnreadMessageIdOnLoad] = useState<number | null>(null);
  const [hasScrolledInitially, setHasScrolledInitially] = useState(false);

  useEffect(() => {
    if (!taskId || !currentUser || !projectId) {
        console.warn('[TaskChat] useEffect principal: Faltan IDs o currentUser.', { taskId, currentUser: !!currentUser, projectId });
        return;
    }
    const roomName = `task_chat_${taskId}`;
    
    const markChatAsEffectivelyViewed = async () => {
      try {
        console.log(`[TaskChat] Intentando marcar chat como VISTO (UserTaskChatStatus) para tarea ${taskId}, proyecto ${projectId}`);
        await taskApi.markTaskChatAsViewed(projectId, taskId);
        console.log(`[TaskChat] Llamada a API markTaskChatAsViewed exitosa.`);
      } catch (error) { console.error(`[TaskChat] Error al marcar chat como VISTO para tarea ${taskId}:`, error); }

      try {
        console.log(`[TaskChat] Intentando marcar notificaciones GLOBALES de chat como leídas para tarea ID: ${taskId}`);
        await notificationApi.markTaskChatNotificationsAsRead(taskId);
        console.log(`[TaskChat] Llamada a API markTaskChatNotificationsAsRead (global) exitosa.`);
      } catch (error) { console.error(`[TaskChat] Error al marcar notificaciones GLOBALES como leídas para tarea ${taskId}:`, error); }
    };

    markChatAsEffectivelyViewed();

    console.log(`[TaskChat] Socket: Uniéndose a la sala: ${roomName} para tarea ${taskId}`);
    socketService.emit('join_task_chat_room', taskId.toString());
    
    const newMessageHandler = (newMessage: ChatMessage) => {
        if (newMessage.tareaId === taskId) {
            setMessages((prevMessages) => {
                if (prevMessages.find(m => m.id === newMessage.id)) return prevMessages;
                const updatedMessages = [...prevMessages, newMessage];
                
                const container = messagesContainerRef.current;
                if (container && newMessage.remitente.id !== currentUser?.id) {
                    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 60; 
                    if (!isNearBottom) {
                        setShowNewMessagesButton(true);
                        if(!showNewMessagesButton) {
                            setFirstUnreadMessageIdOnLoad(currentFirstUnread => currentFirstUnread === null ? newMessage.id : currentFirstUnread);
                        }
                    } else {
                         setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
                    }
                }
                return updatedMessages;
            });
        }
    };
    socketService.on('nuevo_mensaje_chat', newMessageHandler);

    return () => { 
        console.log(`[TaskChat] Socket: Dejando la sala: ${roomName} para tarea ${taskId}`);
        socketService.emit('leave_task_chat_room', taskId.toString());
        const socket = socketService.getSocket();
        if (socket) {
            socket.off('nuevo_mensaje_chat', newMessageHandler);
        }
    };
  }, [taskId, currentUser, projectId, showNewMessagesButton]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0 || hasScrolledInitially) {
        if(messages.length === 0) setShowNewMessagesButton(false);
        return;
    }
    let newFirstUnreadMsgIdForThisLoad: number | null = null;
    let scrollToBottom = true; 
    if (initialLastReadTimestamp) {
        const lastReadTime = new Date(initialLastReadTimestamp).getTime();
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            if (new Date(message.fechaEnvio).getTime() > lastReadTime) {
                if (message.remitente.id !== currentUser?.id) { 
                    newFirstUnreadMsgIdForThisLoad = message.id;
                    scrollToBottom = false; 
                    break; 
                }
            }
        }
    } else if (messages.length > 0 && messages.some(m => m.remitente.id !== currentUser?.id)) {
        newFirstUnreadMsgIdForThisLoad = messages.find(m => m.remitente.id !== currentUser?.id)?.id || null;
        scrollToBottom = false;
    }
    if (!scrollToBottom && newFirstUnreadMsgIdForThisLoad) {
        console.log(`[TaskChat] Scroll inicial: Hay mensajes nuevos (ID más reciente no leído por OTRO: ${newFirstUnreadMsgIdForThisLoad}). Mostrando botón.`);
        setFirstUnreadMessageIdOnLoad(newFirstUnreadMsgIdForThisLoad);
        setShowNewMessagesButton(true);
        const lastReadMsgIndex = messages.findIndex(m => newFirstUnreadMsgIdForThisLoad && m.id === newFirstUnreadMsgIdForThisLoad) -1;
        if (lastReadMsgIndex >=0) {
           const elementToScrollTo = document.getElementById(`message-item-${messages[lastReadMsgIndex].id}`);
           elementToScrollTo?.scrollIntoView({behavior: 'auto', block: 'start'});
        } else { 
           container.scrollTop = 0;
        }
    } else {
        console.log("[TaskChat] Scroll inicial: No hay mensajes nuevos de otros o no hay 'initialLastReadTimestamp'. Scrolleando al fondo.");
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        setShowNewMessagesButton(false);
    }
    setHasScrolledInitially(true);
  }, [messages, initialLastReadTimestamp, currentUser?.id, hasScrolledInitially]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const threshold = 30; 
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
            if (isAtBottom) {
                if (showNewMessagesButton) setShowNewMessagesButton(false);
                setFirstUnreadMessageIdOnLoad(null); 
            } else {
                if (firstUnreadMessageIdOnLoad && !showNewMessagesButton && messages.some(m => m.id === firstUnreadMessageIdOnLoad && new Date(m.fechaEnvio) > new Date(initialLastReadTimestamp || 0) && m.remitente.id !== currentUser?.id )) {
                    setShowNewMessagesButton(true);
                }
            }
        }, 150); 
    };
    container.addEventListener('scroll', handleScroll);
    return () => { clearTimeout(scrollTimeout); container.removeEventListener('scroll', handleScroll); };
  }, [showNewMessagesButton, firstUnreadMessageIdOnLoad, initialLastReadTimestamp, messages, currentUser?.id]);

  const handleSendMessage = async () => {
    if (!newMessageContent || !currentUser) {
        setError("El mensaje no puede estar vacío.");
        return;
    }
    const cleanHtml = DOMPurify.sanitize(newMessageContent, { 
        ALLOWED_TAGS: ['h1','h2','h3','p','strong','em','u','ol','ul','li','a','br','img'],
        ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'title']
    });
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;
    const textContentFromCleanHtml = tempDiv.textContent || tempDiv.innerText || "";

    if (!textContentFromCleanHtml.trim()) {
        setError("El mensaje está vacío o solo contiene espacios.");
        setNewMessageContent(null);
        return;
    }

    setIsSending(true);
    setError(null);
    try {
      await chatMessageService.createChatMessage(projectId, taskId, { contenido: cleanHtml });
      setNewMessageContent(null); 
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };
  
  if (!currentUser) { return <Typography>Debes estar autenticado para participar en el chat.</Typography>; }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '500px', position: 'relative' }}>
      <Paper ref={messagesContainerRef} variant="outlined" sx={{ flexGrow: 1, p: 2, overflowY: 'auto', mb: 2, backgroundColor: 'background.default', position: 'relative' }}>
        {messages.length === 0 && ( <Typography color="text.secondary" textAlign="center" sx={{ mt: 2 }}>No hay mensajes en esta tarea aún. ¡Sé el primero!</Typography> )}
        {messages.map((msg, index) => (
    <React.Fragment key={msg.id}>
        {/* Insertar el divisor ANTES del primer mensaje no leído por el usuario actual */}
        {msg.id === firstUnreadMessageIdOnLoad && msg.remitente.id !== currentUser?.id && (
            <Divider sx={{ my: 2, '&::before, &::after': { borderColor: 'primary.light' } }}>
                <MuiChip label="Nuevos mensajes" size="small" color="primary" variant="outlined" />
            </Divider>
        )}
        <Box id={`message-item-${msg.id}`}>
            <ChatMessageItem message={msg} />
        </Box>
    </React.Fragment>
))}
        <div ref={messagesEndRef} />
      </Paper>

      {showNewMessagesButton && (
        <Fab color="primary" size="small" onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowNewMessagesButton(false); setFirstUnreadMessageIdOnLoad(null); }}
            sx={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, boxShadow: theme.shadows[6] }}
            aria-label="Ir a mensajes nuevos"
        >
            <ArrowDownwardIcon />
        </Fab>
      )}

      <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1, borderTop: 1, borderColor: 'divider', pt:1.5 }}>
         <Box sx={{ flexGrow: 1 }}>
            <TiptapEditor
                value={newMessageContent}
                onChange={setNewMessageContent}
                placeholder="Escribe tu mensaje..."
                disabled={isSending}
                showHeadersInToolbar={false} 
            />
         </Box>
        <Button
            variant="contained"
            color="primary"
            size="medium"
            onClick={handleSendMessage}
            // Lógica completa para deshabilitar el botón
            disabled={isSending || !newMessageContent || (typeof newMessageContent === 'string' && (!newMessageContent.replace(/<[^>]+>/g, '').trim() || newMessageContent === '<p></p>' || newMessageContent === '<p><br></p>')) }
            endIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            sx={{ ml: 1, borderRadius: '8px', alignSelf: 'flex-end', mb: '1px' }}
        >
            Enviar
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{mt:1}}>{error}</Alert>}
    </Box>
  );
};

export default TaskChat;