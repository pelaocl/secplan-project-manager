/*
  Warnings:

  - You are about to drop the column `imagenUrl` on the `proyectos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "proyectos" DROP COLUMN "imagenUrl",
ADD COLUMN     "imagenUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
