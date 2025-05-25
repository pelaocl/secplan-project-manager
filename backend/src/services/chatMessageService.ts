// backend/src/services/chatMessageService.ts
import prisma from '../config/prismaClient';
import { CreateChatMessageInput } from '../schemas/chatMessageSchemas';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { Role, User as PrismaUser, Tarea, MensajeChatTarea, TipoNotificacion, TipoRecursoNotificacion } from '@prisma/client';
import { UserPayload } from '../types/express';
import { emitToRoom, emitToUser } from '../socketManager'; // Usaremos emitToRoom para el chat
import { notificationService } from './notificationService'; // Para crear notificaciones en DB

// Helper para verificar si un usuario puede interactuar con el chat de una tarea
const checkTaskChatAccess = async (taskId: number, userPayload: UserPayload): Promise<Tarea & { proyecto: { colaboradores: PrismaUser[] } }> => {
    const tarea = await prisma.tarea.findUnique({
        where: { id: taskId },
        include: {
            proyecto: {
                include: {
                    colaboradores: true, // Para verificar si el usuario es colaborador del proyecto
                    proyectista: true,
                    formulador: true,
                }
            },
            creador: true,
            asignado: true
        }
    });

    if (!tarea) {
        throw new NotFoundError(`Tarea con ID ${taskId} no encontrada.`);
    }

    // Admins y Coordinadores siempre tienen acceso
    if (userPayload.role === Role.ADMIN || userPayload.role === Role.COORDINADOR) {
        return tarea;
    }

    // Verificar si el usuario es creador de la tarea, asignado a la tarea,
    // o parte del equipo del proyecto (proyectista, formulador, colaborador)
    const isCreator = tarea.creadorId === userPayload.id;
    const isAssignee = tarea.asignadoId === userPayload.id;
    const isProjectProyectista = tarea.proyecto.proyectistaId === userPayload.id;
    const isProjectFormulador = tarea.proyecto.formuladorId === userPayload.id;
    const isProjectCollaborator = tarea.proyecto.colaboradores.some(colab => colab.id === userPayload.id);

    if (!isCreator && !isAssignee && !isProjectProyectista && !isProjectFormulador && !isProjectCollaborator) {
        throw new ForbiddenError('No tienes permiso para interactuar con el chat de esta tarea.');
    }
    return tarea;
};

