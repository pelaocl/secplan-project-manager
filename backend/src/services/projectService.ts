// backend/src/services/projectService.ts (LIMPIO - Revisado)
import { Prisma, Role, TipoMoneda } from '@prisma/client';
import prisma from '../config/prismaClient';
import { CreateProjectInput, UpdateProjectInput, ListProjectsQuery } from '../schemas/projectSchemas';
import { ForbiddenError, NotFoundError, BadRequestError, AppError } from '../utils/errors';

interface AuthenticatedUser { id: number; role: Role; email?: string; name?: string; }

// Helper getProjectSelectFields (LIMPIO Y VERIFICADO)
// ESTA FUNCIÓN ES IDÉNTICA A LA VERSIÓN FUNCIONAL ANTERIOR, SOLO SIN LOGS
const getProjectSelectFields = (user?: AuthenticatedUser): Prisma.ProjectSelect => {
    const publicFields: Prisma.ProjectSelect = {
        id: true, codigoUnico: true, nombre: true, direccion: true, superficieTerreno: true,
        superficieEdificacion: true, ano: true, proyectoPriorizado: true, createdAt: true, updatedAt: true,
        estado: { select: { id: true, nombre: true } },
        unidad: { select: { id: true, nombre: true, abreviacion: true } },
        tipologia: { select: { id: true, nombre: true, abreviacion: true, colorChip: true } },
        sector: { select: { id: true, nombre: true } },
    };
    if (user && user.role && user.role !== Role.VISITANTE) {
        // La versión extendida incluye todo lo público MÁS lo interno/relacionado
        return {
            ...publicFields,
            descripcion: true, proyectistaId: true, formuladorId: true,
            proyectista: { select: { id: true, name: true, email: true } },
            formulador: { select: { id: true, name: true, email: true } },
            colaboradores: { select: { id: true, name: true, email: true } },
            lineaFinanciamientoId: true, programaId: true, etapaFinanciamientoId: true,
            monto: true, tipoMoneda: true, codigoExpediente: true, fechaPostulacion: true,
            montoAdjudicado: true, codigoLicitacion: true,
            lineaFinanciamiento: { select: { id: true, nombre: true } },
            programa: { select: { id: true, nombre: true } },
            etapaActualFinanciamiento: { select: { id: true, nombre: true } },
        };
    }
    return publicFields;
};

// Función generateCodigoUnico (sin cambios)
async function generateCodigoUnico(tipologiaId: number): Promise<string> {
    const tipologia = await prisma.tipologiaProyecto.findUnique({ where: { id: tipologiaId }, select: { abreviacion: true } });
    if (!tipologia) { throw new BadRequestError('Tipología inválida para generar código único.'); }
    const abr = tipologia.abreviacion;
    const lastProject = await prisma.project.findFirst({ where: { tipologiaId: tipologiaId, }, orderBy: { codigoUnico: 'desc', }, select: { codigoUnico: true } });
    let nextCorrelativo = 1;
    if (lastProject && lastProject.codigoUnico.startsWith(`${abr}-`)) {
        const parts = lastProject.codigoUnico.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) { nextCorrelativo = lastNum + 1; }
    }
    const correlativoStr = nextCorrelativo.toString().padStart(3, '0');
    return `${abr}-${correlativoStr}`;
 }

