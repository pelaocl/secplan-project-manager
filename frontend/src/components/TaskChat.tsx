// frontend/src/components/TaskChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, CircularProgress, Paper, Typography, IconButton, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DOMPurify from 'dompurify';

import { ChatMessage, Task, User, UserPayload } from '../types';
import { useCurrentUser } from '../store/authStore';
import ChatMessageItem from './ChatMessageItem';
import { chatMessageService } from '../services/chatMessageApi';
import { socketService } from '../services/socketService';
import { notificationApi } from '../services/notificationApi';
import TiptapEditor from './TiptapEditor'; // <-- AÑADIR IMPORT DE TIPTAPEDITOR

// Configuración de Quill para el chat (puede ser más simple que para descripciones)
const chatQuillModules  = {
  toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'], // Usará el handler simple de abajo
        ['clean']
      ],
      handlers: {
        image: function(this: { quill: any }) { // Handler simple para imagen
          const url = prompt('Por favor, ingrese la URL de la imagen:');
          if (url) {
            const quillInstance = this.quill;
            const range = quillInstance.getSelection(true);
            quillInstance.insertEmbed(range.index, 'image', url, 'user');
          }
        }
      }
    }
};

const chatQuillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'link', 'image'
];

interface TaskChatProps {
  projectId: number;
  taskId: number;
  initialMessages: ChatMessage[];
  // No necesitamos projectUsers si remitente ya tiene nombre/email
}

const TaskChat: React.FC<TaskChatProps> = ({ projectId, taskId, initialMessages }) => {
  const currentUser = useCurrentUser(); // Para saber quién es el remitente
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessageContent, setNewMessageContent] = useState<string>('');
  const [isSending, setIsSending] = useState<false>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Para auto-scroll

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- LÓGICA SOCKET.IO (Unirse/Dejar Sala y Escuchar Mensajes) ---
  useEffect(() => {
    if (!taskId || !currentUser) {
        console.log('[TaskChat] useEffect: taskId o currentUser no definidos, no se hace nada aún para sockets o marcar como leídas.');
        return;
    }

    const roomName = `task_chat_${taskId}`;
    
    const markAssociatedChatNotificationsAsRead = async () => {
      try {
        console.log(`[TaskChat - STEP 1] Intentando marcar notificaciones de chat como leídas para tarea ID: ${taskId}`);
        const response = await notificationApi.markTaskChatNotificationsAsRead(taskId);
        // Asumiendo que la API devuelve algo como { count: numeroDeNotificacionesActualizadas }
        console.log(`[TaskChat - STEP 2] Llamada a API markTaskChatNotificationsAsRead exitosa. Respuesta:`, response);
      } catch (error) {
        console.error(`[TaskChat - STEP 2 FAILED] Error al marcar notificaciones de chat como leídas para tarea ${taskId}:`, error);
      }
    };

    markAssociatedChatNotificationsAsRead(); // Llamar al montar/actualizar dependencias

    // --- Lógica de Socket.IO para unirse a la sala y escuchar nuevos mensajes ---
    console.log(`[TaskChat] Socket: Uniéndose a la sala: ${roomName} para tarea ${taskId}`);
    socketService.emit('join_task_chat_room', taskId.toString());
    
    const newMessageHandler = (newMessage: ChatMessage) => {
        console.log(`[TaskChat] Socket: Nuevo mensaje recibido para tarea ${taskId}:`, newMessage);
        if (newMessage.tareaId === taskId) {
            setMessages((prevMessages) => {
                if (prevMessages.find(m => m.id === newMessage.id)) return prevMessages;
                return [...prevMessages, newMessage];
            });
        }
    };
    socketService.on('nuevo_mensaje_chat', newMessageHandler);
    // --- Fin Lógica Socket.IO ---

    return () => {
        console.log(`[TaskChat] Socket: Dejando la sala: ${roomName} para tarea ${taskId}`);
        socketService.emit('leave_task_chat_room', taskId.toString());
        const socket = socketService.getSocket();
        if (socket) {
            socket.off('nuevo_mensaje_chat', newMessageHandler);
        }
    };
}, [taskId, currentUser]); // Dependencias

  const handleSendMessage = async () => {
    if (!newMessageContent.trim() || !currentUser) return;
    const cleanHtml = DOMPurify.sanitize(newMessageContent, { 
        ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'br', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'title']
    });
    if (!cleanHtml.trim() && !editorRef.current?.getEditor().getText().trim()) { // Doble check por si solo eran tags vacíos
        setError("El mensaje no puede estar vacío después de la sanitización.");
        return;
    }

    setIsSending(true);
    setError(null);
    try {
      // Pasar projectId a createChatMessage
      await chatMessageService.createChatMessage(projectId, taskId, { contenido: cleanHtml }); // <--- PASAR projectId
      setNewMessageContent('');
      if (editorRef.current) {
          editorRef.current.getEditor().setText('');
      }
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };
  
  // Ref para el editor Quill para poder limpiarlo
  const editorRef = useRef<ReactQuill>(null);

  if (!currentUser) {
    return <Typography>Debes estar autenticado para participar en el chat.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '500px' /* o la altura que desees */ }}>
      <Paper variant="outlined" sx={{ flexGrow: 1, p: 2, overflowY: 'auto', mb: 2, backgroundColor: 'background.default' }}>
        {messages.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            No hay mensajes en esta tarea aún. ¡Sé el primero!
          </Typography>
        )}
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} /> {/* Para auto-scroll */}
      </Paper>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderTop: 1, borderColor: 'divider', pt:1.5 }}>
         <Box sx={{ flexGrow: 1 }}>
          <TiptapEditor
                  value={newMessageContent} // Pasa el estado actual
                  onChange={setNewMessageContent} // Actualiza el estado
                  placeholder="Escribe tu mensaje..."
                  disabled={isSending}
                  // Si quieres una toolbar más simple para el chat, necesitaríamos modificar TiptapEditor
                  // o EditorToolbar para aceptar una configuración de toolbar diferente.
                  // Por ahora, usará la toolbar completa definida en EditorToolbar.tsx.
            />
         </Box>
         <Button
              variant="contained"
              color="primary"
              size="medium" // O 'small' si prefieres
              onClick={handleSendMessage}
              disabled={isSending || !newMessageContent.trim()}
              endIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{ ml: 1, borderRadius: '8px' /* Ajusta el redondeo */ }}
          >
              Enviar
          </Button>
      </Box>
      {error && <Alert severity="error" sx={{mt:1}}>{error}</Alert>}
    </Box>
  );
};

export default TaskChat;