export const createChatMessage = async (
    taskId: number,
    remitentePayload: UserPayload,
    data: CreateChatMessageInput
): Promise<MensajeChatTarea> => {
    // 1. Verificar que la tarea exista y que el remitente tenga permiso para chatear en ella
    const tarea = await checkTaskChatAccess(taskId, remitentePayload);
    console.log('[ChatMessageService] Detalles de la Tarea para el chat:', JSON.stringify(tarea, null, 2));
    console.log(`[ChatMessageService] Remitente del mensaje (User ID): ${remitentePayload.id}, Nombre: ${remitentePayload.name}`);

    // 2. Crear el mensaje en la base de datos
    const nuevoMensaje = await prisma.mensajeChatTarea.create({
        data: {
            contenido: data.contenido, // HTML del editor enriquecido
            tarea: { connect: { id: taskId } },
            remitente: { connect: { id: remitentePayload.id } },
        },
        include: { // Incluir remitente para la respuesta y el evento socket
            remitente: {
                select: { id: true, name: true, email: true, role: true }
            }
        }
    });

    // 3. Lógica de Notificación (DB y Socket.IO)
    // Notificar a los "participantes" de la tarea (creador, asignado, y colaboradores del proyecto)
    // excluyendo al remitente del mensaje.
    const nombreRemitente = remitentePayload.name || remitentePayload.email;
    const mensajeNotificacion = `${nombreRemitente} envió un mensaje en la tarea "${tarea.titulo}"`; // Mensaje más genérico
    
    // Identificar a todos los usuarios que podrían tener interés en la tarea
    const interesadosPotencialesIds = new Set<number>();
    if (tarea.creadorId) interesadosPotencialesIds.add(tarea.creadorId);
    if (tarea.asignadoId) interesadosPotencialesIds.add(tarea.asignadoId);
    // Añadir colaboradores del proyecto al que pertenece la tarea
    tarea.proyecto.colaboradores.forEach(colab => interesadosPotencialesIds.add(colab.id));
    if (tarea.proyecto.proyectistaId) interesadosPotencialesIds.add(tarea.proyecto.proyectistaId);
    if (tarea.proyecto.formuladorId) interesadosPotencialesIds.add(tarea.proyecto.formuladorId);
    // Incluir Admin y Coordinadores que son parte del proyecto explícitamente, o todos.
    // Por ahora, nos basamos en la implicación directa o colaboración en el proyecto.

    const usuariosParaNotificar = await prisma.user.findMany({
        where: { id: { in: Array.from(interesadosPotencialesIds) } },
        select: { id: true, role: true }
    });

    usuariosParaNotificar.forEach(async (usuario) => {
        if (usuario.id === remitentePayload.id) return; // No notificar al propio remitente

        let crearNotificacionParaEsteUsuario = false;

        // Regla 1: Usuarios con rol USUARIO
        if (usuario.role === Role.USUARIO) {
            // Si ya está en interesadosPotencialesIds (es creador, asignado, colaborador, proyectista, formulador)
            // y es un USUARIO, se notifica.
            crearNotificacionParaEsteUsuario = true;
        } 
        // Regla 2: Usuarios con rol ADMIN o COORDINADOR
        else if (usuario.role === Role.ADMIN || usuario.role === Role.COORDINADOR) {
            // Se notifican si son creador de la tarea, asignado a la tarea,
            // O SI SON EL PROYECTISTA DEL PROYECTO AL QUE PERTENECE LA TAREA.
            if (tarea.creadorId === usuario.id || 
                tarea.asignadoId === usuario.id ||
                tarea.proyecto.proyectistaId === usuario.id) { // <--- AÑADIR ESTA CONDICIÓN
                crearNotificacionParaEsteUsuario = true;
            } else {
                console.log(`[ChatMessageService] No se crea notificación de chat para Admin/Coordinador (ID: ${usuario.id}) para tarea ${taskId} (no es creador, ni asignado, ni proyectista del proyecto de la tarea)`);
            }
        }
        // (FUTURO: añadir lógica para 'if (mensajeContieneMencionPara(usuario.id)) crearNotificacionParaEsteUsuario = true;')

        if (crearNotificacionParaEsteUsuario) {
            try {
                await notificationService.createDBNotification({ // Esta función ya emite 'unread_count_updated'
                    usuarioId: usuario.id,
                    tipo: TipoNotificacion.NUEVO_MENSAJE_TAREA,
                    mensaje: mensajeNotificacion, // Usar el mensaje genérico
                    urlDestino: `/projects/${tarea.proyectoId}/tasks/${taskId}`,
                    recursoId: nuevoMensaje.id, // ID del MensajeChatTarea
                    recursoTipo: TipoRecursoNotificacion.MENSAJE_CHAT_TAREA,
                });
            } catch (dbNotificationError) {
                console.error(`[ChatMessageService] Error creando notificación de chat en DB para usuario ${usuario.id}:`, dbNotificationError);
            }
        }
    });

    // El evento Socket.IO a la sala de la tarea se emite siempre para actualizar el chat en tiempo real
    // para cualquiera que lo esté viendo.
    const taskRoom = `task_chat_${taskId}`;
    emitToRoom(taskRoom, 'nuevo_mensaje_chat', nuevoMensaje); // 'nuevoMensaje' tiene remitente incluido

    return nuevoMensaje;
};

export const getChatMessagesByTaskId = async (
    taskId: number,
    requestingUserPayload: UserPayload,
    query: GetChatMessagesQuery // Para paginación
): Promise<{ messages: MensajeChatTarea[], totalMessages: number, page: number, limit: number, totalPages: number }> => {
    // 1. Verificar que la tarea exista y que el usuario tenga permiso para ver sus mensajes
    await checkTaskChatAccess(taskId, requestingUserPayload); // Reutilizamos el helper de acceso

    // 2. Configurar paginación
    const page = query.page || 1;
    const limit = query.limit || 20; // Default a 20 mensajes por página
    const skip = (page - 1) * limit;

    // 3. Obtener los mensajes y el conteo total para la paginación
    const [messages, totalMessages] = await prisma.$transaction([
        prisma.mensajeChatTarea.findMany({
            where: { tareaId: taskId },
            include: {
                remitente: {
                    select: { id: true, name: true, email: true, role: true } // Datos del remitente
                }
            },
            orderBy: {
                fechaEnvio: 'asc', // Mensajes más antiguos primero, o 'desc' para más nuevos primero
            },
            skip: skip,
            take: limit,
        }),
        prisma.mensajeChatTarea.count({
            where: { tareaId: taskId }
        })
    ]);

    return {
        messages,
        totalMessages,
        page,
        limit,
        totalPages: Math.ceil(totalMessages / limit)
    };
};

export const chatMessageService = {
    createChatMessage,
    getChatMessagesByTaskId,
};