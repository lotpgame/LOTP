-- Aşama 2b: eleme maçı periyot periyot çözülürken birikmiş durum (DeBoutState JSON).
-- Eklemeli + nullable → canlı veri korunur (mevcut maçlar NULL, davranış değişmez).
ALTER TABLE "Match" ADD COLUMN "deState" TEXT;
