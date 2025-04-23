import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/roleMiddleware';
import { Role } from '@prisma/client';
// Importa tus controladores y middlewares de validación específicos para admin
// import * as adminController from '../controllers/adminController';
// import { validateRequest } from '../middlewares/validationMiddleware';
// import { createUserSchema, updateUserSchema, userIdSchema, ... } from '../schemas/adminSchemas';

const router = express.Router();

// Aplica autenticación y rol ADMIN a todas las rutas de este archivo
router.use(authenticateToken, authorizeRole([Role.ADMIN]));

// --- Rutas CRUD Usuarios (Ejemplos) ---
// GET /api/admin/users
// router.get('/users', adminController.getAllUsersHandler);
// POST /api/admin/users
// router.post('/users', validateRequest({ body: createUserSchema }), adminController.createUserHandler);
// PUT /api/admin/users/:id
// router.put('/users/:id', validateRequest({ params: userIdSchema, body: updateUserSchema }), adminController.updateUserHandler);
// DELETE /api/admin/users/:id
// router.delete('/users/:id', validateRequest({ params: userIdSchema }), adminController.deleteUserHandler);

// --- Rutas CRUD Etiquetas (Ejemplos) ---
// GET /api/admin/tags
// router.get('/tags', adminController.getAllTagsHandler);
// ... (POST, PUT, DELETE para etiquetas) ...

// --- Rutas CRUD Lookups (Ejemplos, si Admin las gestiona) ---
// GET /api/admin/lookups/estados
// router.get('/lookups/estados', adminController.getAllEstadosHandler);
// ... (POST, PUT, DELETE para estados, tipologias, etc.) ...


// Exporta el router (aunque no tenga rutas definidas aún, necesita el export)
export default router;