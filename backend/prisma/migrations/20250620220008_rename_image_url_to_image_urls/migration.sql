/*
  Warnings:

  - You are about to drop the column `imagenUrls` on the `proyectos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "proyectos" DROP COLUMN "imagenUrls",
ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
