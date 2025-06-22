-- CreateEnum
CREATE TYPE "CategoriaNotificacion" AS ENUM ('SISTEMA', 'CHAT');

-- AlterTable
ALTER TABLE "notificaciones" ADD COLUMN     "categoria" "CategoriaNotificacion" NOT NULL DEFAULT 'SISTEMA';
