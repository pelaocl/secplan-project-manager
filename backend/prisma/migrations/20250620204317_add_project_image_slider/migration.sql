/*
  Warnings:

  - The `imagenUrl` column on the `proyectos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "proyectos" DROP COLUMN "imagenUrl",
ADD COLUMN     "imagenUrl" TEXT[] DEFAULT ARRAY[]::TEXT[];