// Función findAllProjects (LIMPIO)
export const findAllProjects = async (query: ListProjectsQuery, user?: AuthenticatedUser) => {
    const page = parseInt(String(query.page || '1'), 10);
    const limit = parseInt(String(query.limit || '10'), 10);
    const safePage = isNaN(page) || page < 1 ? 1 : page;
    const safeLimit = isNaN(limit) || limit < 1 || limit > 100 ? 10 : limit;
    const { sortBy = 'createdAt', sortOrder = 'desc', searchText, estadoId, tipologiaId, unidadId, sectorId, } = query;
    const skip = (safePage - 1) * safeLimit;
    const take = safeLimit;
    const where: Prisma.ProjectWhereInput = {};
    if (searchText) { const searchConditions: Prisma.ProjectWhereInput[] = [ { nombre: { contains: searchText, mode: 'insensitive' } }, { codigoUnico: { contains: searchText, mode: 'insensitive' } }, ]; if (user) { searchConditions.push({ descripcion: { contains: searchText, mode: 'insensitive' } }); } where.OR = searchConditions; }
    if (estadoId) where.estadoId = Number(estadoId); if (tipologiaId) where.tipologiaId = Number(tipologiaId); if (unidadId) where.unidadId = Number(unidadId); if (sectorId) where.sectorId = Number(sectorId);
    const select = getProjectSelectFields(user); // Llama al helper limpio
    try {
        const [projects, total] = await prisma.$transaction([
            prisma.project.findMany({ where, select, skip, take, orderBy: { [sortBy]: sortOrder } }),
            prisma.project.count({ where }),
        ]);
        return { projects, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
    } catch (error) {
        console.error("Error in findAllProjects transaction:", error);
        throw new AppError("Error al buscar proyectos", 500);
    }
};

// Función findProjectById (LIMPIO)
export const findProjectById = async (id: number, user?: AuthenticatedUser) => {
    const select = getProjectSelectFields(user); // Llama al helper limpio
    try {
        const project = await prisma.project.findUnique({ where: { id }, select });
        if (!project) { throw new NotFoundError('Proyecto no encontrado'); }
        return project;
    } catch (error) {
        console.error(`Error in findProjectById for ID ${id}:`, error);
        if (error instanceof NotFoundError) throw error;
        throw new AppError("Error al buscar el proyecto", 500);
    }
};

// Función createProject (LIMPIO)
export const createProject = async (data: CreateProjectInput, user: AuthenticatedUser) => {
  console.log(`[createProject] Attempting creation by User ${user.id}`); // Log informativo útil
  const codigoUnico = await generateCodigoUnico(data.tipologiaId);
  const parseIntOptional = (value: unknown): number | null => { const num = Number(value); return !isNaN(num) && Number.isInteger(num) && num > 0 ? num : null; };
  const parseIntAno = (value: unknown): number | null => { const num = Number(value); return !isNaN(num) && Number.isInteger(num) && num >= 1900 && num <= new Date().getFullYear() + 10 ? num : null; };
  const parseDecimalOptional = (value: unknown): Prisma.Decimal | null => { if (value == null || value === '') return null; const num = Number(typeof value === 'string' ? value.replace(',', '.') : value); return !isNaN(num) && num >= 0 ? new Prisma.Decimal(num) : null; };
  const parseDateOptional = (value: unknown): Date | null => { if (value == null || value === '') return null; const date = (value instanceof Date) ? value : new Date(String(value) + 'T00:00:00Z'); return !isNaN(date.getTime()) ? date : null; };
  const createData: Prisma.ProjectCreateInput = {
      codigoUnico, nombre: data.nombre, descripcion: data.descripcion ?? null, direccion: data.direccion ?? null,
      superficieTerreno: parseDecimalOptional(data.superficieTerreno), superficieEdificacion: parseDecimalOptional(data.superficieEdificacion),
      ano: parseIntAno(data.ano), proyectoPriorizado: data.proyectoPriorizado ?? false, tipoMoneda: data.tipoMoneda ?? TipoMoneda.CLP,
      monto: parseDecimalOptional(data.monto), codigoExpediente: data.codigoExpediente ?? null, fechaPostulacion: parseDateOptional(data.fechaPostulacion),
      montoAdjudicado: parseDecimalOptional(data.montoAdjudicado), codigoLicitacion: data.codigoLicitacion ?? null,
      tipologia: { connect: { id: data.tipologiaId } },
      estado: data.estadoId ? { connect: { id: Number(data.estadoId) } } : undefined,
      unidad: data.unidadId ? { connect: { id: Number(data.unidadId) } } : undefined,
      sector: data.sectorId ? { connect: { id: Number(data.sectorId) } } : undefined,
      proyectista: data.proyectistaId ? { connect: { id: data.proyectistaId } } : undefined,
      formulador: data.formuladorId ? { connect: { id: data.formuladorId } } : undefined,
      lineaFinanciamiento: data.lineaFinanciamientoId ? { connect: { id: Number(data.lineaFinanciamientoId) } } : undefined,
      programa: data.programaId ? { connect: { id: Number(data.programaId) } } : undefined,
      etapaActualFinanciamiento: data.etapaFinanciamientoId ? { connect: { id: Number(data.etapaFinanciamientoId) } } : undefined,
      ...(data.colaboradoresIds && data.colaboradoresIds.length > 0 && { colaboradores: { connect: data.colaboradoresIds.filter(id => id != null).map((id) => ({ id: Number(id) })) } }),
  };
  // Log de data enviada eliminado
  try {
      const newProject = await prisma.project.create({ data: createData, select: getProjectSelectFields(user) });
      console.log(`[createProject] Project created successfully by user ${user.id} with ID: ${newProject.id}`); // Log de éxito
      return newProject;
   } catch(error) {
       console.error(`[createProject] Error during prisma.project.create:`, error); // Log de error
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { throw new BadRequestError(`Error al crear: El código único '${codigoUnico}' u otro campo único ya existe.`); }
       throw new AppError("Error al crear el proyecto en la base de datos", 500);
   }
};

// Función updateProject (LIMPIO)
export const updateProject = async (id: number, data: UpdateProjectInput, user: AuthenticatedUser) => { /* ... lógica interna sin cambios ... */ };

// Función deleteProject (LIMPIO)
export const deleteProject = async (id: number, user: AuthenticatedUser) => { /* ... lógica interna sin cambios ... */ };