// backend/src/controllers/tagController.ts

import { Request, Response, NextFunction } from 'express';
import * as tagService from '../services/tagService'; // Importa todo desde el servicio
import { CreateTagInput, UpdateTagInput } from '../schemas/tagSchemas'; // Importa los tipos validados

// Nota: Usamos '(req as any).validatedParams' y '(req as any).validatedBody'.
// Una alternativa más limpia sería definir un tipo extendido de Request
// que incluya estas propiedades añadidas por tu middleware de validación.

/**
 * Handler para obtener todas las etiquetas.
 */
export const getAllTagsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tags = await tagService.findAllTags();
        res.status(200).json({
            status: 'success',
            results: tags.length, // Opcional: número de resultados
            data: {
                tags,
            },
        });
    } catch (error) {
        next(error); // Pasa el error al manejador global
    }
};

/**
 * Handler para obtener una etiqueta por ID.
 */
export const getTagByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Asume que el middleware de validación puso el ID parseado en req.validatedParams
        const tagId = (req as any).validatedParams.id as number;

        const tag = await tagService.findTagById(tagId);
        // Si findTagById no encuentra, lanzará un NotFoundError que será capturado por el manejador global
        res.status(200).json({
            status: 'success',
            data: {
                tag,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para crear una nueva etiqueta.
 */
export const createTagHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Asume que el middleware puso el cuerpo validado en req.validatedBody
        const validatedData = (req as any).validatedBody as CreateTagInput;

        const newTag = await tagService.createTag(validatedData);
        // Si el nombre ya existe, createTag lanzará un BadRequestError
        res.status(201).json({ // Código 201: Created
            status: 'success',
            data: {
                tag: newTag,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para actualizar una etiqueta existente.
 */
export const updateTagHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tagId = (req as any).validatedParams.id as number;
        const validatedData = (req as any).validatedBody as UpdateTagInput;

        // Validar que el cuerpo no esté totalmente vacío si partial() lo permitiera
        if (Object.keys(validatedData).length === 0) {
             return res.status(400).json({ status: 'fail', message: 'Se requiere al menos un campo (nombre o color) para actualizar.' });
        }

        const updatedTag = await tagService.updateTag(tagId, validatedData);
        // updateTag maneja errores de NotFound y BadRequest (nombre duplicado)
        res.status(200).json({
            status: 'success',
            data: {
                tag: updatedTag,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para eliminar una etiqueta.
 */
export const deleteTagHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tagId = (req as any).validatedParams.id as number;

        await tagService.deleteTag(tagId);
        // deleteTag maneja errores de NotFound y BadRequest (etiqueta en uso)

        // Envía respuesta 204: No Content (éxito sin cuerpo de respuesta)
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};