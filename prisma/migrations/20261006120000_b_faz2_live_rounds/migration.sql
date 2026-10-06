-- B Faz 2-4 (docs/DEVIR.md "B Faz 2-4 şartnamesi", 06.10): canlı turnuva TUR TUR çözülür.
-- Tamamen EKLEMELİ: yeni nullable sütunlar + varsayılanlı "step" + yeni olay tablosu. Mevcut satırlara
-- dokunulmaz; eski (anında çözülmüş) turnuvalarda yeni alanlar null/0 kalır.

-- Turnuva: T+0 anı, turnuva günü, çözülmüş adım sayısı.
ALTER TABLE "Tournament" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "Tournament" ADD COLUMN "worldDay" INTEGER;
ALTER TABLE "Tournament" ADD COLUMN "step" INTEGER NOT NULL DEFAULT 0;

-- Katılımcı: turnuva başı anlık görüntü + turnuva-içi yorgunluk + taktik kaynakları.
ALTER TABLE "TournamentParticipant" ADD COLUMN "snapshot" TEXT;
ALTER TABLE "TournamentParticipant" ADD COLUMN "fatigue" INTEGER;
ALTER TABLE "TournamentParticipant" ADD COLUMN "registeredTactic" TEXT;
ALTER TABLE "TournamentParticipant" ADD COLUMN "pendingTactic" TEXT;
ALTER TABLE "TournamentParticipant" ADD COLUMN "lastTactic" TEXT;

-- Maç: tur numarası, eleme tablosu yeri, kullanılan taktikler.
ALTER TABLE "Match" ADD COLUMN "roundNo" INTEGER;
ALTER TABLE "Match" ADD COLUMN "slot" INTEGER;
ALTER TABLE "Match" ADD COLUMN "tacticA" TEXT;
ALTER TABLE "Match" ADD COLUMN "tacticB" TEXT;

-- Olay kaydı (GDD 23.59) + taktik istek sınırı (GDD 23.58) için.
CREATE TABLE "TournamentEvent" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "playerId" INTEGER,
    "type" TEXT NOT NULL,
    "step" INTEGER,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TournamentEvent_tournamentId_createdAt_idx" ON "TournamentEvent"("tournamentId", "createdAt");
CREATE INDEX "TournamentEvent_tournamentId_playerId_createdAt_idx" ON "TournamentEvent"("tournamentId", "playerId", "createdAt");
ALTER TABLE "TournamentEvent" ADD CONSTRAINT "TournamentEvent_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
