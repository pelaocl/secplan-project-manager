import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { dashboardFiltersSchema } from '../schemas/statsSchemas'; // <-- NUEVO IMPORT
import * as statsController from '../controllers/statsController';

const router = express.Router();

// GET /api/stats/dashboard
// Obtiene todas las métricas necesarias para el dashboard principal.
router.get(
    '/dashboard',
    authenticateToken,
    validateRequest({ query: dashboardFiltersSchema }), // <-- AÑADIDO: Valida los filtros de la query
    statsController.getDashboardStatsHandler
);

export default router;