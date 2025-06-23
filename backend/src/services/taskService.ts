// backend/src/services/taskService.ts
import prisma from '../config/prismaClient';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { 
    Role, 
    User as PrismaUser, 
    Project as PrismaProject,
    Tarea,
    TipoNotificacion,
    TipoRecursoNotificacion,
    EstadoTarea, // Asegúrate que EstadoTarea esté importado si lo usas
    Prisma // Para Prisma.TareaCreateInput y otros tipos de input de Prisma
} from '@prisma/client';
import { emitToUser } from '../socketManager';
import { UserPayload } from '../types/express';
import { notificationService } from './notificationService';

// Tipo para la tarea que incluye el nuevo flag y las relaciones seleccionadas
export type TaskWithChatStatusAndDetails = Tarea & { 
    tieneMensajesNuevosEnChat?: boolean;
    creador?: { id: number; name: string | null; email: string; role: Role; } | null;
    asignado?: { id: number; name: string | null; email: string; role: Role; } | null;
    proyecto?: { id: number; nombre: string; codigoUnico: string; proyectistaId: number | null; }; // Añadido proyectistaId
    participantes?: { id: number; name: string | null; email: string; role: Role; }[]; // Para la respuesta de createTask
};

// Tipo de retorno ajustado para checkProjectAccess
type ProjectForAccessCheck = PrismaProject & { 
    proyectista?: { id: number } | null; 
    formulador?: { id: number } | null;
    colaboradores: { id: number }[];
    tareas: { asignadoId: number | null }[];
};

// Helper para verificar permisos
const checkProjectAccess = async (
    projectId: number, 
    requestingUser: UserPayload
): Promise<ProjectForAccessCheck> => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { 
            proyectista: { select: { id: true } },
            formulador: { select: { id: true } },  
            colaboradores: { select: { id: true } },
            tareas: { select: { asignadoId: true } }
        }
    });

    if (!project) {
        throw new NotFoundError(`Proyecto con ID ${projectId} no encontrado.`);
    }

    if (requestingUser.role === Role.ADMIN || requestingUser.role === Role.COORDINADOR) {
        return project as ProjectForAccessCheck;
    }

    const isProyectista = project.proyectistaId === requestingUser.id;
    const isFormulador = project.formuladorId === requestingUser.id;
    const isColaborador = project.colaboradores.some(colab => colab.id === requestingUser.id);
    const isTaskAssigneeInProject = project.tareas.some(tarea => tarea.asignadoId === requestingUser.id);

    if (!isProyectista && !isFormulador && !isColaborador && !isTaskAssigneeInProject) {
        throw new ForbiddenError('No tienes permiso para acceder a los recursos de tareas de este proyecto.');
    }
    return project as ProjectForAccessCheck;
};

