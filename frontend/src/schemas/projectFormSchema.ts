import { z } from 'zod';

// Helper de preproceso: Convierte explícitamente '', null, undefined a null ANTES de otras validaciones.
// Si no es ninguno de esos, devuelve el valor original para que z.coerce pueda actuar.
const preprocessOptionalNumberInput = (val: unknown): unknown => {
    if (val === '' || val == null) return null; // Usamos == null para atrapar undefined también
    return val; // Devuelve el string numérico u otro valor para que coerce actúe
};

// --- NUEVO: Schema base para objetos GeoJSON en el formulario ---
// Este schema es bastante permisivo. Valida que sea un objeto con 'type' y 'coordinates',
// y permite otras propiedades. Se hace opcional y nulable.
const geoJsonFormSchema = z.object({
   type: z.string({ required_error: "GeoJSON type es requerido" })
     .min(1, "GeoJSON type no puede estar vacío"),
   coordinates: z.array(z.any(), { required_error: "GeoJSON coordinates son requeridas" })
     .min(1, "GeoJSON coordinates no pueden estar vacías"),
   // Permite otras propiedades como 'properties', 'bbox', etc.
 }).passthrough().deepPartial().optional().nullable(); // deepPartial() hace que todo dentro sea opcional, útil si se arma por partes
 // Alternativamente, si esperas que el objeto esté completo o nulo:
 // }).passthrough().optional().nullable();

// Schema Zod REFINADO para el formulario de Proyecto en el Frontend
export const projectFormSchema = z.object({
  // --- Información Básica ---
  nombre: z.string().min(1, "Nombre es requerido").min(3, "Nombre requiere al menos 3 caracteres"),
  // Selects Requeridos: deben tener un ID numérico post-coerción
  tipologiaId: z.coerce.number({ required_error: "Tipología es requerida", invalid_type_error: "Tipología inválida" }).int().positive(),

  // --- Campos Opcionales Refinados ---
  estadoId: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number({ invalid_type_error: "ID de Estado debe ser número" }).int().positive().nullable() // Permite null explícito
  ),
  unidadId: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number({ invalid_type_error: "ID de Unidad debe ser número" }).int().positive().nullable()
  ),
  sectorId: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number({ invalid_type_error: "ID de Sector debe ser número" }).int().positive().nullable()
  ),
  descripcion: z.string().optional().nullable(), // Permite string vacío o nulo
  direccion: z.string().optional().nullable(),
  superficieTerreno: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number({ invalid_type_error: "Superficie debe ser número" }).positive("Superficie debe ser positiva").nullable()
  ),
  superficieEdificacion: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number({ invalid_type_error: "Superficie debe ser número" }).positive("Superficie debe ser positiva").nullable()
  ),
  ano: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number({ invalid_type_error: "Año debe ser número" }).int()
       .min(1900, "Año fuera de rango")
       .max(new Date().getFullYear() + 10, "Año fuera de rango")
       .nullable() // Permite que sea null
  ),
  proyectoPriorizado: z.boolean().optional().default(false),

  // --- Equipo (Interno) ---
  proyectistaId: z.number().int().positive().optional().nullable(), // Autocomplete ya debería devolver number o null
  formuladorId: z.number().int().positive().optional().nullable(),
  colaboradoresIds: z.array(z.number().int().positive()).optional().default([]), // Default a array vacío

  // --- Información Financiera (Interno) ---
  lineaFinanciamientoId: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number().int().positive().nullable()
  ),
  programaId: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number().int().positive().nullable()
  ),
  etapaFinanciamientoId: z.preprocess(preprocessOptionalNumberInput,
      z.coerce.number().int().positive().nullable()
  ),
  monto: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number({ invalid_type_error: "Monto debe ser número" }).positive("Monto debe ser positivo").nullable()
  ),
  tipoMoneda: z.enum(['CLP', 'UF'], { errorMap: () => ({ message: 'Seleccione CLP o UF' }) }).optional().default('CLP'),
  codigoExpediente: z.string().optional().nullable(),
  fechaPostulacion: z.preprocess((arg) => { // Mantenemos este preproceso para fechas
    if (arg === null || arg === undefined || arg === '') return null;
    const date = (arg instanceof Date) ? arg : new Date(String(arg) + 'T00:00:00'); // Añade hora UTC para evitar problemas de timezone al parsear solo fecha
    return isNaN(date.getTime()) ? null : date;
    }, z.date().optional().nullable()
  ),
  montoAdjudicado: z.preprocess(preprocessOptionalNumberInput,
     z.coerce.number({ invalid_type_error: "Monto Adjudicado debe ser número" }).positive("Monto Adjudicado debe ser positivo").nullable()
  ),
  codigoLicitacion: z.string().optional().nullable(),
  location_point: geoJsonFormSchema,
  area_polygon: geoJsonFormSchema,
});

// Tipo inferido (sin cambios)
export type ProjectFormValues = z.infer<typeof projectFormSchema>;