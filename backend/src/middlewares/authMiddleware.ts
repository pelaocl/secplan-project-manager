// backend/src/middlewares/authMiddleware.ts

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserPayload } from '../types/express'; // Asegúrate que UserPayload esté importado
import { UnauthorizedError, AppError } from '../utils/errors'; // AppError añadido si es que se usa en este archivo
import prisma from '../config/prismaClient';

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // Permite continuar sin usuario para rutas potencialmente públicas.
        // El middleware authorizeRole (si lo tienes) se encargará de bloquear si se requiere rol.
        return next();
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("FATAL ERROR: JWT_SECRET no está configurado en .env");
            // Es mejor lanzar un error que el manejador global pueda atrapar de forma consistente.
            throw new AppError('Error de configuración del servidor.', 500); // O un Error genérico
        }

        // --- MODIFICACIÓN AQUÍ ---
        // Usa el tipo UserPayload para el objeto decodificado.
        // UserPayload debe coincidir con lo que authService.ts pone en el token.
        const decoded = jwt.verify(token, jwtSecret) as UserPayload; 

        // Verifica si el usuario aún existe y está activo en la BD
        // --- MODIFICACIÓN AQUÍ ---
        // Usa decoded.id en lugar de decoded.userId
        const userFromDb = await prisma.user.findUnique({
            where: { id: decoded.id }, // <--- USA decoded.id
            // Selecciona los campos que conformarán req.user
            // Estos deben coincidir con lo que esperas en UserPayload y lo que es útil para req.user
            select: { 
                id: true, 
                role: true, 
                isActive: true, 
                email: true, // Añadido para consistencia con UserPayload
                name: true   // Añadido para consistencia con UserPayload
            } 
        });

        if (!userFromDb || !userFromDb.isActive) {
            throw new UnauthorizedError('Usuario no encontrado o inactivo.');
        }

        // Adjunta la información validada del usuario al objeto request.
        // La estructura de req.user debe ser consistente con tu tipo UserPayload.
        req.user = {
            id: userFromDb.id,
            role: userFromDb.role,
            email: userFromDb.email, // Proviene de userFromDb.email
            name: userFromDb.name,   // Proviene de userFromDb.name
            // No necesitas añadir iat o exp aquí; esos son para la validación del token.
        };
        // --- FIN MODIFICACIONES PRINCIPALES ---

        next(); // Pasa al siguiente middleware/controlador

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return next(new UnauthorizedError('Token inválido o expirado. Por favor, inicie sesión de nuevo.'));
        }
        // Si es un AppError lanzado por nosotros (ej. config server o usuario no encontrado/inactivo)
        if (error instanceof AppError) {
            return next(error);
        }
        // Otros errores inesperados
        next(new AppError('Error de autenticación inesperado.', 500, error)); // Envuelve errores desconocidos
    }
};