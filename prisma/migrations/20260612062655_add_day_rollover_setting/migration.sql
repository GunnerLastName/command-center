-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "dayRolloverHour" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("createdAt", "dailyMinimumHours", "dailyStretchHours", "dashboardWidgets", "habitsScoreWeight", "id", "reviewScoreWeight", "tasksScoreWeight", "theme", "updatedAt", "userName", "workScoreWeight") SELECT "createdAt", "dailyMinimumHours", "dailyStretchHours", "dashboardWidgets", "habitsScoreWeight", "id", "reviewScoreWeight", "tasksScoreWeight", "theme", "updatedAt", "userName", "workScoreWeight" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
