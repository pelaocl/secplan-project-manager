// backend/src/server.ts
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './api/authRoutes';
import projectRoutes from './api/projectRoutes';
import taskRoutes from './api/taskRoutes';
import chatMessageRoutes from './api/chatMessageRoutes';
import lookupRoutes from './api/lookupRoutes';
import adminRoutes from './api/adminRoutes';
import tagRoutes from './api/tagRoutes';
import lookupAdminRoutes from './api/lookupAdminRoutes';
import adminUserRoutes from './api/adminUserRoutes';
import { NotFoundError, AppError } from './utils/errors';
import prisma from './config/prismaClient';

import { UserPayload } from './types/express';
import { initializeSocketManager } from './socketManager';
import notificationRoutes from './api/notificationRoutes';
import statsRoutes from './api/statsRoutes';
import { CategoriaNotificacion } from '@prisma/client';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0'; // El servidor Express escuchará en todas las interfaces
const API_PREFIX = '/api';
const JWT_SECRET = process.env.JWT_SECRET || '8172348712iadwhdiuawdAWDAWED1238791293awdawd';

// URL del frontend para CORS de API HTTP.
// Para desarrollo, si accedes desde la tablet via IP, esta URL también debería ser la IP.
// O puedes usar un array de orígenes permitidos aquí también.
const HTTP_CORS_ORIGIN = process.env.FRONTEND_URL || `http://localhost:5173`;


// --- Middlewares ---
app.use(cors({
    origin: function (origin, callback) {
        // Para CORS de HTTP, puedes ser más flexible en desarrollo o usar una lista blanca.
        // Esta configuración permite el FRONTEND_URL y también si el origen es undefined (ej. Postman sin origin)
        // Para pruebas con la tablet, necesitarás que HTTP_CORS_ORIGIN sea la IP o que permitas múltiples orígenes.
        // Por ahora, mantenemos la lógica original, pero considera ajustarla si las llamadas API fallan desde la tablet.
        const allowedHttpOrigins = [
            `http://localhost:5173`,
            `http://192.10.10.150:5173` // REEMPLAZA <TU_IP_LOCAL_DE_PC>
        ];
        if (process.env.FRONTEND_URL && !allowedHttpOrigins.includes(process.env.FRONTEND_URL)) {
            allowedHttpOrigins.push(process.env.FRONTEND_URL);
        }
        const uniqueAllowedHttpOrigins = [...new Set(allowedHttpOrigins)];

        if (!origin || uniqueAllowedHttpOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[HTTP CORS] Origen no permitido: ${origin}. Orígenes permitidos para HTTP: ${uniqueAllowedHttpOrigins.join(', ')}`);
            callback(new Error('Origen no permitido por CORS para API HTTP'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// --- API Routes ---
app.get('/', (req: Request, res: Response) => { res.send('SECPLAN Project Manager API'); });
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/lookups`, lookupRoutes);
app.use(`${API_PREFIX}/admin/tags`, tagRoutes);
app.use(`${API_PREFIX}/admin/lookups`, lookupAdminRoutes);
app.use(`${API_PREFIX}/admin/users`, adminUserRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/tasks`, chatMessageRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/stats`, statsRoutes);

// --- 404 Handler ---
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError('Ruta no encontrada'));
});

// --- Global Error Handler ---
const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('ERROR GLOBAL:', err.name, '-', err.message);
    if (process.env.NODE_ENV === 'development' && err.stack) {
        console.error(err.stack);
    }
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            details: err.details,
        });
        return;
    }
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor.',
    });
};
app.use(globalErrorHandler);

// --- CONFIGURACIÓN DEL SERVIDOR HTTP Y SOCKET.IO ---
const httpServer = http.createServer(app);

// Define las URLs de origen permitidas para Socket.IO
const frontendDevLocalhostUrlSocket = 'http://localhost:5173';
// ¡¡¡IMPORTANTE!!! Reemplaza <TU_IP_LOCAL_DE_PC> con la IP local real de tu PC.
const frontendDevNetworkUrlSocket = `http://192.10.10.150:5173`; // EJ: 'http://192.168.1.100:5173'

const allowedSocketOrigins = [
    frontendDevLocalhostUrlSocket,
];
if (frontendDevNetworkUrlSocket.includes('localhost') === false && frontendDevNetworkUrlSocket.startsWith('http://')) {
    allowedSocketOrigins.push(frontendDevNetworkUrlSocket);
}
if (process.env.FRONTEND_URL && !allowedSocketOrigins.includes(process.env.FRONTEND_URL)) {
    allowedSocketOrigins.push(process.env.FRONTEND_URL);
}
const uniqueAllowedSocketOrigins = [...new Set(allowedSocketOrigins)];

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: function (origin, callback) {
            if (!origin || uniqueAllowedSocketOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`[Socket.IO CORS] Origen no permitido: ${origin}. Orígenes permitidos para Socket.IO: ${uniqueAllowedSocketOrigins.join(', ')}`);
                callback(new Error('Origen no permitido por CORS para Socket.IO'));
            }
        },
        methods: ["GET", "POST"]
    }
});

