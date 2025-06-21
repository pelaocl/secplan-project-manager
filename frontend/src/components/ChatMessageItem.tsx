import React from 'react';
import { Box, Paper, Typography, Avatar, Tooltip, useTheme, IconButton, Chip } from '@mui/material';
import { ChatMessage, ParentChatMessage } from '../types';
import { useCurrentUser } from '../store/authStore';
import { getUserAvatarColor } from '../utils/colorUtils';
import ReplyIcon from '@mui/icons-material/Reply';
import parse from 'html-react-parser';

// --- Props (sin cambios) ---
interface ChatMessageItemProps {
  message: ChatMessage;
  onReply: (message: ChatMessage) => void;
}

// --- Componente QuotedMessage (sin cambios) ---
const QuotedMessage: React.FC<{ parentMessage: ParentChatMessage }> = ({ parentMessage }) => {
  const theme = useTheme();
  const truncateContent = (html: string) => {
    const text = html.replace(/<[^>]+>/g, '');
    return text.length > 70 ? `${text.substring(0, 70)}...` : text;
  };

  return (
    <Box
      sx={{
        pl: 1,
        mb: 0.5,
        borderLeft: `3px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.primary.light}`,
        opacity: 0.8,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        {parentMessage.remitente.name || 'Usuario'}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {truncateContent(parentMessage.contenido)}
      </Typography>
    </Box>
  );
};

// --- Helper para Menciones (sin cambios) ---
const renderMessageWithMentions = (content: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(user:(\d+)\)/g;
    return parse(content, {
      replace: (domNode) => {
        if (domNode.type === 'text') {
            const text = domNode.data;
            const parts: (string | JSX.Element)[] = [];
            let lastIndex = 0;
            let match;
            while ((match = mentionRegex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(text.substring(lastIndex, match.index));
                }
                const userName = match[1];
                parts.push(<Chip key={match.index} label={`@${userName}`} size="small" color="secondary" sx={{ mx: 0.2, height: 'auto' }} />);
                lastIndex = mentionRegex.lastIndex;
            }
            if (lastIndex < text.length) {
                parts.push(text.substring(lastIndex));
            }
            return <>{parts}</>;
        }
      },
    });
};


const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onReply }) => {
  const theme = useTheme();
  const currentUser = useCurrentUser();
  const isSenderCurrentUser = currentUser ? message.remitente.id === currentUser.id : false;

  const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // --- INICIO DE MODIFICACIÓN: Reestructuración completa del return con Flexbox ---
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isSenderCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        // Al pasar el mouse sobre toda la fila, se muestra el botón de respuesta
        '&:hover .reply-button': {
          opacity: 1,
        },
      }}
    >
      {/* Contenedor Flex para alinear los elementos del mensaje (avatar, bocadillo, botón) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '85%' }}>
        
        {/* --- LÓGICA PARA MENSAJES DE OTROS (alineados a la izquierda) --- */}
        {!isSenderCurrentUser && (
          <>
            {/* 1. Avatar (a la izquierda) */}
            <Tooltip title={message.remitente.name || message.remitente.email}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: getUserAvatarColor(message.remitente.id), alignSelf: 'flex-end' }}>
                {getInitials(message.remitente.name)}
              </Avatar>
            </Tooltip>

            {/* 2. Bocadillo del Mensaje */}
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                borderRadius: '16px 16px 16px 4px',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                wordBreak: 'break-word',
              }}
            >
              {message.mensajePadre && <QuotedMessage parentMessage={message.mensajePadre} />}
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                {message.remitente.name || message.remitente.email}
              </Typography>
              <Box
                className="chat-content"
                sx={{ 
                  lineHeight: 1.4,
                  '& p, & ul, & ol': { m: 0, p: 0, lineHeight: 'inherit' },
                  '& a': { color: theme.palette.primary.main },
                }}
              >
                {renderMessageWithMentions(message.contenido)}
              </Box>
              <Typography variant="caption" component="div" sx={{ mt: 0.5, textAlign: 'right', fontSize: '0.65rem', opacity: 0.7 }}>
                {new Date(message.fechaEnvio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>
            
            {/* 3. Botón de Respuesta (a la derecha) */}
            <Tooltip title="Responder">
              <IconButton
                className="reply-button"
                size="small"
                onClick={() => onReply(message)}
                sx={{ opacity: 0, transition: 'opacity 0.2s', backgroundColor: theme.palette.action.selected, // Color de fondo en estado normal
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover, // Color de fondo al pasar el mouse
                  }, }}
              >
                <ReplyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* --- LÓGICA PARA TUS MENSAJES (alineados a la derecha) --- */}
        {isSenderCurrentUser && (
          <>
            {/* 1. Botón de Respuesta (a la izquierda) */}
            <Tooltip title="Responder">
              <IconButton
                className="reply-button"
                size="small"
                onClick={() => onReply(message)}
                sx={{ opacity: 0, transition: 'opacity 0.2s', backgroundColor: theme.palette.action.selected, // Color de fondo en estado normal
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover, // Color de fondo al pasar el mouse
                  }, }}
              >
                <ReplyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>

            {/* 2. Bocadillo del Mensaje */}
            <Paper
              elevation={2}
              sx={{
                p: 1.5,
                borderRadius: '16px 16px 4px 16px',
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                wordBreak: 'break-word',
              }}
            >
              {message.mensajePadre && <QuotedMessage parentMessage={message.mensajePadre} />}
              <Box
                className="chat-content"
                sx={{ 
                  lineHeight: 1.4,
                  '& p, & ul, & ol': { m: 0, p: 0, lineHeight: 'inherit' },
                  '& a': { color: theme.palette.common.white, textDecoration: 'underline' },
                }}
              >
                {renderMessageWithMentions(message.contenido)}
              </Box>
              <Typography variant="caption" component="div" sx={{ mt: 0.5, textAlign: 'right', fontSize: '0.65rem', opacity: 0.8 }}>
                {new Date(message.fechaEnvio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>

            {/* 3. Avatar (a la derecha) */}
            <Tooltip title={currentUser?.name || currentUser?.email}>
               <Avatar sx={{ width: 32, height: 32, bgcolor: getUserAvatarColor(currentUser?.id || 0), alignSelf: 'flex-end' }}>
                 {getInitials(currentUser?.name)}
               </Avatar>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
  // --- FIN DE MODIFICACIÓN ---
};

export default ChatMessageItem;
