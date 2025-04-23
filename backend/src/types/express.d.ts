import { Request } from 'express';
import { Role } from '@prisma/client';

// Define la estructura del payload que añadiremos a req.user
interface UserPayload {
    id: number;
    role: Role;
    email: string;
    name?: string;
}

// Usa la declaración global para extender el espacio de nombres de Express
declare global {
    namespace Express {
        // Extiende la interfaz Request original
        export interface Request {
            user?: UserPayload; // Define req.user como opcional
            // Campos para almacenar datos validados por Zod
            validatedBody?: any; // Puedes usar tipos más específicos si lo prefieres
            validatedQuery?: any;
            validatedParams?: any;
        }
    }
}

// Exporta el tipo extendido para poder importarlo explícitamente donde se necesite
export interface AuthenticatedRequest extends Request {
    user?: UserPayload;
    // Incluye también los campos validados aquí para coherencia
    validatedBody?: any;
    validatedQuery?: any;
    validatedParams?: any;
}

// Añade un export vacío para asegurar que TypeScript trate este archivo como un módulo
export {};