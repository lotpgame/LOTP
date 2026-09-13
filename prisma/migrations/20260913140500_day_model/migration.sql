-- Gün-bazlı zaman modeli: weekIndex → dayIndex (hafta*7 = ilgili ayın Pazartesi'si),
-- kayıt (register) kaldırıldı, sakatlık hafta → gün.
ALTER TABLE "GameState" RENAME COLUMN "weekIndex" TO "dayIndex";
UPDATE "GameState" SET "dayIndex" = "dayIndex" * 7;
ALTER TABLE "GameState" DROP COLUMN "pendingLevel";
ALTER TABLE "GameState" DROP COLUMN "pendingWeekIndex";
ALTER TABLE "Player" RENAME COLUMN "injuryWeeksRemaining" TO "injuryDaysRemaining";
