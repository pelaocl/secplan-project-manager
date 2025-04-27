// backend/src/api/lookupAdminRoutes.ts

import express from 'express';
import * as lookupCtrl from '../controllers/lookupAdminController'; // Controlador genérico
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware'; // Middleware de validación Zod
import {
    // Schemas para parámetros de ruta
    lookupTypeParamSchema,
    lookupTypeAndIdParamSchema,
    // Schemas para el cuerpo (body) - importamos todos
    createSimpleLookupSchema, createUnidadSchema, createTipologiaSchema, createProgramaSchema,
    updateSimpleLookupSchema, updateUnidadSchema, updateTipologiaSchema, updateProgramaSchema,
    // Importa el tipo o enum para lookupType si es necesario
    validLookupTypes
} from '../schemas/lookupAdminSchemas';
import { Role } from '@prisma/client';
import { z } from 'zod'; // Para inferir tipo

type LookupType = z.infer<typeof validLookupTypes>;

const router = express.Router();

// --- Middleware para Seleccionar Dinámicamente el Schema del Body ---
const selectBodySchema = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Asumimos que lookupType ya fue validado por un validateRequest({ params: ... }) anterior
    const lookupType = req.params.lookupType as LookupType;
    const method = req.method;
    let bodySchema: z.ZodSchema | undefined = undefined; // Tipo base de Zod

    // Selecciona el schema apropiado según el método y el tipo de lookup
    if (method === 'POST') {
        switch (lookupType) {
            case 'unidades': bodySchema = createUnidadSchema; break;
            case 'tipologias': bodySchema = createTipologiaSchema; break;
            case 'programas': bodySchema = createProgramaSchema; break;
            case 'estados':
            case 'sectores':
            case 'lineas':
            case 'etapas':
            default: bodySchema = createSimpleLookupSchema; break; // Usa el schema simple para los demás
        }
    } else if (method === 'PUT' || method === 'PATCH') { // Considera PATCH también
         switch (lookupType) {
            case 'unidades': bodySchema = updateUnidadSchema; break;
            case 'tipologias': bodySchema = updateTipologiaSchema; break;
            case 'programas': bodySchema = updateProgramaSchema; break;
            case 'estados':
            case 'sectores':
            case 'lineas':
            case 'etapas':
            default: bodySchema = updateSimpleLookupSchema; break; // Usa el schema simple de update
        }
    }

    // Adjunta el schema seleccionado al objeto request para que validateRequest lo use
    if (bodySchema) {
        (req as any).selectedBodySchema = bodySchema;
    } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        // Si es POST/PUT/PATCH pero no encontramos schema, es un error interno
         console.error(`[selectBodySchema] No se pudo determinar el schema para ${method} ${lookupType}`);
         return next(new Error('Error interno: No se pudo determinar el schema de validación.'));
    }
    next(); // Continúa al siguiente middleware
};

// --- Middleware para Ejecutar Validación con Schema Seleccionado ---
// Este middleware asume que 'selectBodySchema' ya puso el schema correcto en req.selectedBodySchema
const validateSelectedBody = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const schema = (req as any).selectedBodySchema;
    if (!schema) {
         // Si no hay schema seleccionado (ej. para métodos GET), simplemente continúa
         // O si es POST/PUT/PATCH y selectBodySchema falló, ya se habrá llamado a next(error)
        return next();
    }
    // Llama a validateRequest usando el schema seleccionado dinámicamente
    return validateRequest({ body: schema })(req, res, next);
};


// === RUTAS GENÉRICAS PARA LOOKUPS ===
// Base: /api/admin/lookups (montado en server.ts)

// GET /:lookupType - Listar todos los registros de un tipo
router.get(
    '/:lookupType',
    authenticateToken,
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // Permitir a ambos ver las listas
    validateRequest({ params: lookupTypeParamSchema }), // Valida el tipo de lookup
    lookupCtrl.getAllLookupHandler
);

// POST /:lookupType - Crear un registro de un tipo
router.post(
    '/:lookupType',
    authenticateToken,
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // Permitir a ambos crear lookups? (Decisión tuya)
    validateRequest({ params: lookupTypeParamSchema }), // 1. Valida tipo
    selectBodySchema,                           // 2. Selecciona schema de body
    validateSelectedBody,                       // 3. Valida el body con el schema seleccionado
    lookupCtrl.createLookupHandler              // 4. Ejecuta controlador
);

// GET /:lookupType/:id - Obtener un registro específico
router.get(
    '/:lookupType/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN, Role.COORDINADOR]),
    validateRequest({ params: lookupTypeAndIdParamSchema }), // Valida tipo e ID
    lookupCtrl.getLookupByIdHandler
);

// PUT /:lookupType/:id - Actualizar un registro específico
router.put(
    '/:lookupType/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN, Role.COORDINADOR]), // Permitir a ambos editar lookups? (Decisión tuya)
    validateRequest({ params: lookupTypeAndIdParamSchema }), // 1. Valida params
    selectBodySchema,                           // 2. Selecciona schema de body
    validateSelectedBody,                       // 3. Valida body
    lookupCtrl.updateLookupHandler              // 4. Ejecuta controlador
);

// DELETE /:lookupType/:id - Eliminar un registro específico
router.delete(
    '/:lookupType/:id',
    authenticateToken,
    authorizeRole([Role.ADMIN]), // Solo Admin puede borrar? (Recomendado)
    validateRequest({ params: lookupTypeAndIdParamSchema }), // Valida params
    lookupCtrl.deleteLookupHandler
);

export default router;