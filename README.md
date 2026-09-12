# Project Engarde

Eskrim temalı, metin-tabanlı kariyer ve yönetim simülasyonu (Hattrick / Championship
Manager tarzı). Oyuncu bir eskrimci yaratır ve yıllar süren kariyerini yönetir.

- Çalışma kuralları ve mimari: [`CLAUDE.md`](CLAUDE.md)
- Değişiklik geçmişi: [`CHANGELOG.md`](CHANGELOG.md)
- Tam tasarım dokümanları: [`docs/gdd/`](docs/gdd/)

---

## Teknoloji

TypeScript · Next.js 16 (React 19, App Router) · Tailwind CSS · ESLint
Veritabanı: SQLite (geliştirme) → PostgreSQL (multiplayer fazı), Prisma ORM ile *(sıradaki adım)*.

## Kurulum ve çalıştırma

Önkoşul: **Node.js** (kuruldu — v24.19.0). Yeni bir terminalde `node --version` sürüm
yazdırmalı. (Not: Node winget ile kurulduğu için, kurulumdan önce açılmış terminaller
PATH'i görmez — terminali/Claude Code'u bir kez yeniden başlatmak yeterli.)

```bash
npm install     # bağımlılıkları kur (ilk sefer / yeni makinede)
npm run dev     # geliştirme sunucusu → http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

## Proje yapısı

Şu an standart Next.js iskeleti (`src/app/`). Engine'ler eklendikçe hedeflenen yapı:

```
src/
  engine/     # saf simülasyon mantığı (I/O yok) — Player, Skill, Combat, Ranking...
  db/         # veritabanı erişimi (Prisma)
  server/     # engine ↔ DB orkestrasyonu (API, günlük döngü)
  app/        # Next.js arayüzü (React ekranları)  ← şu an burada
scripts/      # başsız dengeleme simülasyonları
tests/        # Vitest testleri
docs/gdd/     # tasarım dokümanları (26 bölüm)
```

## Yol haritası (özet)

GDD'nin engine öncelik sırasıyla ilerlenir: **Player → Skill → Trait → Psychology →
Coach → Club → Training → Equipment → Tournament → Combat → Probability → Ranking →
Economy → Memory → AI.** V1 hedefi: uçtan uca çalışan kariyer döngüsü.

Sıradaki adım: **Prisma + SQLite yapılandırması**, ardından **Player Engine + oyuncu
oluşturma ekranı**.
