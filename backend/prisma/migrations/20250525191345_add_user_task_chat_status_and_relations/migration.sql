-- CreateTable
CREATE TABLE "user_task_chat_statuses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "lastReadTimestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_task_chat_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_task_chat_statuses_userId_taskId_key" ON "user_task_chat_statuses"("userId", "taskId");

-- AddForeignKey
ALTER TABLE "user_task_chat_statuses" ADD CONSTRAINT "user_task_chat_statuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_task_chat_statuses" ADD CONSTRAINT "user_task_chat_statuses_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tareas_bitacora"("id") ON DELETE CASCADE ON UPDATE CASCADE;
