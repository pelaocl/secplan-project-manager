import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/express'; // Importa el tipo extendido
import { UnauthorizedError } from '../utils/errors'; // Importa el error específico
import prisma from '../config/prismaClient'; // Importa la instancia de Prisma

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // Permite continuar sin usuario para rutas potencialmente públicas.
        // El middleware authorizeRole se encargará de bloquear si se requiere rol.
        return next();
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("FATAL ERROR: JWT_SECRET no está configurado en .env");
            // No expongas este error directamente al cliente en producción
            return next(new Error('Error de configuración del servidor.'));
        }

        const decoded = jwt.verify(token, jwtSecret) as { userId: number; role: string; iat: number; exp: number };

        // Verifica si el usuario aún existe y está activo en la BD
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, isActive: true, email: true, name: true } // Selecciona los campos que necesites en req.user
        });

        if (!user || !user.isActive) {
            // Aunque el token sea válido, el usuario ya no existe o fue desactivado
            throw new UnauthorizedError('Usuario no encontrado o inactivo.');
        }

        // Adjunta la información validada del usuario al objeto request
        // Asegúrate que los campos coincidan con la interfaz UserPayload en express.d.ts
        req.user = { id: user.id, role: user.role, email: user.email, name: user.name ?? undefined };

        next(); // Pasa al siguiente middleware/controlador

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            // Token inválido, malformado o expirado
            return next(new UnauthorizedError('Token inválido o expirado. Por favor, inicie sesión de nuevo.'));
        }
         // Pasa otros errores (como usuario no encontrado) al manejador global
        next(error);
    }
};