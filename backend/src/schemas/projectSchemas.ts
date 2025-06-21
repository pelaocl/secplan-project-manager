//backend/src/schemas/projectSchemas.ts
import { z } from 'zod';
import { Role, TipoMoneda } from '@prisma/client'; // Importa el Enum de Prisma

// Schema for numeric ID in URL params
export const projectIdSchema = z.object({
    // Asegúrate que parsea a número correctamente
    id: z.string().regex(/^\d+$/, "ID debe ser un número").transform(val => parseInt(val, 10)),
});

// Schema for List Query Params
export const listProjectsSchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val, 10) : 1).pipe(z.number().int().min(1)),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val, 10) : 10).pipe(z.number().int().min(1).max(100)),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    searchText: z.string().optional(),
    estadoId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val, 10) : undefined).pipe(z.number().int().positive().optional()),
    tipologiaId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val, 10) : undefined).pipe(z.number().int().positive().optional()),
    unidadId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val, 10) : undefined).pipe(z.number().int().positive().optional()),
    sectorId: z.string().optional().transform((val: string | undefined) => val ? parseInt(val, 10) : undefined).pipe(z.number().int().positive().optional()),
});

// Definición base de un objeto GeoJSON muy genérico para validación
// Esto es muy básico, podrías hacerlo más específico si quieres,
// por ejemplo, para validar la presencia de 'type' y 'coordinates'.
const geoJsonSchema = z.object({
    type: z.string(),
    coordinates: z.array(z.any()),
    // permite otras propiedades como 'properties', 'bbox', etc.
}).passthrough().optional().nullable();

// Base schema for common fields (used in create and update)
const projectBaseSchema = z.object({
    nombre: z.string().min(3, "Nombre requiere al menos 3 caracteres"),
    imageUrls: z.array(z.string().url("Cada ítem debe ser una URL válida.")).optional(),
    tipologiaId: z.number().int("ID de Tipología debe ser un número entero positivo").positive(),
    descripcion: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    superficieTerreno: z.number().positive("Superficie Terreno debe ser positiva").optional().nullable(),
    superficieEdificacion: z.number().positive("Superficie Edificación debe ser positiva").optional().nullable(),
    ano: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional().nullable(),
    proyectoPriorizado: z.boolean().optional().default(false),
    estadoId: z.number().int().positive().optional().nullable(),
    unidadId: z.number().int().positive().optional().nullable(),
    sectorId: z.number().int().positive().optional().nullable(),
    proyectistaId: z.number().int().positive().optional().nullable(),
    formuladorId: z.number().int().positive().optional().nullable(),
    colaboradoresIds: z.array(z.number().int().positive()).optional(), // Array of User IDs
    lineaFinanciamientoId: z.number().int().positive().optional().nullable(),
    programaId: z.number().int().positive().optional().nullable(),
    etapaFinanciamientoId: z.number().int().positive().optional().nullable(),
    monto: z.preprocess(
        // Allow string input for decimals, convert to number for validation
        (val: unknown) => (typeof val === 'string' && val !== '') ? parseFloat(val.replace(',', '.')) : (typeof val === 'number' ? val : undefined),
        z.number().positive("Monto debe ser positivo").optional().nullable()
    ),
    // CORREGIDO: Usar z.nativeEnum con el Enum importado o z.enum con los strings
    // Opción 1: Usando el Enum de Prisma (recomendado si los valores coinciden exactamente)
    tipoMoneda: z.nativeEnum(TipoMoneda).optional().default(TipoMoneda.CLP),
    // Opción 2: Usando z.enum con los strings literales (si prefieres no importar el enum)
    // tipoMoneda: z.enum(['CLP', 'UF']).optional().default('CLP'),
    codigoExpediente: z.string().optional().nullable(),
    fechaPostulacion: z.preprocess(
        (arg: unknown) => {
            // Acepta string (YYYY-MM-DD) o Date
            if (typeof arg === 'string' || arg instanceof Date) {
                const date = new Date(arg);
                // Verifica si es una fecha válida antes de convertir
                return isNaN(date.getTime()) ? null : date;
            }
            return null; // Devuelve null para otros tipos o inválidos
        },
        z.date().optional().nullable() // Valida como Date
    ),
    montoAdjudicado: z.preprocess(
        (val: unknown) => (typeof val === 'string' && val !== '') ? parseFloat(val.replace(',', '.')) : (typeof val === 'number' ? val : undefined),
        z.number().positive("Monto Adjudicado debe ser positivo").optional().nullable()
    ),
    codigoLicitacion: z.string().optional().nullable(),

    // --- Nuevos campos de Geometría ---
    location_point: geoJsonSchema,
    area_polygon: geoJsonSchema,
});

// Schema for Creating a Project
// No necesita cambios si projectBaseSchema es correcto
export const createProjectSchema = projectBaseSchema;

// Schema for Updating a Project (most fields are optional)
// No necesita cambios si projectBaseSchema es correcto
export const updateProjectSchema = projectBaseSchema.partial(); // Makes all fields optional

// Type Inference from Zod Schemas
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsSchema>; // Tipo para query validada