-- Bugün ekranı radarı (GORSEL_ETKILESIM §8): çeyrek başı yetenek değerleri (JSON).
-- Yalnız EKLEMELİ — mevcut satırlar değişmez (null kalır → ilk ilerlemede o günün değerleri dondurulur).
ALTER TABLE "GameState" ADD COLUMN "skillQuarterBase" TEXT;
