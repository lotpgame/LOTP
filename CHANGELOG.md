# Changelog

Bu projedeki tüm önemli değişiklikler bu dosyada tutulur.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) ·
Sürümleme: [Semantic Versioning](https://semver.org/lang/tr/).

## [Unreleased]

### Eklendi
- **M1 — Dikey dilim tamamlandı (ilk oynanabilir kariyer):**
  - Saf simülasyon engine'leri: `domain`, `skill` (10 alt-skill, azalan verimli gelişim),
    `training`, `combat` (silaha göre olasılık, tuş-tuş, metin log), `tournament`
    (8 kişilik tek eleme), `ranking` (Open puanları), `player` (Zod doğrulama + AI üretimi).
    38 birim testi (tümü sabit seed → tekrarlanabilir).
  - Kalıcılık: şema `PlayerSkill`, `GameState`, `Tournament`, `TournamentParticipant`,
    `Match`, `Ranking` ile genişletildi (migration `m1_core`).
  - Orkestrasyon: `careerService` (Engine→DataService→DB) — kariyer oluştur, gün/antrenman,
    turnuva çalıştır, ranking, kaydet/yükle.
  - Ekranlar (Next 16 + Server Actions): oyuncu oluşturma, kariyer paneli (durum, yetenekler,
    antrenman, ranking), turnuva sonuç sayfası (dereceler + maç anlatımları). Türkçe UI.
  - Uçtan uca tarayıcıda doğrulandı: oluştur → antren → turnuva → sonuç → ranking → kalıcılık.
- **M0 — Altyapı tamamlandı:**
  - Prisma 7 + SQLite kurulumu; ilk şema (`Country`, `Season`, `Player`) + `init` migration.
    Prisma 7 driver-adapter mimarisi: `@prisma/adapter-better-sqlite3` + `better-sqlite3`.
    Üretilen client `src/generated/` (gitignore'da; `postinstall` ile üretilir).
  - Tohumlanabilir deterministik RNG (`src/engine/probability`, cyrb128+sfc32) —
    aynı seed → aynı sonuç (GDD 20.30). Vitest ile 9 test.
  - Engine olay tipleri (`src/engine/events.ts`).
  - Veritabanı katmanı (`src/db`, singleton client) + Data Service iskeleti (`src/server`).
  - Vitest kurulumu (`vitest.config.mts`) ve `tests/`; başsız çalıştırıcı (`scripts/sim.ts`).
  - npm script'leri: `test`, `test:watch`, `sim`, `db:migrate`, `db:generate`, `db:studio`,
    `postinstall`.
- **`docs/ROADMAP.md`**: projenin teknik uygulama planı — mimari kararlar (saf engine'ler,
  seeded RNG, tek kaynaklı veri, Data Service katmanı), M0–M8 aşamaları, veri sahipliği
  tablosu, test stratejisi ve süreç kuralları. GDD'nin "NASIL/hangi sırayla" karşılığı.
  `CLAUDE.md` ve `README.md` buna referans verecek şekilde güncellendi.
- Proje temeli: 26 bölümlük GDD `docs/gdd/` altına çıkarıldı.
- `CLAUDE.md`: teknoloji kararı, engine=modül mimarisi, güvenlik ve çalışma kuralları.
- Git deposu başlatıldı; `.gitignore` (sırlar, node_modules, DB dosyaları hariç tutuldu).
- Node.js LTS kuruldu (winget, v24.19.0 / npm 11.17.0).
- Next.js 16 + TypeScript + Tailwind CSS + ESLint iskeleti (App Router, `src/` dizini).
- `CHANGELOG.md` oluşturuldu; README + CHANGELOG'u her işte güncel tutma kuralı benimsendi.

### Değişti
- Paket adı `project-engarde` olarak ayarlandı.
- Next.js anonim telemetrisi kapatıldı (gizlilik).

[Unreleased]: https://example.com/project-engarde
