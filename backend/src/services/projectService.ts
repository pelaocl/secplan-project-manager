import { Prisma, PrismaClient, Role, User as PrismaUser, TipoMoneda } from '@prisma/client';
import prisma from '../config/prismaClient';
import { CreateProjectInput, UpdateProjectInput, ListProjectsQuery } from '../schemas/projectSchemas';
// Asegúrate que AppError esté importado
import { ForbiddenError, NotFoundError, BadRequestError, AppError } from '../utils/errors';

// Tipo para usuario autenticado (ajusta según UserPayload en express.d.ts)
interface AuthenticatedUser {
    id: number;
    role: Role;
    email?: string;
    name?: string;
}

// Helper para seleccionar campos basado en autenticación/rol
const getProjectSelectFields = (user?: AuthenticatedUser): Prisma.ProjectSelect => {
    // --- DEBUG LOG ---
    console.log('[getProjectSelectFields] Received user:', user ? { id: user.id, role: user.role } : 'undefined');

    const publicFields: Prisma.ProjectSelect = {
        id: true,
        codigoUnico: true,
        nombre: true,
        direccion: true,
        superficieTerreno: true,
        superficieEdificacion: true,
        ano: true,
        proyectoPriorizado: true,
        createdAt: true,
        updatedAt: true,
        estado: { select: { id: true, nombre: true } },
        unidad: { select: { id: true, nombre: true, abreviacion: true } },
        tipologia: { select: { id: true, nombre: true, abreviacion: true, colorChip: true } },
        sector: { select: { id: true, nombre: true } },
    };

    // Verifica si el usuario existe, tiene rol y no es visitante implícito
    // (Aunque 'VISITANTE' no debería llegar aquí si authenticateToken funciona bien)
    if (user && user.role && user.role !== Role.VISITANTE) {
         // --- DEBUG LOG ---
         console.log('[getProjectSelectFields] User is authenticated, returning EXTENDED fields.');
        const extendedFields: Prisma.ProjectSelect = {
            ...publicFields,
            descripcion: true,
            proyectistaId: true,
            formuladorId: true,
            proyectista: { select: { id: true, name: true, email: true } },
            formulador: { select: { id: true, name: true, email: true } },
            colaboradores: { select: { id: true, name: true, email: true } },
            lineaFinanciamientoId: true,
            programaId: true,
            etapaFinanciamientoId: true,
            monto: true,
            tipoMoneda: true,
            codigoExpediente: true,
            fechaPostulacion: true,
            montoAdjudicado: true,
            codigoLicitacion: true,
            lineaFinanciamiento: { select: { id: true, nombre: true } },
            programa: { select: { id: true, nombre: true } },
            etapaActualFinanciamiento: { select: { id: true, nombre: true } },
        };
        return extendedFields;
    } else {
         // --- DEBUG LOG ---
         console.log('[getProjectSelectFields] User is public/visitor, returning PUBLIC fields.');
        return publicFields;
    }
};

// Generar codigoUnico (sin cambios)
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

