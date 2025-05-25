// backend/src/services/taskService.ts
import prisma from '../config/prismaClient';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchemas';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { 
    Role, 
    User as PrismaUser, 
    Project, 
    Task,
    TipoNotificacion,
    TipoRecursoNotificacion,
    Prisma // Importa Prisma para Prisma.TareaCreateInput
} from '@prisma/client';
import { emitToUser } from '../socketManager';
import { UserPayload } from '../types/express';
import { notificationService } from './notificationService';

// Helper para verificar permisos
const checkProjectAccess = async (
    projectId: number, 
    requestingUser: UserPayload
): Promise<Project & { // El tipo de retorno incluye lo que necesitamos para los chequeos
    proyectista?: { id: number } | null; 
    formulador?: { id: number } | null;
    colaboradores: { id: number }[];
    tareas: { asignadoId: number | null }[];
}> => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { 
            proyectista: { select: { id: true } },      // Solo necesitamos el ID para la comparación
            formulador: { select: { id: true } },       // Solo necesitamos el ID
            colaboradores: { select: { id: true } },    // Solo IDs para el chequeo .some()
            tareas: {                                   // Incluimos las tareas del proyecto
                select: {
                    asignadoId: true                    // Solo el asignadoId para verificar
                }
            }
        }
    });

    if (!project) {
        throw new NotFoundError(`Proyecto con ID ${projectId} no encontrado.`);
    }

    // Admins y Coordinadores tienen acceso
    if (requestingUser.role === Role.ADMIN || requestingUser.role === Role.COORDINADOR) {
        return project; // Devuelve el proyecto con los includes que hicimos
    }

    // Verificar si el usuario es parte del equipo del proyecto
    const isProyectista = project.proyectistaId === requestingUser.id;
    const isFormulador = project.formuladorId === requestingUser.id;
    const isColaborador = project.colaboradores.some(colab => colab.id === requestingUser.id);
    
    // --- NUEVA VERIFICACIÓN ---
    // Verificar si el usuario está asignado a alguna tarea DENTRO de este proyecto
    const isTaskAssigneeInProject = project.tareas.some(tarea => tarea.asignadoId === requestingUser.id);
    // --- FIN NUEVA VERIFICACIÓN ---

    if (!isProyectista && !isFormulador && !isColaborador && !isTaskAssigneeInProject) {
        throw new ForbiddenError('No tienes permiso para acceder a los recursos de tareas de este proyecto.');
    }
    
    return project; // Devuelve el proyecto con los includes
};

