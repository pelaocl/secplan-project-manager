// backend/src/schemas/chatMessageSchemas.ts
import { z } from 'zod';

export const createChatMessageSchema = z.object({
    contenido: z.string().min(1, "El contenido del mensaje no puede estar vacío.")
                      .max(2000, "El contenido del mensaje es demasiado largo."), // Límite de caracteres para el HTML
    // tareaId vendrá del parámetro de la URL
    // remitenteId vendrá del usuario autenticado
});
export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>;

// Podrías añadir un schema para query params de paginación al listar mensajes
export const getChatMessagesSchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export type GetChatMessagesQuery = z.infer<typeof getChatMessagesSchema>;