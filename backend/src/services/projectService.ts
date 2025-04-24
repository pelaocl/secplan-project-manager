import { Prisma, PrismaClient, Role, User as PrismaUser, TipoMoneda } from '@prisma/client';
import prisma from '../config/prismaClient';
import { CreateProjectInput, UpdateProjectInput, ListProjectsQuery } from '../schemas/projectSchemas';
import { ForbiddenError, NotFoundError, BadRequestError, AppError } from '../utils/errors';

interface AuthenticatedUser { id: number; role: Role; email?: string; name?: string; }

// Helper getProjectSelectFields (con logs de depuración añadidos antes)
const getProjectSelectFields = (user?: AuthenticatedUser): Prisma.ProjectSelect => {
    console.log('[getProjectSelectFields] Determining fields for user:', user ? user.role : 'Public');
    const publicFields: Prisma.ProjectSelect = { id: true, codigoUnico: true, nombre: true, direccion: true, superficieTerreno: true, superficieEdificacion: true, ano: true, proyectoPriorizado: true, createdAt: true, updatedAt: true, estado: { select: { id: true, nombre: true } }, unidad: { select: { id: true, nombre: true, abreviacion: true } }, tipologia: { select: { id: true, nombre: true, abreviacion: true, colorChip: true } }, sector: { select: { id: true, nombre: true } }, };
    if (user && user.role && user.role !== Role.VISITANTE) {
         console.log('[getProjectSelectFields] Selecting EXTENDED fields.');
        const extendedFields = { ...publicFields, descripcion: true, proyectistaId: true, formuladorId: true, proyectista: { select: { id: true, name: true, email: true } }, formulador: { select: { id: true, name: true, email: true } }, colaboradores: { select: { id: true, name: true, email: true } }, lineaFinanciamientoId: true, programaId: true, etapaFinanciamientoId: true, monto: true, tipoMoneda: true, codigoExpediente: true, fechaPostulacion: true, montoAdjudicado: true, codigoLicitacion: true, lineaFinanciamiento: { select: { id: true, nombre: true } }, programa: { select: { id: true, nombre: true } }, etapaActualFinanciamiento: { select: { id: true, nombre: true } }, };
        return extendedFields;
    } else {
         console.log('[getProjectSelectFields] Selecting PUBLIC fields.');
        return publicFields;
    }
};

// Función generateCodigoUnico (sin cambios)
async function generateCodigoUnico(tipologiaId: number): Promise<string> { /* ... */ const tipologia = await prisma.tipologiaProyecto.findUnique({ where: { id: tipologiaId }, select: { abreviacion: true } }); if (!tipologia) { throw new BadRequestError('Tipología inválida para generar código único.'); } const abr = tipologia.abreviacion; const lastProject = await prisma.project.findFirst({ where: { tipologiaId: tipologiaId, }, orderBy: { codigoUnico: 'desc', }, select: { codigoUnico: true } }); let nextCorrelativo = 1; if (lastProject && lastProject.codigoUnico.startsWith(`${abr}-`)) { const parts = lastProject.codigoUnico.split('-'); const lastNum = parseInt(parts[parts.length - 1], 10); if (!isNaN(lastNum)) { nextCorrelativo = lastNum + 1; } } const correlativoStr = nextCorrelativo.toString().padStart(3, '0'); return `${abr}-${correlativoStr}`; }