// Obtener todos los proyectos con filtros y paginación
export const findAllProjects = async (query: ListProjectsQuery, user?: AuthenticatedUser) => {
    // --- DEBUG LOG ---
    console.log('[findAllProjects] Received user:', user ? { id: user.id, role: user.role } : 'undefined');

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', searchText, estadoId, tipologiaId, unidadId, sectorId, } = query;
    const skip = (page - 1) * limit;
    const take = limit;
    const where: Prisma.ProjectWhereInput = {};

    if (searchText) {
        const searchConditions: Prisma.ProjectWhereInput[] = [
            { nombre: { contains: searchText, mode: 'insensitive' } },
            { codigoUnico: { contains: searchText, mode: 'insensitive' } },
        ];
        if (user) { // Solo busca en descripción si el usuario está logueado
            searchConditions.push({ descripcion: { contains: searchText, mode: 'insensitive' } });
        }
        where.OR = searchConditions;
    }

    if (estadoId) where.estadoId = estadoId;
    if (tipologiaId) where.tipologiaId = tipologiaId;
    if (unidadId) where.unidadId = unidadId;
    if (sectorId) where.sectorId = sectorId;

    // Llama al helper para obtener los campos a seleccionar
    const select = getProjectSelectFields(user);

    // Ejecuta las consultas de obtener datos y contar total en una transacción
    const [projects, total] = await prisma.$transaction([
        prisma.project.findMany({ where, select, skip, take, orderBy: { [sortBy]: sortOrder } }),
        prisma.project.count({ where }),
    ]);

    return { projects, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// Obtener un proyecto por ID
export const findProjectById = async (id: number, user?: AuthenticatedUser) => {
    const select = getProjectSelectFields(user);
    const project = await prisma.project.findUnique({ where: { id }, select });
     if (!project) {
         throw new NotFoundError('Proyecto no encontrado'); // Lanza error si no existe
     }
    return project;
};

// Crear un nuevo proyecto
export const createProject = async (data: CreateProjectInput, user: AuthenticatedUser) => {
    // Solo ADMIN o COORDINADOR pueden crear (validado por middleware de rol antes)
    const codigoUnico = await generateCodigoUnico(data.tipologiaId);

    const createData: Prisma.ProjectCreateInput = {
        codigoUnico,
        nombre: data.nombre,
        tipologia: { connect: { id: data.tipologiaId } },
        descripcion: data.descripcion,
        direccion: data.direccion,
        superficieTerreno: data.superficieTerreno,
        superficieEdificacion: data.superficieEdificacion,
        ano: data.ano,
        proyectoPriorizado: data.proyectoPriorizado,
        tipoMoneda: data.tipoMoneda, // Tipo Enum de Prisma
        monto: data.monto,
        codigoExpediente: data.codigoExpediente,
        fechaPostulacion: data.fechaPostulacion, // Es Date o null
        montoAdjudicado: data.montoAdjudicado,
        codigoLicitacion: data.codigoLicitacion,

        // Conectar relaciones opcionales
        ...(data.estadoId && { estado: { connect: { id: data.estadoId } } }),
        ...(data.unidadId && { unidad: { connect: { id: data.unidadId } } }),
        ...(data.sectorId && { sector: { connect: { id: data.sectorId } } }),
        ...(data.proyectistaId && { proyectista: { connect: { id: data.proyectistaId } } }),
        ...(data.formuladorId && { formulador: { connect: { id: data.formuladorId } } }),
        ...(data.lineaFinanciamientoId && { lineaFinanciamiento: { connect: { id: data.lineaFinanciamientoId } } }),
        ...(data.programaId && { programa: { connect: { id: data.programaId } } }),
        ...(data.etapaFinanciamientoId && { etapaActualFinanciamiento: { connect: { id: data.etapaFinanciamientoId } } }),
        ...(data.colaboradoresIds && data.colaboradoresIds.length > 0 && {
            colaboradores: { connect: data.colaboradoresIds.map((id: number) => ({ id })) }
        }),
    };

    const newProject = await prisma.project.create({
        data: createData,
         // Selecciona los campos del proyecto recién creado para devolverlos
         select: getProjectSelectFields(user) // Usa el mismo selector
    });
    return newProject;
};

// Actualizar un proyecto existente
export const updateProject = async (id: number, data: UpdateProjectInput, user: AuthenticatedUser) => {
    // Busca el proyecto para verificar existencia y permisos
    const project = await prisma.project.findUnique({
        where: { id },
        select: { proyectistaId: true } // Solo necesitamos esto para la lógica de permisos
    });

    if (!project) {
        throw new NotFoundError('Proyecto no encontrado');
    }

    // Lógica de Permisos: USUARIO solo edita si es proyectista asignado
    if (user.role === Role.USUARIO && project.proyectistaId !== user.id) {
        throw new ForbiddenError('No tienes permiso para editar este proyecto.');
    }
    // ADMIN y COORDINADOR pueden editar cualquiera (validado por middleware de rol antes)

    // Construye el objeto de datos para la actualización
    const updateData: Prisma.ProjectUpdateInput = {
        // Campos directos (solo se actualizan si vienen en 'data')
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.direccion !== undefined && { direccion: data.direccion }),
        ...(data.superficieTerreno !== undefined && { superficieTerreno: data.superficieTerreno }),
        ...(data.superficieEdificacion !== undefined && { superficieEdificacion: data.superficieEdificacion }),
        ...(data.ano !== undefined && { ano: data.ano }),
        ...(data.proyectoPriorizado !== undefined && { proyectoPriorizado: data.proyectoPriorizado }),
        ...(data.tipoMoneda !== undefined && { tipoMoneda: data.tipoMoneda }),
        ...(data.monto !== undefined && { monto: data.monto }),
        ...(data.codigoExpediente !== undefined && { codigoExpediente: data.codigoExpediente }),
        ...(data.fechaPostulacion !== undefined && { fechaPostulacion: data.fechaPostulacion }),
        ...(data.montoAdjudicado !== undefined && { montoAdjudicado: data.montoAdjudicado }),
        ...(data.codigoLicitacion !== undefined && { codigoLicitacion: data.codigoLicitacion }),

        // Manejo de relaciones (conectar si viene ID, desconectar si viene null)
        ...(data.tipologiaId !== undefined && { tipologia: { connect: { id: data.tipologiaId } } }),
        ...(data.estadoId !== undefined && { estado: data.estadoId ? { connect: { id: data.estadoId } } : { disconnect: true } }),
        ...(data.unidadId !== undefined && { unidad: data.unidadId ? { connect: { id: data.unidadId } } : { disconnect: true } }),
        ...(data.sectorId !== undefined && { sector: data.sectorId ? { connect: { id: data.sectorId } } : { disconnect: true } }),
        ...(data.proyectistaId !== undefined && { proyectista: data.proyectistaId ? { connect: { id: data.proyectistaId } } : { disconnect: true } }),
        ...(data.formuladorId !== undefined && { formulador: data.formuladorId ? { connect: { id: data.formuladorId } } : { disconnect: true } }),
        ...(data.lineaFinanciamientoId !== undefined && { lineaFinanciamiento: data.lineaFinanciamientoId ? { connect: { id: data.lineaFinanciamientoId } } : { disconnect: true } }),
        ...(data.programaId !== undefined && { programa: data.programaId ? { connect: { id: data.programaId } } : { disconnect: true } }),
        ...(data.etapaFinanciamientoId !== undefined && { etapaActualFinanciamiento: data.etapaFinanciamientoId ? { connect: { id: data.etapaFinanciamientoId } } : { disconnect: true } }),

        // Manejo de relación ManyToMany (colaboradores) - usar 'set' para reemplazar
        ...(data.colaboradoresIds !== undefined && {
            colaboradores: { set: data.colaboradoresIds.map((id: number) => ({ id })) }
        }),
    };

    // Evita una actualización vacía
    if (Object.keys(updateData).length === 0) {
         console.warn(`Update attempt on project ${id} with no changes.`);
         // Devuelve el proyecto sin cambios buscándolo de nuevo con los campos correctos
         return await findProjectById(id, user);
    }

    // Realiza la actualización
    const updatedProject = await prisma.project.update({
        where: { id },
        data: updateData,
        select: getProjectSelectFields(user) // Devuelve el proyecto actualizado con los campos correctos
    });

    return updatedProject;
};

// Eliminar un proyecto
export const deleteProject = async (id: number, user: AuthenticatedUser) => {
    // Permiso: Solo ADMIN puede eliminar (validado por middleware de rol antes)
    if (user.role !== Role.ADMIN) {
        throw new ForbiddenError('Solo los administradores pueden eliminar proyectos.');
    }
    // Verifica si existe antes de borrar
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
        throw new NotFoundError('Proyecto no encontrado');
    }
    try {
        await prisma.project.delete({ where: { id } });
        // No se devuelve nada en un DELETE exitoso (HTTP 204)
    } catch (error) {
         console.error("Error deleting project:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             // Error de constraint (ej. tareas asociadas si no hay onDelete: Cascade)
             throw new BadRequestError('No se puede eliminar el proyecto porque tiene datos relacionados.');
         }
         // Lanza error genérico si falla por otra razón
         throw new AppError('Error al eliminar el proyecto.', 500);
    }
};

// La función getFormOptions se movió a lookupService.ts