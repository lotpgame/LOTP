-- AlterTable
ALTER TABLE "TournamentParticipant" ADD COLUMN "indicator" INTEGER;
ALTER TABLE "TournamentParticipant" ADD COLUMN "losses" INTEGER;
ALTER TABLE "TournamentParticipant" ADD COLUMN "poolNumber" INTEGER;
ALTER TABLE "TournamentParticipant" ADD COLUMN "seedRank" INTEGER;
ALTER TABLE "TournamentParticipant" ADD COLUMN "touchesReceived" INTEGER;
ALTER TABLE "TournamentParticipant" ADD COLUMN "touchesScored" INTEGER;
ALTER TABLE "TournamentParticipant" ADD COLUMN "wins" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'DE',
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
INSERT INTO "new_Match" ("createdAt", "id", "log", "orderIndex", "playerAId", "playerBId", "round", "scoreA", "scoreB", "seed", "tournamentId", "winnerId") SELECT "createdAt", "id", "log", "orderIndex", "playerAId", "playerBId", "round", "scoreA", "scoreB", "seed", "tournamentId", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
