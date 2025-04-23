import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/projectService';
// CORREGIDO: Usa AuthenticatedRequest para acceder a los campos validados y a req.user
import { AuthenticatedRequest } from '../types/express';
import { NotFoundError } from '../utils/errors';
// Ya no necesitas importar ListProjectsQuery aquí si confías en el tipo de req.validatedQuery
// import { CreateProjectInput, UpdateProjectInput } from '../schemas/projectSchemas';

// Get All Projects (Public/Authenticated)
export const getAllProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // CORREGIDO: Usa req.validatedQuery (o req.query si no hay validación de query)
        // El tipo debería ser inferido correctamente desde el schema Zod usado en el middleware
        const queryParams = req.validatedQuery || req.query; // Usa el validado si existe
        const user = req.user; // Ya está disponible por AuthenticatedRequest
        // Ya no necesitas el 'as unknown as ListProjectsQuery' si usas req.validatedQuery
        const result = await projectService.findAllProjects(queryParams, user);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// Get Project By ID (Public/Authenticated)
export const getProjectById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // CORREGIDO: Usa req.validatedParams
        const params = req.validatedParams || req.params;
        const projectId = params.id as number; // El tipo debería ser inferido por Zod
        const user = req.user;
        const project = await projectService.findProjectById(projectId, user);
        res.status(200).json(project);
    } catch (error) {
        next(error);
    }
};

// Create Project (Authenticated: ADMIN, COORDINADOR)
export const createProjectHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // CORREGIDO: Usa req.validatedBody
        const projectData = req.validatedBody; // Tipo inferido por Zod
        if (!req.user) { /* Manejo de error o confiar en middleware */ }
        const newProject = await projectService.createProject(projectData, req.user!);
        res.status(201).json(newProject);
    } catch (error) {
        next(error);
    }
};

// Update Project (Authenticated: ADMIN, COORDINADOR, USUARIO)
export const updateProjectHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // CORREGIDO: Usa req.validatedParams y req.validatedBody
        const params = req.validatedParams || req.params;
        const projectId = params.id as number; // Tipo inferido por Zod
        const updateData = req.validatedBody; // Tipo inferido por Zod
        if (!req.user) { /* Manejo de error o confiar en middleware */ }
        const updatedProject = await projectService.updateProject(projectId, updateData, req.user!);
        res.status(200).json(updatedProject);
    } catch (error) {
        next(error);
    }
};

// Delete Project (Authenticated: ADMIN)
export const deleteProjectHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // CORREGIDO: Usa req.validatedParams
        const params = req.validatedParams || req.params;
        const projectId = params.id as number; // Tipo inferido por Zod
        if (!req.user) { /* Manejo de error o confiar en middleware */ }
        await projectService.deleteProject(projectId, req.user!);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};