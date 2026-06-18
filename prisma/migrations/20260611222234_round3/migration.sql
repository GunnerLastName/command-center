-- AlterTable
ALTER TABLE "Project" ADD COLUMN "completedAt" DATETIME;

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" TEXT NOT NULL,
    "whatWorked" TEXT NOT NULL DEFAULT '',
    "whatToFix" TEXT NOT NULL DEFAULT '',
    "nextWeekFocus" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyHabit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "points" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "scheduleDays" TEXT NOT NULL DEFAULT '1,2,3,4,5,6,7',
    "timesPerDay" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DailyHabit" ("active", "category", "createdAt", "description", "id", "name", "points", "sortOrder", "updatedAt") SELECT "active", "category", "createdAt", "description", "id", "name", "points", "sortOrder", "updatedAt" FROM "DailyHabit";
DROP TABLE "DailyHabit";
ALTER TABLE "new_DailyHabit" RENAME TO "DailyHabit";
CREATE TABLE "new_HabitCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HabitCompletion_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "DailyHabit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HabitCompletion" ("completed", "completedAt", "createdAt", "date", "habitId", "id", "updatedAt") SELECT "completed", "completedAt", "createdAt", "date", "habitId", "id", "updatedAt" FROM "HabitCompletion";
DROP TABLE "HabitCompletion";
ALTER TABLE "new_HabitCompletion" RENAME TO "HabitCompletion";
CREATE UNIQUE INDEX "HabitCompletion_habitId_date_key" ON "HabitCompletion"("habitId", "date");
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "dailyMinimumHours" REAL NOT NULL DEFAULT 6,
    "dailyStretchHours" REAL NOT NULL DEFAULT 8,
    "workScoreWeight" INTEGER NOT NULL DEFAULT 40,
    "habitsScoreWeight" INTEGER NOT NULL DEFAULT 35,
    "tasksScoreWeight" INTEGER NOT NULL DEFAULT 15,
    "reviewScoreWeight" INTEGER NOT NULL DEFAULT 10,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "userName" TEXT NOT NULL DEFAULT 'Gunner',
    "dashboardWidgets" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("createdAt", "dailyMinimumHours", "dailyStretchHours", "habitsScoreWeight", "id", "reviewScoreWeight", "tasksScoreWeight", "theme", "updatedAt", "workScoreWeight") SELECT "createdAt", "dailyMinimumHours", "dailyStretchHours", "habitsScoreWeight", "id", "reviewScoreWeight", "tasksScoreWeight", "theme", "updatedAt", "workScoreWeight" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "projectAreaId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" DATETIME,
    "estimatedMinutes" INTEGER,
    "today" BOOLEAN NOT NULL DEFAULT false,
    "todaySortOrder" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_projectAreaId_fkey" FOREIGN KEY ("projectAreaId") REFERENCES "ProjectArea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completedAt", "createdAt", "dueDate", "estimatedMinutes", "id", "notes", "priority", "projectAreaId", "projectId", "status", "title", "today", "updatedAt") SELECT "completedAt", "createdAt", "dueDate", "estimatedMinutes", "id", "notes", "priority", "projectAreaId", "projectId", "status", "title", "today", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_projectAreaId_idx" ON "Task"("projectAreaId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_today_idx" ON "Task"("today");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_weekStart_key" ON "WeeklyReview"("weekStart");
