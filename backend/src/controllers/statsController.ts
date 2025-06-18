import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import * as statsService from '../services/statsService';
import { DashboardFilters } from '../schemas/statsSchemas';

export const getDashboardStatsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Obtiene los filtros validados desde la query de la solicitud.
        const filters = req.validatedQuery as DashboardFilters;

        // Pasa los filtros a la función principal del servicio.
        const dashboardData = await statsService.getDashboardData(filters);

        res.status(200).json({ status: 'success', data: dashboardData });

    } catch (error) {
        next(error);
    }
};