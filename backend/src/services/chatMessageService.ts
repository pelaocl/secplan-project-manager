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
    const mensajeNotificacion = `${nombreRemitente} ha enviado un nuevo mensaje en la tarea "${tarea.titulo}" del proyecto "${tarea.proyecto.nombre}".`;
    
    const participantesIds = new Set<number>();
    if (tarea.creadorId) participantesIds.add(tarea.creadorId);
    if (tarea.asignadoId) participantesIds.add(tarea.asignadoId);
    tarea.proyecto.colaboradores.forEach(colab => participantesIds.add(colab.id));
    if (tarea.proyecto.proyectistaId) participantesIds.add(tarea.proyecto.proyectistaId);
    if (tarea.proyecto.formuladorId) participantesIds.add(tarea.proyecto.formuladorId);


    participantesIds.forEach(async (usuarioId) => {
        if (usuarioId !== remitentePayload.id) { // No notificar al propio remitente
            try {
                await notificationService.createDBNotification({
                    usuarioId: usuarioId,
                    tipo: TipoNotificacion.NUEVO_MENSAJE_TAREA,
                    mensaje: mensajeNotificacion,
                    urlDestino: `/projects/${tarea.proyectoId}/tasks/${taskId}`, // Lleva al detalle de la tarea
                    recursoId: nuevoMensaje.id, // ID del mensaje de chat
                    recursoTipo: TipoRecursoNotificacion.MENSAJE_CHAT_TAREA,
                });
                // La notificación por socket para nuevo mensaje se emitirá a la sala de la tarea
            } catch (dbNotificationError) {
                console.error(`[ChatMessageService] Error creando notificación de chat en DB para usuario ${usuarioId}:`, dbNotificationError);
            }
        }
    });

    // Emitir evento Socket.IO a una "sala" específica de la tarea para que todos los
    // clientes suscritos a esa tarea reciban el mensaje en tiempo real.
    const taskRoom = `task_chat_${taskId}`;
    emitToRoom(taskRoom, 'nuevo_mensaje_chat', nuevoMensaje);
    // También podrías emitir un evento 'nueva_notificacion_generica' a los usuarios individuales
    // para que actualicen su contador de notificaciones, si el evento de sala no lo hace.
    // Ejemplo:
    // participantesIds.forEach(usuarioId => {
    //   if (usuarioId !== remitentePayload.id) {
    //     emitToUser(usuarioId.toString(), 'notificacion_global_actualizada', { count: numero_de_sus_notificaciones_no_leidas });
    //   }
    // });


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