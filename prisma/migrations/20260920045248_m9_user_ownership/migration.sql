-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "humanPlayerId" INTEGER NOT NULL,
    "userId" INTEGER,
    "seed" TEXT NOT NULL,
    "currentDate" DATETIME NOT NULL,
    "dayIndex" INTEGER NOT NULL DEFAULT 0,
    "liveTournament" TEXT,
    "trainingPlan" TEXT NOT NULL DEFAULT 'TECHNICAL,PHYSICAL,REST',
    "lastReport" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameState" ("createdAt", "currentDate", "dayIndex", "humanPlayerId", "id", "lastReport", "liveTournament", "seed", "trainingPlan", "updatedAt") SELECT "createdAt", "currentDate", "dayIndex", "humanPlayerId", "id", "lastReport", "liveTournament", "seed", "trainingPlan", "updatedAt" FROM "GameState";
DROP TABLE "GameState";
ALTER TABLE "new_GameState" RENAME TO "GameState";
CREATE UNIQUE INDEX "GameState_humanPlayerId_key" ON "GameState"("humanPlayerId");
CREATE UNIQUE INDEX "GameState_userId_key" ON "GameState"("userId");
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "userId" INTEGER,
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
    "sharpness" REAL NOT NULL DEFAULT 50,
    "injuryDaysRemaining" INTEGER NOT NULL DEFAULT 0,
    "traits" TEXT NOT NULL DEFAULT '',
    "morale" REAL NOT NULL DEFAULT 60,
    "motivation" REAL NOT NULL DEFAULT 65,
    "confidence" REAL NOT NULL DEFAULT 50,
    "stress" REAL NOT NULL DEFAULT 20,
    "equipmentLevel" INTEGER NOT NULL DEFAULT 1,
    "balance" REAL NOT NULL DEFAULT 0,
    "careerBestRank" INTEGER,
    "tactic" TEXT NOT NULL DEFAULT 'BALANCED',
    "adultHeightCm" REAL NOT NULL DEFAULT 175,
    "reachBiasCm" REAL NOT NULL DEFAULT 0,
    "buildFactor" REAL NOT NULL DEFAULT 0,
    "leftHanded" BOOLEAN NOT NULL DEFAULT false,
    "clubId" INTEGER,
    "careerStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Player_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Player_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("adultHeightCm", "balance", "birthDate", "buildFactor", "careerBestRank", "careerStartDate", "clubId", "code", "confidence", "createdAt", "equipmentLevel", "fatigue", "firstName", "gender", "id", "injuryDaysRemaining", "isAI", "lastName", "leftHanded", "morale", "motivation", "nationalityId", "profile", "reachBiasCm", "sharpness", "status", "stress", "tactic", "traits", "updatedAt", "weapon") SELECT "adultHeightCm", "balance", "birthDate", "buildFactor", "careerBestRank", "careerStartDate", "clubId", "code", "confidence", "createdAt", "equipmentLevel", "fatigue", "firstName", "gender", "id", "injuryDaysRemaining", "isAI", "lastName", "leftHanded", "morale", "motivation", "nationalityId", "profile", "reachBiasCm", "sharpness", "status", "stress", "tactic", "traits", "updatedAt", "weapon" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_code_key" ON "Player"("code");
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");
CREATE INDEX "Player_nationalityId_idx" ON "Player"("nationalityId");
CREATE INDEX "Player_gender_weapon_idx" ON "Player"("gender", "weapon");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_token_key" ON "User"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