export const createTask = async (
    projectId: number,
    data: CreateTaskInput, // CreateTaskInput ahora incluye participantesIds
    creatorPayload: UserPayload 
): Promise<Task> => { // Task de Prisma, que incluirá relaciones si se especifica

    // 1. Obtener detalles del proyecto para verificar permisos y para notificaciones
    const project = await prisma.project.findUnique({ 
        where: { id: projectId },
        // Incluye los campos necesarios para la lógica de permisos y notificaciones
        select: { id: true, nombre: true, codigoUnico: true, proyectistaId: true } 
    });
    if (!project) {
        throw new NotFoundError(`Proyecto con ID ${projectId} no encontrado.`);
    }

    // 2. Verificar Permisos de Creación de Tarea ACTUALIZADOS
    const isProjectLeadByProyectistaId = project.proyectistaId === creatorPayload.id;
    const isAdminOrCoordinator = creatorPayload.role === Role.ADMIN || creatorPayload.role === Role.COORDINADOR;

    if (!isAdminOrCoordinator && !isProjectLeadByProyectistaId) {
        throw new ForbiddenError('No tienes permiso para crear tareas en este proyecto (solo Admin, Coordinador o Proyectista a cargo del proyecto).');
    }

    // 3. Validar asignadoId y participantesIds (que los usuarios existan)
    if (data.asignadoId) {
        const asignee = await prisma.user.findUnique({ where: { id: data.asignadoId }, select: {id: true} });
        if (!asignee) throw new AppError(`Usuario asignado principal con ID ${data.asignadoId} no encontrado.`, 400);
        // TODO (Opcional): Validar que 'asignadoId' sea parte del equipo del proyecto.
    }
    if (data.participantesIds && data.participantesIds.length > 0) {
        const uniqueParticipantesIds = Array.from(new Set(data.participantesIds)); // Asegurar IDs únicos
        const participantes = await prisma.user.findMany({ 
            where: { id: { in: uniqueParticipantesIds } },
            select: {id: true} 
        });
        if (participantes.length !== uniqueParticipantesIds.length) {
            throw new AppError('Alguno de los IDs de participantes proporcionados no corresponde a un usuario válido.', 400);
        }
        // TODO (Opcional): Validar que todos los 'participantesIds' sean parte del equipo del proyecto.
    }
    
    // 4. Preparar datos para la creación de la tarea
    const tareaData: Prisma.TareaCreateInput = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        fechaPlazo: data.fechaPlazo,
        estado: data.estado, // Ya tiene default en el schema Zod y Prisma
        prioridad: data.prioridad,
        proyecto: { connect: { id: project.id } },
        creador: { connect: { id: creatorPayload.id } },
    };

    if (data.asignadoId) {
        tareaData.asignado = { connect: { id: data.asignadoId } };
    }

    if (data.participantesIds && data.participantesIds.length > 0) {
        // Filtramos para no incluir al asignadoId principal si ya está en participantesIds para evitar errores.
        // O, si el asignadoId también debe estar explícitamente en participantes, no es necesario filtrar.
        // Prisma maneja bien si se intenta conectar el mismo usuario en una relación M2M varias veces (solo lo conecta una vez).
        // También filtramos al creador si está en la lista, para no añadirlo dos veces si la lógica es distinta.
        const finalParticipantesIds = Array.from(new Set(data.participantesIds)).filter(id => id !== creatorPayload.id && id !== data.asignadoId);
        if (finalParticipantesIds.length > 0) {
            tareaData.participantes = { 
                connect: finalParticipantesIds.map(id => ({ id }))
            };
        }
    }
        
    const newTask = await prisma.tarea.create({
        data: tareaData,
        include: { 
            asignado: { select: { id: true, email: true, name: true, role: true }},
            creador: { select: { id: true, email: true, name: true, role: true }},
            proyecto: { select: { id: true, nombre: true, codigoUnico: true, proyectistaId: true } },
            participantes: { select: { id: true, name: true, email: true, role: true } } // Incluir participantes en la respuesta
        }
    });

    // 5. Lógica de Notificación (NUEVA_TAREA_ASIGNADA y AÑADIDO_A_TAREA)
    const usersToNotify = new Map<number, TipoNotificacion>();

    // Notificar al asignado principal (si existe y no es el creador)
    if (newTask.asignadoId && newTask.asignadoId !== creatorPayload.id) {
        usersToNotify.set(newTask.asignadoId, TipoNotificacion.NUEVA_TAREA_ASIGNADA);
    }

    // Notificar a los participantes adicionales (si existen y no son el creador ni el asignado principal)
    if (newTask.participantes) {
        newTask.participantes.forEach(participante => {
            if (participante.id !== creatorPayload.id && participante.id !== newTask.asignadoId) {
                // Si ya tiene una notificación de asignado principal, no sobrescribir, o usar un tipo diferente.
                // Por ahora, si ya está por ser notificado como asignado, esa notificación es más específica.
                if (!usersToNotify.has(participante.id)) {
                     // Podrías crear un nuevo TipoNotificacion.PARTICIPANTE_TAREA_ANADIDO
                    usersToNotify.set(participante.id, TipoNotificacion.NUEVA_TAREA_ASIGNADA); 
                }
            }
        });
    }
    
    // Notificar al Project.proyectistaId (Proyectista a Cargo del Proyecto) si no es el creador y no está ya en la lista de notificados
    if (project.proyectistaId && 
        project.proyectistaId !== creatorPayload.id &&
        !usersToNotify.has(project.proyectistaId)) {
        usersToNotify.set(project.proyectistaId, TipoNotificacion.NUEVA_TAREA_ASIGNADA); // O un tipo "NUEVA_TAREA_EN_PROYECTO"
    }

    // Enviar las notificaciones
    for (const [userId, tipoNotif] of usersToNotify) {
        let message = "";
        if (tipoNotif === TipoNotificacion.NUEVA_TAREA_ASIGNADA) {
            if (userId === newTask.asignadoId) {
                message = `Se te ha asignado la tarea: "${newTask.titulo}" en el proyecto "${project.nombre}".`;
            } else if (newTask.participantes?.some(p => p.id === userId)) {
                message = `Has sido añadido como participante a la tarea: "${newTask.titulo}" en el proyecto "${project.nombre}".`;
            } else if (userId === project.proyectistaId) {
                message = `Nueva tarea "${newTask.titulo}" creada en tu proyecto "${project.nombre}".`;
            }
        }
        // Añadir más lógica de mensajes para otros tipos de notificación si es necesario.
        if (!message) message = `Nueva actividad en la tarea "${newTask.titulo}" del proyecto "${project.nombre}".`; // Fallback

        try {
            await notificationService.createDBNotification({
               usuarioId: userId,
               tipo: tipoNotif,
               mensaje: message,
               urlDestino: `/projects/${project.id}/tasks/${newTask.id}`,
               recursoId: newTask.id,
               recursoTipo: TipoRecursoNotificacion.TAREA
            }); // notificationService ya emite 'unread_count_updated'
        } catch (e) { console.error(`[TaskService] Error creando notificación para usuario ${userId} para tarea ${newTask.id}:`, e); }
    }
    // Además de las notificaciones individuales, podrías emitir un evento general a la sala del proyecto
    // ej: emitToRoom(`project_${project.id}`, 'new_task_in_project', { taskId: newTask.id, titulo: newTask.titulo });

    return newTask;
};

