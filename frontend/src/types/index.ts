//frontend/src/types/index.ts
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
  id: number;
  codigoUnico: string;
  nombre: string;
  descripcion: string | null; // Ahora siempre es público
  imagenUrl?: string | null;
  direccion: string | null;
  superficieTerreno: number | null; // Prisma Decimal se convierte a number o string en JSON, ajusta si es string
  superficieEdificacion: number | null; // Prisma Decimal se convierte a number o string
  ano: number | null;
  proyectoPriorizado: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  location_point: any | null; // O un tipo GeoJSON más específico si lo tienes
  area_polygon: any | null;   // O un tipo GeoJSON más específico

  // Relaciones públicas (asumiendo que tienes tipos para estos en el frontend)
  estado?: { id: number; nombre: string; } | null;
  unidad?: { id: number; nombre: string; abreviacion: string; } | null;
  tipologia?: { id: number; nombre: string; abreviacion: string; colorChip: string; } | null;
  sector?: { id: number; nombre: string; } | null;
  lineaFinanciamiento?: { id: number; nombre: string; } | null;
  programa?: { id: number; nombre: string; } | null;
  etapaActualFinanciamiento?: { id: number; nombre: string; } | null;

  // IDs de relaciones que son públicos
  estadoId: number | null;
  unidadId: number | null;
  tipologiaId: number; // Esta parece ser requerida en tu schema
  sectorId: number | null;
  lineaFinanciamientoId: number | null;
  programaId: number | null;
  etapaFinanciamientoId: number | null; // Tu schema lo tiene así
  proyectistaId: number | null; // El ID es público

  // Campos financieros básicos (públicos)
  monto: string | number | null; // Prisma Decimal puede ser string
  tipoMoneda: TipoMoneda;

  // --- CAMPOS INTERNOS (Opcionales en el tipo del frontend) ---
  formuladorId?: number | null;
  proyectista?: UserProjectTeamMember | null; // Objeto de usuario, opcional
  formulador?: UserProjectTeamMember | null;  // Objeto de usuario, opcional
  colaboradores?: UserProjectTeamMember[];    // Array de objetos de usuario, opcional (podría ser [] si no hay o undefined si no se tiene permiso)

  codigoExpediente?: string | null;
  fechaPostulacion?: string | Date | null; // La API devuelve string, el DatePicker usa Date
  montoAdjudicado?: string | number | null; // Prisma Decimal puede ser string
  codigoLicitacion?: string | null;

  // Relaciones con Tareas (si las incluyes directamente en el objeto Project en algún momento)
  // tareas?: Task[]; // Opcional, y Task tendría su propia definición
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

// Sub-tipo para el mensaje citado en una respuesta.
// Esto mantiene la interfaz ChatMessage más limpia.
export interface ParentChatMessage {
  id: number;
  contenido: string;
  remitente: {
    id: number;
    name?: string | null;
  };
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
  // Campos para la funcionalidad de respuestas
  mensajePadreId?: number | null;
  mensajePadre?: ParentChatMessage | null; // Contiene el objeto del mensaje respondido
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
}

export enum CategoriaNotificacion {
  SISTEMA = 'SISTEMA',
  CHAT = 'CHAT',
}

// --- INTERFAZ PARA NOTIFICACIONES ---
export interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string | Date; // La API podría devolver string, pero es bueno castear a Date si se usa
  urlDestino?: string | null;
  tipo: TipoNotificacion; // Usa el enum definido arriba
  categoria: CategoriaNotificacion;
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
    proyectistaId?: number | null;
  };
  mensajes?: ChatMessage[]; // Array de mensajes, se cargará en getTaskById
  tieneMensajesNuevosEnChat?: boolean;
  chatStatuses?: { lastReadTimestamp: string | Date | null }[] | null;
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

export interface UserProjectTeamMember { // O UserSummary, UserDigest, etc.
  id: number;
  name?: string | null;
  email: string;
  // No incluimos 'role' aquí porque tu select en getProjectSelectFields no lo trae para proyectista/formulador/colaboradores
}