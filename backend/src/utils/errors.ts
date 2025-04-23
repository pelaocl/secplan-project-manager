// Clase base para errores operacionales manejados
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;
    public readonly details?: any; // Campo opcional para detalles adicionales (ej. errores de validación)

    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Indica que es un error esperado/manejado
        this.details = details;

        // Mantiene el stack trace adecuado (importante para V8/Node.js)
        // Puede requerir @types/node
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            // Fallback si captureStackTrace no está disponible
             this.stack = (new Error(message)).stack;
        }


        // Asegura que el nombre de la clase sea el nombre del error
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// Errores específicos que heredan de AppError

export class BadRequestError extends AppError {
    constructor(message = 'Solicitud incorrecta', details?: any) {
        super(message, 400, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'No autorizado / Autenticación requerida') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Acceso prohibido / Permisos insuficientes') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
    }
}

// Puedes añadir más según necesites (e.g., ConflictError - 409)