export const createTask = async (
    projectId: number,
    data: CreateTaskInput,
    creatorPayload: UserPayload 
): Promise<Tarea> => { // Devuelve el tipo Tarea, el include define lo que trae
    const project = await prisma.project.findUnique({ 
        where: { id: projectId },
        select: { id: true, nombre: true, codigoUnico: true, proyectistaId: true } 
    });
    if (!project) {
        throw new NotFoundError(`Proyecto con ID ${projectId} no encontrado.`);
    }

    const isProjectLeadByProyectistaId = project.proyectistaId === creatorPayload.id;
    const isAdminOrCoordinator = creatorPayload.role === Role.ADMIN || creatorPayload.role === Role.COORDINADOR;

    if (!isAdminOrCoordinator && !isProjectLeadByProyectistaId) {
        throw new ForbiddenError('No tienes permiso para crear tareas en este proyecto.');
    }

    if (data.asignadoId) {
        const asignee = await prisma.user.findUnique({ where: { id: data.asignadoId }, select: {id: true} });
        if (!asignee) throw new AppError(`Usuario asignado principal con ID ${data.asignadoId} no encontrado.`, 400);
    }
    
    // Validar participantesIds si se proveen
    if (data.participantesIds && data.participantesIds.length > 0) {
        const uniqueParticipantesIds = Array.from(new Set(data.participantesIds));
        const participantesDb = await prisma.user.findMany({ 
            where: { id: { in: uniqueParticipantesIds } },
            select: {id: true} 
        });
        if (participantesDb.length !== uniqueParticipantesIds.length) {
            throw new AppError('Alguno de los IDs de participantes proporcionados no es válido.', 400);
        }
    }
    
    const tareaData: Prisma.TareaCreateInput = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        fechaPlazo: data.fechaPlazo,
        estado: data.estado || EstadoTarea.PENDIENTE,
        prioridad: data.prioridad,
        proyecto: { connect: { id: project.id } },
        creador: { connect: { id: creatorPayload.id } },
    };

    if (data.asignadoId) {
        tareaData.asignado = { connect: { id: data.asignadoId } };
    }

    if (data.participantesIds && data.participantesIds.length > 0) {
        const finalParticipantesIds = Array.from(new Set(data.participantesIds))
            .filter(id => id !== creatorPayload.id && id !== data.asignadoId); // Evitar duplicar conexiones si ya son creador/asignado
        if (finalParticipantesIds.length > 0) {
            tareaData.participantes = { connect: finalParticipantesIds.map(id => ({ id })) };
        }
    }
        
    const newTask = await prisma.tarea.create({
        data: tareaData,
        include: { 
            asignado: { select: { id: true, email: true, name: true, role: true }},
            creador: { select: { id: true, email: true, name: true, role: true }},
            proyecto: { select: { id: true, nombre: true, codigoUnico: true, proyectistaId: true } },
            participantes: { select: { id: true, name: true, email: true, role: true } }
        }
    });

    const usersToNotify = new Map<number, { tipo: TipoNotificacion, mensaje: string }>();
    const urlDestino = `/projects/${project.id}/tasks/${newTask.id}`;

    // Notificar al asignado principal
    if (newTask.asignadoId && newTask.asignadoId !== creatorPayload.id) {
        usersToNotify.set(newTask.asignadoId, {
            tipo: TipoNotificacion.NUEVA_TAREA_ASIGNADA,
            mensaje: `Se te ha asignado la tarea: "${newTask.titulo}" en el proyecto "${project.nombre}".`
        });
    }
    // Notificar a los participantes adicionales
    if (newTask.participantes) {
        newTask.participantes.forEach(p => {
            if (p.id !== creatorPayload.id && p.id !== newTask.asignadoId) { // No notificar si ya es creador o asignado principal
                 if (!usersToNotify.has(p.id)) { // Evitar doble notificación si un participante también es proyectista del proyecto
                    usersToNotify.set(p.id, {
                        tipo: TipoNotificacion.TAREA_ACTUALIZADA_INFO, // O un tipo NUEVO_PARTICIPANTE_TAREA
                        mensaje: `Has sido añadido como participante a la tarea: "${newTask.titulo}" en el proyecto "${project.nombre}".`
                    });
                 }
            }
        });
    }
    // Notificar al Proyectista del Proyecto (si existe y no es el creador ni ya está siendo notificado)
    if (project.proyectistaId && project.proyectistaId !== creatorPayload.id && !usersToNotify.has(project.proyectistaId)) {
        usersToNotify.set(project.proyectistaId, {
            tipo: TipoNotificacion.TAREA_ACTUALIZADA_INFO, // O "NUEVA_TAREA_EN_PROYECTO"
            mensaje: `Nueva tarea "${newTask.titulo}" creada en tu proyecto "${project.nombre}" por ${creatorPayload.name || creatorPayload.email}.`
        });
    }

    for (const [userId, notifData] of usersToNotify) {
        try {
            await notificationService.createDBNotification({
                usuarioId: userId,
                tipo: notifData.tipo,
                mensaje: notifData.mensaje,
                urlDestino: urlDestino,
                recursoId: newTask.id,
                recursoTipo: TipoRecursoNotificacion.TAREA
            });
        } catch (e) { console.error(`[TaskService] Error creando notificación para usuario ${userId} para tarea ${newTask.id}:`, e); }
    }
    
    return newTask;
};

export const getTasksByProjectId = async (
    projectId: number,
    requestingUserPayload: UserPayload
): Promise<TaskWithChatStatusAndDetails[]> => {
    await checkProjectAccess(projectId, requestingUserPayload); 
    
    const tasksFromDb = await prisma.tarea.findMany({
        where: { proyectoId: projectId },
        include: {
            creador: { select: { id: true, name: true, email: true, role: true } },
            asignado: { select: { id: true, name: true, email: true, role: true } },
            mensajes: { orderBy: { fechaEnvio: 'desc' }, take: 1, select: { fechaEnvio: true } },
            chatStatuses: { where: { userId: requestingUserPayload.id }, select: { lastReadTimestamp: true } }
        },
        orderBy: { fechaCreacion: 'desc' },
    });

    if (tasksFromDb.length === 0) return [];

    const tasksWithStatus = tasksFromDb.map(task => {
        const lastMessageTimestamp = task.mensajes[0]?.fechaEnvio;
        const userChatStatus = task.chatStatuses[0];
        let tieneMensajesNuevos = false;
        if (lastMessageTimestamp) {
            if (!userChatStatus?.lastReadTimestamp || new Date(lastMessageTimestamp) > new Date(userChatStatus.lastReadTimestamp)) {
                tieneMensajesNuevos = true;
            }
        }
        const { mensajes, chatStatuses, ...taskData } = task; 
        return { ...taskData, tieneMensajesNuevosEnChat: tieneMensajesNuevos };
    });
    return tasksWithStatus as TaskWithChatStatusAndDetails[];
};