export const getTasksByProjectId = async (
    projectId: number,
    requestingUserPayload: UserPayload
): Promise<(Task & { tieneNotificacionesChatNoLeidasParaUsuarioActual?: boolean })[]> => {
    // 1. Verificar acceso al proyecto
    await checkProjectAccess(projectId, requestingUserPayload);
    
    // 2. Obtener las tareas del proyecto
    const tasksFromDb = await prisma.tarea.findMany({
        where: { proyectoId: projectId },
        include: {
            creador: { select: { id: true, name: true, email: true, role: true } },
            asignado: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: {
            fechaCreacion: 'desc',
        },
    });

    if (tasksFromDb.length === 0) {
        return [];
    }

    // 3. Obtener todas las notificaciones de chat NO LEÍDAS para el usuario actual
    const unreadUserChatNotifications = await prisma.notificacion.findMany({
        where: {
            usuarioId: requestingUserPayload.id,
            leida: false,
            tipo: TipoNotificacion.NUEVO_MENSAJE_TAREA,
            recursoTipo: TipoRecursoNotificacion.MENSAJE_CHAT_TAREA, // Importante: que sea de tipo mensaje de chat
            recursoId: { not: null } // Asegura que recursoId (que es mensajeId) exista
        },
        select: {
            recursoId: true // Esto es el ID del MensajeChatTarea
        }
    });

    // Si no hay notificaciones de chat no leídas para el usuario, ninguna tarea tendrá el flag
    if (unreadUserChatNotifications.length === 0) {
        return tasksFromDb.map(task => ({ 
            ...task, 
            tieneNotificacionesChatNoLeidasParaUsuarioActual: false 
        }));
    }

    // 4. Obtener los IDs de los mensajes que tienen notificaciones no leídas
    const unreadMessageIds = unreadUserChatNotifications.map(n => n.recursoId as number);

    // 5. Descubrir a qué tareas pertenecen esos mensajes no leídos
    //    y que esas tareas sean parte del proyecto actual que estamos listando.
    const messagesInProjectTasks = await prisma.mensajeChatTarea.findMany({
        where: {
            id: { in: unreadMessageIds },      // El mensaje es uno de los que tiene notificación no leída
            tareaId: { in: tasksFromDb.map(t => t.id) } // Y el mensaje pertenece a una de las tareas de este proyecto
        },
        select: {
            tareaId: true // Solo necesitamos el tareaId para marcar
        },
        distinct: ['tareaId'] // Obtenemos cada tareaId solo una vez
    });

    const unreadTaskIds = new Set(messagesInProjectTasks.map(m => m.tareaId));

    // 6. Mapear sobre las tareas originales y añadir el nuevo flag
    const tasksWithUnreadFlag = tasksFromDb.map(task => ({
        ...task,
        tieneNotificacionesChatNoLeidasParaUsuarioActual: unreadTaskIds.has(task.id)
    }));

    return tasksWithUnreadFlag;
};

export const getTaskById = async (
    projectId: number, // Todavía útil para el chequeo de acceso al proyecto
    taskId: number,
    requestingUserPayload: UserPayload
): Promise<Task | null> => {
    // Primero, verifica si el usuario tiene acceso al proyecto al que pertenece la tarea
    // Esto también nos da el objeto 'project' si lo necesitamos
    await checkProjectAccess(projectId, requestingUserPayload);

    const task = await prisma.tarea.findUnique({
        where: { 
            id: taskId,
            // Opcionalmente, puedes añadir proyectoId aquí para asegurar que la tarea pertenece al proyecto
            // aunque checkProjectAccess ya nos da una capa de seguridad a nivel de proyecto.
            // Si la ruta es /projects/:projectId/tasks/:taskId, entonces el projectId en la URL
            // ya nos da el contexto del proyecto.
            // Si la tarea no pertenece a ese projectId, findUnique con un filtro compuesto fallaría o sería más complejo.
            // Es más simple buscar por taskId y luego verificar si su proyectoId coincide con el de la URL.
        },
        include: {
            creador: { select: { id: true, name: true, email: true, role: true } },
            asignado: { select: { id: true, name: true, email: true, role: true } },
            proyecto: { select: { id: true, nombre: true, codigoUnico: true } },
            mensajes: { // <-- IMPORTANTE: Incluimos los mensajes del chat
                orderBy: {
                    fechaEnvio: 'asc', // Mensajes más antiguos primero
                },
                include: {
                    remitente: { select: { id: true, name: true, email: true, role: true } } // Datos del remitente del mensaje
                }
                // Podrías añadir paginación para mensajes aquí si esperas muchos: take, skip
            }
        }
    });

    if (!task) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }

    // Verificación adicional: que la tarea encontrada realmente pertenezca al proyectoId de la URL.
    // Esto es una buena práctica si taskId es el único criterio de búsqueda principal.
    if (task.proyectoId !== projectId) {
        throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);
        // O podrías simplemente lanzar un NotFoundError para no revelar información.
    }
    
    // Aquí ya hemos verificado el acceso al proyecto.
    // Si hay reglas más específicas sobre quién puede ver qué tarea (además de pertenecer al proyecto),
    // se añadirían aquí. Por ejemplo, ¿puede un colaborador ver *cualquier* tarea del proyecto
    // o solo aquellas en las que es creador o asignado?
    // Por ahora, si tiene acceso al proyecto, puede ver la tarea.

    return task;
};

