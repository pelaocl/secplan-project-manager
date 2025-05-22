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