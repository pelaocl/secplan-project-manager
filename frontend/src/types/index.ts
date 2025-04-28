// Define roles basados en backend Role enum para consistencia en el frontend
export type UserRole = 'ADMIN' | 'COORDINADOR' | 'USUARIO';

// --- NUEVO: Definición y exportación de TipoMoneda ---
export type TipoMoneda = 'CLP' | 'UF';
export const DEFAULT_TIPO_MONEDA: TipoMoneda = 'CLP'; // Constante para el valor por defecto
// --- FIN NUEVO ---

// Interface para objetos User compartidos en el frontend
export interface User {
  id: number;
  email: string;
  name?: string | null;
  role: UserRole;
  isActive?: boolean;
  etiquetas?: Etiqueta[];
}

// Interface básica para objetos Project
export interface Project {
  // ... (contenido de la interfaz Project sin cambios) ...
  id: number;
  codigoUnico: string;
  nombre: string;
  direccion?: string | null;
  superficieTerreno?: number | null;
  superficieEdificacion?: number | null;
  ano?: number | null;
  proyectoPriorizado: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  estado?: { id: number; nombre: string } | null;
  unidad?: { id: number; nombre: string; abreviacion: string } | null;
  tipologia: { id: number; nombre: string; abreviacion: string; colorChip: string };
  sector?: { id: number; nombre: string } | null;
  descripcion?: string | null;
  proyectistaId?: number | null;
  formuladorId?: number | null;
  proyectista?: Pick<User, 'id' | 'name' | 'email'> | null;
  formulador?: Pick<User, 'id' | 'name' | 'email'> | null;
  colaboradores?: Array<Pick<User, 'id' | 'name' | 'email'>>;
  lineaFinanciamientoId?: number | null;
  programaId?: number | null;
  etapaFinanciamientoId?: number | null;
  monto?: string | number | null;
  tipoMoneda?: TipoMoneda; // Usa el tipo exportado
  codigoExpediente?: string | null;
  fechaPostulacion?: string | Date | null;
  montoAdjudicado?: string | number | null;
  codigoLicitacion?: string | null;
  lineaFinanciamiento?: { id: number; nombre: string } | null;
  programa?: { id: number; nombre: string; lineaFinanciamientoId: number; } | null; // Añadido lineaFinanciamientoId a Programa si API lo devuelve
  etapaActualFinanciamiento?: { id: number; nombre: string } | null;
}


// --- Tipos/Interfaces para Opciones de Lookup (Formularios) ---
export interface LookupOption { /* ... */ id: number; nombre: string; }
export interface UnidadMunicipalOption extends LookupOption { /* ... */ abreviacion: string; }
export interface TipologiaOption extends LookupOption { /* ... */ abreviacion: string; colorChip: string; }
export interface ProgramaOption extends LookupOption { /* ... */ lineaFinanciamientoId: number; }
export interface UserOption { /* ... */ id: number; name?: string | null; email: string; }
export interface FormOptionsResponse { /* ... */ estados: LookupOption[]; unidades: UnidadMunicipalOption[]; tipologias: TipologiaOption[]; sectores: LookupOption[]; lineas: LookupOption[]; programas: ProgramaOption[]; etapas: LookupOption[]; usuarios: UserOption[]; }
// --- Fin Tipos/Interfaces para Opciones de Lookup ---