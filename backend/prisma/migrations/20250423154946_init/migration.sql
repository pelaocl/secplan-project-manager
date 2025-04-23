-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COORDINADOR', 'USUARIO', 'VISITANTE');

-- CreateEnum
CREATE TYPE "TipoMoneda" AS ENUM ('CLP', 'UF');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USUARIO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etiquetas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" SERIAL NOT NULL,
    "codigoUnico" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "direccion" TEXT,
    "superficieTerreno" DOUBLE PRECISION,
    "superficieEdificacion" DOUBLE PRECISION,
    "ano" INTEGER,
    "proyectoPriorizado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estadoId" INTEGER,
    "unidadId" INTEGER,
    "tipologiaId" INTEGER NOT NULL,
    "sectorId" INTEGER,
    "proyectistaId" INTEGER,
    "formuladorId" INTEGER,
    "lineaFinanciamientoId" INTEGER,
    "programaId" INTEGER,
    "etapaFinanciamientoId" INTEGER,
    "monto" DECIMAL(15,2),
    "tipoMoneda" "TipoMoneda" NOT NULL DEFAULT 'CLP',
    "codigoExpediente" TEXT,
    "fechaPostulacion" DATE,
    "montoAdjudicado" DECIMAL(15,2),
    "codigoLicitacion" TEXT,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_proyecto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "estados_proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_municipales" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviacion" TEXT NOT NULL,

    CONSTRAINT "unidades_municipales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipologias_proyecto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "abreviacion" TEXT NOT NULL,
    "colorChip" TEXT NOT NULL,

    CONSTRAINT "tipologias_proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "sectores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_financiamiento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "lineas_financiamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "lineaFinanciamientoId" INTEGER NOT NULL,

    CONSTRAINT "programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapas_financiamiento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "etapas_financiamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas_bitacora" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaPlazo" TIMESTAMP(3),
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proyectoId" INTEGER NOT NULL,
    "asignadoId" INTEGER,

    CONSTRAINT "tareas_bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserEtiquetas" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserEtiquetas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectCollaborators" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProjectCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "etiquetas_nombre_key" ON "etiquetas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "proyectos_codigoUnico_key" ON "proyectos"("codigoUnico");

-- CreateIndex
CREATE UNIQUE INDEX "estados_proyecto_nombre_key" ON "estados_proyecto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_municipales_nombre_key" ON "unidades_municipales"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_municipales_abreviacion_key" ON "unidades_municipales"("abreviacion");

-- CreateIndex
CREATE UNIQUE INDEX "tipologias_proyecto_nombre_key" ON "tipologias_proyecto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipologias_proyecto_abreviacion_key" ON "tipologias_proyecto"("abreviacion");

-- CreateIndex
CREATE UNIQUE INDEX "sectores_nombre_key" ON "sectores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "lineas_financiamiento_nombre_key" ON "lineas_financiamiento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "programas_nombre_lineaFinanciamientoId_key" ON "programas"("nombre", "lineaFinanciamientoId");

-- CreateIndex
CREATE UNIQUE INDEX "etapas_financiamiento_nombre_key" ON "etapas_financiamiento"("nombre");

-- CreateIndex
CREATE INDEX "_UserEtiquetas_B_index" ON "_UserEtiquetas"("B");

-- CreateIndex
CREATE INDEX "_ProjectCollaborators_B_index" ON "_ProjectCollaborators"("B");

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "estados_proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "unidades_municipales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_tipologiaId_fkey" FOREIGN KEY ("tipologiaId") REFERENCES "tipologias_proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_proyectistaId_fkey" FOREIGN KEY ("proyectistaId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_formuladorId_fkey" FOREIGN KEY ("formuladorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_lineaFinanciamientoId_fkey" FOREIGN KEY ("lineaFinanciamientoId") REFERENCES "lineas_financiamiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "programas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_etapaFinanciamientoId_fkey" FOREIGN KEY ("etapaFinanciamientoId") REFERENCES "etapas_financiamiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programas" ADD CONSTRAINT "programas_lineaFinanciamientoId_fkey" FOREIGN KEY ("lineaFinanciamientoId") REFERENCES "lineas_financiamiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas_bitacora" ADD CONSTRAINT "tareas_bitacora_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas_bitacora" ADD CONSTRAINT "tareas_bitacora_asignadoId_fkey" FOREIGN KEY ("asignadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserEtiquetas" ADD CONSTRAINT "_UserEtiquetas_A_fkey" FOREIGN KEY ("A") REFERENCES "etiquetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserEtiquetas" ADD CONSTRAINT "_UserEtiquetas_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectCollaborators" ADD CONSTRAINT "_ProjectCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectCollaborators" ADD CONSTRAINT "_ProjectCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
