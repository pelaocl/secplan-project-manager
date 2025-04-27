// frontend/src/schemas/tagFormSchema.ts
import { z } from 'zod';

// Schema para validar el formulario de creación/edición de etiquetas en el frontend
export const tagFormSchema = z.object({
  nombre: z.string({ required_error: "El nombre es requerido." })
           .trim()
           .min(1, "El nombre no puede estar vacío.")
           .max(50, "El nombre no puede exceder 50 caracteres."),

  color: z.string({ required_error: "El color es requerido." })
          .trim()
          // Valida formato hex simple, el input type="color" ayuda.
          .regex(/^#[0-9A-Fa-f]{6}$/, { message: "Seleccione un color válido." })
          .toUpperCase(), // Consistencia
});

// Inferir el tipo para usar con React Hook Form
export type TagFormValues = z.infer<typeof tagFormSchema>;