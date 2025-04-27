// backend/src/controllers/lookupAdminController.ts

import { Request, Response, NextFunction } from 'express';
import * as lookupAdminService from '../services/lookupAdminService'; // Importa el servicio genérico
import { validLookupTypes } from '../schemas/lookupAdminSchemas'; // Importa la lista/enum de tipos válidos
import { z } from 'zod'; // Para inferir el tipo LookupType

// Infiere el tipo específico para lookupType desde el schema Zod
type LookupType = z.infer<typeof validLookupTypes>;

// Helper para obtener datos validados (asume que el middleware los adjunta)
const getValidatedData = (req: Request) => {
    // Usamos 'as any' por simplicidad, idealmente definirías un tipo ValidatedRequest
    const params = (req as any).validatedParams || req.params;
    const body = (req as any).validatedBody || req.body;
    return { params, body };
};

/**
 * Handler para obtener TODOS los registros de un tipo de lookup específico.
 * El tipo viene en req.params.lookupType
 */
export const getAllLookupHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { params } = getValidatedData(req);
        // El tipo ya fue validado por el schema en la ruta (lookupTypeParamSchema)
        const lookupType = params.lookupType as LookupType;

        const records = await lookupAdminService.findAll(lookupType);

        // Devolvemos la respuesta con una clave dinámica basada en el tipo
        // ej: { status: 'success', data: { estados: [...] } }
        res.status(200).json({
            status: 'success',
            results: records.length,
            data: {
                [lookupType]: records,
            },
        });
    } catch (error) {
        next(error); // Pasa al manejador de errores global
    }
};

/**
 * Handler para obtener UN registro por ID de un tipo de lookup específico.
 * El tipo y el ID vienen en req.params
 */
export const getLookupByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { params } = getValidatedData(req);
        const lookupType = params.lookupType as LookupType;
        const id = params.id as number; // El schema ya lo parseó a número

        const record = await lookupAdminService.findById(lookupType, id);
        // findById lanza NotFoundError si no existe

        // Devolvemos el registro con clave singular, ej: { data: { estado: {...} } }
        // Quitamos la 's' final del tipo para la clave (simple heurística)
        const singularKey = lookupType.endsWith('s') ? lookupType.slice(0, -1) : lookupType;

        res.status(200).json({
            status: 'success',
            data: {
                [singularKey]: record,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para CREAR un registro para un tipo de lookup específico.
 * El tipo viene en req.params, los datos vienen en req.body.
 */
export const createLookupHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { params, body } = getValidatedData(req);
        const lookupType = params.lookupType as LookupType;
        // El body ya fue validado por el schema correspondiente en la ruta
        const validatedData = body as Record<string, any>; // El tipo exacto depende del lookupType

        const newRecord = await lookupAdminService.create(lookupType, validatedData);
        // create maneja errores de unicidad

        const singularKey = lookupType.endsWith('s') ? lookupType.slice(0, -1) : lookupType;
        res.status(201).json({ // 201 Created
            status: 'success',
            data: {
                [singularKey]: newRecord,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para ACTUALIZAR un registro por ID para un tipo de lookup específico.
 * El tipo y el ID vienen en req.params, los datos vienen en req.body.
 */
export const updateLookupHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { params, body } = getValidatedData(req);
        const lookupType = params.lookupType as LookupType;
        const id = params.id as number;
        const validatedData = body as Record<string, any>;

        // Evita enviar un cuerpo vacío
        if (Object.keys(validatedData).length === 0) {
            return res.status(400).json({ status: 'fail', message: 'Se requiere al menos un campo para actualizar.' });
        }

        const updatedRecord = await lookupAdminService.update(lookupType, id, validatedData);
        // update maneja errores NotFound y de unicidad

        const singularKey = lookupType.endsWith('s') ? lookupType.slice(0, -1) : lookupType;
        res.status(200).json({
            status: 'success',
            data: {
                [singularKey]: updatedRecord,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para ELIMINAR un registro por ID para un tipo de lookup específico.
 * El tipo y el ID vienen en req.params.
 */
export const deleteLookupHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { params } = getValidatedData(req);
        const lookupType = params.lookupType as LookupType;
        const id = params.id as number;

        await lookupAdminService.deleteRecord(lookupType, id);
        // deleteRecord maneja errores NotFound y BadRequest (si está en uso)

        res.status(204).send(); // 204 No Content
    } catch (error) {
        next(error);
    }
};