-- CreateTable
CREATE TABLE "_TareaParticipantes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TareaParticipantes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TareaParticipantes_B_index" ON "_TareaParticipantes"("B");

-- AddForeignKey
ALTER TABLE "_TareaParticipantes" ADD CONSTRAINT "_TareaParticipantes_A_fkey" FOREIGN KEY ("A") REFERENCES "tareas_bitacora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TareaParticipantes" ADD CONSTRAINT "_TareaParticipantes_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
