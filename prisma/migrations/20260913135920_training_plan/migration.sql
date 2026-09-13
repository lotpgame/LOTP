-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "humanPlayerId" INTEGER NOT NULL,
    "seed" TEXT NOT NULL,
    "currentDate" DATETIME NOT NULL,
    "weekIndex" INTEGER NOT NULL DEFAULT 0,
    "pendingLevel" TEXT,
    "pendingWeekIndex" INTEGER,
    "liveTournament" TEXT,
    "trainingPlan" TEXT NOT NULL DEFAULT 'TECHNICAL,PHYSICAL,REST',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GameState" ("createdAt", "currentDate", "humanPlayerId", "id", "liveTournament", "pendingLevel", "pendingWeekIndex", "seed", "updatedAt", "weekIndex") SELECT "createdAt", "currentDate", "humanPlayerId", "id", "liveTournament", "pendingLevel", "pendingWeekIndex", "seed", "updatedAt", "weekIndex" FROM "GameState";
DROP TABLE "GameState";
ALTER TABLE "new_GameState" RENAME TO "GameState";
CREATE UNIQUE INDEX "GameState_humanPlayerId_key" ON "GameState"("humanPlayerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
