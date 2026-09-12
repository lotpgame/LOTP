-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "humanPlayerId" INTEGER NOT NULL,
    "seed" TEXT NOT NULL,
    "currentDate" DATETIME NOT NULL,
    "weekIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GameState" ("createdAt", "currentDate", "humanPlayerId", "id", "seed", "updatedAt") SELECT "createdAt", "currentDate", "humanPlayerId", "id", "seed", "updatedAt" FROM "GameState";
DROP TABLE "GameState";
ALTER TABLE "new_GameState" RENAME TO "GameState";
CREATE UNIQUE INDEX "GameState_humanPlayerId_key" ON "GameState"("humanPlayerId");
CREATE TABLE "new_Ranking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL DEFAULT 1,
    "points" REAL NOT NULL DEFAULT 0,
    "position" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ranking_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ranking" ("categoryId", "id", "playerId", "points", "position", "updatedAt") SELECT "categoryId", "id", "playerId", "points", "position", "updatedAt" FROM "Ranking";
DROP TABLE "Ranking";
ALTER TABLE "new_Ranking" RENAME TO "Ranking";
CREATE INDEX "Ranking_categoryId_quarter_idx" ON "Ranking"("categoryId", "quarter");
CREATE UNIQUE INDEX "Ranking_playerId_categoryId_quarter_key" ON "Ranking"("playerId", "categoryId", "quarter");
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'OPEN',
    "quarter" INTEGER NOT NULL DEFAULT 1,
    "week" INTEGER NOT NULL DEFAULT 1,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINISHED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Tournament" ("categoryId", "createdAt", "date", "id", "level", "name", "status") SELECT "categoryId", "createdAt", "date", "id", "level", "name", "status" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE INDEX "Tournament_categoryId_idx" ON "Tournament"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
