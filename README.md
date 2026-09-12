# Project Engarde

Eskrim temalı, metin-tabanlı kariyer ve yönetim simülasyonu (Hattrick / Championship
Manager tarzı). Oyuncu bir eskrimci yaratır ve yıllar süren kariyerini yönetir.

Detaylı çalışma kuralları ve mimari için: [`CLAUDE.md`](CLAUDE.md)
Tam tasarım dokümanları: [`docs/gdd/`](docs/gdd/)

---

## Teknoloji

TypeScript · Next.js (React) · Tailwind CSS · Prisma · SQLite (dev) → PostgreSQL (multiplayer)

## Başlamadan önce — Node.js kurulumu (tek önkoşul)

Bu proje **Node.js** gerektirir; henüz kurulu değil.

1. https://nodejs.org adresinden **LTS** sürümünü indir (Windows Installer .msi).
2. Kurulumu tamamla (varsayılan ayarlar yeterli), bilgisayarı yeniden başlat veya
   terminali kapatıp aç.
3. Kontrol:
   ```bash
   node --version
   npm --version
   ```
   İkisi de sürüm yazdırıyorsa hazırız.

SQLite, Prisma ile birlikte gelir — ayrı bir veritabanı sunucusu kurmana **gerek yok**.

## Sonraki adımlar (Node kurulunca Claude yapacak)

```bash
# 1. Next.js iskeleti kurulur
# 2. Prisma + SQLite yapılandırılır
# 3. Player Engine temeli + oyuncu oluşturma ekranı
npm install
npm run dev   # http://localhost:3000
```

## Proje yapısı (kurulum sonrası)

```
src/engine/   # saf simülasyon mantığı (I/O yok)
src/db/       # veritabanı erişimi (Prisma)
src/server/   # engine ↔ DB orkestrasyonu
src/app/      # Next.js arayüzü
scripts/      # başsız dengeleme simülasyonları
tests/        # Vitest testleri
docs/gdd/     # tasarım dokümanları
```
