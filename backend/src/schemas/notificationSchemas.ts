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