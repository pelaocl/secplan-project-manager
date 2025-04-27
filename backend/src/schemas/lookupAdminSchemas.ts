// backend/src/schemas/lookupAdminSchemas.ts

import { z } from 'zod';

// --- Schemas para Parámetros de Ruta ---

// Valida que el tipo de lookup sea uno de los esperados
export const validLookupTypes = [
    'estados', 'unidades', 'tipologias', 'sectores', 'lineas', 'programas', 'etapas'
] as const;

export const lookupTypeParamSchema = z.object({
    lookupType: z.enum(validLookupTypes, {
        required_error: "El tipo de lookup es requerido en la URL.",
        invalid_type_error: `Tipo de lookup inválido. Debe ser uno de: ${validLookupTypes.join(', ')}`,
    }),
});

// Valida el ID numérico en parámetros de ruta
export const lookupIdParamSchema = z.object({
    id: z.preprocess(
        (val) => parseInt(String(val), 10),
        z.number({ invalid_type_error: "El ID debe ser un número." }).int().positive("El ID debe ser positivo.")
    ),
});

// Combinación para rutas que necesitan ambos parámetros
export const lookupTypeAndIdParamSchema = lookupTypeParamSchema.merge(lookupIdParamSchema);


// --- Schemas para el Cuerpo (Body) de la Petición ---

// Schema base (solo nombre)
const baseLookupSchema = z.object({
    nombre: z.string({ required_error: "El nombre es requerido." })
        .trim().min(1, "El nombre no puede estar vacío.").max(100, "El nombre excede los 100 caracteres."),
});

// --- Schemas de CREACIÓN ---
export const createSimpleLookupSchema = baseLookupSchema; // Para Estado, Sector, Linea, Etapa

export const createUnidadSchema = baseLookupSchema.extend({
    abreviacion: z.string({ required_error: "La abreviación es requerida." })
        .trim().min(1, "Abreviación vacía.").max(10, "Abreviación excede 10 caracteres."),
});

export const createTipologiaSchema = baseLookupSchema.extend({
    abreviacion: z.string({ required_error: "La abreviación es requerida." })
        .trim().min(1, "Abreviación vacía.").max(10, "Abreviación excede 10 caracteres."),
    colorChip: z.string({ required_error: "El color es requerido." })
        .trim().regex(/^#[0-9A-Fa-f]{6}$/i, "Color debe ser hex #rrggbb.")
        .toUpperCase(),
});

export const createProgramaSchema = baseLookupSchema.extend({
    lineaFinanciamientoId: z.number({
        required_error: "Debe seleccionar una Línea de Financiamiento.",
        invalid_type_error: "ID de Línea inválido."
    }).int().positive("ID de Línea inválido."),
});

// --- Schemas de ACTUALIZACIÓN ---
export const updateSimpleLookupSchema = baseLookupSchema.partial();
export const updateUnidadSchema = createUnidadSchema.partial();
export const updateTipologiaSchema = createTipologiaSchema.partial();
export const updateProgramaSchema = createProgramaSchema.partial();

// --- Tipos TypeScript Inferidos ---
export type LookupTypeParam = z.infer<typeof lookupTypeParamSchema>;
export type LookupIdParam = z.infer<typeof lookupIdParamSchema>;
export type LookupTypeAndIdParam = z.infer<typeof lookupTypeAndIdParamSchema>;
// ... (puedes exportar los otros tipos Input si los necesitas en otro lugar)
// export type CreateSimpleLookupInput = z.infer<typeof createSimpleLookupSchema>;
// ... etc ...