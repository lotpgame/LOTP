# CLAUDE.md — Project Engarde

Bu dosya, bu proje üzerinde çalışan Claude Code (ben) için kalıcı kılavuzdur.
Her yeni oturumda önce bunu okurum. Kurallar buraya yazılır, sohbete değil.

---

## 1. Proje Nedir?

**Project Engarde**, eskrim sporunu temel alan, **metin-tabanlı bir kariyer & yönetim
simülasyonudur** (Hattrick / Championship Manager tarzı).

- Oyuncu bir eskrimci yaratır ve **yıllar süren kariyerini** yönetir: antrenman →
  kulüp → turnuva → maç → gelişim → ranking → milli takım → uluslararası kariyer.
- Maçlar **3D dövüş değil**, metinle anlatılır ("A mesafeyi kapattı, B savundu, A tuşu
  buldu"). Ağır oyun motoru (Unity/Unreal) **gerekmez**.
- Tüm hesaplama **sunucu tarafında, olasılık tabanlı** yapılır (oyuncu online olmasa
  bile ilerleyebilir — Hattrick modeli).
- Tam tasarım `docs/gdd/` içinde 26 dokümanda tanımlı. **Kod yazmadan önce ilgili
  Engine'in GDD bölümü okunur.**

**V1 hedefi:** Uçtan uca çalışan bir kariyer döngüsü. Tüm 25 sistem değil.

---

## 2. İşbirliği Kuralları (ÖNEMLİ)

Proje sahibi (kullanıcı) **yazılıma yeni başlıyor** ve deneyimli bir eskrimci/antrenör.
Buna göre davranırım:

- **Türkçe konuşurum.** Teknik terimleri İngilizce bırakırım (commit, migration, prop…)
  ama ilk geçtiğinde bir cümleyle açıklarım.
- **Her adımda ne yaptığımı ve NEDEN yaptığımı** kısaca anlatırım. Sessizce büyük
  değişiklik yapmam.
- Büyük bir işe girmeden önce **planı sade bir dille özetler, onay alırım.**
- Kullanıcının eskrim/oyun tasarımı bilgisi derin, yazılım bilgisi yeni — açıklamaları
  oyun mantığına bağlarım ("bu fonksiyon, GDD'deki pool sıralamasını hesaplıyor").
- Jargon yığmam. Bir kavramı ilk kez kullanırken 1 cümlelik analoji veririm.
- Kullanıcı "wipe/vibe coding" yapmak istiyor: **ben yazarım, o yönlendirir.** Kod
  kalitesi, güvenlik ve güncel pratiklerden ben sorumluyum.

### ⭐ Zorunlu kural: README + CHANGELOG her zaman güncel

**Yaptığımız her iş sonunda `README.md` ve `CHANGELOG.md` güncellenir.** (Kullanıcı kuralı.)
- `CHANGELOG.md`: [Keep a Changelog](https://keepachangelog.com/tr/) formatı. Her anlamlı
  değişiklik `## [Unreleased]` altına Eklendi/Değişti/Düzeltildi/Kaldırıldı başlığıyla yazılır.
- `README.md`: kurulum/çalıştırma adımları, proje durumu güncel tutulur.
- Bu güncelleme, işi bitiren commit'in **parçasıdır** — ayrı bırakılmaz, unutulmaz.

---

## 3. Teknoloji Seçimi ve Gerekçesi

Tek dil (TypeScript) her yerde → yeni başlayan için en düşük zihinsel yük, hataları
erken yakalayan tip güvenliği, GDD'nin kendi önerisiyle uyumlu.

| Katman | Seçim | Neden |
|---|---|---|
| Dil | **TypeScript** | Frontend + backend tek dil; tip güvenliği karmaşık engine'lerde hata önler |
| Framework | **Next.js 16 (App Router)** | UI + sunucu API'si tek projede; web + ileride mobil tarayıcı |
| UI | **React + Tailwind CSS** | Metin-ağırlıklı arayüz için hızlı, sade |
| Veritabanı (geliştirme) | **SQLite** | Ayrı sunucu kurmak gerekmez — yeni başlayan için en kolay |
| Veritabanı (multiplayer fazı) | **PostgreSQL** | GDD'nin hedefi; Prisma sayesinde geçiş neredeyse kodsuz |
| ORM | **Prisma** | Tip-güvenli DB erişimi, kolay migration, şema = kod |
| Test | **Vitest** | Hızlı, TS-yerel, sade |
| Rastgelelik | **Tohumlanabilir (seeded) RNG** | Simülasyonlar tekrar edilebilir olmalı (dengeleme testleri için şart) |

**Karar:** Başlangıçta SQLite ile ilerleriz (sunucu kurmadan). Şema PostgreSQL uyumlu
tasarlanır; multiplayer fazında `.env`'de tek satır değiştirip PostgreSQL'e geçeriz.

> ⚠️ **Önkoşul:** Node.js kurulu değil. Geliştirmeye başlamadan **Node.js LTS**
> kurulmalı (bkz. `README.md`). SQLite Prisma ile geldiği için ayrı DB sunucusu gerekmez.

---

## 4. Mimari — Engine = Modül

GDD'nin **Engine Map** bölümü (`docs/gdd/..._05_Engine_Map.docx`) doğrudan yazılım
mimarimizdir. Temel kurallar (GDD'den, tartışmasız):

1. **Her engine'in TEK bir ana sorumluluğu vardır.** Player kimliği tutar, Skill
   yetenekleri, Combat maçı simüle eder, Ranking sıralamayı hesaplar.
2. **Bir verinin sahibi tek bir engine'dir.** Tournament, Skill değerini *okur* ama asla
   *değiştiremez*. Para → sadece Economy. Ranking puanı → sadece Ranking.
3. **Engine'ler birbirinin iç koduna girmez.** İletişim: istek/olay (event) → sonuç.
   `Tournament → MatchRequest → Combat → MatchResult → Tournament`.
4. **Yasak görevler** (GDD 5.36): Tournament ranking puanı hesaplamaz; Combat bracket
   oluşturmaz; Training para vermez; Economy skill geliştirmez.
5. **Database sadece saklar, hesaplamaz.**

### Klasör yapısı (kurulunca)

```
src/
  engine/           # SAF simülasyon mantığı — I/O yok, DB yok, HTTP yok
    player/         #   her engine kendi klasöründe; sadece veri alır, sonuç döner
    skill/
    training/
    tournament/
    combat/
    ranking/
    probability/    #   tohumlanabilir RNG burada
    ...
    events.ts       #   engine'ler arası olay tipleri (TrainingCompleted, MatchCompleted…)
  db/               # Prisma şeması + kalıcılık ("Database Engine")
  server/           # engine'leri DB'ye bağlayan orkestrasyon (API, günlük döngü)
  app/              # Next.js arayüzü (React ekranları)
scripts/            # başsız (headless) simülasyon koşucuları — dengeleme testleri
tests/              # Vitest testleri
docs/gdd/           # tasarım dokümanları (kaynak-of-truth)
prisma/             # schema.prisma + migration'lar
```

**Neden `src/engine` saf tutulur:** Aynı mantık hem web API'sinde hem de "100 oyuncu ×
20 yıl" başsız dengeleme simülasyonlarında (GDD 4.33) çalışabilsin diye. Bu ayrım ileride
multiplayer sunucusu için de tam olarak gereken şeydir.

### V1 engine öncelik sırası (GDD 5.37 — mimari öncelik, mutlak kodlama sırası değil)

Player → Skill → Trait → Psychology → Coach → Club → Training → Equipment →
Tournament → Combat → Probability → Ranking → Economy → Memory → Database → AI

Bir engine'e başlamadan önce kendisinden önce gelen bağımlılıkları çalışır olmalı.

---

## 5. Çalışma Akışı

1. **Tasarım önce:** İlgili GDD bölümünü oku → ne yapacağını 1 paragrafla özetle → onay al.
2. **Küçük dilimler:** Bir engine'i tek seferde bitirmeye çalışma. Önce veri yapısı →
   temel fonksiyon → test → arayüz.
3. **Her engine "tamamlandı" sayılmadan** (GDD 5.38): tasarım + girdi/çıktı + bağımlılık
   + kod + tekil test + entegrasyon testi geçmeli.
4. **Test yaz:** Engine mantığı saf olduğu için kolay test edilir. Olasılık içeren
   fonksiyonlar sabit tohumla (seed) test edilir → tekrar edilebilir sonuç.
5. **Milestone yedeği (GDD 4.46):** Her ana bölüm bitince git commit + etiket.

### Komutlar
```bash
npm run dev         # geliştirme sunucusu (http://localhost:3000)
npm run build       # production build (kurulum doğrulaması)
npm run lint        # ESLint
npm test            # Vitest testleri
npm run sim         # başsız çalıştırıcı (scripts/sim.ts) — RNG + DB smoke
npm run db:migrate  # şema değişikliğini uygula (prisma migrate dev)
npm run db:generate # Prisma client'ı üret (postinstall'da otomatik)
npm run db:studio   # veritabanını görsel incele (Prisma Studio)
```

> ⚠️ **Next.js 16 uyarısı:** Bu sürüm eğitim verimden yeni; API'ler değişmiş olabilir.
> Next-özel kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili kılavuzu
> oku (kök `AGENTS.md` de bunu hatırlatır, `next dev` tarafından yeniden üretilir).

> ⚠️ **Prisma 7 notu:** Eğitim verimden yeni. Yeni mimari: `generator client` (eski
> `prisma-client-js` değil), `output = src/generated/prisma`, datasource URL'i şemada
> DEĞİL `prisma7.config.ts`'te. **SQLite için driver adapter zorunlu**
> (`@prisma/adapter-better-sqlite3`). Client `src/db/client.ts`'te bu adapter'la kurulur.
> Detaylı v7 rehberi için gerekirse `npx prisma init`'in ürettiği `prisma/skills` referansları
> (github: prisma/skills) — repoya eklenmez.

> ⚠️ **PATH notu:** Node.js winget ile user-scope kuruldu. Yeni açılan terminaller
> yeni PATH'i alır; ama mevcut Claude Code oturumu almazsa komutlara şu ön ek eklenir:
> `export PATH="/c/Users/yusuf/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.19.0-win-x64:$PATH"`
> Kalıcı çözüm: Claude Code / terminali bir kez yeniden başlat.

---

## 6. Güvenlik Kuralları (her zaman uygulanır)

- **Sırlar asla kodda/commit'te olmaz.** API anahtarları, DB şifreleri → `.env`
  (`.gitignore`'da). `.env` asla commit'lenmez.
- **Tüm kullanıcı girdisi doğrulanır** (sunucu tarafında, sadece arayüzde değil) —
  isim, sayı aralıkları, kategori seçimleri. Zod ile şema doğrulaması kullanılır.
- **SQL injection yok:** Sadece Prisma (parametreli sorgular) kullanılır, ham SQL
  string birleştirme yapılmaz.
- **XSS yok:** React zaten kaçış yapar; `dangerouslySetInnerHTML` kullanılmaz.
- **Simülasyon sunucuda:** Kritik hesaplama (maç sonucu, ranking) asla tarayıcıda
  yapılmaz — multiplayer'da hile önlemenin temeli budur.
- **Bağımlılıklar:** Yeni paket eklemeden önce gerekli mi diye düşünülür; `npm audit`
  düzenli kontrol edilir.
- Commit öncesi `git status` ile ne eklendiğine bakılır; şüpheli/sır içeren dosya
  varsa commit edilmez.

---

## 7. Kod Kalitesi

- Anlamlı isimler; kısa, tek sorumluluklu fonksiyonlar.
- Yorum sadece **NEDEN** için (bir sınır, bir GDD kuralı, şaşırtıcı bir davranış).
  Kodun *ne* yaptığını iyi isimler zaten anlatır.
- Erken soyutlama yok; gereğinden fazla mimari kurulmaz. GDD'nin dediği gibi:
  **önce çalışan temel döngü, sonra derinlik.**
- V1 kapsamı korunur (GDD 4.49): özellik temel kariyer deneyimine katkı sağlıyorsa →
  V1; sağlıyor ama zorunlu değilse → V2; sadece gelecekte → Future.

---

## 8. Referanslar

- ⭐ **Teknik uygulama planı: [`docs/ROADMAP.md`](docs/ROADMAP.md)** — NASIL ve hangi
  sırayla inşa edileceğimizin kalıcı kaynağı (mimari kararlar, M0–M8 aşamaları, veri
  sahipliği, test stratejisi). Kod yazmadan önce ilgili aşama buradan okunur.
- Tasarım dokümanları: `docs/gdd/` (26 dosya, `.docx`) — NE yapılacağı.
- Okuma: pandoc/python bu makinede YOK. `.docx` şöyle okunur (çalıştığı doğrulandı):
  `unzip -p dosya.docx word/document.xml | node -e '...'` ile `<w:p>`→satır, taglar
  temizlenerek metin çıkarılır (node PATH'i için CLAUDE.md §5 PATH notuna bak).
- MVP özeti: `docs/gdd/Project_Engarde_MVP_Ozet.docx` — en hızlı genel bakış.
- Engine ilişkileri: `Project_Engarde_05_Engine_Map.docx`
- Geliştirme sırası: `Project_Engarde_04_Roadmap.docx`

---

## 9. Durum

- [x] GDD alındı, okundu, `docs/gdd/`'ye çıkarıldı
- [x] Teknoloji seçildi, `CLAUDE.md` hazırlandı
- [x] Git deposu başlatıldı
- [x] Node.js LTS kuruldu (winget, v24.19.0 / npm 11.17.0)
- [x] Next.js 16 + TypeScript + Tailwind iskeleti kuruldu, `build` doğrulandı
- [x] Teknik uygulama planı hazırlandı → [`docs/ROADMAP.md`](docs/ROADMAP.md) (M0–M8)
- [x] **M0 — Altyapı:** Prisma 7+SQLite (better-sqlite3 adapter), Vitest, seeded RNG,
      events, `src/db` + Data Service iskeleti. build+lint+test yeşil.
- [x] **M1 — Dikey dilim:** oynanabilir minimal kariyer (oyuncu oluştur → antren → turnuva
      → sonuç → ranking → save/load). 7 engine + testler; Next 16 Server Actions ile ekranlar.
- [x] **M2 — Combat + Probability:** silaha göre ağırlıklar, effective strength + modifier,
      momentum, açıklanabilir analiz, maç formatı. 42 test.
- [x] **M3 — Tam turnuva sistemi:** havuz 6 + FIE tie-break + seed'li eleme + bye + seviye
      puan tabloları (İl/Open/Türkiye…); 24 kişilik alan. 45 test.
- [x] **M4 — Quarter Ranking + uluslararası + milli takım:** hafta/quarter takvimi (12 hafta=1
      oyun yılı), Quarter Ranking (quarter sonu sıfırlanır), davet/uygunluk (ilk 16 / ilk 4). 48 test.
- [x] **M5 — Haftalık döngü + kondisyon:** 3 seanslık haftalık plan, keskinlik (sharpness,
      combat'a etki), sakatlık (yorgunluk+yaş riski → INJURED), overtraining. 53 test.
- [x] **M6 — Gelişim çevresi:** Trait, Psychology (moral/motivasyon/özgüven/stres),
      Coach/Club (antrenman kalitesi), Equipment, Economy (ödül/para) — training/combat
      modifier'ları. 66 test.
- [x] **M7 — Canlı dünya + Memory:** AI oyuncular her hafta özerk gelişir; Achievements
      (şampiyonluk/madalya/milli takım/ranking) + rakiplikler + kariyer geçmişi sayfası. 70 test.
- [ ] **M8 — Cila & denge** ← sıradaki (başsız denge simülasyonları, katsayı dengeleme,
      UI/UX geçişi, save backup; bkz. `docs/ROADMAP.md` §B)

> Ayrıntılı aşama takibi `docs/ROADMAP.md` §F'de. Bir adım tamamlandığında her iki liste
> de güncellenir.