export const updateTask = async (
    projectId: number,
    taskId: number,
    data: UpdateTaskInput,
    requestingUserPayload: UserPayload
): Promise<Task> => {
    // 1. Verificar acceso al proyecto
    await checkProjectAccess(projectId, requestingUserPayload);

    // 2. Verificar que la tarea exista y pertenezca al proyecto
    const existingTask = await prisma.tarea.findUnique({
        where: { id: taskId },
        include: {
            proyecto: { select: { id: true, nombre: true } }, // Para el mensaje de notificación
            asignado: { select: { id: true, name: true } }, // Para saber el asignado anterior
            creador: { select: { id: true, name: true } }    // Para saber el creador
        }
    });

    if (!existingTask) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }
    if (existingTask.proyectoId !== projectId) {
        throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);
    }

    // 3. Lógica de Permisos para Actualizar
    // Ejemplo: Admin/Coordinador pueden editar todo.
    // El asignado podría solo cambiar el estado a 'COMPLETADA' o 'EN_REVISION'.
    // El creador podría tener algunos permisos de edición.
    // Define esto según tus reglas de negocio.
    const isAdminOrCoordinator = requestingUserPayload.role === Role.ADMIN || requestingUserPayload.role === Role.COORDINADOR;
    const isAssignee = existingTask.asignadoId === requestingUserPayload.id;

    if (!isAdminOrCoordinator) {
        // Si no es Admin/Coordinador, aplicamos reglas más estrictas
        if (isAssignee) {
            // El asignado solo puede actualizar ciertos campos (ej. estado)
            const allowedUpdatesForAssignee: (keyof UpdateTaskInput)[] = ['estado'];
            for (const key in data) {
                if (!allowedUpdatesForAssignee.includes(key as keyof UpdateTaskInput)) {
                    throw new ForbiddenError(`Como asignado, solo puedes actualizar campos permitidos (ej: estado).`);
                }
            }
            // Adicionalmente, el asignado solo puede cambiar a ciertos estados
            if (data.estado && ![EstadoTarea.COMPLETADA, EstadoTarea.EN_REVISION, EstadoTarea.EN_PROGRESO, EstadoTarea.PENDIENTE].includes(data.estado)) {
                 throw new ForbiddenError(`Como asignado, solo puedes cambiar el estado a COMPLETADA, EN_REVISION, EN_PROGRESO o PENDIENTE.`);
            }
        } else {
            // Otros usuarios (que no son admin/coord ni el asignado actual) no pueden editar.
            throw new ForbiddenError('No tienes permiso para actualizar esta tarea.');
        }
    }
    
    // Campos que no deberían ser actualizables directamente por el usuario aquí (como creadorId, proyectoId)
    // ya están excluidos por UpdateTaskInput o no se pasan.

    const updatedTask = await prisma.tarea.update({
        where: { id: taskId },
        data: {
            titulo: data.titulo,
            descripcion: data.descripcion,
            fechaPlazo: data.fechaPlazo,
            estado: data.estado,
            prioridad: data.prioridad,
            // Si permites reasignar la tarea:
            ...(data.asignadoId !== undefined && { // Permite desasignar (null) o reasignar
                asignado: data.asignadoId === null 
                    ? { disconnect: true } 
                    : { connect: { id: data.asignadoId } }
            }),
        },
        include: {
            asignado: { select: { id: true, email: true, name: true, role: true } },
            creador: { select: { id: true, email: true, name: true, role: true } },
            proyecto: { select: { id: true, nombre: true, codigoUnico: true } }
        }
    });

    // 4. Lógica de Notificación (DB y Socket.IO) por cambios significativos
    // Ejemplo: Notificar si el estado cambió o si se reasignó la tarea.
    
    // Notificación por cambio de estado
    if (data.estado && data.estado !== existingTask.estado) {
        const message = `El estado de la tarea "${updatedTask.titulo}" en el proyecto "${updatedTask.proyecto.nombre}" ha cambiado a: ${data.estado}.`;
        const recipientIds: number[] = [];
        if (updatedTask.creadorId && updatedTask.creadorId !== requestingUserPayload.id) recipientIds.push(updatedTask.creadorId);
        if (updatedTask.asignadoId && updatedTask.asignadoId !== requestingUserPayload.id && !recipientIds.includes(updatedTask.asignadoId)) recipientIds.push(updatedTask.asignadoId);
        // Podrías notificar a otros participantes del proyecto también.

        for (const recipientId of recipientIds) {
            try {
                await notificationService.createDBNotification({
                    usuarioId: recipientId,
                    tipo: TipoNotificacion.TAREA_ACTUALIZADA_ESTADO,
                    mensaje: message,
                    urlDestino: `/projects/${updatedTask.proyecto.id}/tasks/${updatedTask.id}`,
                    recursoId: updatedTask.id,
                    recursoTipo: TipoRecursoNotificacion.TAREA
                });
                emitToUser(recipientId.toString(), 'tarea_actualizada', { 
                    notification: { /* ... objeto notificación ... */ },
                    taskId: updatedTask.id, 
                    titulo: updatedTask.titulo,
                    proyectoNombre: updatedTask.proyecto.nombre,
                    cambio: `estado a ${data.estado}`
                });
            } catch (e) { console.error(`[TaskService] Error creando/emitiendo notificación de estado para usuario ${recipientId}:`, e); }
        }
    }

    // Notificación por reasignación de tarea
    // Asegúrate que updatedTask.proyecto exista y tenga nombre antes de usarlo.
    if (data.asignadoId !== undefined && data.asignadoId !== existingTask.asignadoId && updatedTask.proyecto && updatedTask.proyecto.nombre) {
        // Notificar al NUEVO asignado (si hay uno y no es quien hace el cambio)
        if (data.asignadoId !== null && data.asignadoId !== requestingUserPayload.id) { 
            const messageNewAssignee = `Se te ha asignado la tarea: "${updatedTask.titulo}" en el proyecto "${updatedTask.proyecto.nombre}".`;
            try {
                await notificationService.createDBNotification({ 
                    usuarioId: data.asignadoId,
                    tipo: TipoNotificacion.NUEVA_TAREA_ASIGNADA, // O un tipo TAREA_REASIGNADA
                    mensaje: messageNewAssignee,
                    urlDestino: `/projects/${updatedTask.proyecto.id}/tasks/${updatedTask.id}`,
                    recursoId: updatedTask.id,
                    recursoTipo: TipoRecursoNotificacion.TAREA
                });
                emitToUser(data.asignadoId.toString(), 'nueva_tarea_asignada', { // O 'tarea_reasignada'
                    notification: { /* ... */ },
                    taskId: updatedTask.id, 
                    titulo: updatedTask.titulo,
                    proyectoNombre: updatedTask.proyecto.nombre, 
                    mensaje: messageNewAssignee 
                });
            } catch (e) { console.error(`[TaskService] Error creando/emitiendo notificación de reasignación para NUEVO usuario ${data.asignadoId}:`, e); }
        }
        
        // Notificar al asignado ANTERIOR (si había uno y no es quien hace el cambio)
        if (existingTask.asignadoId && existingTask.asignadoId !== requestingUserPayload.id) { 
            const messageOldAssignee = `Ya no estás asignado a la tarea: "${updatedTask.titulo}" en el proyecto "${updatedTask.proyecto.nombre}".`;
            try {
                await notificationService.createDBNotification({ 
                    usuarioId: existingTask.asignadoId,
                    tipo: TipoNotificacion.TAREA_ACTUALIZADA_INFO, // O un tipo TAREA_DESASIGNADA
                    mensaje: messageOldAssignee,
                    urlDestino: `/projects/${updatedTask.proyecto.id}/tasks/${updatedTask.id}`,
                    recursoId: updatedTask.id,
                    recursoTipo: TipoRecursoNotificacion.TAREA
                 });
                emitToUser(existingTask.asignadoId.toString(), 'tarea_actualizada', { 
                    notification: { /* ... */ },
                    taskId: updatedTask.id,
                    titulo: updatedTask.titulo,
                    proyectoNombre: updatedTask.proyecto.nombre,
                    mensaje: messageOldAssignee
                 });
            } catch (e) { console.error(`[TaskService] Error creando/emitiendo notificación de desasignación para ANTERIOR usuario ${existingTask.asignadoId}:`, e); }
        }
    }
    // Puedes añadir más lógicas de notificación para otros campos si es necesario.

    return updatedTask;
};

