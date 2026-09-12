-- CreateTable
CREATE TABLE "Club" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "facility" INTEGER NOT NULL DEFAULT 60,
    "coachName" TEXT NOT NULL,
    "coachSkill" INTEGER NOT NULL DEFAULT 60,
    "coachSpecialty" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "sharpness" REAL NOT NULL DEFAULT 50,
    "injuryWeeksRemaining" INTEGER NOT NULL DEFAULT 0,
    "traits" TEXT NOT NULL DEFAULT '',
    "morale" REAL NOT NULL DEFAULT 60,
    "motivation" REAL NOT NULL DEFAULT 65,
    "confidence" REAL NOT NULL DEFAULT 50,
    "stress" REAL NOT NULL DEFAULT 20,
    "equipmentLevel" INTEGER NOT NULL DEFAULT 1,
    "balance" REAL NOT NULL DEFAULT 0,
    "clubId" INTEGER,
    "careerStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Player_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("birthDate", "careerStartDate", "code", "createdAt", "fatigue", "firstName", "gender", "id", "injuryWeeksRemaining", "isAI", "lastName", "nationalityId", "profile", "sharpness", "status", "updatedAt", "weapon") SELECT "birthDate", "careerStartDate", "code", "createdAt", "fatigue", "firstName", "gender", "id", "injuryWeeksRemaining", "isAI", "lastName", "nationalityId", "profile", "sharpness", "status", "updatedAt", "weapon" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_code_key" ON "Player"("code");
CREATE INDEX "Player_nationalityId_idx" ON "Player"("nationalityId");
CREATE INDEX "Player_gender_weapon_idx" ON "Player"("gender", "weapon");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
