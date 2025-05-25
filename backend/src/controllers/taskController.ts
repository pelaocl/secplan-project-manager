// backend/src/controllers/taskController.ts
import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/taskService';
import { CreateTaskInput } from '../schemas/taskSchemas';
import { AuthenticatedRequest, UserPayload } from '../types/express';

export const createTaskHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.projectId, 10);
        const data = req.validatedBody as CreateTaskInput;
        const creatorPayload = req.user as UserPayload; // req.user ES UserPayload

        if (!creatorPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        
        const newTask = await taskService.createTask(projectId, data, creatorPayload); // Ahora coincide el tipo
        res.status(201).json(newTask);
    } catch (error) {
        next(error);
    }
};

export const getTasksByProjectHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.projectId, 10);
        const requestingUserPayload = req.user as UserPayload; // req.user ES UserPayload

        if (!requestingUserPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        
        const tasks = await taskService.getTasksByProjectId(projectId, requestingUserPayload); // Ahora coincide el tipo
        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
};

export const getTaskByIdHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.projectId, 10); // projectId de la URL
        const taskId = parseInt(req.params.taskId, 10);    // taskId de la URL
        const requestingUserPayload = req.user as UserPayload;

        if (!requestingUserPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        if (isNaN(projectId) || isNaN(taskId)) {
            return res.status(400).json({ message: "IDs de proyecto o tarea inválidos." });
        }

        const task = await taskService.getTaskById(projectId, taskId, requestingUserPayload);
        if (!task) { 
            // El servicio ya lanza NotFoundError, pero por si acaso.
            return res.status(404).json({ message: "Tarea no encontrada." });
        }
        res.status(200).json(task);
    } catch (error) {
        next(error);
    }
};

export const updateTaskHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.projectId, 10);
        const taskId = parseInt(req.params.taskId, 10);
        const data = req.validatedBody as UpdateTaskInput; // Asume validación de body
        const requestingUserPayload = req.user as UserPayload;

        if (!requestingUserPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        if (isNaN(projectId) || isNaN(taskId)) {
            return res.status(400).json({ message: "IDs de proyecto o tarea inválidos." });
        }
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: "No se proporcionaron datos para actualizar." });
        }

        const updatedTask = await taskService.updateTask(projectId, taskId, data, requestingUserPayload);
        res.status(200).json(updatedTask);
    } catch (error) {
        next(error);
    }
};

export const deleteTaskHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const projectId = parseInt(req.params.projectId, 10);
        const taskId = parseInt(req.params.taskId, 10);
        const requestingUserPayload = req.user as UserPayload;

        if (!requestingUserPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        if (isNaN(projectId) || isNaN(taskId)) {
            return res.status(400).json({ message: "IDs de proyecto o tarea inválidos." });
        }

        const result = await taskService.deleteTask(projectId, taskId, requestingUserPayload);
        res.status(200).json(result); // O puedes enviar un 204 No Content si prefieres no devolver cuerpo
    } catch (error) {
        next(error);
    }
};

export const markTaskChatAsViewedHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const taskId = parseInt(req.params.taskId, 10); // taskId viene del parámetro de la ruta
        const userPayload = req.user as UserPayload;

        if (!userPayload) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado." });
        }
        if (isNaN(taskId)) { 
            throw new BadRequestError("ID de tarea inválido en la URL."); 
        }

        // Asumo que taskService.markTaskChatAsViewed está definido
        await taskService.markTaskChatAsViewed(taskId, userPayload.id); 
        res.status(200).json({ message: "Chat de tarea marcado como visto." });
    } catch (error) {
        next(error);
    }
};