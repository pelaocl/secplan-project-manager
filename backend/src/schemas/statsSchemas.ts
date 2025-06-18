import { z } from 'zod';

// Define los filtros opcionales que se pueden aplicar al dashboard.
// Usamos z.coerce.number() para convertir automáticamente los strings de la URL a números.
export const dashboardFiltersSchema = z.object({
  ano: z.coerce.number().int().optional(),
  tipologiaId: z.coerce.number().int().optional(),
  estadoId: z.coerce.number().int().optional(),
  unidadId: z.coerce.number().int().optional(),
  // Puedes añadir más filtros aquí en el futuro, como 'sectorId', 'lineaFinanciamientoId', etc.
});

// Extrae el tipo de TypeScript del schema para usarlo en el servicio y controlador.
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;
