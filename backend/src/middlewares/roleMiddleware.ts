import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client'; // Importa el Enum Role de Prisma
import { AuthenticatedRequest } from '../types/express'; // Importa el tipo extendido
import { ForbiddenError, UnauthorizedError } from '../utils/errors'; // Importa errores

// Función que genera el middleware de autorización por rol
export const authorizeRole = (allowedRoles: Role[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // Primero, verifica si el usuario fue autenticado y adjuntado por authenticateToken
        if (!req.user) {
            // Si authenticateToken llamó a next() sin error pero sin user, significa
            // que no había token (ruta pública) pero se está intentando acceder
            // a un recurso que requiere un rol específico.
            return next(new UnauthorizedError('Autenticación requerida para acceder a este recurso.'));
        }

        // Verifica si el rol del usuario está en la lista de roles permitidos
        if (!allowedRoles.includes(req.user.role)) {
            // El usuario está autenticado pero no tiene el rol necesario
            return next(new ForbiddenError(`Acceso denegado. Rol requerido: ${allowedRoles.join(' o ')}.`));
        }

        // El usuario tiene el rol requerido, permite continuar
        next();
    };
};