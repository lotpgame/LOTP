-- B Faz 0 (docs/TURNUVA_MULTIPLAYER.md §2.1, §4): server-authoritative canlı turnuva için kanonik şema.
-- PENDING maçlar oyuncular/skor belli olmadan ÖNCEDEN yazılır (bracket turnuva başında bir kez çekilir).
-- Eklemeli: mevcut satırlar zaten dolu, hiçbiri etkilenmez — yalnız YENİ canlı yol PENDING yazabilir.
ALTER TABLE "Match" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'RESOLVED';
ALTER TABLE "Match" ADD COLUMN "scheduledAt" TIMESTAMP(3);

ALTER TABLE "Match" ALTER COLUMN "playerAId" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "playerBId" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "scoreA" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "scoreB" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "winnerId" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "log" DROP NOT NULL;