export const getTaskById = async (
    projectId: number,
    taskId: number,
    requestingUserPayload: UserPayload
): Promise<Tarea | null> => {
    await checkProjectAccess(projectId, requestingUserPayload);

    const task = await prisma.tarea.findUnique({
        where: { id: taskId },
        include: {
            creador: { select: { id: true, name: true, email: true, role: true } },
            asignado: { select: { id: true, name: true, email: true, role: true } },
            proyecto: { select: { id: true, nombre: true, codigoUnico: true } },
            participantes: { select: { id: true, name: true, email: true, role: true } },
            // --- INICIO DE MODIFICACIÓN ---
            mensajes: { 
                orderBy: { fechaEnvio: 'asc' },
                include: { 
                    remitente: { select: { id: true, name: true, email: true, role: true } },
                    // Añadimos la inclusión del mensaje padre aquí
                    mensajePadre: {
                        select: {
                            id: true,
                            contenido: true,
                            remitente: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                }
            },
            // --- FIN DE MODIFICACIÓN ---
            chatStatuses: { 
                where: { userId: requestingUserPayload.id },
                select: { lastReadTimestamp: true }
            }
        }
    });

    if (!task) throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    if (task.proyectoId !== projectId) throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);
    
    return task;
};

export const getMyTasks = async (
    requestingUserPayload: UserPayload,
    filters: MyTasksQuery
): Promise<TaskWithChatStatusAndDetails[]> => {
    const { id: userId, role } = requestingUserPayload;
    const { projectId, searchTerm } = filters;

    const whereClause: Prisma.TareaWhereInput = {};

    // 1. Condición base según el rol
    if (role === Role.ADMIN || role === Role.COORDINADOR) {
        whereClause.OR = [
            { asignadoId: userId },
            { creadorId: userId }
        ];
    } else { // Rol USUARIO
        whereClause.asignadoId = userId;
    }

    // 2. Añadir filtros adicionales dinámicamente
    const andConditions: Prisma.TareaWhereInput[] = [];
    if (projectId) {
        // Prisma espera un número para el ID, pero los query params pueden llegar como string.
        // Convertimos a número para asegurar que la consulta sea válida.
        const numericProjectId = Number(projectId);
        if (!isNaN(numericProjectId)) {
            andConditions.push({ proyectoId: numericProjectId });
        }
    }
    if (searchTerm) {
        andConditions.push({
            titulo: {
                contains: searchTerm,
                mode: 'insensitive'
            }
        });
    }
    
    // Si hay condiciones de filtro, las añadimos con un AND
    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    const tasksFromDb = await prisma.tarea.findMany({
        where: whereClause,
        include: {
            creador: { select: { id: true, name: true, email: true } },
            asignado: { select: { id: true, name: true, email: true } },
            proyecto: { select: { id: true, nombre: true, codigoUnico: true } },
        },
        orderBy: {
            // Ordenar por tareas sin fecha de plazo al final, luego por fecha más próxima
            fechaPlazo: { sort: 'asc', nulls: 'last' },
        },
    });

    // Tipado explícito para asegurar que el resultado coincida
    return tasksFromDb as TaskWithChatStatusAndDetails[];
};

export const updateTask = async (
    projectId: number,
    taskId: number,
    data: UpdateTaskInput,
    requestingUserPayload: UserPayload
): Promise<Tarea> => {
    await checkProjectAccess(projectId, requestingUserPayload);

    const existingTask = await prisma.tarea.findUnique({
        where: { id: taskId },
        include: {
            proyecto: { select: { id: true, nombre: true } },
            asignado: { select: { id: true } }, 
            creador: { select: { id: true } },
            participantes: { select: { id: true } } // Para notificar a participantes existentes
        }
    });

    if (!existingTask) throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    if (existingTask.proyectoId !== projectId) throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);

    const isAdminOrCoordinator = requestingUserPayload.role === Role.ADMIN || requestingUserPayload.role === Role.COORDINADOR;
    const isAssignee = existingTask.asignadoId === requestingUserPayload.id;
    const isCreator = existingTask.creadorId === requestingUserPayload.id;

        if (!isAdminOrCoordinator) {
        // Si el usuario es el CREADOR de la tarea, permitimos que continúe.
        // Esto le da permiso para editar todos los campos que envíe el formulario.
        if (isCreator) {
            // No se necesita ninguna acción aquí; el creador puede editar.
        } 
        // Si NO es el creador, pero SÍ es el ASIGNADO, solo puede cambiar el estado.
        else if (isAssignee) {
            const keysToUpdate = Object.keys(data);
            // Si está intentando cambiar más de un campo, o un campo que no es 'estado', se deniega.
            if (keysToUpdate.length > 1 || (keysToUpdate.length === 1 && keysToUpdate[0] !== 'estado')) {
                throw new ForbiddenError('Como asignado, solo tienes permiso para cambiar el estado de la tarea.');
            }
        } 
        // Si no es creador ni asignado (y no es admin/coord), no tiene permisos.
        else {
            throw new ForbiddenError('No tienes permiso para editar esta tarea.');
        }
    }
    
    // Preparar datos de actualización, incluyendo manejo de participantes si se actualizan
    const updateData: Prisma.TareaUpdateInput = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        fechaPlazo: data.fechaPlazo,
        estado: data.estado,
        prioridad: data.prioridad,
    };
    if (data.asignadoId !== undefined) {
        updateData.asignado = data.asignadoId === null ? { disconnect: true } : { connect: { id: data.asignadoId } };
    }
    if (data.participantesIds !== undefined) {
        // Para M2M, set es más simple para reemplazar la lista de participantes
        updateData.participantes = { set: data.participantesIds.map(id => ({ id })) };
    }

    const updatedTask = await prisma.tarea.update({
        where: { id: taskId },
        data: updateData,
        include: {
            asignado: { select: { id: true, email: true, name: true, role: true } },
            creador: { select: { id: true, email: true, name: true, role: true } },
            proyecto: { select: { id: true, nombre: true, codigoUnico: true } },
            participantes: { select: {id: true, name: true, email: true, role: true } }
        }
    });

    // Lógica de Notificación para Actualizaciones
    const usersToNotifyOnChange = new Set<number>();
    if (updatedTask.creadorId) usersToNotifyOnChange.add(updatedTask.creadorId);
    if (updatedTask.asignadoId) usersToNotifyOnChange.add(updatedTask.asignadoId);
    updatedTask.participantes?.forEach(p => usersToNotifyOnChange.add(p.id));
    if (existingTask.asignadoId && existingTask.asignadoId !== updatedTask.asignadoId) { // Asignado anterior
        usersToNotifyOnChange.add(existingTask.asignadoId);
    }
    existingTask.participantes?.forEach(p => { // Participantes anteriores que ya no lo son
        if (!updatedTask.participantes?.some(up => up.id === p.id)) {
            usersToNotifyOnChange.add(p.id);
        }
    });


    let notificationType: TipoNotificacion = TipoNotificacion.TAREA_ACTUALIZADA_INFO;
    let changeDescription = "La tarea ha sido actualizada.";

    if (data.estado && data.estado !== existingTask.estado) {
        notificationType = TipoNotificacion.TAREA_ACTUALIZADA_ESTADO;
        changeDescription = `El estado de la tarea cambió a: ${data.estado}.`;
    }
    if (data.asignadoId !== undefined && data.asignadoId !== existingTask.asignadoId) {
        notificationType = TipoNotificacion.NUEVA_TAREA_ASIGNADA; // O TAREA_REASIGNADA
        changeDescription = data.asignadoId 
            ? `La tarea ha sido reasignada a ${updatedTask.asignado?.name || 'un nuevo usuario'}.`
            : `La tarea ya no tiene un asignado principal.`;
        if(data.asignadoId) usersToNotifyOnChange.add(data.asignadoId); // Asegurar que el nuevo asignado esté
    }
    // Añadir más lógicas para otros cambios si es necesario

    const baseMessage = `La tarea "${updatedTask.titulo}" en "${updatedTask.proyecto.nombre}"`;
    const urlDestino = `/projects/${updatedTask.proyecto.id}/tasks/${updatedTask.id}`;

    for (const userId of usersToNotifyOnChange) {
        if (userId === requestingUserPayload.id && userId !== data.asignadoId) continue; // No notificar a quien hizo el cambio, a menos que se autoasigne
        
        let finalMessage = `${baseMessage}: ${changeDescription}`;
        if (userId === data.asignadoId && notificationType === TipoNotificacion.NUEVA_TAREA_ASIGNADA) {
            finalMessage = `Se te ha asignado/reasignado la tarea: "${updatedTask.titulo}" en "${updatedTask.proyecto.nombre}".`;
        } else if (userId === existingTask.asignadoId && data.asignadoId !== undefined && data.asignadoId !== existingTask.asignadoId) {
            finalMessage = `Ya no estás asignado a la tarea: "${updatedTask.titulo}".`;
        }

        try {
            await notificationService.createDBNotification({
                usuarioId: userId, tipo: notificationType, mensaje: finalMessage,
                urlDestino, recursoId: updatedTask.id, recursoTipo: TipoRecursoNotificacion.TAREA
            });
            emitToUser(userId.toString(), 'tarea_actualizada', { taskId: updatedTask.id, titulo: updatedTask.titulo, cambio: changeDescription });
        } catch (e) { console.error(`[TaskService] Error notificación actualización tarea para user ${userId}:`, e); }
    }
    return updatedTask;
};

