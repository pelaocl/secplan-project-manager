//backend/src/controllers/lookupController.ts
import { Request, Response, NextFunction } from 'express';
import * as lookupService from '../services/lookupService'; // Asegúrate que exista y exporte getFormOptions
import { AuthenticatedRequest } from '../types/express';

export const getFormOptionsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // No necesita parámetros, el servicio obtiene todas las opciones
        // Podrías pasar req.user al servicio si las opciones dependieran del rol
        const options = await lookupService.getFormOptions();
        res.status(200).json(options);
    } catch (error) {
        next(error); // Pasa errores al manejador global
    }
};

// Asegúrate de exportar algo si no hay handlers aún
// export {}; // Puedes quitar esto si getFormOptionsHandler está definido