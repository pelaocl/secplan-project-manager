// backend/src/schemas/notificationSchemas.ts
import { z } from 'zod';
import { TipoNotificacion, TipoRecursoNotificacion } from '@prisma/client';

export const createNotificationSchema = z.object({
    usuarioId: z.number().int().positive(),
    tipo: z.nativeEnum(TipoNotificacion),
    mensaje: z.string().min(1).max(500), // Límite para el mensaje
    urlDestino: z.string().max(255).optional().nullable(),
    recursoId: z.number().int().positive().optional().nullable(),
    recursoTipo: z.nativeEnum(TipoRecursoNotificacion).optional().nullable(),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const notificationIdParamSchema = z.object({
    notificationId: z.string().regex(/^\d+$/, "ID de notificación debe ser un número").transform(val => parseInt(val, 10)),
});

export const getNotificationsQuerySchema = z.object({
    soloNoLeidas: z.preprocess(
        (val) => val === 'true' || val === true, // Convierte 'true' string a boolean
        z.boolean().optional()
    ),
    // Puedes añadir paginación si es necesario
    // page: z.coerce.number().int().min(1).optional().default(1),
    // limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;