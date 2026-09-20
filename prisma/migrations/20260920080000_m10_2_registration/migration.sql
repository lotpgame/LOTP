-- M10.2: turnuva kaydı + önceden taktik.
CREATE TABLE "Registration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "worldDay" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tactic" TEXT NOT NULL DEFAULT 'BALANCED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Registration_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Registration_playerId_worldDay_level_key" ON "Registration"("playerId", "worldDay", "level");
CREATE INDEX "Registration_worldDay_level_categoryId_idx" ON "Registration"("worldDay", "level", "categoryId");
