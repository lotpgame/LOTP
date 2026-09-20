-- M11.3b: ortak turnuva örneği anahtarı (dedup). Nullable + unique (SQLite'ta çoklu NULL serbest).
ALTER TABLE "Tournament" ADD COLUMN "scopeKey" TEXT;
CREATE UNIQUE INDEX "Tournament_scopeKey_key" ON "Tournament"("scopeKey");
