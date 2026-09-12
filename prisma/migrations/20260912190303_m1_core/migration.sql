-- CreateTable
CREATE TABLE "PlayerSkill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "current" REAL NOT NULL,
    "potential" REAL NOT NULL,
    "floor" REAL NOT NULL,
    "ceiling" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlayerSkill_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "humanPlayerId" INTEGER NOT NULL,
    "seed" TEXT NOT NULL,
    "currentDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'OPEN',
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINISHED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seed" INTEGER NOT NULL,
    "finalPosition" INTEGER,
    CONSTRAINT "TournamentParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "round" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "playerAId" INTEGER NOT NULL,
    "playerBId" INTEGER NOT NULL,
    "scoreA" INTEGER NOT NULL,
    "scoreB" INTEGER NOT NULL,
    "winnerId" INTEGER NOT NULL,
    "seed" TEXT NOT NULL,
    "log" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "points" REAL NOT NULL DEFAULT 0,
    "position" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ranking_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "weapon" TEXT NOT NULL,
    "nationalityId" INTEGER NOT NULL,
    "profile" TEXT NOT NULL DEFAULT 'BALANCED',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isAI" BOOLEAN NOT NULL DEFAULT false,
    "fatigue" REAL NOT NULL DEFAULT 0,
    "careerStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("birthDate", "careerStartDate", "code", "createdAt", "firstName", "gender", "id", "isAI", "lastName", "nationalityId", "status", "updatedAt", "weapon") SELECT "birthDate", "careerStartDate", "code", "createdAt", "firstName", "gender", "id", "isAI", "lastName", "nationalityId", "status", "updatedAt", "weapon" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_code_key" ON "Player"("code");
CREATE INDEX "Player_nationalityId_idx" ON "Player"("nationalityId");
CREATE INDEX "Player_gender_weapon_idx" ON "Player"("gender", "weapon");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PlayerSkill_playerId_idx" ON "PlayerSkill"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSkill_playerId_key_key" ON "PlayerSkill"("playerId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "GameState_humanPlayerId_key" ON "GameState"("humanPlayerId");

-- CreateIndex
CREATE INDEX "Tournament_categoryId_idx" ON "Tournament"("categoryId");

-- CreateIndex
CREATE INDEX "TournamentParticipant_tournamentId_idx" ON "TournamentParticipant"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentParticipant_playerId_idx" ON "TournamentParticipant"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_playerId_key" ON "TournamentParticipant"("tournamentId", "playerId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Ranking_categoryId_idx" ON "Ranking"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_playerId_categoryId_key" ON "Ranking"("playerId", "categoryId");
