# Changelog

Bu projedeki tüm önemli değişiklikler bu dosyada tutulur.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) ·
Sürümleme: [Semantic Versioning](https://semver.org/lang/tr/).

## [Unreleased]

Playtest (oyun sahibi) geri bildirimlerine göre oynanış iyileştirmeleri. Ayrıntılı liste
`docs/NOTLAR.md`.

### Eklendi
- **Gün-bazlı zaman modeli (GDD 17.7 + kullanıcı takvimi):** Zaman birimi hafta yerine **GÜN**.
  **Q = 1 oyun yılı**, içinde **12 ay (h1–h12)**, her ay **7 günlük sabit program** (Pzt→Pazar):
  Salı **İl**, Perşembe **Türkiye**, Cumartesi **Open** (her ay); Pzt/Çrş/Cuma/Pazar **antrenman**;
  uluslararası **yılda 1 kez** — h4 Satellite · h6 Avrupa · h8 Grand Prix · h10 Dünya Kupası. Aynı güne
  iki turnuva gelmez. Gösterim **"Q1 · h1 · Salı"**. Kayıt (register) akışı kaldırıldı; yerine
  **İlerle / Katıl / Geç**: sabit çubuk sonraki turnuva gününe kadar ilerler (antrenmanları uygular),
  turnuva gününde durur → Katıl (canlı oyna) / Geç (atla). Sakatlık artık **gün** cinsinden.
  `season.ts` gün-bazlı (`activityForDay`, `monthOfQuarter`, `dayOfWeek`); `GameState.dayIndex`
  (migration `day_model`, `weekIndex`/pending kaldırıldı); careerService `advanceDay`/`attendTournament`.
- **Klasman sekmesi:** Ana menüye **📊 Klasman** eklendi — kategori sıralaması (U10-M-EPE…), milli takım
  (ilk 4) ve uluslararası davet (ilk 16) durumu. GDD 19'a göre V1'de tek klasman kategori sıralamasıdır;
  dünya/ülke/uluslararası ranking sistemleri "Gelecek Sürümler" (V2) notuyla belirtildi.
- **Sabit "İlerle" çubuğu:** Zaman ilerletme düğmesi sayfa içinden çıkarılıp **alt sabit
  çubuğa** taşındı (sayfalar arası değişmez). Haftalık antrenman planı Antrenman sayfasından
  **kaydedilir** (`GameState.trainingPlan`, migration `training_plan`); çubuk bu planı uygular.
  Sakatken "🩹 Dinlen", turnuva haftası "🏆 Turnuvaya Git" olur. (Online'da zaman otomatik akacağı
  için bu çubuk yalnız tek-oyuncu zaman sürücüsü — bu yüzden sayfadan bağımsız konumlandı.)
- **Turnuva bitiş ekranı — sonuç + klasman:** Turnuva bitince kaçıncı olduğun (büyük), **kazanılan
  ranking puanı** ve **Quarter Ranking klasman sıran** gösterilir; ardından **🏠 Eve Dön**.
- **Mobil öncelikli arayüz — gizli/açılır menü + sayfalara bölme:** Tek uzun kaydırma yerine
  uygulama benzeri yapı. Üstte oyuncu adı + avatar; altında **"☰" açılır menü**: Profil / Antrenman /
  Turnuvalar / Kulüp / Ekipman / Kariyer Geçmişi (`src/app/kariyer/layout.tsx` + `CareerNav`,
  `getCareerHeader`). **Profil** = oyuncu özellikleri (özet + fizik + psikoloji + yetenekler);
  **Kulüp** ve **Ekipman** ayrı sayfalar (Ekipman'da seviye göstergesi + "🛒 Mağaza yakında"
  yer tutucu — ileride markete bağlanır); **Antrenman** = haftalık plan + "Haftayı İlerle";
  **Turnuvalar** = kayıt + Quarter Ranking. Mobil boşluk/başlık cilası (dar ekran için `px-4`,
  sticky başlık, tam-genişlik butonlar).
- **Canlı turnuva — gerçek zamanlı, maç-maç akış (GDD 18.54):** Turnuvaya girince ekranda
  **sıralı** oynanır: pul maçları **teker teker açılır** (1. bitmeden 2. aktif olmaz; ilerideki
  maçlar kilitli), **her maçın kendi taktiği** vardır (maç öncesi Ofansif/Dengeli/Defansif seçilir),
  maç **canlı** akar. Pul bitince sıralaman + pul tabloları açılır; **eleme pul bitince, tur tur**
  görünür (çeyrek bitmeden yarı açılmaz). Turnuva-içi **gerçekçi saat** (14:00 başlar; pul 2'şer dk,
  eleme 5'er dk) immersion için; **kariyer/hafta saati turnuva boyunca durur**, yalnız turnuva bitince
  ilerler (multiplayer'da sunucu saati sürer — çekirdek aynı). İlerleme `GameState.liveTournament`
  JSON blob'unda tutulur (sayfa yenilense de devam); AI maçları arka planda toplu simüle edilir.
  `src/server/careerService.ts` (startLiveTournament/playLiveMatch/enterBracket/finalize),
  `src/app/turnuva/canli`, migration `live_tournament`.
- **Maç taktiği (GDD 18.22–18.25):** Taktik sonucu tek bir bonusla belirlemez; **iki yoldan** etkiler
  ve oyuncunun **skill + trait**'leriyle ve **rakibin** özellikleriyle etkileşir: (1) effective
  strength'e küçük, matchup-farkındalıklı **"Taktik" modifier'ı** (±3.5 puan; Agresif/Soğukkanlı
  trait sinerjisi), (2) tuş-başı **kaos** (ofansif = sürpriz/risk ↑, defansif = salınım ↓, favoriyi
  korur). Rastgelelik beceriyi ezmez (GDD 18.32). AI rakipler karakterlerine göre stil seçer
  (`src/engine/combat/tactics.ts`). Taktik artık **her maça özel** seçilir (canlı turnuvada), kariyer
  geneli değil. +10 test.
- **Turnuva kayıt → bekle → oyna akışı (#8, GDD 17.20):** Turnuvaya "Katıl" artık anında
  sonuç düşürmez; **kaydolursun** ve turnuvanın **tarihi/haftası** gösterilir. Panelde
  **"Yaklaşan Turnuvalar"** bu quarter'ın tüm takvimini listeler (uygunluk/kayıt durumu ile).
  Tek "**Haftayı İlerle**" düğmesi (CM "Next" mantığı) zamanı sürer: kayıtlı turnuvanın
  haftası gelince seni doğrudan **turnuva ekranına** götürür, aksi halde haftalık antrenmanı
  uygular. Kayıt iptal edilebilir. *(Online'da bu akış sunucu saatiyle otomatik oynanır —
  kayıt çekirdek, "İlerle" yalnız tek-oyuncu zaman sürücüsü.)* Şema: `GameState.pendingLevel`
  + `pendingWeekIndex` (migration `registration`).
- **Şehir seçimi (#1):** Oluşturmada Ülke (Türkiye) + **Şehir** (12 il); seçilen şehir kulübü belirler.
- **Fiziksel yapı (#3):** Boy/kulaç/bacak/kilo + el tercihi; yaşa göre gelişir; combat'ta kulaç
  erişimi (Epe>Flöre>Kılıç) + yapı/bacak + solak (yalnız U10–U12) etkisi; kilo hız gelişimini etkiler.
- **Canlı maç izleme (#7):** Turnuva ekranında maçlar CM/Hattrick tarzı satır satır, spoiler'sız akar.
- Panelde baş harfli **avatar** (#5); oluşturmada varsayılan **8 yaş** (#2).

### Değişti
- **Terim: "Havuz" → "Pul"** (poule) — kullanıcı-görünür tüm metinlerde ve maç turu etiketinde.
- **Turnuva ekranı akışı:** "Senin Maçların" artık **1) Pul → 2) Pul sonucu (kaçıncı oldun) →
  3) Eleme** sırasıyla; üst sıradan gelen oyuncuya **bay (bye)** açıklaması eklendi
  ("Son 32'yi oynamadan geçtin çünkü sıralaman yüksekti").
- Maç anlatımındaki **"Güç" → "Maç gücü"** (overall değil; silaha göre ağırlıklı, o maça özel
  effective strength olduğunu netleştirmek için).

### Düzeltildi
- Seçim kutularında beyaz-üstüne-beyaz okunmaz metin (#4); sakatlıkta "sahalardan" → **"pistlerden"** (#6).
- **Antrenman planı kaydedince eski haline dönüyordu:** plan formu artık **kontrollü** bir client
  bileşeni (`TrainingPlanForm`) — server action sonrası seçim korunuyor + "Kaydedildi ✓" göstergesi.
- **Pul son maçı bitmeden pul sonucu ekrana düşüyordu:** son pul maçı oynanınca sonuç HEMEN
  hesaplanmıyor; maçı izleyip **"Pul sonuçlarını gör"** dendiğinde açıklanıyor (`revealPool`).
- **Turnuva "Tüm tabloyu gör" sayfasında çıkış zorluğu:** sayfanın altına **🏠 Kariyere Dön** eklendi.

## [1.0.0] — 2026-09-13 — V1 (uçtan uca kariyer döngüsü)

M0–M8 tamamlandı: oyuncu oluşturma → haftalık antrenman planı (kondisyon) → gerçek FIE
turnuvaları (havuz+eleme) → Quarter Ranking + milli takım → gelişim çevresi (trait/psikoloji/
kulüp/koç/ekipman/ekonomi) → canlı AI dünyası + başarılar/kariyer geçmişi. 70 test.

### Eklendi
- **M8 — Cila & denge:**
  - **Başsız denge simülasyonu** (`npm run sim`, `scripts/sim.ts`): saf engine'lerle combat
    kazanma oranları, gelişim eğrisi, turnuva rekabeti ve sakatlık sıklığı raporu (GDD 4.33).
    Rapor katsayıların makul olduğunu doğruladı (küçük farklar rekabetçi, aşırı antrenman cezalı).
  - **Veritabanı yedeği** (`npm run db:backup`, GDD 22.58): zaman damgalı SQLite kopyası.
  - Tüm sayfalara ince sürüm alt bilgisi (V1).
- **M7 — Canlı dünya + Memory:**
  - **Canlı dünya (GDD 2.17):** AI oyuncular her hafta özerk gelişir (`advanceWeekTx` içinde
    seeded skill artışı) — rekabet zamanla sertleşir; oyuncu antren/dinlenirken de dünya ilerler.
  - **Memory/Achievements** (`src/engine/memory.ts`): turnuva sonucundan başarı tespiti
    (İlk Turnuva/Madalya/Şampiyonluk, Şampiyonluk, Uluslararası Madalya, Milli Takım, Ranking
    İlk 3 / 1 Numara). `Achievement` tablosu (migration `m7_memory`) + `Player.careerBestRank`.
  - **Kariyer Geçmişi** sayfası (`/kariyer/gecmis`): başarılar, kariyer istatistikleri (turnuva/
    şampiyonluk/madalya/maç/galibiyet/en iyi ranking) ve rakiplikler (maç geçmişinden).
  - 70 test. Uçtan uca tarayıcıda doğrulandı.
- **M6 — Gelişim çevresi engine'leri:**
  - **Trait** (`src/engine/trait.ts`): karakter özellikleri (Çalışkan/Tembel/Agresif…) → antrenman
    verimi + combat katkısı. **Psychology** (`src/engine/psychology.ts`): moral/motivasyon/özgüven/
    stres; olaylardan değişir (antrenman, turnuva); antrenman ve combat'a etki.
  - **Coach/Club** (`src/engine/environment.ts`): kulüp tesisi + koç uzmanlığı antrenman verimini
    artırır. **Equipment**: seviye 1–5, küçük antrenman/combat bonusu. **Economy**
    (`src/engine/economy.ts`): turnuva ödülleri (seviye×derece), para, ekipman yükseltme maliyeti.
  - Entegrasyon: `applyTraining` çevre çarpanı (trait×psikoloji×kulüp×koç×ekipman);
    Combat effective strength'e "Form" modifier'ı (psikoloji+trait+ekipman). Turnuva sonrası
    ödül + psikoloji güncellemesi.
  - Şema: Player'a trait/psikoloji/ekipman/para; `Club` modeli (migration `m6_environment`).
    Kariyer başında kulüp/koç/trait atanır, başlangıç parası verilir.
  - UI: "Psikoloji" barları + trait rozetleri + "Kulüp & Ekipman" kartı (para, ekipman yükselt).
  - 66 test. Uçtan uca tarayıcıda doğrulandı. (AI çevresi nötr — M7'de derinleşir.)
- **M5 — Haftalık döngü + kondisyon:**
  - Haftalık plan: her hafta **3 seans** (Teknik/Fiziksel/Mental/Taktik/Dinlenme); seanslar
    sırayla işlenir, yorgunluk biriktikçe verim düşer (GDD 14.33). `playWeek`/`restWeek`.
  - **Keskinlik (sharpness)** (`src/engine/conditioning.ts`): antrenman/maç artırır, dinlenme
    düşürür; Combat effective strength'e modifier (GDD 14.81) — Probability Engine'e eklendi.
  - **Sakatlık**: hafta sonu yorgunluk+yaş riskiyle (GDD 14.38); INJURED oyuncu antrenman/turnuva
    yapamaz (GDD 8.19), dinlenerek iyileşir. `Player.sharpness`, `Player.injuryWeeksRemaining`
    (migration `m5_conditioning`).
  - UI: keskinlik stat'ı, "Haftalık Plan" (3 seans seçici), sakatlık bandı + dinlenme akışı.
  - 53 test (conditioning + sharpness). Uçtan uca tarayıcıda doğrulandı.
- **M4 — Quarter Ranking + uluslararası + milli takım:**
  - Hafta/quarter zaman modeli (`src/engine/season.ts`): 12 hafta = 1 Quarter = 1 oyun yılı;
    haftalık takvim (İl/Open her hafta, Türkiye çift haftalarda, Satellite/GP/Avrupa/Dünya özel
    haftalarda); uygunluk kuralları (ilk 16 / milli takım ilk 4).
  - **Quarter Ranking**: kategori × quarter bazlı; quarter sonunda sıfırlanır (yeni quarter =
    yeni sıralama). Yaş her quarter +1 ilerler (GDD 17.5).
  - Uluslararası turnuvalar Quarter Ranking'e göre **davet/uygunluk kapısıyla** açılır; milli
    takım = ilk 4. Kalıcılık: `GameState.weekIndex`, `Ranking.quarter`, `Tournament.quarter/week`
    (migration `m4_quarter`).
  - UI: Sezon (Q/hafta) + milli takım rozeti; "Bu Hafta — Turnuvalar" (uygun=Katıl, kilitli=
    gerekçe); Quarter Ranking görünümü. Antrenman ve turnuva artık **hafta** ilerletir.
  - 48 test (season modeli + mevcutlar). Uçtan uca tarayıcıda doğrulandı.
  - Basitleştirme (ROADMAP §G): rekabet kategorisi M4'te sabit; U17→U21 ilerlemesi M7'ye.
- **M3 — Tam turnuva sistemi (gerçek FIE yapısı):**
  - Turnuva motoru yeniden yazıldı (`simulateTournament`): **Havuz** (6 kişi round-robin, 5 tuş)
    → **Turnuva Ranking** (FIE tie-break: galibiyet oranı → indicator → toplam tuş → kura)
    → **Eleme** (seed'li, standart tablo 16/32/…, üst seed'lere **bye**) → dereceler.
  - Seviye bazlı **puan tabloları** (İl/Open/Türkiye/Satellite/GP/Avrupa/Dünya — GDD 17.82–88);
    prestij katsayıları. Ranking puanı seviyeye göre hesaplanır.
  - Kalıcılık: `TournamentParticipant`'a havuz istatistikleri (poolNumber/wins/losses/tuşlar/
    indicator/seedRank), `Match`'e `phase` (POOL/DE) eklendi (migration `m3_tournament`).
    Alan 24 kişi (insan + 23 AI).
  - UI: turnuva seviyesi seçimi (İl/Open/Türkiye); sonuç sayfasında havuzlar, eleme turları
    (dinamik), FIE sıralaması ve dereceler. Uçtan uca tarayıcıda doğrulandı.
  - Tasarım kararı (GDD 2.25): GDD 17.54↔17.62 çelişkisi — bye tabanlı (kesmesiz) yaklaşım seçildi.
  - 45 test (turnuva yardımcıları + havuz/tie-break/bye + seviye puanları).
- **M2 — Combat + Probability derinleştirme:**
  - Güç/olasılık modeli Probability Engine'e taşındı (`src/engine/probability/strength.ts`):
    silaha göre belirgin ağırlıklar (Flöre/Epe/Kılıç), effective strength = yetenek + modifier
    (yorgunluk), olasılık eğrisi + soft-cap.
  - Combat aksiyon-bazlı yeniden yazıldı: küçük **momentum** (üst üste sayılar), silaha özgü
    metin anlatım, ve **açıklanabilir analiz** satırı ("Güç — A: X · B: Y, kazanma ihtimali %Z").
  - Maç formatı (havuz 5 / eleme 15 tuş) parametreleştirildi (`MATCH_FORMATS`).
  - 42 test (yeni: probability-strength; combat davranışları güncellendi).
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
- Ranking puanı artık **turnuva seviyesine** göre hesaplanır (`rankingPointsForPosition(pos, level)`).
- Combat artık güç/olasılığı Probability Engine'den alır (`effectiveStrength`/olasılık matematiği
  `src/engine/probability`'ye taşındı).
- Paket adı `project-engarde` olarak ayarlandı.
- Next.js anonim telemetrisi kapatıldı (gizlilik).

[Unreleased]: https://example.com/project-engarde
