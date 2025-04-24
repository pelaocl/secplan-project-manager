import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/projectService';
import { CreateProjectInput, UpdateProjectInput, ListProjectsQuery } from '../schemas/projectSchemas';
// --- CORREGIDO: Importa AuthenticatedRequest desde su origen ---
import { AuthenticatedRequest } from '../types/express'; // <<<--- Ruta corregida
// -------------------------------------------------------------
import { NotFoundError, BadRequestError } from '../utils/errors';

// --- Handlers (sin cambios en la lógica, solo verifica la importación arriba) ---

export const getAllProjectsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const queryParams = (req.validatedQuery || req.query) as ListProjectsQuery;
        const user = req.user;
        const result = await projectService.findAllProjects(queryParams, user);
        res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        next(error);
    }
};

export const getProjectByIdHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const params = req.validatedParams || req.params;
        const projectId = params.id as number;
        if (isNaN(projectId)) { return next(new BadRequestError('ID de proyecto inválido.')); }
        const user = req.user;
        const project = await projectService.findProjectById(projectId, user);
        res.status(200).json({ status: 'success', data: { project } });
    } catch (error) {
        next(error);
    }
};

export const createProjectHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // console.log('[CONTROLLER createProjectHandler] req.body RECEIVED:', JSON.stringify(req.body, null, 2));
    const user = req.user;
    if (!user) { return next(new Error('req.user no definido en ruta protegida')); }
    const validatedData = (req.validatedBody || req.body) as CreateProjectInput;
    try {
        const project = await projectService.createProject(validatedData, user);
        res.status(201).json({ status: 'success', data: { project } });
    } catch (error) {
        next(error);
    }
};

export const updateProjectHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
     const user = req.user;
     if (!user) { return next(new Error('req.user no definido en ruta protegida')); }
     try {
        const params = req.validatedParams || req.params;
        const projectId = params.id as number;
        if (isNaN(projectId)) { return next(new BadRequestError('ID de proyecto inválido.')); }
        const validatedData = (req.validatedBody || req.body) as UpdateProjectInput;
        const updatedProject = await projectService.updateProject(projectId, validatedData, user);
        res.status(200).json({ status: 'success', data: { project: updatedProject } });
    } catch (error) {
         next(error);
    }
};

export const deleteProjectHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user) { return next(new Error('req.user no definido en ruta protegida')); }
    try {
        const params = req.validatedParams || req.params;
        const projectId = params.id as number;
        if (isNaN(projectId)) { return next(new BadRequestError('ID de proyecto inválido.')); }
        await projectService.deleteProject(projectId, user);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};