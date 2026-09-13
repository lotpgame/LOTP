# Project Engarde

Eskrim temalı, metin-tabanlı kariyer ve yönetim simülasyonu (Hattrick / Championship
Manager tarzı). Oyuncu bir eskrimci yaratır ve yıllar süren kariyerini yönetir.

- **Yol haritası / teknik plan:** [`docs/ROADMAP.md`](docs/ROADMAP.md) — nasıl ve hangi
  sırayla inşa ediliyor (mimari kararlar + M0–M8 aşamaları).
- Çalışma kuralları ve mimari: [`CLAUDE.md`](CLAUDE.md)
- Değişiklik geçmişi: [`CHANGELOG.md`](CHANGELOG.md)
- Tam tasarım dokümanları: [`docs/gdd/`](docs/gdd/) (GDD, 26 bölüm)

---

## Teknoloji

TypeScript · Next.js 16 (React 19, App Router) · Tailwind CSS · ESLint · Vitest
Veritabanı: SQLite (geliştirme) → PostgreSQL (multiplayer fazı), **Prisma 7 ORM** ile
(SQLite için `better-sqlite3` driver adapter).

## Kurulum ve çalıştırma

Önkoşul: **Node.js** (kuruldu — v24.19.0). Yeni bir terminalde `node --version` sürüm
yazdırmalı. (Not: Node winget ile kurulduğu için, kurulumdan önce açılmış terminaller
PATH'i görmez — terminali/Claude Code'u bir kez yeniden başlatmak yeterli.)

İlk kurulumda `.env` gerekir: `cp .env.example .env` (SQLite yolu hazır gelir).

```bash
npm install       # bağımlılıkları kur (+ prisma client'ı otomatik üretir)
npm run db:migrate  # veritabanı şemasını uygula (ilk sefer / şema değişince)
npm run dev       # geliştirme sunucusu → http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
npm test          # Vitest testleri (70)
npm run sim       # başsız denge raporu (combat/gelişim/turnuva/sakatlık)
npm run db:studio # veritabanını görsel incele (Prisma Studio)
npm run db:backup # veritabanının zaman damgalı yedeğini al
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

Ayrıntılı aşamalar ve güncel durum: [`docs/ROADMAP.md`](docs/ROADMAP.md).

✅ **M0 — Altyapı** ve ✅ **M1 — Dikey dilim** tamam. Oyun artık uçtan uca oynanabilir:
oyuncu oluştur → antren yap (gün ilerler) → 8 kişilik turnuvaya katıl → maç sonuçlarını
metinle izle → kategori ranking'inde yerini gör. Kariyer veritabanında saklanır (kaldığın
yerden devam). `npm run dev` → http://localhost:3000.

✅ M2, ✅ M3 ve ✅ **M4 — Quarter Ranking + uluslararası + milli takım** tamam. Oyun artık
**hafta/quarter takvimiyle** ilerliyor (12 hafta = 1 oyun yılı): her hafta İl/Open (+ çift
haftalarda Türkiye) turnuvaları; Satellite/Grand Prix ilk 16'ya, Avrupa/Dünya Kupası
**milli takıma (ilk 4)** davetli. Quarter Ranking quarter sonunda sıfırlanır, yaş +1 ilerler.

✅ M5 ve ✅ **M6 — Gelişim çevresi** tamam: **Trait** (karakter), **Psychology** (moral/
motivasyon/özgüven/stres), **Coach/Club** (antrenman kalitesi + koç uzmanlığı), **Equipment**
(ekipman seviyesi), **Economy** (turnuva ödülü, para, ekipman yükseltme) — hepsi antrenman
verimine ve maç gücüne modifier olarak bağlı.

🎉 **V1 TAMAMLANDI (sürüm 1.0.0)** — M0'dan M8'e uçtan uca çalışan kariyer döngüsü:
oyuncu oluştur → haftalık antrenman planı (kondisyon/sakatlık) → gerçek FIE turnuvaları
(pul + eleme) → Quarter Ranking + milli takım → gelişim çevresi (trait/psikoloji/kulüp/
koç/ekipman/ekonomi) → canlı AI dünyası + başarılar & kariyer geçmişi. **76 test.**

🛠️ **V1 sonrası oynanış iyileştirmeleri** (playtest, bkz. [`docs/NOTLAR.md`](docs/NOTLAR.md)):
şehir seçimi → kulüp; fiziksel yapı (boy/kulaç/bacak/kilo/el); **canlı maç izleme** (CM tarzı);
**turnuva kayıt → bekle → oyna akışı** — "Katıl" ile kaydolursun, tek **"Haftayı İlerle"**
düğmesi zamanı sürer ve turnuva haftası gelince seni turnuva ekranına götürür (online'da bunu
sunucu saati yapar); **maç taktiği** (ofansif/dengeli/defansif — skill+trait ile etkileşir);
panelde **kondisyon** (dolu başlar, azalır) ve tüm göstergeler %'li; terim **"pul"** (poule).

Sonraki derinlik maddeleri ve V2 hedefleri: [`docs/ROADMAP.md`](docs/ROADMAP.md) (§G backlog,
§B "Sonra"). Öne çıkanlar: AI'ların bağımsız turnuvaları + emeklilik/yeni nesil, yaş kategorisi
ilerlemesi (U10→U12→…), gelişmiş taktik (counter/pressure, maç-arası değişim), multiplayer (PostgreSQL).
