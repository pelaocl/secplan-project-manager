/*
  Warnings:

  - The values [EN_PROGRESO,CANCELADA] on the enum `EstadoTarea` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoTarea_new" AS ENUM ('PENDIENTE', 'COMPLETADA', 'EN_REVISION');
ALTER TABLE "tareas_bitacora" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "tareas_bitacora" ALTER COLUMN "estado" TYPE "EstadoTarea_new" USING ("estado"::text::"EstadoTarea_new");
ALTER TYPE "EstadoTarea" RENAME TO "EstadoTarea_old";
ALTER TYPE "EstadoTarea_new" RENAME TO "EstadoTarea";
DROP TYPE "EstadoTarea_old";
ALTER TABLE "tareas_bitacora" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
COMMIT;
