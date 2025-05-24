// frontend/src/components/TaskChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, CircularProgress, Paper, Typography, IconButton, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ReactQuill from 'react-quill-new'; // O el editor que estés usando
import DOMPurify from 'dompurify';

import { ChatMessage, Task, User, UserPayload } from '../types';
import { useCurrentUser } from '../store/authStore';
import ChatMessageItem from './ChatMessageItem';
import { chatMessageService } from '../services/chatMessageApi'; // Necesitaremos crear este servicio
import { socketService } from '../services/socketService';

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
    if (!taskId || !currentUser) return;

    const roomName = `task_chat_${taskId}`;
    const newMessageHandler = (newMessage: ChatMessage) => {
        console.log(`[TaskChat] Nuevo mensaje recibido para tarea ${taskId}:`, newMessage);
        // Asegurarse que el mensaje es para esta tarea (aunque la sala debería garantizarlo)
        if (newMessage.tareaId === taskId) {
            setMessages((prevMessages) => {
                // Evitar duplicados si el mensaje ya fue añadido optimistamente
                if (prevMessages.find(m => m.id === newMessage.id)) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage];
            });
        }
    };

    console.log(`[TaskChat] Uniéndose a la sala: ${roomName} para tarea ${taskId}`);
    socketService.emit('join_task_chat_room', taskId.toString()); // El backend espera string o number
    socketService.on('nuevo_mensaje_chat', newMessageHandler); // Escucha evento genérico de la sala

    return () => {
        console.log(`[TaskChat] Dejando la sala: ${roomName} para tarea ${taskId}`);
        socketService.emit('leave_task_chat_room', taskId.toString());
        // socketService.off('nuevo_mensaje_chat', newMessageHandler); // Desregistrar listener si es necesario
        // Es importante desregistrar el listener si se registra múltiples veces o si el componente se destruye y recrea
        // Para socket.io-client, si la instancia del socket es la misma y solo haces .on/.off,
        // podrías necesitar manejar los listeners con más cuidado para evitar duplicados
        // o usar un identificador único para el handler.
        // Por ahora, si 'socketService.on' añade un nuevo listener cada vez,
        // y el socket es persistente, necesitarás una función de limpieza para 'off'.
        // Si 'socketService.on' reemplaza o es idempotente, está bien.
        // Asumamos por ahora que el 'on' en tu socketService es simple.
        // Una mejor práctica sería que socketService.on devuelva una función de desuscripción.
        if (socketService.getSocket()) { // Solo si el socket existe
            socketService.getSocket()?.off('nuevo_mensaje_chat', newMessageHandler);
        }
    };
  }, [taskId, currentUser]); // Depende de taskId y currentUser para la lógica de salas/auth

  const handleSendMessage = async () => {
    if (!newMessageContent.trim() || !currentUser) return;
    const cleanHtml = DOMPurify.sanitize(newMessageContent, { 
        ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'br'],
        ALLOWED_ATTR: ['href', 'target']
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
            <ReactQuill
                ref={editorRef}
                theme="snow" // O "bubble" para un look más simple en chat
                value={newMessageContent}
                onChange={setNewMessageContent}
                modules={chatQuillModules}
                formats={chatQuillFormats}
                placeholder="Escribe tu mensaje..."
                style={{ backgroundColor: 'white' }} // Para que se vea bien sobre fondo gris
            />
         </Box>
        <IconButton color="primary" onClick={handleSendMessage} disabled={isSending || !newMessageContent.trim()} aria-label="Enviar mensaje">
          {isSending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
      {error && <Alert severity="error" sx={{mt:1}}>{error}</Alert>}
    </Box>
  );
};

export default TaskChat;