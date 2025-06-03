// frontend/src/services/socketService.ts:
import { io, Socket } from 'socket.io-client';

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

    // Desconectar si ya existe una instancia pero no está conectada, para evitar múltiples instancias sin limpiar.
    if (socket) {
        socket.disconnect();
    }

    console.log(`[SocketService] Intentando conectar a ${SOCKET_SERVER_URL} con token...`);

    socket = io(SOCKET_SERVER_URL, {
        auth: { // Aquí enviamos el token para la autenticación del middleware en el backend
            token: token
        },
        // Opciones adicionales si las necesitas:
        // transports: ['websocket'], // Forzar websocket si hay problemas con long-polling
        // reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
        console.log('[SocketService] Conectado al servidor Socket.IO con ID:', socket?.id);
        // Escuchar el evento de bienvenida (para probar)
        socket?.emit('test_event_from_client', { message: 'Hola desde el cliente!' }); // Opcional, para probar emisión
    });

    socket.on('disconnect', (reason: Socket.DisconnectReason) => {
        console.log('[SocketService] Desconectado del servidor Socket.IO. Razón:', reason);
        if (reason === 'io server disconnect') {
            // El servidor desconectó el socket intencionalmente (ej. auth fallida)
            // Podrías querer limpiar el token local si la desconexión es por auth inválida.
            // import { useAuthStore } from '../store/authStore'; // Cuidado con imports circulares si se usa en authStore
            // useAuthStore.getState().logout(); // Ejemplo, pero manejar con cuidado
        }
        // No intentar reconectar automáticamente aquí si la desconexión fue por el servidor (auth)
        // Socket.IO tiene su propia lógica de reconexión que puedes configurar.
    });

    socket.on('connect_error', (err: Error) => {
        console.error('[SocketService] Error de conexión Socket.IO:', err.message);
        // Aquí podrías manejar errores específicos, ej. si err.message indica auth fallida
        // err.data podría contener más info del error del middleware del backend.
    });

    // --- LISTENER DE PRUEBA PARA 'welcome_message' ---
    socket.on('welcome_message', (message: string) => {
        console.log('[SocketService] Mensaje de bienvenida recibido:', message);
        // Aquí podrías mostrar una notificación o actualizar algún estado si quisieras
    });

    // Aquí puedes registrar otros listeners globales si es necesario
    // Por ejemplo, para notificaciones genéricas:
    // socket.on('new_notification', (notificationData) => {
    //   console.log('[SocketService] Nueva notificación recibida:', notificationData);
    //   // Aquí llamarías a una acción de tu store de notificaciones
    // });

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