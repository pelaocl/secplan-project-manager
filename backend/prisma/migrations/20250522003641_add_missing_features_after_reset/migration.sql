/*
  Warnings:

  - You are about to drop the column `completada` on the `tareas_bitacora` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tareas_bitacora` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tareas_bitacora` table. All the data in the column will be lost.
  - Added the required column `creadorId` to the `tareas_bitacora` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaActualizacion` to the `tareas_bitacora` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'EN_REVISION', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadTarea" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('NUEVA_TAREA_ASIGNADA', 'NUEVO_MENSAJE_TAREA', 'TAREA_ACTUALIZADA_ESTADO', 'TAREA_ACTUALIZADA_INFO', 'TAREA_COMPLETADA', 'TAREA_VENCIMIENTO_PROXIMO');

-- CreateEnum
CREATE TYPE "TipoRecursoNotificacion" AS ENUM ('TAREA', 'MENSAJE_CHAT_TAREA', 'PROYECTO');

-- AlterTable
ALTER TABLE "proyectos" ADD COLUMN     "area_polygon" JSONB,
ADD COLUMN     "location_point" JSONB;

-- AlterTable
ALTER TABLE "tareas_bitacora" DROP COLUMN "completada",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "creadorId" INTEGER NOT NULL,
ADD COLUMN     "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaActualizacion" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "prioridad" "PrioridadTarea";

-- CreateTable
CREATE TABLE "mensajes_chat_tarea" (
    "id" SERIAL NOT NULL,
    "contenido" TEXT NOT NULL,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tareaId" INTEGER NOT NULL,
    "remitenteId" INTEGER NOT NULL,

    CONSTRAINT "mensajes_chat_tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" SERIAL NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urlDestino" TEXT,
    "tipo" "TipoNotificacion" NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "recursoId" INTEGER,
    "recursoTipo" "TipoRecursoNotificacion",

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tareas_bitacora" ADD CONSTRAINT "tareas_bitacora_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_chat_tarea" ADD CONSTRAINT "mensajes_chat_tarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas_bitacora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_chat_tarea" ADD CONSTRAINT "mensajes_chat_tarea_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