initializeSocketManager(io);

// Middleware de Autenticación para Socket.IO
io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
        console.log('[Socket.IO Auth] Conexión rechazada: No se proporcionó token.');
        return next(new Error('Autenticación fallida: No hay token.'));
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        (socket as any).user = decoded;
        console.log(`[Socket.IO Auth] Usuario conectado y autenticado via Socket: ID ${decoded.id}, Rol ${decoded.role}`);
        next();
    } catch (err) {
        let errorMessage = 'Autenticación fallida: Token inválido.';
        if (err instanceof Error) {
            errorMessage = `Autenticación fallida: ${err.message}`;
        }
        console.log('[Socket.IO Auth] Conexión rechazada:', errorMessage);
        next(new Error(errorMessage));
    }
});

// Manejador de Conexiones de Socket.IO
io.on('connection', (socket: Socket) => {
    const connectedUser = (socket as any).user as UserPayload | undefined;
    if (connectedUser) {
        console.log(`[Socket.IO] Nuevo cliente conectado: ${socket.id}, Usuario ID: ${connectedUser.id}, Nombre: ${connectedUser.name || 'N/A'}`);
        socket.emit('welcome_message', `¡Bienvenido ${connectedUser.name || 'usuario'}! Estás conectado al servidor de notificaciones.`);
        socket.join(connectedUser.id.toString());
        console.log(`[Socket.IO] Usuario ID: ${connectedUser.id} unido a la sala personal: ${connectedUser.id.toString()}`);

        // --- Listener para pedir contadores iniciales ---
        socket.on('request_initial_counts', async () => {
            if (connectedUser) {
                console.log(`[Socket.IO] Usuario ${connectedUser.id} solicitó contadores iniciales.`);
                try {
                    const [systemCount, chatCount] = await Promise.all([
                        prisma.notificacion.count({
                            where: { usuarioId: connectedUser.id, leida: false, categoria: CategoriaNotificacion.SISTEMA }
                        }),
                        prisma.notificacion.count({
                            where: { usuarioId: connectedUser.id, leida: false, categoria: CategoriaNotificacion.CHAT }
                        })
                    ]);
                    // Se emite el evento solo a este socket que lo pidió
                    socket.emit('unread_count_updated', { systemCount, chatCount });
                } catch (error) {
                    console.error(`[Socket.IO] Error al obtener contadores iniciales para usuario ${connectedUser.id}:`, error);
                }
            }
        });
        // --- Fin: istener para pedir contadores iniciales ---

        socket.on('join_task_chat_room', (taskId: string | number) => {
            if (taskId && connectedUser) {
                const roomName = `task_chat_${taskId.toString()}`;
                socket.join(roomName);
                console.log(`[Socket.IO] Usuario ID: ${connectedUser.id} (Socket: ${socket.id}) se unió a la sala: ${roomName}`);
            }
        });
        socket.on('leave_task_chat_room', (taskId: string | number) => {
            if (taskId && connectedUser) {
                const roomName = `task_chat_${taskId.toString()}`;
                socket.leave(roomName);
                console.log(`[Socket.IO] Usuario ID: ${connectedUser.id} (Socket: ${socket.id}) dejó la sala: ${roomName}`);
            }
        });
        socket.on('disconnect', (reason) => {
            console.log(`[Socket.IO] Cliente desconectado: ${socket.id}, Usuario ID: ${connectedUser.id}. Razón: ${reason}`);
        });
    } else {
        console.error('[Socket.IO] Conexión establecida pero falta información de usuario en el socket. Desconectando.');
        socket.disconnect(true);
    }
});

// --- Start Server & Graceful Shutdown ---
const httpServerInstance = httpServer.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor HTTP y Socket.IO corriendo en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT} (accesible en la red local si HOST es 0.0.0.0 y tu IP es conocida)`);
});

const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
const gracefulShutdown = (signal: NodeJS.Signals) => {
    process.on(signal, async () => {
        console.info(`\n${signal} signal received: closing HTTP server...`);
        httpServerInstance.close(async () => {
            console.info('HTTP server closed.');
            try {
                await prisma.$disconnect();
                console.info('Prisma connection closed.');
            } catch (e) {
                console.error('Error closing Prisma connection:', e);
            }
            process.exit(0);
        });
    });
};
signals.forEach(gracefulShutdown);