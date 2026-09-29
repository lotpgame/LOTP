-- M11.5: AI havuzu ORTAK (bkz. resetCareer yorumu, DEVIR.md). Önceden worldAdvanceTx her ay geçişinde
-- "bu ay zaten işlendi mi?" diye bakmadan TÜM AI'ların gelişimini yeniden zar atıyordu — birden fazla
-- insanın kendi gün ilerletmesi aynı ayı geçtiğinde bu ay birkaç kez üst üste işlenip AI'lar tasarlanandan
-- hızlı/tutarsız gelişebiliyordu. Bu sütun her AI'nın "en son işlenen ay"ını tutar; worldAdvanceTx artık
-- bunu atomik bir updateMany + koşullu WHERE ile "hak ediyor" (bkz. careerService.ts).
ALTER TABLE "Player" ADD COLUMN "aiDevMonth" INTEGER NOT NULL DEFAULT -1;

-- Veri-düzeltmesi (KRİTİK — canlı test verisi için gerekli): yukarıdaki DEFAULT -1, mevcut AI'ları
-- "hiç işlenmemiş" gösterir. Bunu düzeltmezsek bir sonraki gün ilerletmede TÜM AI'lar TÜM kaçırılan
-- ayları birden telafi edip aşırı bir gelişim sıçraması yapar. Bunun yerine mevcut AI'ları "en ileri
-- gitmiş insanın vardığı aya kadar zaten işlenmiş" olarak başlatıyoruz (güvenli/muhafazakâr taraf —
-- olası bir tekrar-işlemeyi engeller ama eksik büyüme yaratmaz, sadece bundan sonrakiler tekilleşir).
UPDATE "Player"
SET "aiDevMonth" = (SELECT COALESCE(MAX("dayIndex"), 0) FROM "GameState") / 7
WHERE "isAI" = true;
