// frontend/src/schemas/lookupFormSchema.ts
import { z } from 'zod';

// Schema base (solo nombre) - igual que backend
const baseLookupSchema = z.object({
    nombre: z.string({ required_error: "El nombre es requerido." })
        .trim().min(1, "El nombre no puede estar vacío.").max(100, "Nombre muy largo."),
});

// --- Schemas específicos para el FORMULARIO (pueden diferir ligeramente del backend si es necesario) ---

// Para lookups simples (Estado, Sector, Linea, Etapa)
export const simpleLookupFormSchema = baseLookupSchema;

// Para Unidad Municipal (nombre + abreviacion)
export const unidadFormSchema = baseLookupSchema.extend({
    abreviacion: z.string({ required_error: "La abreviación es requerida." })
        .trim().min(1, "Abreviación vacía.").max(10),
});

// Para Tipologia Proyecto (nombre + abreviacion + color)
export const tipologiaFormSchema = baseLookupSchema.extend({
    abreviacion: z.string({ required_error: "La abreviación es requerida." })
        .trim().min(1, "Abreviación vacía.").max(10),
    colorChip: z.string({ required_error: "El color es requerido." })
        .trim().regex(/^#[0-9A-Fa-f]{6}$/i, "Color debe ser hex #rrggbb.")
        .toUpperCase(),
});

// Para Programa (nombre + FK a lineaFinanciamiento)
export const programaFormSchema = baseLookupSchema.extend({
    // Hacemos que acepte string o número, y lo transformamos a número
    lineaFinanciamientoId: z.preprocess(
        (val) => (val === "" || val == null ? undefined : Number(val)), // Convierte a número o undefined
        z.number({ required_error: "Debe seleccionar o ingresar ID de Línea.", invalid_type_error: "ID de Línea inválido." })
           .int().positive("ID de Línea inválido.")
    )
});

// --- Tipos TypeScript Inferidos ---
export type SimpleLookupFormValues = z.infer<typeof simpleLookupFormSchema>;
export type UnidadFormValues = z.infer<typeof unidadFormSchema>;
export type TipologiaFormValues = z.infer<typeof tipologiaFormSchema>;
export type ProgramaFormValues = z.infer<typeof programaFormSchema>;

// Tipo unión para el formulario (útil para RHF con resolver dinámico)
export type AnyLookupFormValues = SimpleLookupFormValues | UnidadFormValues | TipologiaFormValues | ProgramaFormValues;