import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './api/authRoutes';
import projectRoutes from './api/projectRoutes';
import lookupRoutes from './api/lookupRoutes';
import adminRoutes from './api/adminRoutes';
import tagRoutes from './api/tagRoutes';
import { NotFoundError, AppError } from './utils/errors';
import prisma from './config/prismaClient';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const API_PREFIX = '/api';

// --- Middlewares ---
// ... (cors, helmet, json, urlencoded, morgan - sin cambios)
app.use(cors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], })); app.use(helmet()); app.use(express.json()); app.use(express.urlencoded({ extended: true })); app.use(morgan('dev'));

// --- API Routes ---
// ... (/, auth, projects, lookups, admin - sin cambios)
app.get('/', (req: Request, res: Response) => { res.send('SECPLAN Project Manager API'); }); app.use(`${API_PREFIX}/auth`, authRoutes); app.use(`${API_PREFIX}/projects`, projectRoutes); app.use(`${API_PREFIX}/lookups`, lookupRoutes); app.use(`${API_PREFIX}/admin`, adminRoutes); app.use(`${API_PREFIX}/admin/tags`, tagRoutes);

// --- 404 Handler ---
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError('Ruta no encontrada'));
});

// --- Global Error Handler ---
// CORREGIDO: Asegura que la firma y el cuerpo se ajusten a ErrorRequestHandler
const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('ERROR:', err.name, '-', err.message);
    if (process.env.NODE_ENV === 'development' && err.stack) {
         console.error(err.stack);
    }

    if (err instanceof AppError) {
        // Envía la respuesta y termina
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            details: err.details,
        });
        return; // Importante: termina la ejecución aquí
    }

    // TODO: Manejar errores específicos de Prisma

    // Error genérico del servidor
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor.',
    });
    // No llames a next() aquí para errores 500, la respuesta ya se envió
};
app.use(globalErrorHandler);

// --- Start Server & Graceful Shutdown ---
// ... (sin cambios)
const server = app.listen(PORT, '0.0.0.0', () => { console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`); }); const signals = ['SIGTERM', 'SIGINT']; const gracefulShutdown = (signal: string) => { process.on(signal, async () => { console.info(`\n${signal} signal received: closing HTTP server...`); server.close(async () => { console.info('HTTP server closed.'); try { await prisma.$disconnect(); console.info('Prisma connection closed.'); } catch (e) { console.error('Error closing Prisma connection:', e); } process.exit(0); }); }); }; signals.forEach(gracefulShutdown);