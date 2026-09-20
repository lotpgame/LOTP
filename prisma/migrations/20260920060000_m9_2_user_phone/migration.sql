-- M9.2: telefon tabanlı hesap alanları (nullable → mevcut satırlar bozulmaz).
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" DATETIME;

-- Telefon benzersiz (SQLite birden çok NULL'a izin verir → anonim hesaplar sorunsuz).
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
