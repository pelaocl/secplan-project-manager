import { z } from 'zod';

// Frontend schema often deals with strings from inputs, needs parsing/coercion
export const projectFormSchema = z.object({
  // Ensure fields match the form structure and backend expectations after parsing
  nombre: z.string().min(1, "Nombre es requerido").min(3, "Nombre requiere al menos 3 caracteres"),
  tipologiaId: z.preprocess( // Allow empty string from Select, convert to number or keep empty
    (val) => (val === '' ? '' : parseInt(String(val), 10)),
    z.number({ required_error: "Tipología es requerida" }).int().positive("Tipología es requerida")
  ),
  descripcion: z.string().optional(), // Allow empty string
  direccion: z.string().optional(),
  superficieTerreno: z.preprocess(
      (val) => (val === '' ? undefined : parseFloat(String(val).replace(',', '.'))), // Allow empty string -> undefined
      z.number().positive("Superficie Terreno debe ser positiva").optional().nullable() // Backend handles null
  ),
  superficieEdificacion: z.preprocess(
      (val) => (val === '' ? undefined : parseFloat(String(val).replace(',', '.'))),
      z.number().positive("Superficie Edificación debe ser positiva").optional().nullable()
  ),
  ano: z.preprocess(
      (val) => (val === '' ? undefined : parseInt(String(val), 10)),
      z.number().int().min(1900).max(new Date().getFullYear() + 5, "Año inválido").optional().nullable()
  ),
  proyectoPriorizado: z.boolean().optional(),
  estadoId: z.preprocess(
      (val) => (val === '' ? null : parseInt(String(val), 10)), // Allow empty string -> null
      z.number().int().positive().optional().nullable()
  ),
  unidadId: z.preprocess(
      (val) => (val === '' ? null : parseInt(String(val), 10)),
      z.number().int().positive().optional().nullable()
  ),
  sectorId: z.preprocess(
      (val) => (val === '' ? null : parseInt(String(val), 10)),
      z.number().int().positive().optional().nullable()
  ),
  // --- Equipo ---
  proyectistaId: z.preprocess(
      (val) => (val === '' ? null : parseInt(String(val), 10)), // Allow empty string/null from Autocomplete
      z.number().int().positive().optional().nullable()
  ),
  formuladorId: z.preprocess(
      (val) => (val === '' ? null : parseInt(String(val), 10)),
      z.number().int().positive().optional().nullable()
  ),
  colaboradoresIds: z.array(z.number().int().positive()).optional(), // Expecting array of numbers
  // --- Financiera ---
  lineaFinanciamientoId: z.preprocess(
      (val) => (val === '' ? null : parseInt(String(val), 10)),
      z.number().int().positive().optional().nullable()
  ),
   programaId: z.preprocess(
      (val) => (val === '' ? null : parseInt(String(val), 10)),
      z.number().int().positive().optional().nullable()
  ),
  etapaFinanciamientoId: z.preprocess(
      (val) => (val === '' ? null : parseInt(String(val), 10)),
      z.number().int().positive().optional().nullable()
  ),
  monto: z.preprocess(
      (val) => (val === '' ? undefined : parseFloat(String(val).replace(',', '.'))),
      z.number().positive("Monto debe ser positivo").optional().nullable()
  ),
  tipoMoneda: z.enum(['CLP', 'UF']).optional().default('CLP'),
  codigoExpediente: z.string().optional(),
  fechaPostulacion: z.preprocess(
       // Handle various inputs: string date, Date object, empty string, null
       (arg) => {
         if (!arg || arg === '') return null; // Treat empty string as null
         try {
             // Attempt to create a valid date. ISO format (YYYY-MM-DD) is safest.
             const date = new Date(arg);
             // Check if the date is valid
             return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]; // Send as YYYY-MM-DD string
         } catch {
             return null; // Invalid date format
         }
     },
     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (AAAA-MM-DD)").optional().nullable() // Validate format before sending
   ),
  montoAdjudicado: z.preprocess(
      (val) => (val === '' ? undefined : parseFloat(String(val).replace(',', '.'))),
      z.number().positive("Monto Adjudicado debe ser positivo").optional().nullable()
  ),
  codigoLicitacion: z.string().optional(),

  // Include id only if needed for update logic identification, but typically not part of the form data itself
  id: z.number().optional(),
});

// Type for form values derived from Zod schema
export type ProjectFormValues = z.infer<typeof projectFormSchema>;