import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, CircularProgress, Paper, Typography, Alert, useTheme, Fab, Divider, Chip as MuiChip, Tooltip, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import DOMPurify from 'dompurify';

import { ChatMessage, User } from '../types';
import { useCurrentUser } from '../store/authStore';
import ChatMessageItem from './ChatMessageItem';
import { chatMessageService } from '../services/chatMessageApi';
import { socketService } from '../services/socketService';
import { notificationApi } from '../services/notificationApi';
import { taskApi } from '../services/taskApi';

// Dependencias para la nueva funcionalidad de Menciones
import { MentionsInput, Mention } from 'react-mentions';
import './mentionStyles.css'; // Asegúrate de crear este archivo

// --- Props actualizadas para recibir a los participantes ---
interface TaskChatProps {
  projectId: number;
  taskId: number;
  initialMessages: ChatMessage[];
  participants: User[]; // Lista de usuarios que pueden ser mencionados
  initialLastReadTimestamp?: string | Date | null;
}

// --- Nuevo componente para la previsualización de la respuesta ---
const ReplyPreview: React.FC<{ message: ChatMessage; onCancel: () => void }> = ({ message, onCancel }) => {
    const theme = useTheme();
    return (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.action.hover }}>
            <Box>
                <Typography variant="caption" color="text.secondary">Respondiendo a:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {message.remitente.name || message.remitente.email}
                </Typography>
            </Box>
            <IconButton onClick={onCancel} size="small">
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    );
};

