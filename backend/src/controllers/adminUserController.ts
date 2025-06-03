// backend/src/controllers/adminUserController.ts

import { Request, Response, NextFunction } from 'express';
import * as adminUserService from '../services/adminUserService'; // Importa el servicio de usuarios
import { CreateUserInput, UpdateUserInput } from '../schemas/adminUserSchemas'; // Importa tipos Zod

// Helper para obtener datos validados (asumiendo middleware)
const getValidatedData = (req: Request) => {
    const params = (req as any).validatedParams || req.params;
    const body = (req as any).validatedBody || req.body;
    return { params, body };
};

/**
 * Handler para ADMIN: Obtener todos los usuarios.
 */
export const getAllUsersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Podríamos añadir lógica para query params (paginación, filtro) aquí si fuera necesario
        const users = await adminUserService.findAllUsers();
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users, // El servicio ya excluye contraseñas y selecciona etiquetas
            },
        });
    } catch (error) {
        next(error); // Delega al manejador global
    }
};

/**
 * Handler para ADMIN: Obtener un usuario por ID.
 */
export const getUserByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { params } = getValidatedData(req);
        const userId = params.id as number; // Validado y parseado por middleware

        const user = await adminUserService.findUserById(userId);
        // El servicio lanza NotFoundError si no existe
        res.status(200).json({
            status: 'success',
            data: {
                user, // El servicio ya excluye contraseña y selecciona etiquetas
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handler para ADMIN: Crear un nuevo usuario.
 */
export const createUserHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { body } = getValidatedData(req);
        const validatedData = body as CreateUserInput; // Body validado por middleware

        const newUser = await adminUserService.createUser(validatedData);
        // El servicio maneja hash de contraseña, chequeo de email, asignación de etiquetas
        res.status(201).json({ // 201 Created
            status: 'success',
            data: {
                user: newUser, // Sin contraseña
            },
        });
    } catch (error) {
        next(error); // Captura BadRequestError (email duplicado) u otros
    }
};

/**
 * Handler para ADMIN: Actualizar un usuario existente.
 */
export const updateUserHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { params, body } = getValidatedData(req);
        const userId = params.id as number;
        const validatedData = body as UpdateUserInput; // Body validado (campos opcionales)

        // Evita llamadas con cuerpo vacío
        if (Object.keys(validatedData).length === 0) {
            res.status(400).json({ status: 'fail', message: 'Se requiere al menos un campo para actualizar.' });
            return;
        }

        const updatedUser = await adminUserService.updateUser(userId, validatedData);
        // Servicio maneja NotFound, conflictos de email, hash de contraseña opcional, sync de etiquetas
        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser, // Sin contraseña
            },
        });
    } catch (error) {
        next(error); // Captura NotFoundError, BadRequestError (email duplicado, etiqueta no existe) u otros
    }
};

/**
 * Handler para ADMIN: Eliminar un usuario.
 */
export const deleteUserHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { params } = getValidatedData(req);
        const userId = params.id as number;

        await adminUserService.deleteUser(userId);
        // Servicio maneja NotFound y chequeo de dependencias (proyectos/tareas)

        res.status(204).send(); // 204 No Content
    } catch (error) {
        next(error); // Captura NotFoundError, BadRequestError (dependencias) u otros
    }
};