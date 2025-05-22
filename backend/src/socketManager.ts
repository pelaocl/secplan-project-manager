// backend/src/socketManager.ts
import { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const initializeSocketManager = (io: SocketIOServer): void => {
    if (ioInstance) {
        console.warn("[SocketManager] Socket.IO server instance ya está inicializada.");
        return;
    }
    ioInstance = io;
    console.log("[SocketManager] Socket.IO server instance inicializada y lista para usarse en servicios.");
};

export const getIoInstance = (): SocketIOServer => {
    if (!ioInstance) {
        throw new Error("[SocketManager] Socket.IO server instance no ha sido inicializada. Llama a initializeSocketManager primero.");
    }
    return ioInstance;
};

// Funciones helper (ejemplos, puedes expandirlas)
export const emitToUser = (userId: string | number, eventName: string, data: any): void => {
    const io = getIoInstance();
    // Los usuarios se unieron a una sala con su ID como nombre
    io.to(userId.toString()).emit(eventName, data); 
    console.log(`[SocketManager] Emitiendo evento '${eventName}' al usuario ID ${userId}`);
};

export const emitToRoom = (roomName: string, eventName: string, data: any): void => {
    const io = getIoInstance();
    io.to(roomName).emit(eventName, data);
    console.log(`[SocketManager] Emitiendo evento '${eventName}' a la sala ${roomName}`);
};