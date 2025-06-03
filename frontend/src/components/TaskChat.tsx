// frontend/src/components/TaskChat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, CircularProgress, Paper, Typography, Alert, useTheme, Fab, Divider, Chip as MuiChip, Tooltip, IconButton, TextField } from '@mui/material'; // TextField añadido
import SendIcon from '@mui/icons-material/Send';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ImageIcon from '@mui/icons-material/Image';
import DOMPurify from 'dompurify';

import { ChatMessage, UserPayload } from '../types';
import { useCurrentUser } from '../store/authStore';
import ChatMessageItem from './ChatMessageItem';
import { chatMessageService } from '../services/chatMessageApi';
import { socketService } from '../services/socketService';
import { notificationApi } from '../services/notificationApi';
import { taskApi } from '../services/taskApi';
// Ya no importamos TiptapEditor para el input del chat

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
  useEffect(() => {
    setMessages(initialMessages);
    setHasScrolledInitially(false); 
    setFirstUnreadMessageIdForDivider(null);
    setShowNewMessagesButton(false);
  }, [initialMessages]);

  const [newMessageText, setNewMessageText] = useState<string>(''); // Para el TextField
  const [imageToSend, setImageToSend] = useState<string | null>(null); // Para la URL de la imagen
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null); // Ref para el textarea
  
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
                        // firstUnreadMessageIdForDivider se establece en el scroll inicial, no aquí por cada mensaje nuevo
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
  }, [taskId, currentUser?.id, scrollToBottom]); // Eliminados setters de estado para estabilizar

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
             // Si ya se hizo scroll inicial y no se marcó ningún "no leído", asegurar scroll al fondo
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
  }, [showNewMessagesButton, firstUnreadMessageIdForDivider, messages.length]); // messages.length para re-evaluar si cambia el scrollHeight

  useEffect(() => {
    }, [newMessageText]);
  // --- FIN AJUSTAR ALTURA ---

  useEffect(() => {
    if (shouldFocusInput) {
        chatInputRef.current?.focus();
        setShouldFocusInput(false); // Resetea el flag después de enfocar
    }
}, [shouldFocusInput]); // Este efecto se ejecuta cuando shouldFocusInput cambia a true

  const handleInsertImageLink = () => {
    const url = prompt("Ingresa la URL de la imagen que deseas adjuntar:");
    if (url) {
        setImageToSend(url); // Guardar la URL de la imagen
        // Opcional: mostrar un preview o indicador de que una imagen está adjunta
        alert("Imagen lista para ser enviada con tu mensaje. Escribe un texto si quieres y presiona Enviar.");
        chatInputRef.current?.focus();
    }
  };

  const handleSendMessage = async () => {
    const textContent = newMessageText.trim();
    if ((!textContent && !imageToSend) || !currentUser) {
        setError(!textContent && !imageToSend ? "El mensaje no puede estar vacío." : "Usuario no autenticado.");
        // Re-enfocar si el intento de envío falla por validación temprana
        setTimeout(() => {
            chatInputRef.current?.focus();
        }, 0);
        return;
    }

    let htmlContent = "";
    if (textContent) {
        const escapedText = textContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
        htmlContent += `<p>${escapedText}</p>`;
    }
    if (imageToSend) {
        htmlContent += `<p><img src="${imageToSend}" alt="Imagen adjunta" style="max-width: 200px; height: auto; border-radius: 4px; margin-top: 4px;" /></p>`;
    }

    const cleanHtml = DOMPurify.sanitize(htmlContent, { 
        ALLOWED_TAGS: ['p', 'br', 'img'],
        ALLOWED_ATTR: ['src', 'alt', 'style']
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;
    if (!(tempDiv.textContent || tempDiv.innerText || "").trim() && !cleanHtml.includes("<img")) {
        setError("El mensaje está vacío o solo contiene espacios.");
        setNewMessageText(''); 
        setImageToSend(null);
        // Re-enfocar si el mensaje estaba vacío después de sanear
        setTimeout(() => {
            chatInputRef.current?.focus();
        }, 0);
        return;
    }

    setIsSending(true); 
    setError(null);
    try {
      await chatMessageService.createChatMessage(projectId, taskId, { contenido: cleanHtml });
      setNewMessageText(''); 
      setImageToSend(null);
      setShouldFocusInput(true);
        // La llamada a focus() se moverá al bloque finally para asegurar que el input esté habilitado
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
        {messages.map((msg) => (
            <React.Fragment key={msg.id}>
                {msg.id === firstUnreadMessageIdForDivider && msg.remitente.id !== currentUser?.id && (
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
        <Fab color="primary" size="small" onClick={() => { scrollToBottom('smooth'); setShowNewMessagesButton(false); setFirstUnreadMessageIdForDivider(null); }}
            sx={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, boxShadow: theme.shadows[6] }}
            aria-label="Ir a mensajes nuevos"
        >
            <ArrowDownwardIcon />
        </Fab>
      )}

{/* --- ÁREA DE INPUT MODIFICADA --- */}
<Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-end', // Importante para alinear botones con el textarea cuando crece
          gap: 1, 
          borderTop: 1, 
          borderColor: 'divider', 
          pt: 1, // Reducido padding top
          pb: 0.5  // Reducido padding bottom para que esté más pegado al final
        }}
      >
        <Tooltip title="Adjuntar imagen desde URL">
            <IconButton onClick={handleInsertImageLink} disabled={isSending} sx={{p: theme.spacing(1.25) /* Consistencia en padding */}}>
                <ImageIcon fontSize="small"/>
            </IconButton>
        </Tooltip>
        <TextField
            inputRef={chatInputRef} // Usar inputRef para el textarea interno
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={isSending}
            variant="outlined"
            size="small" // Para un look más compacto
            rows={1} // Iniciar con 1 fila
            onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            }}
            // No necesitamos InputProps.rows aquí si usamos el useEffect con adjustTextareaHeight
            // La lógica de maxHeight y overflowY se maneja en adjustTextareaHeight
            sx={{
                flexGrow: 1,
                mr: 0.5, 
                '& .MuiInputBase-root': { 
                    borderRadius: '20px',
                    backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[800],
                    pt: '5px', // Ajusta el padding superior DENTRO del MuiInputBase-root
                    pb: '5px', // Ajusta el padding inferior DENTRO del MuiInputBase-root
                    alignItems: 'center', // Para centrar el texto si es una sola línea
                },
                '& .MuiOutlinedInput-input': { // Estilos para el <textarea> interno
                    // py: '10px', // Eliminamos o reducimos el padding vertical aquí, minRows/maxRows lo manejan mejor
                    paddingTop: '3.5px', // Padding más fino para el texto dentro del input
                    paddingBottom: '3.5px',// Padding más fino para el texto dentro del input
                    lineHeight: '1.43', // Ajuste de altura de línea estándar
                    fontSize: '0.875rem',
                    // maxHeight y overflowY ahora son manejados por maxRows
                }
            }}
        />
        <Tooltip title="Enviar mensaje">
            <span>
                <IconButton color="primary" onClick={handleSendMessage} disabled={isSending || (!newMessageText.trim() && !imageToSend)} sx={{p: theme.spacing(1.25)}}>
                    {isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                </IconButton>
            </span>
        </Tooltip>
      </Box>
      {/* --- FIN ÁREA DE INPUT MODIFICADA --- */}
      {error && <Alert severity="error" sx={{mt:1}}>{error}</Alert>}
    </Box>
  );
};

export default TaskChat;