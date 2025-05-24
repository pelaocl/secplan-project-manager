// frontend/src/components/ChatMessageItem.tsx
import React from 'react';
import { Box, Paper, Typography, Avatar, Tooltip, useTheme } from '@mui/material';
import { ChatMessage, User } from '../types'; // Asume que User tiene id, name, email
import { useCurrentUser } from '../store/authStore'; // Para saber quién es el usuario actual
import { getUserAvatarColor } from '../utils/colorUtils';

interface ChatMessageItemProps {
  message: ChatMessage;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const theme = useTheme();
  const currentUser = useCurrentUser(); // Obtiene el usuario logueado
  const isSenderCurrentUser = currentUser ? message.remitente.id === currentUser.id : false;

  const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isSenderCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', maxWidth: '75%' }}>
        {!isSenderCurrentUser && (
          <Tooltip title={message.remitente.name || message.remitente.email}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                mr: 1, 
                mb: 0.5, // Alinea con la base del Paper
                bgcolor: getUserAvatarColor(message.remitente.id)
              }}
            >
              {getInitials(message.remitente.name)}
            </Avatar>
          </Tooltip>
        )}
        <Paper
          elevation={2}
          sx={{
            p: 1.5,
            borderRadius: isSenderCurrentUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            backgroundColor: isSenderCurrentUser ? theme.palette.primary.main : theme.palette.background.paper,
            color: isSenderCurrentUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
            wordBreak: 'break-word',
          }}
        >
          {/* Nombre del remitente (si no es el usuario actual) */}
          {!isSenderCurrentUser && (
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              {message.remitente.name || message.remitente.email}
            </Typography>
          )}
          {/* Contenido del mensaje (HTML) */}
          <Box
            className="quill-chat-content" // Para estilos específicos si es necesario
            sx={{ 
              lineHeight: 1.5, 
              '& p': { my: 0, lineHeight: 'inherit' }, // Asegura que el p herede el line-height del Box
              '& strong': { fontWeight: 'bold' },
              '& em': { fontStyle: 'italic' },
              '& ul, & ol': { pl: 2.5, my: 0.5, lineHeight: 'inherit' },
              '& a': { color: isSenderCurrentUser ? theme.palette.common.white : theme.palette.primary.main },
              '& img': { maxWidth: '100%', height: 'auto', my: 0.5, borderRadius: 1 },
          }}
            dangerouslySetInnerHTML={{ __html: message.contenido }}
          />
          <Typography
            variant="caption"
            component="div" // Para evitar anidamiento p > div
            sx={{
              mt: 0.5,
              textAlign: 'right',
              fontSize: '0.65rem',
              opacity: 0.7,
              color: isSenderCurrentUser ? theme.palette.primary.contrastText : theme.palette.text.secondary,
            }}
          >
            {new Date(message.fechaEnvio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isSenderCurrentUser && (
           <Tooltip title={currentUser.name || currentUser.email}>
            <Avatar 
                sx={{ 
                    width: 32, 
                    height: 32, 
                    ml: 1, 
                    mb: 0.5, 
                    bgcolor: getUserAvatarColor(currentUser.id)
                }}
            >
                {getInitials(currentUser.name)}
            </Avatar>
           </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default ChatMessageItem;