// Define roles basados en backend Role enum para consistencia en el frontend
export type UserRole = 'ADMIN' | 'COORDINADOR' | 'USUARIO';

export type TipoMoneda = 'CLP' | 'UF';
export const DEFAULT_TIPO_MONEDA: TipoMoneda = 'CLP'; // Constante para el valor por defecto

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
  location_point?: GeoJSONPoint | null;
  area_polygon?: GeoJSONPolygon | null;
}


// --- Tipos/Interfaces para Opciones de Lookup (Formularios) ---
export interface LookupOption { /* ... */ id: number; nombre: string; }
export interface UnidadMunicipalOption extends LookupOption { /* ... */ abreviacion: string; }
export interface TipologiaOption extends LookupOption { /* ... */ abreviacion: string; colorChip: string; }
export interface ProgramaOption extends LookupOption { /* ... */ lineaFinanciamientoId: number; }
export interface UserOption { /* ... */ id: number; name?: string | null; email: string; }
export interface FormOptionsResponse { /* ... */ estados: LookupOption[]; unidades: UnidadMunicipalOption[]; tipologias: TipologiaOption[]; sectores: LookupOption[]; lineas: LookupOption[]; programas: ProgramaOption[]; etapas: LookupOption[]; usuarios: UserOption[]; }
// --- Fin Tipos/Interfaces para Opciones de Lookup ---

// --- ENUMS para Tareas (deben coincidir con los de Prisma) ---
export enum EstadoTarea {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  EN_REVISION = 'EN_REVISION',
  CANCELADA = 'CANCELADA',
}

export enum PrioridadTarea {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA',
}

// --- Interfaz para Mensajes de Chat ---
export interface ChatMessage {
  id: number;
  contenido: string; // HTML
  fechaEnvio: string | Date;
  tareaId: number;
  remitenteId: number;
  remitente: { // Información seleccionada del remitente
    id: number;
    name?: string | null;
    email: string;
    role: UserRole; // Asumiendo que UserRole ya está definido
  };
}

// --- ENUMS PARA NOTIFICACIONES (deben coincidir con los valores de Prisma) ---
export enum TipoNotificacion {
  NUEVA_TAREA_ASIGNADA = 'NUEVA_TAREA_ASIGNADA',
  NUEVO_MENSAJE_TAREA = 'NUEVO_MENSAJE_TAREA',
  TAREA_ACTUALIZADA_ESTADO = 'TAREA_ACTUALIZADA_ESTADO',
  TAREA_ACTUALIZADA_INFO = 'TAREA_ACTUALIZADA_INFO',
  TAREA_COMPLETADA = 'TAREA_COMPLETADA',
  TAREA_VENCIMIENTO_PROXIMO = 'TAREA_VENCIMIENTO_PROXIMO',
  // Añade otros tipos que hayas definido en tu schema.prisma si es necesario
}

export enum TipoRecursoNotificacion {
  TAREA = 'TAREA',
  MENSAJE_CHAT_TAREA = 'MENSAJE_CHAT_TAREA',
  PROYECTO = 'PROYECTO',
  // Añade otros tipos que hayas definido
}

// --- INTERFAZ PARA NOTIFICACIONES ---
export interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string | Date; // La API podría devolver string, pero es bueno castear a Date si se usa
  urlDestino?: string | null;
  tipo: TipoNotificacion; // Usa el enum definido arriba
  usuarioId: number; // El ID del usuario al que pertenece esta notificación (no el objeto User completo)
  recursoId?: number | null;
  recursoTipo?: TipoRecursoNotificacion | null; // Usa el enum definido arriba
}

// --- Interfaz para Tareas ---
// Esta interfaz debe reflejar lo que la API devuelve, incluyendo los 'includes'
export interface Task {
  id: number;
  titulo: string;
  descripcion?: string | null; // HTML
  fechaCreacion: string | Date;
  fechaActualizacion: string | Date;
  fechaPlazo?: string | Date | null;
  estado: EstadoTarea;
  prioridad?: PrioridadTarea | null;
  proyectoId: number;
  creadorId: number;
  asignadoId?: number | null;

  // Relaciones incluidas (con campos seleccionados, sin contraseñas)
  creador?: {
    id: number;
    name?: string | null;
    email: string;
    role: UserRole;
  };
  asignado?: {
    id: number;
    name?: string | null;
    email: string;
    role: UserRole;
  } | null;
  proyecto?: { // Información básica del proyecto
    id: number;
    nombre: string;
    codigoUnico: string;
  };
  mensajes?: ChatMessage[]; // Array de mensajes, se cargará en getTaskById
}

// --- Tipos para los Inputs de Formularios de Tareas (Frontend) ---
// Basados en los Zod schemas del backend, pero como tipos para el frontend

export interface CreateTaskFrontendInput {
  titulo: string;
  descripcion?: string | null;
  fechaPlazo?: string | null; // El date picker podría dar un string o Date, el servicio API lo manejará
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea | null;
  asignadoId?: number | null;
}

// UpdateTaskFrontendInput es usualmente un Partial del CreateTaskFrontendInput
export type UpdateTaskFrontendInput = Partial<CreateTaskFrontendInput>;


// Tipo para la respuesta paginada de mensajes (si lo necesitas así más adelante)
export interface PaginatedChatMessages {
    messages: ChatMessage[];
    totalMessages: number;
    page: number;
    limit: number;
    totalPages: number;
}