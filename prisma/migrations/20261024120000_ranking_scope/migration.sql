-- İki klasman (DOMESTIC + WORLD): Ranking'e `scope` eklenir; unique key + index scope'u içerir.
-- Eklemeli + default: mevcut satırlar scope='DOMESTIC' olur → canlı veri korunur.
-- DOMESTIC = İl + Ulusal (ülke klasmanı / milli takım). WORLD = uluslararası (dünya/kıta klasmanı).
ALTER TABLE "Ranking" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'DOMESTIC';

DROP INDEX "Ranking_playerId_categoryId_quarter_key";
CREATE UNIQUE INDEX "Ranking_playerId_categoryId_quarter_scope_key" ON "Ranking"("playerId", "categoryId", "quarter", "scope");

DROP INDEX "Ranking_categoryId_quarter_idx";
CREATE INDEX "Ranking_categoryId_quarter_scope_idx" ON "Ranking"("categoryId", "quarter", "scope");
