import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';
import { AuthenticatedRequest } from '../types/express'; // Importa el tipo extendido si lo usas aquí

interface ValidationSchemas {
    body?: AnyZodObject;
    query?: AnyZodObject;
    params?: AnyZodObject;
}

// Usa AuthenticatedRequest para tener acceso a los campos extendidos
export const validateRequest = (schemas: ValidationSchemas) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (schemas.params) {
                // Valida y guarda en req.validatedParams
                req.validatedParams = await schemas.params.parseAsync(req.params);
            }
            if (schemas.body) {
                // Valida y guarda en req.validatedBody
                req.validatedBody = await schemas.body.parseAsync(req.body);
            }
            if (schemas.query) {
                // Valida y guarda en req.validatedQuery
                req.validatedQuery = await schemas.query.parseAsync(req.query);
            }
            next(); // Pasa al siguiente middleware/handler si la validación es exitosa
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                const validationError = new BadRequestError(
                    'Error de validación de datos',
                    formattedErrors
                );
                next(validationError); // Pasa el error formateado al manejador global
            } else {
                 next(error); // Pasa otros errores
            }
        }
    };
};