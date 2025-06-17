import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import * as statsService from '../services/statsService';
// Importaremos el servicio de estadísticas en el siguiente paso
// import * as statsService from '../services/statsService';

export const getDashboardStatsHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Llama a la función principal del servicio para obtener todos los datos del dashboard
        const dashboardData = await statsService.getDashboardData();

        res.status(200).json({ status: 'success', data: dashboardData });

    } catch (error) {
        next(error);
    }
};