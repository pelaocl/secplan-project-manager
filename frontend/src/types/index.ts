// Define roles basados en backend Role enum para consistencia en el frontend
export type UserRole = 'ADMIN' | 'COORDINADOR' | 'USUARIO';

// Interface para objetos User compartidos en el frontend
// Asegúrate que coincida con lo que devuelve tu API en /login y lo que usa tu authStore
export interface User {
  id: number;
  email: string;
  name?: string | null; // El nombre es opcional en el schema de Prisma
  role: UserRole;
  isActive?: boolean; // Opcional: Incluir si se necesita en la lógica del frontend
  // Puedes añadir otros campos si la API los devuelve y los necesitas
  // Por ejemplo: etiquetas?: Array<{ id: number; nombre: string; color: string }>;
}

// Interface básica para objetos Project (la expandiremos según sea necesario)
// Basada inicialmente en los campos que devuelve la API (públicos y privados)
export interface Project {
  id: number;
  codigoUnico: string;
  nombre: string;
  direccion?: string | null;
  superficieTerreno?: number | null;
  superficieEdificacion?: number | null;
  ano?: number | null;
  proyectoPriorizado: boolean; // No es opcional en el schema
  createdAt: string | Date; // Las fechas pueden llegar como string vía JSON
  updatedAt: string | Date;

  // Relaciones básicas (pueden ser null si son opcionales)
  estado?: { id: number; nombre: string } | null;
  unidad?: { id: number; nombre: string; abreviacion: string } | null;
  tipologia: { id: number; nombre: string; abreviacion: string; colorChip: string }; // Requerida
  sector?: { id: number; nombre: string } | null;

  // --- Campos Internos/Privados (Opcionales en la interfaz general, la API los omite para visitantes) ---
  descripcion?: string | null;
  proyectistaId?: number | null;
  formuladorId?: number | null;
  // Podrías usar un tipo User más simple aquí si solo necesitas ID/nombre/email
  proyectista?: Pick<User, 'id' | 'name' | 'email'> | null;
  formulador?: Pick<User, 'id' | 'name' | 'email'> | null;
  colaboradores?: Array<Pick<User, 'id' | 'name' | 'email'>>; // Array de colaboradores

  // Campos financieros
  lineaFinanciamientoId?: number | null;
  programaId?: number | null;
  etapaFinanciamientoId?: number | null;
  // Prisma Decimal usualmente se serializa como string en JSON
  monto?: string | number | null;
  tipoMoneda?: 'CLP' | 'UF'; // Usa el tipo Enum directamente
  codigoExpediente?: string | null;
  fechaPostulacion?: string | Date | null;
  montoAdjudicado?: string | number | null;
  codigoLicitacion?: string | null;

  // Relaciones financieras anidadas
  lineaFinanciamiento?: { id: number; nombre: string } | null;
  programa?: { id: number; nombre: string } | null;
  etapaActualFinanciamiento?: { id: number; nombre: string } | null;
}


// --- Tipos para Opciones de Lookup (Ejemplo) ---
export interface LookupOption {
    id: number;
    nombre: string;
}
export interface UnidadMunicipalOption extends LookupOption {
    abreviacion: string;
}
export interface TipologiaOption extends LookupOption {
    abreviacion: string;
    colorChip: string;
}
export interface ProgramaOption extends LookupOption {
    lineaFinanciamientoId: number;
}

// Puedes añadir más interfaces compartidas aquí a medida que crezca la app
// export interface Tarea { ... }
// export interface Etiqueta { ... }