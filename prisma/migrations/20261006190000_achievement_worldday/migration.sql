-- Kupa vitrini + kariyer zaman çizgisi (GORSEL_ETKILESIM §7): başarının kazanıldığı dünya günü.
-- Yalnız EKLEMELİ — mevcut satırlar değişmez (null kalır → gösterim çeyreğe düşer).
ALTER TABLE "Achievement" ADD COLUMN "worldDay" INTEGER;
