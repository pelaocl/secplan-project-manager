// frontend/src/components/TaskChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Paper, Typography, IconButton, Alert, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DOMPurify from 'dompurify';

import { ChatMessage, UserPayload } from '../types'; // Task y User no se usan directamente como props
import { useCurrentUser } from '../store/authStore';
import ChatMessageItem from './ChatMessageItem';
import { chatMessageService } from '../services/chatMessageApi';
import { socketService } from '../services/socketService';
import { notificationApi } from '../services/notificationApi'; // Para marcar notificaciones globales
import { taskApi } from '../services/taskApi'; // <-- AÑADIDO para markTaskChatAsViewed
import TiptapEditor from './TiptapEditor';

// Configuración de Quill/Tiptap (asegúrate que esta sea la que funciona para ti)
// Esta es la que incluye el handler de imagen y formatos completos que usaste en ProjectForm
// Si quieres una toolbar más simple para el chat, puedes definir otra constante aquí.
const chatEditorModules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
    handlers: {
      image: function(this: { quill: any }) { // Asumiendo que Tiptap lo maneja similar o que TiptapEditor no usa este handler directamente
                                            // Si TiptapEditor usa EditorToolbar, esta config se pasa implícitamente.
                                            // Para Tiptap, el handler de imagen se configura en las extensiones.
                                            // Por simplicidad, si TiptapEditor usa la EditorToolbar que ya tiene el prompt, está bien.
        const url = prompt('Por favor, ingrese la URL de la imagen:');
        if (url && this.quill) { // this.quill es específico de ReactQuill
          const quillInstance = this.quill;
          const range = quillInstance.getSelection(true);
          quillInstance.insertEmbed(range.index, 'image', url, 'user');
        }
      }
    }
  }
};

const chatEditorFormats = [
  'header', 'bold', 'italic', 'underline',
  'list', 'bullet', 'link', 'image'
];


interface TaskChatProps {
  projectId: number;
  taskId: number;
  initialMessages: ChatMessage[];
}

const TaskChat: React.FC<TaskChatProps> = ({ projectId, taskId, initialMessages }) => {
  const theme = useTheme();
  const currentUser = useCurrentUser();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessageContent, setNewMessageContent] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!taskId || !currentUser || !projectId) { // projectId añadido al guard
        console.warn('[TaskChat] useEffect: Faltan IDs o currentUser para configurar el chat.', { taskId, currentUser: !!currentUser, projectId });
        return;
    }

    const roomName = `task_chat_${taskId}`;
    
    // Marcar las notificaciones GLOBALES de chat para esta tarea como leídas
    const markGlobalChatNotificationsAsRead = async () => {
      try {
        console.log(`[TaskChat] Intentando marcar notificaciones GLOBALES de chat como leídas para tarea ID: ${taskId}`);
        const response = await notificationApi.markTaskChatNotificationsAsRead(taskId);
        console.log(`[TaskChat] Llamada a API markTaskChatNotificationsAsRead (global) exitosa. Respuesta:`, response);
      } catch (error) {
        console.error(`[TaskChat] Error al marcar notificaciones GLOBALES de chat como leídas para tarea ${taskId}:`, error);
      }
    };

    // Marcar el CHAT de esta tarea como VISTO por el usuario (actualiza UserTaskChatStatus)
    const markChatItselfAsViewed = async () => {
        try {
            console.log(`[TaskChat] Intentando marcar chat como VISTO (UserTaskChatStatus) para tarea ${taskId}, proyecto ${projectId}`);
            await taskApi.markTaskChatAsViewed(projectId, taskId); // <--- LLAMADA A LA NUEVA FUNCIÓN
            console.log(`[TaskChat] Llamada a API markTaskChatAsViewed exitosa.`);
            // El backend emitirá 'task_chat_status_updated', que ProjectDetailPage escuchará para quitar el punto rojo.
        } catch (error) {
            console.error(`[TaskChat] Error al marcar chat como VISTO para tarea ${taskId}:`, error);
        }
    };

    markGlobalChatNotificationsAsRead(); // Para la campana de TopAppBar
    markChatItselfAsViewed();           // Para el indicador de la lista de tareas

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

    return () => {
        console.log(`[TaskChat] Socket: Dejando la sala: ${roomName} para tarea ${taskId}`);
        socketService.emit('leave_task_chat_room', taskId.toString());
        const socket = socketService.getSocket();
        if (socket) {
            socket.off('nuevo_mensaje_chat', newMessageHandler);
        }
    };
  }, [taskId, currentUser, projectId]); // projectId añadido como dependencia

  const handleSendMessage = async () => {
    if (!newMessageContent || !currentUser) {
        setError("El mensaje no puede estar vacío.");
        return;
    }

    // Si tu EditorToolbar para Tiptap en el chat permite ciertos tags, ajústalos aquí.
    // Esta configuración permite los mismos que la toolbar completa.
    const cleanHtml = DOMPurify.sanitize(newMessageContent, { 
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'br', 'img'],
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
  
  // const editorRef = useRef<ReactQuill>(null); // Ya no se necesita y fue eliminado

  if (!currentUser) {
    return <Typography>Debes estar autenticado para participar en el chat.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '500px' }}>
      <Paper variant="outlined" sx={{ flexGrow: 1, p: 2, overflowY: 'auto', mb: 2, backgroundColor: 'background.default' }}>
        {messages.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            No hay mensajes en esta tarea aún. ¡Sé el primero!
          </Typography>
        )}
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </Paper>
      <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1, borderTop: 1, borderColor: 'divider', pt:1.5 }}>
         <Box sx={{ flexGrow: 1 }}>
            <TiptapEditor
                value={newMessageContent}
                onChange={setNewMessageContent}
                placeholder="Escribe tu mensaje..."
                disabled={isSending}
                // Para el chat, queremos la toolbar SIN encabezados.
                // TiptapEditor y EditorToolbar ya están configurados para aceptar esta prop.
                showHeadersInToolbar={false} 
            />
         </Box>
        <Button
            variant="contained"
            color="primary"
            size="medium"
            onClick={handleSendMessage}
            disabled={isSending || !newMessageContent || newMessageContent === "<p></p>" || (typeof newMessageContent === 'string' && !newMessageContent.replace(/<p><br><\/p>/g, '').trim()) }
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