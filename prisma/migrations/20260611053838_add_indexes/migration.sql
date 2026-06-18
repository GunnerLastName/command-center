-- CreateIndex
CREATE INDEX "BrainDumpItem_projectId_idx" ON "BrainDumpItem"("projectId");

-- CreateIndex
CREATE INDEX "BrainDumpItem_projectAreaId_idx" ON "BrainDumpItem"("projectAreaId");

-- CreateIndex
CREATE INDEX "BrainDumpItem_status_idx" ON "BrainDumpItem"("status");

-- CreateIndex
CREATE INDEX "ProjectArea_projectId_idx" ON "ProjectArea"("projectId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_projectAreaId_idx" ON "Task"("projectAreaId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_today_idx" ON "Task"("today");

-- CreateIndex
CREATE INDEX "WorkSession_projectId_idx" ON "WorkSession"("projectId");

-- CreateIndex
CREATE INDEX "WorkSession_taskId_idx" ON "WorkSession"("taskId");

-- CreateIndex
CREATE INDEX "WorkSession_startTime_idx" ON "WorkSession"("startTime");

-- CreateIndex
CREATE INDEX "WorkSession_endTime_idx" ON "WorkSession"("endTime");