const TaskChat: React.FC<TaskChatProps> = ({ projectId, taskId, initialMessages, participants, initialLastReadTimestamp }) => {
  const theme = useTheme();
  const currentUser = useCurrentUser();
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  useEffect(() => {
    setMessages(initialMessages);
    setHasScrolledInitially(false); 
    setFirstUnreadMessageIdForDivider(null);
    setShowNewMessagesButton(false);
  }, [initialMessages]);

  // --- Estados actualizados y nuevos ---
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const mentionData = participants.map(p => ({ id: p.id, display: p.name || p.email }));
  // ---

  const [imageToSend, setImageToSend] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  
  const [showNewMessagesButton, setShowNewMessagesButton] = useState<boolean>(false);
  const [firstUnreadMessageIdForDivider, setFirstUnreadMessageIdForDivider] = useState<number | null>(null);
  const [hasScrolledInitially, setHasScrolledInitially] = useState<boolean>(false);
  const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  const newMessageHandler = useCallback((newMessage: ChatMessage) => {
    if (newMessage.tareaId === taskId) {
        setMessages((prevMessages) => {
            if (prevMessages.find(m => m.id === newMessage.id)) return prevMessages;
            const updatedMessages = [...prevMessages, newMessage];
            const container = messagesContainerRef.current;

            if (container) {
                const isCurrentUserSender = newMessage.remitente.id === currentUser?.id;
                if (!isCurrentUserSender) {
                    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 60;
                    if (!isNearBottom) {
                        setShowNewMessagesButton(true);
                    } else {
                        setTimeout(() => scrollToBottom('smooth'), 50);
                    }
                } else { 
                    setTimeout(() => scrollToBottom('auto'), 50);
                    setShowNewMessagesButton(false); 
                    setFirstUnreadMessageIdForDivider(null); 
                }
            }
            return updatedMessages;
        });
    }
  }, [taskId, currentUser?.id, scrollToBottom]);

  useEffect(() => {
    if (!taskId || !currentUser || !projectId) return;
    setHasScrolledInitially(false); 
    setFirstUnreadMessageIdForDivider(null);
    setShowNewMessagesButton(false);     

    const roomName = `task_chat_${taskId}`;
    const markChatAsEffectivelyViewed = async () => {
      try { await taskApi.markTaskChatAsViewed(projectId, taskId); } catch (e) { console.error(`Error markTaskChatAsViewed:`, e); }
      try { await notificationApi.markTaskChatNotificationsAsRead(taskId); } catch (e) { console.error(`Error markTaskChatNotificationsAsRead:`, e); }
    };
    markChatAsEffectivelyViewed();

    socketService.emit('join_task_chat_room', taskId.toString());
    socketService.on('nuevo_mensaje_chat', newMessageHandler);
    return () => {
        socketService.emit('leave_task_chat_room', taskId.toString());
        socketService.getSocket()?.off('nuevo_mensaje_chat', newMessageHandler);
    };
  }, [taskId, currentUser, projectId, newMessageHandler]); 
  
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || initialMessages.length === 0 || hasScrolledInitially) {
        if (initialMessages.length === 0) { setShowNewMessagesButton(false); setFirstUnreadMessageIdForDivider(null); }
        if (hasScrolledInitially && initialMessages.length > 0 && !firstUnreadMessageIdForDivider) {
             scrollToBottom('auto');
        }
        return; 
    }
    let firstUnreadIdxFromOther: number = -1;

    if (initialLastReadTimestamp) {
        const lastReadTime = new Date(initialLastReadTimestamp).getTime();
        for (let i = 0; i < initialMessages.length; i++) {
            if (new Date(initialMessages[i].fechaEnvio).getTime() > lastReadTime) {
                if (initialMessages[i].remitente.id !== currentUser?.id) {
                    firstUnreadIdxFromOther = i;
                    break;
                }
            }
        }
    } else { 
        const firstOtherMsgIdx = initialMessages.findIndex(m => m.remitente.id !== currentUser?.id);
        if (firstOtherMsgIdx !== -1) firstUnreadIdxFromOther = firstOtherMsgIdx;
    }
    
    if (firstUnreadIdxFromOther !== -1) {
        const firstUnreadMsg = initialMessages[firstUnreadIdxFromOther];
        setFirstUnreadMessageIdForDivider(firstUnreadMsg.id);
        setShowNewMessagesButton(true);
        const targetScrollIndex = Math.max(0, firstUnreadIdxFromOther - 1);
        const messageToScrollTo = initialMessages[targetScrollIndex];
        setTimeout(() => {
            const elementToScrollTo = document.getElementById(`message-item-${messageToScrollTo?.id}`);
            if (elementToScrollTo && firstUnreadIdxFromOther > 0) {
                elementToScrollTo.scrollIntoView({ behavior: 'auto', block: 'start' });
            } else if (firstUnreadIdxFromOther === 0) {
                if(container) container.scrollTop = 0;
            } else { 
                scrollToBottom('auto');
            }
        }, 50);
    } else {
        scrollToBottom('auto');
        setShowNewMessagesButton(false);
        setFirstUnreadMessageIdForDivider(null);
    }
    setHasScrolledInitially(true);
  }, [initialMessages, initialLastReadTimestamp, currentUser?.id, hasScrolledInitially, scrollToBottom]);

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
                if (firstUnreadMessageIdForDivider !== null) setFirstUnreadMessageIdForDivider(null); 
            } else {
                if (firstUnreadMessageIdForDivider && !showNewMessagesButton) {
                    setShowNewMessagesButton(true);
                }
            }
        }, 150); 
    };
    container.addEventListener('scroll', handleScroll);
    return () => { clearTimeout(scrollTimeout); container.removeEventListener('scroll', handleScroll); };
  }, [showNewMessagesButton, firstUnreadMessageIdForDivider, messages.length]);

  useEffect(() => {
    if (shouldFocusInput) {
        chatInputRef.current?.focus();
        setShouldFocusInput(false);
    }
  }, [shouldFocusInput]);

  const handleInsertImageLink = () => {
    const url = prompt("Ingresa la URL de la imagen que deseas adjuntar:");
    if (url) {
        setImageToSend(url);
        alert("Imagen lista para ser enviada con tu mensaje. Escribe un texto si quieres y presiona Enviar.");
        setShouldFocusInput(true);
    }
  };

  // --- Nuevos Handlers para la funcionalidad de Respuestas ---
  const handleReplyClick = (message: ChatMessage) => {
    setReplyingTo(message);
    setShouldFocusInput(true);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setShouldFocusInput(true);
  };
  
  // --- Función de envío de mensaje MODIFICADA ---
  const handleSendMessage = async () => {
    const textContent = newMessageText.trim();
    if ((!textContent && !imageToSend) || !currentUser) {
        setError(!textContent && !imageToSend ? "El mensaje no puede estar vacío." : "Usuario no autenticado.");
        setTimeout(() => { chatInputRef.current?.focus(); }, 0);
        return;
    }

    let htmlContent = "";
    if (textContent) {
        // El texto ya viene con el markup de menciones: @[Nombre](user:ID)
        // Lo envolvemos en un párrafo para consistencia, escapando saltos de línea
        htmlContent += `<p>${textContent.replace(/\n/g, "<br />")}</p>`;
    }
    if (imageToSend) {
        htmlContent += `<p><img src="${imageToSend}" alt="Imagen adjunta" style="max-width: 200px; height: auto; border-radius: 4px; margin-top: 4px;" /></p>`;
    }

    const cleanHtml = DOMPurify.sanitize(htmlContent, { 
        ALLOWED_TAGS: ['p', 'br', 'img', 'strong', 'em', 'u', 's', 'a', 'span'],
        ALLOWED_ATTR: ['src', 'alt', 'style', 'class', 'href', 'target']
    });

    setIsSending(true); 
    setError(null);
    try {
      await chatMessageService.createChatMessage(projectId, taskId, { 
          contenido: cleanHtml,
          mensajePadreId: replyingTo ? replyingTo.id : undefined,
      });
      setNewMessageText(''); 
      setImageToSend(null);
      setReplyingTo(null); // Limpiar respuesta después de enviar
      setShouldFocusInput(true);
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
      <Paper ref={messagesContainerRef} variant="outlined" sx={{ flexGrow: 1, p: 2, overflowY: 'auto', mb: 1, backgroundColor: 'background.default', position: 'relative' }}>
        {messages.length === 0 && ( <Typography color="text.secondary" textAlign="center" sx={{ mt: 2 }}>No hay mensajes en esta tarea aún. ¡Sé el primero!</Typography> )}
        {messages.map((msg) => (
            <React.Fragment key={msg.id}>
                {msg.id === firstUnreadMessageIdForDivider && msg.remitente.id !== currentUser?.id && (
                    <Divider sx={{ my: 2, '&::before, &::after': { borderColor: 'primary.light' } }}>
                        <MuiChip label="Nuevos mensajes" size="small" color="primary" variant="outlined" />
                    </Divider>
                )}
                <Box id={`message-item-${msg.id}`}>
                    <ChatMessageItem message={msg} onReply={handleReplyClick} />
                </Box>
            </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </Paper>

      {showNewMessagesButton && (
        <Fab color="primary" size="small" onClick={() => { scrollToBottom('smooth'); setShowNewMessagesButton(false); setFirstUnreadMessageIdForDivider(null); }}
            sx={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, boxShadow: theme.shadows[6] }}
            aria-label="Ir a mensajes nuevos"
        >
            <ArrowDownwardIcon />
        </Fab>
      )}

      <Paper elevation={3} sx={{ mt: 'auto', flexShrink: 0 }}>
        {replyingTo && <ReplyPreview message={replyingTo} onCancel={handleCancelReply} />}
        
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 1 }}>
            <Tooltip title="Adjuntar imagen desde URL">
              <span>
                <IconButton onClick={handleInsertImageLink} disabled={isSending}>
                    <ImageIcon />
                </IconButton>
              </span>
            </Tooltip>
            
            <MentionsInput
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Escribe un mensaje... Usa @ para mencionar."
                a11ySuggestionsListLabel={"Usuarios sugeridos para mencionar"}
                disabled={isSending}
                className="mentions-input" // Clase para aplicar estilos desde .css
                inputRef={chatInputRef}
                allowSpaceInQuery
            >
                <Mention
                    trigger="@"
                    data={mentionData}
                    markup="@[__display__](user:__id__)"
                    className="mentions-mention"
                />
            </MentionsInput>

            <Tooltip title="Enviar mensaje">
              <span>
                <IconButton color="primary" onClick={handleSendMessage} disabled={isSending || (!newMessageText.trim() && !imageToSend)}>
                    {isSending ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </span>
            </Tooltip>
        </Box>
      </Paper>
      {error && <Alert severity="error" sx={{mt:1}}>{error}</Alert>}
    </Box>
  );
};

export default TaskChat;