export const deleteTask = async (
    projectId: number,
    taskId: number,
    requestingUserPayload: UserPayload
): Promise<{ message: string }> => {
    // 1. Verificar acceso al proyecto
    const project = await checkProjectAccess(projectId, requestingUserPayload);

    // 2. Verificar que la tarea exista y pertenezca al proyecto
    const taskToDelete = await prisma.tarea.findUnique({
        where: { id: taskId }
    });

    if (!taskToDelete) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }
    if (taskToDelete.proyectoId !== projectId) {
        // Aunque checkProjectAccess ya valida el proyecto, esta es una doble seguridad.
        throw new ForbiddenError(`La tarea ${taskId} no pertenece al proyecto ${projectId}.`);
    }

    // 3. Lógica de Permisos para Eliminar
    // Generalmente, solo Admins o Coordinadores pueden eliminar tareas.
    // Podrías permitir que el creador de la tarea también la elimine si no ha sido asignada o está en cierto estado.
    if (requestingUserPayload.role !== Role.ADMIN && requestingUserPayload.role !== Role.COORDINADOR) {
        // Ejemplo: Si quieres permitir que el creador borre sus propias tareas (quizás bajo ciertas condiciones)
        // if (taskToDelete.creadorId !== requestingUserPayload.id) {
        //     throw new ForbiddenError('No tienes permiso para eliminar esta tarea.');
        // }
        // Por ahora, solo Admin/Coordinador:
        throw new ForbiddenError('No tienes permiso para eliminar tareas en este proyecto.');
    }

    // 4. Eliminar la tarea
    // Si definiste `onDelete: Cascade` en tu schema.prisma para los MensajeChatTarea
    // relacionados con una Tarea, se borrarán automáticamente.
    // Las Notificaciones que apuntan a esta tarea a través de recursoId y recursoTipo TAREA
    // no se borrarán automáticamente a menos que tengas una relación directa con onDelete: Cascade.
    // Por ahora, las dejaremos (la notificación fue válida en su momento).
    await prisma.tarea.delete({
        where: { id: taskId }
    });

    // 5. Lógica de Notificación (DB - opcional) y Socket.IO
    // Podrías notificar al asignado, creador (si no es quien borra), o colaboradores del proyecto.
    const message = `La tarea "${taskToDelete.titulo}" del proyecto "${project.nombre}" ha sido eliminada por ${requestingUserPayload.name || requestingUserPayload.email}.`;
    
    // Ejemplo de notificación al asignado (si lo había y no es quien borra)
    if (taskToDelete.asignadoId && taskToDelete.asignadoId !== requestingUserPayload.id) {
        try {
            await notificationService.createDBNotification({
                usuarioId: taskToDelete.asignadoId,
                tipo: TipoNotificacion.TAREA_ACTUALIZADA_INFO, // O un nuevo tipo TAREA_ELIMINADA
                mensaje: message,
                // urlDestino podría no ser relevante o apuntar al proyecto
                urlDestino: `/projects/${project.id}`, 
                recursoId: taskToDelete.id, // Guardamos el ID de la tarea eliminada
                recursoTipo: TipoRecursoNotificacion.TAREA 
            });
            emitToUser(taskToDelete.asignadoId.toString(), 'tarea_eliminada', { 
                taskId: taskToDelete.id, 
                titulo: taskToDelete.titulo,
                proyectoId: project.id,
                proyectoNombre: project.nombre,
                mensaje: `La tarea "${taskToDelete.titulo}" ha sido eliminada.`
            });
        } catch (e) { console.error(`[TaskService] Error creando/emitiendo notificación de eliminación de tarea para usuario ${taskToDelete.asignadoId}:`, e); }
    }
    // Considera notificar también al creador si no es el mismo que requestingUserPayload.
    // Y quizás a todos los colaboradores del proyecto a través de un evento a una "sala" del proyecto.

    console.log(`[TaskService] Tarea ID ${taskId} eliminada por usuario ID ${requestingUserPayload.id}`);
    return { message: `Tarea ID ${taskId} eliminada correctamente.` };
};