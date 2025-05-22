// backend/src/server.ts
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http'; // <--- Usado para crear el servidor HTTP
import { Server as SocketIOServer, Socket } from 'socket.io'; // <--- Tipos de Socket.IO
import jwt from 'jsonwebtoken'; // <--- Para verificar JWT en sockets

import authRoutes from './api/authRoutes';
import projectRoutes from './api/projectRoutes';
import lookupRoutes from './api/lookupRoutes';
import adminRoutes from './api/adminRoutes'; // Asumo que esta es una ruta general de admin
import tagRoutes from './api/tagRoutes'; // Corregido: estas eran tus rutas específicas
import lookupAdminRoutes from './api/lookupAdminRoutes';
import adminUserRoutes from './api/adminUserRoutes';
import { NotFoundError, AppError } from './utils/errors'; // Asumo que handleErrors está en utils/errors también
import prisma from './config/prismaClient';

import { UserPayload } from './types/express'; // <--- ¡ASEGÚRATE DE TENER ESTE TIPO DEFINIDO Y EXPORTADO!

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const API_PREFIX = '/api';
// Asegúrate de que JWT_SECRET esté definido en tu .env o usa un valor por defecto SEGURO solo para desarrollo.
const JWT_SECRET = process.env.JWT_SECRET || '8172348712iadwhdiuawdAWDAWED1238791293awdawd'; 
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Usaremos esta variable

// --- Middlewares ---
app.use(cors({ 
    origin: FRONTEND_URL, // Usa la variable para consistencia
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
app.use(`${API_PREFIX}/projects`, projectRoutes); 
app.use(`${API_PREFIX}/lookups`, lookupRoutes); 
app.use(`${API_PREFIX}/admin/tags`, tagRoutes); 
app.use(`${API_PREFIX}/admin/lookups`, lookupAdminRoutes); 
app.use(`${API_PREFIX}/admin/users`, adminUserRoutes); 
// Si adminRoutes es una ruta general que agrupa otras, asegúrate que no haya conflictos
// con las rutas más específicas de arriba. Si es independiente, está bien.
app.use(`${API_PREFIX}/admin`, adminRoutes); 

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

    // TODO: Manejar errores específicos de Prisma (ej. P2002 para unique constraints, P2025 para record not found)

    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor.',
    });
};
app.use(globalErrorHandler);

// --- CONFIGURACIÓN DEL SERVIDOR HTTP Y SOCKET.IO ---
const httpServer = http.createServer(app); // Crea servidor HTTP desde la app Express

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: FRONTEND_URL, // Permite conexiones desde tu frontend
        methods: ["GET", "POST"] // Métodos permitidos para la conexión inicial de Socket.IO
    }
});

// Middleware de Autenticación para Socket.IO
io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined; // El cliente debería enviar el token aquí
    
    if (!token) {
        console.log('[Socket.IO Auth] Conexión rechazada: No se proporcionó token.');
        return next(new Error('Autenticación fallida: No hay token.'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload; // Usa tu tipo UserPayload
        // Adjuntamos la información del usuario al objeto socket para uso posterior
        // Definir 'user' en la interfaz Socket es una mejor práctica (ver comentario en respuesta anterior)
        (socket as any).user = decoded; 
        console.log(`[Socket.IO Auth] Usuario conectado y autenticado via Socket: ID ${decoded.id}, Rol ${decoded.role}`);
        next(); // Permite la conexión
    } catch (err) {
        let errorMessage = 'Autenticación fallida: Token inválido.';
        if (err instanceof Error) {
            errorMessage = `Autenticación fallida: ${err.message}`;
        }
        console.log('[Socket.IO Auth] Conexión rechazada:', errorMessage);
        next(new Error(errorMessage)); // Rechaza la conexión
    }
});

// Manejador de Conexiones de Socket.IO
io.on('connection', (socket: Socket) => {
    const connectedUser = (socket as any).user as UserPayload | undefined;

    if (connectedUser) {
        console.log(`[Socket.IO] Nuevo cliente conectado: ${socket.id}, Usuario ID: ${connectedUser.id}, Nombre: ${connectedUser.name || 'N/A'}`);

        // Evento de bienvenida (puedes quitarlo después, es para probar)
        socket.emit('welcome_message', `¡Bienvenido ${connectedUser.name || 'usuario'}! Estás conectado al servidor de notificaciones.`);

        // Ejemplo: Unir al usuario a una "sala" personal basada en su ID
        // Esto es útil para enviar notificaciones específicas a este usuario.
        socket.join(connectedUser.id.toString());
        console.log(`[Socket.IO] Usuario ID: ${connectedUser.id} unido a la sala personal: ${connectedUser.id.toString()}`);

        socket.on('disconnect', (reason) => {
            console.log(`[Socket.IO] Cliente desconectado: ${socket.id}, Usuario ID: ${connectedUser.id}. Razón: ${reason}`);
        });

        // Futuros listeners para eventos específicos de la bitácora irán aquí
        // ej. socket.on('join_task_room', (taskId) => { socket.join(`task-${taskId}`); });

    } else {
        // Esto no debería suceder si el middleware de autenticación funciona correctamente y siempre adjunta .user
        console.error('[Socket.IO] Conexión establecida pero falta información de usuario en el socket. Desconectando.');
        socket.disconnect(true);
    }
});
// --- FIN CONFIGURACIÓN SOCKET.IO ---


// --- Start Server & Graceful Shutdown ---
// Modificamos 'server' para que se refiera a httpServer
const httpServerInstance = httpServer.listen(PORT, '0.0.0.0', () => { // Renombrado para evitar conflicto con 'server' de express
    console.log(`🚀 Servidor HTTP y Socket.IO corriendo en el puerto ${PORT}`); 
});

const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']; // Tipado explícito para signals

const gracefulShutdown = (signal: NodeJS.Signals) => { // Tipado explícito para signal
  // process.on necesita que el tipo de signal sea NodeJS.Signals o string.
  // Usamos el tipo más específico NodeJS.Signals aquí.
  process.on(signal, async () => { 
    console.info(`\n${signal} signal received: closing HTTP server...`);
    // Usamos httpServerInstance para cerrar
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