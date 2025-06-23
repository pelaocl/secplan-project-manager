// frontend/src/services/socketService.ts:
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
// La URL base de tu backend donde está corriendo Socket.IO
// Asegúrate que esta URL sea correcta y accesible desde tu frontend.
// Si VITE_API_BASE_URL es 'http://localhost:5000/api', entonces SOCKET_SERVER_URL sería 'http://localhost:5000'
// O puedes definir una nueva variable de entorno VITE_SOCKET_URL=http://localhost:5000
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'; // Ajusta el puerto si es diferente al de tu backend

let socket: Socket | null = null;

const connect = (token: string): void => {
    if (socket && socket.connected) {
        console.log('[SocketService] Ya conectado.');
        return;
    }

    if (socket) {
        socket.disconnect();
    }

    console.log(`[SocketService] Intentando conectar a ${SOCKET_SERVER_URL} con token...`);

    socket = io(SOCKET_SERVER_URL, {
        auth: {
            token: token
        },
    });

    socket.on('connect', () => {
        console.log('[SocketService] Conectado al servidor Socket.IO con ID:', socket?.id);
        console.log('[SocketService] Conexión exitosa, pidiendo contadores iniciales...');
        socket?.emit('request_initial_counts');
    });

    socket.on('disconnect', (reason: Socket.DisconnectReason) => {
        console.log('[SocketService] Desconectado del servidor Socket.IO. Razón:', reason);
    });

    socket.on('connect_error', (err: Error) => {
        console.error('[SocketService] Error de conexión Socket.IO:', err.message);
    });

    socket.on('welcome_message', (message: string) => {
        console.log('[SocketService] Mensaje de bienvenida recibido:', message);
    });

    // --- INICIO DE MODIFICACIÓN: Listener para los contadores de notificaciones ---
    socket.on('unread_count_updated', (counts: { systemCount: number; chatCount: number }) => {
        console.log('[SocketService] unread_count_updated recibido:', counts);
        // Llamar a la acción del store para actualizar el estado global
        useAuthStore.getState().actions.setUnreadCounts(counts);
    });
    // --- FIN DE MODIFICACIÓN ---
};

const disconnect = (): void => {
    if (socket) {
        console.log('[SocketService] Desconectando del servidor Socket.IO...');
        socket.disconnect();
        socket = null; // Limpia la instancia del socket
    }
};

// Función para registrar listeners de eventos específicos desde tus componentes/stores
const on = (eventName: string, callback: (...args: any[]) => void) => {
    if (socket) {
        socket.on(eventName, callback);
    } else {
        console.warn(`[SocketService] Intento de registrar listener '${eventName}' sin socket conectado.`);
    }
};

// Función para emitir eventos al servidor
const emit = (eventName: string, data: any) => {
    if (socket && socket.connected) {
        socket.emit(eventName, data);
    } else {
        console.warn(`[SocketService] Intento de emitir evento '${eventName}' sin socket conectado o activo.`);
    }
};

// Función para obtener la instancia del socket si es necesario (usar con cuidado)
const getSocket = (): Socket | null => socket;


export const socketService = {
    connect,
    disconnect,
    on,
    emit,
    getSocket, // Exporta para acceso directo si es estrictamente necesario
};