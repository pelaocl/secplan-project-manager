-- AlterEnum
ALTER TYPE "TipoNotificacion" ADD VALUE 'MENCION_EN_TAREA';

-- AlterTable
ALTER TABLE "mensajes_chat_tarea" ADD COLUMN     "mensajePadreId" INTEGER;

-- AddForeignKey
ALTER TABLE "mensajes_chat_tarea" ADD CONSTRAINT "mensajes_chat_tarea_mensajePadreId_fkey" FOREIGN KEY ("mensajePadreId") REFERENCES "mensajes_chat_tarea"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
