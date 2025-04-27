// backend/src/schemas/tagSchemas.ts

import { z } from 'zod';

// Schema para validar el ID numérico en parámetros de URL (ej: /etiquetas/123)
export const tagIdSchema = z.object({
  id: z.preprocess(
    (val) => parseInt(String(val), 10), // Intenta convertir a número
    z.number({ invalid_type_error: "El ID debe ser un número." })
     .int("El ID debe ser un entero.")
     .positive("El ID debe ser positivo.")
  ),
});

// Schema base para los campos de la etiqueta
const tagBaseSchema = z.object({
    nombre: z.string({ required_error: "El nombre de la etiqueta es requerido." })
             .trim() // Quita espacios al inicio/final
             .min(1, "El nombre no puede estar vacío.")
             .max(50, "El nombre no puede exceder los 50 caracteres."), // Límite de ejemplo

    color: z.string({ required_error: "El color es requerido." })
            .trim()
            .regex(/^#[0-9A-Fa-f]{6}$/i, { message: "El color debe ser un código hexadecimal de 6 dígitos válido (ej: #FF5733)." }) // i para case-insensitive
            .toUpperCase(), // Guarda el color en mayúsculas para consistencia
});

// Schema para validar el cuerpo (body) al CREAR una etiqueta
export const createTagSchema = tagBaseSchema;

// Schema para validar el cuerpo (body) al ACTUALIZAR una etiqueta
// Hace que todos los campos del tagBaseSchema sean opcionales
export const updateTagSchema = tagBaseSchema.partial();

// Inferir tipos de TypeScript desde los schemas para usarlos en el código
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;