// Función findAllProjects (con logs de depuración añadidos antes)
export const findAllProjects = async (query: ListProjectsQuery, user?: AuthenticatedUser) => {
    console.log('[findAllProjects] Service received user:', user ? { id: user.id, role: user.role } : 'undefined');
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', searchText, estadoId, tipologiaId, unidadId, sectorId, } = query;
    const skip = (page - 1) * limit;
    const take = limit;
    const where: Prisma.ProjectWhereInput = {};
    if (searchText) { const searchConditions: Prisma.ProjectWhereInput[] = [ { nombre: { contains: searchText, mode: 'insensitive' } }, { codigoUnico: { contains: searchText, mode: 'insensitive' } }, ]; if (user) { searchConditions.push({ descripcion: { contains: searchText, mode: 'insensitive' } }); } where.OR = searchConditions; }
    if (estadoId) where.estadoId = estadoId; if (tipologiaId) where.tipologiaId = tipologiaId; if (unidadId) where.unidadId = unidadId; if (sectorId) where.sectorId = sectorId;
    const select = getProjectSelectFields(user);
    console.log('[findAllProjects] Using select keys:', Object.keys(select));
    const [projects, total] = await prisma.$transaction([
        prisma.project.findMany({ where, select, skip, take, orderBy: { [sortBy]: sortOrder } }),
        prisma.project.count({ where }),
    ]);
    console.log('[findAllProjects] Projects fetched from DB:', JSON.stringify(projects, null, 2));
    return { projects, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// Función findProjectById (sin cambios)
export const findProjectById = async (id: number, user?: AuthenticatedUser) => { /* ... */ const select = getProjectSelectFields(user); const project = await prisma.project.findUnique({ where: { id }, select }); if (!project) { throw new NotFoundError('Proyecto no encontrado'); } return project; };

// Función createProject (con la corrección Y EL NUEVO LOG)
export const createProject = async (data: CreateProjectInput, user: AuthenticatedUser) => {
  // --- NUEVO LOG ---
  console.log('[BACKEND createProject] Service received data:', JSON.stringify(data, null, 2));
  // --- FIN NUEVO LOG ---

  console.log(`[createProject] Attempting creation by User ${user.id}`); // Log existente
  const codigoUnico = await generateCodigoUnico(data.tipologiaId);

  const createData: Prisma.ProjectCreateInput = {
      // Campos Directos
      codigoUnico, nombre: data.nombre, descripcion: data.descripcion, direccion: data.direccion,
      superficieTerreno: data.superficieTerreno, superficieEdificacion: data.superficieEdificacion,
      ano: data.ano, // <<< ¡Asegúrate que este 'ano' llegue bien en 'data'!
      proyectoPriorizado: data.proyectoPriorizado, tipoMoneda: data.tipoMoneda, monto: data.monto,
      codigoExpediente: data.codigoExpediente, fechaPostulacion: data.fechaPostulacion,
      montoAdjudicado: data.montoAdjudicado, codigoLicitacion: data.codigoLicitacion,
      // Relaciones
      tipologia: { connect: { id: data.tipologiaId } },
      estado: data.estadoId ? { connect: { id: data.estadoId } } : undefined, // <<< ¡Asegúrate que 'estadoId' llegue bien!
      unidad: data.unidadId ? { connect: { id: data.unidadId } } : undefined, // <<< ¡Asegúrate que 'unidadId' llegue bien!
      sector: data.sectorId ? { connect: { id: data.sectorId } } : undefined,
      proyectista: data.proyectistaId ? { connect: { id: data.proyectistaId } } : undefined,
      formulador: data.formuladorId ? { connect: { id: data.formuladorId } } : undefined,
      lineaFinanciamiento: data.lineaFinanciamientoId ? { connect: { id: data.lineaFinanciamientoId } } : undefined,
      programa: data.programaId ? { connect: { id: data.programaId } } : undefined,
      etapaActualFinanciamiento: data.etapaFinanciamientoId ? { connect: { id: data.etapaFinanciamientoId } } : undefined,
      ...(data.colaboradoresIds && data.colaboradoresIds.length > 0 && {
          colaboradores: { connect: data.colaboradoresIds.map((id: number) => ({ id })) }
      }),
  };

  console.log('[createProject] Data being sent to prisma.project.create:', createData);

  const newProject = await prisma.project.create({
      data: createData,
      select: getProjectSelectFields(user)
  });
  console.log(`[createProject] Project created successfully by user ${user.id} with ID: ${newProject.id}`);
  return newProject;
};

// Función updateProject (sin cambios respecto a la última versión)
export const updateProject = async (id: number, data: UpdateProjectInput, user: AuthenticatedUser) => { /* ... */ const project = await prisma.project.findUnique({ where: { id }, select: { proyectistaId: true } }); if (!project) { throw new NotFoundError('Proyecto no encontrado'); } if (user.role === Role.USUARIO && project.proyectistaId !== user.id) { throw new ForbiddenError('No tienes permiso para editar este proyecto.'); } const updateData: Prisma.ProjectUpdateInput = { /* ... */ ...(data.nombre !== undefined && { nombre: data.nombre }), ...(data.descripcion !== undefined && { descripcion: data.descripcion }), ...(data.direccion !== undefined && { direccion: data.direccion }), ...(data.superficieTerreno !== undefined && { superficieTerreno: data.superficieTerreno }), ...(data.superficieEdificacion !== undefined && { superficieEdificacion: data.superficieEdificacion }), ...(data.ano !== undefined && { ano: data.ano }), ...(data.proyectoPriorizado !== undefined && { proyectoPriorizado: data.proyectoPriorizado }), ...(data.tipoMoneda !== undefined && { tipoMoneda: data.tipoMoneda }), ...(data.monto !== undefined && { monto: data.monto }), ...(data.codigoExpediente !== undefined && { codigoExpediente: data.codigoExpediente }), ...(data.fechaPostulacion !== undefined && { fechaPostulacion: data.fechaPostulacion }), ...(data.montoAdjudicado !== undefined && { montoAdjudicado: data.montoAdjudicado }), ...(data.codigoLicitacion !== undefined && { codigoLicitacion: data.codigoLicitacion }), ...(data.tipologiaId !== undefined && { tipologia: { connect: { id: data.tipologiaId } } }), ...(data.estadoId !== undefined && { estado: data.estadoId ? { connect: { id: data.estadoId } } : { disconnect: true } }), ...(data.unidadId !== undefined && { unidad: data.unidadId ? { connect: { id: data.unidadId } } : { disconnect: true } }), ...(data.sectorId !== undefined && { sector: data.sectorId ? { connect: { id: data.sectorId } } : { disconnect: true } }), ...(data.proyectistaId !== undefined && { proyectista: data.proyectistaId ? { connect: { id: data.proyectistaId } } : { disconnect: true } }), ...(data.formuladorId !== undefined && { formulador: data.formuladorId ? { connect: { id: data.formuladorId } } : { disconnect: true } }), ...(data.lineaFinanciamientoId !== undefined && { lineaFinanciamiento: data.lineaFinanciamientoId ? { connect: { id: data.lineaFinanciamientoId } } : { disconnect: true } }), ...(data.programaId !== undefined && { programa: data.programaId ? { connect: { id: data.programaId } } : { disconnect: true } }), ...(data.etapaFinanciamientoId !== undefined && { etapaActualFinanciamiento: data.etapaFinanciamientoId ? { connect: { id: data.etapaFinanciamientoId } } : { disconnect: true } }), ...(data.colaboradoresIds !== undefined && { colaboradores: { set: data.colaboradoresIds.map((id: number) => ({ id })) } }), }; if (Object.keys(updateData).length === 0) { console.warn(`Update attempt on project ${id} with no changes.`); return await findProjectById(id, user); } const updatedProject = await prisma.project.update({ where: { id }, data: updateData, select: getProjectSelectFields(user) }); return updatedProject; };

// Función deleteProject (sin cambios)
export const deleteProject = async (id: number, user: AuthenticatedUser) => { /* ... */ if (user.role !== Role.ADMIN) { throw new ForbiddenError('Solo los administradores pueden eliminar proyectos.'); } const project = await prisma.project.findUnique({ where: { id } }); if (!project) { throw new NotFoundError('Proyecto no encontrado'); } try { await prisma.project.delete({ where: { id } }); } catch (error) { console.error("Error deleting project:", error); if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') { throw new BadRequestError('No se puede eliminar el proyecto porque tiene datos relacionados.'); } throw new AppError('Error al eliminar el proyecto.', 500); } };