export const deleteTask = async (
    projectId: number,
    taskId: number,
    requestingUserPayload: UserPayload
): Promise<{ message: string }> => {
    const project = await checkProjectAccess(projectId, requestingUserPayload); // Incluye project.nombre

    const taskToDelete = await prisma.tarea.findUnique({
        where: { id: taskId },
        include: { 
            asignado: { select: { id: true } },
            creador: { select: { id: true } },
            participantes: { select: { id: true } }
        }
    });

    if (!taskToDelete) throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    if (taskToDelete.proyectoId !== projectId) throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);

    if (requestingUserPayload.role !== Role.ADMIN && requestingUserPayload.role !== Role.COORDINADOR) {
        // Solo Admin/Coordinador pueden borrar (o el creador si la tarea está PENDIENTE y sin asignado, por ejemplo)
        // if (taskToDelete.creadorId !== requestingUserPayload.id || taskToDelete.estado !== EstadoTarea.PENDIENTE || taskToDelete.asignadoId !== null) {
        //     throw new ForbiddenError('No tienes permiso para eliminar esta tarea.');
        // }
        throw new ForbiddenError('No tienes permiso para eliminar tareas.');
    }

    await prisma.tarea.delete({ where: { id: taskId } });
    // Mensajes y UserTaskChatStatus se borran en cascada. Notificaciones no (por ahora).

    const message = `La tarea "${taskToDelete.titulo}" del proyecto "${project.nombre}" ha sido eliminada.`;
    const usersToNotifyDeletion = new Set<number>();
    if (taskToDelete.creadorId && taskToDelete.creadorId !== requestingUserPayload.id) usersToNotifyDeletion.add(taskToDelete.creadorId);
    if (taskToDelete.asignadoId && taskToDelete.asignadoId !== requestingUserPayload.id) usersToNotifyDeletion.add(taskToDelete.asignadoId);
    taskToDelete.participantes?.forEach(p => {
        if (p.id !== requestingUserPayload.id) usersToNotifyDeletion.add(p.id);
    });


    for (const userId of usersToNotifyDeletion) {
        try {
            await notificationService.createDBNotification({
                usuarioId: userId, tipo: TipoNotificacion.TAREA_ACTUALIZADA_INFO, mensaje: message,
                urlDestino: `/projects/${project.id}`, recursoId: taskToDelete.id, recursoTipo: TipoRecursoNotificacion.TAREA
            });
            emitToUser(userId.toString(), 'tarea_eliminada', { taskId: taskToDelete.id, titulo: taskToDelete.titulo, proyectoId: project.id });
        } catch (e) { console.error(`[TaskService] Error notificación eliminación tarea para user ${userId}:`, e); }
    }

    console.log(`[TaskService] Tarea ID ${taskId} eliminada por usuario ID ${requestingUserPayload.id}`);
    return { message: `Tarea ID ${taskId} eliminada correctamente.` };
};

export const markTaskChatAsViewed = async (taskId: number, userId: number): Promise<void> => {
    const now = new Date();
    await prisma.userTaskChatStatus.upsert({
        where: { userId_taskId: { userId, taskId } },
        update: { lastReadTimestamp: now },
        create: { userId, taskId, lastReadTimestamp: now },
    });
    console.log(`[TaskService] Chat de tarea ${taskId} marcado como visto por usuario ${userId} a las ${now.toISOString()}`);

    // Emitir evento para que el frontend (ProjectDetailPage) pueda actualizar el indicador
    // de mensajes no leídos para esta tarea específica para este usuario.
    emitToUser(userId.toString(), 'task_chat_status_updated', { 
        taskId: taskId, 
        tieneMensajesNuevosEnChat: false 
    });
};

export const taskService = {
    getMyTasks,
    createTask,
    getTasksByProjectId,
    getTaskById,
    updateTask,
    deleteTask,
    markTaskChatAsViewed, 
};