# Project Engarde — Teknik Uygulama Planı (ROADMAP)

> **Bu dosya projenin kalıcı yol haritasıdır.** GDD "NE yapılacağını" söyler; bu doküman
> "NASIL ve hangi sırayla" yapılacağını tanımlar. Tüm proje boyunca buna sadık kalınır.
> Bir aşama tamamlandığında ilgili bölüm ve `CLAUDE.md` §9 durum listesi güncellenir.

## Context — Bu plan neden var?

GDD (`docs/gdd/`, 26 bölüm) oyunun **NE** olduğunu eksiksiz tanımlıyor: eskrim temelli,
metin-tabanlı, olasılık hesaplı kariyer/yönetim simülasyonu. Ama **NASIL** kodlanacağını
ve **hangi sırayla** inşa edileceğini tanımlamıyor. Bu doküman o boşluğu doldurur:
mimari kararları kilitler, işi oynanabilir dilimlere böler, her dilimin "bitti" tanımını
ve doğrulamasını verir. Amaç: proje sahibi (yazılıma yeni) yönlendirsin, ben (ve sonraki
agent'lar) bu plana sadık kalarak, güncel ve güvenli pratiklerle kod üretsin.

**Temel strateji (GDD 2.21 ve MVP Özet ile uyumlu):** Önce **çalışan bir dikey dilim**
(uçtan uca minimal kariyer döngüsü), sonra GDD engine öncelik sırasıyla **derinleştirme**.
Her engine'in en gelişmiş hali baştan yapılmaz; önce doğru temel + sistemler arası bağlantı
+ stabil çalışma, sonra derinlik.

---

## A. Mimari Kararlar (değişmez teknik sözleşme)

Bu kararlar GDD'nin Engine Map (5) ve Tasarım Felsefesi (2) bölümlerinden türetildi ve
tüm proje boyunca geçerlidir.

1. **Tek Next.js uygulaması; engine'ler saf TS modülü.** `src/engine/*` içindeki mantık
   I/O, DB, HTTP **içermez** — sadece veri alır, sonuç döner. Aynı mantık hem web'de hem
   başsız dengeleme simülasyonunda (`scripts/`) çalışabilsin diye (GDD 4.33).
2. **Sunucu tarafı simülasyon.** Maç, ranking, gelişim gibi kritik hesaplar Next.js
   sunucusunda çalışır, asla tarayıcıda. Multiplayer'da hile önlemenin temeli (CLAUDE.md §6).
3. **Tohumlanabilir (seeded) RNG.** Tüm rastgelelik `src/engine/probability` içindeki
   deterministik PRNG üzerinden geçer. `Game State + Seed → aynı sonuç` (GDD 20.29–20.30).
   Her maçın seed'i saklanır (replay/debug).
4. **Tek kaynaklı veri (Single Source of Truth).** Her verinin sahibi tek engine'dir
   (bkz. Bölüm C). Skill→Skill Engine, para→Economy, ranking→Ranking. Başka engine
   yalnızca **okur**, kopya tutmaz (GDD 2.20, 5.28, 22.48).
5. **Engine iletişimi: istek→sonuç + event.** Engine'ler birbirinin iç koduna girmez.
   `A → Request/Event → B → Result → A` (GDD 5.29–5.30). Event tipleri `src/engine/events.ts`.
6. **Database sadece saklar.** Hesaplama yapmaz. Erişim `Engine → Data Service → Database`
   katmanından geçer (`src/db`, `src/server`) (GDD 22.2, 22.64).
7. **Kariyer verisi silinmez.** History + soft-delete. Current State ile History ayrı
   (GDD 8.23, 22.3–22.4).
8. **Girdi doğrulama: Zod.** Oyuncu oluşturma ve tüm API sınırlarında sunucu-taraflı şema
   doğrulaması. Ham SQL yok (yalnız Prisma).
9. **Sayısal sistem:** Skill 0–100, **ondalık** saklanır, UI'da yuvarlanır. Permanent Skill
   (gerçek) ≠ Effective Skill (o anki performans) (GDD 9.32). Küçük değerler anlamlı (GDD 2.23).
10. **Kimlikler:** `Player ID = P-000001` (görünen kod) + numerik PK. `Category ID = U17-M-FL`
    (Yaş-Cinsiyet-Silah) — Tournament ve Ranking bunu ortak kullanır.
11. **Kod dili:** Tanımlayıcılar/isimler **İngilizce**, kullanıcıya görünen metin **Türkçe**.
12. **DB:** Geliştirmede SQLite, şema PostgreSQL-uyumlu; Prisma migration + schema version.

---

## B. Aşamalar (milestone sırası)

Her milestone sonunda: `npm test`/`build`/`lint` yeşil → **README + CHANGELOG güncellenir**
→ commit + **git tag** (GDD 4.46). Bir engine "tamamlandı" sayılmaz — bkz. Bölüm C.

### M0 — Altyapı (Foundation)
- Prisma + SQLite kurulumu; minimal ilk şema (Player, Country, Season) + ilk migration.
- Vitest kurulumu + ilk geçen test; `npm run test`, `npm run sim` script'leri.
- `src/engine/probability`: deterministik seeded RNG + **tekrarlanabilirlik testi**.
- `src/engine/events.ts`: event tip tanımları (TrainingCompleted, MatchCompleted, …).
- `src/db` (Prisma client + Data Service iskeleti), `src/server` iskeleti, engine klasörleri.
- **Bitti:** build+lint+test yeşil; aynı seed → aynı RNG dizisi testte kanıtlı.

### M1 — Dikey Dilim: oynanabilir minimal kariyer (MVP Özet'e sadık)
Tek kategori, tek şehir, sade akış. Amaç: mimariyi kanıtlamak + oynanabilir bir şey.
- **Oyuncu oluşturma ekranı:** isim, cinsiyet, ülke, doğum tarihi→yaş→kategori (otomatik),
  silah, başlangıç profili → Zod doğrulama → Player ID → kaydet (GDD 7).
- **Player Engine:** state load/update, status = ACTIVE, yaş doğum tarihinden türetilir.
- **Skill Engine:** 4 ana grup (Teknik/Fiziksel/Mental/Taktik) + her grupta birkaç alt
  skill; potential/floor/ceiling; ondalık; skill history.
- **Training Engine (basit):** antrenman seç → efficiency → küçük skill growth (azalan
  verim) → fatigue. Günlük tek aktivite yeterli.
- **Basit AI havuzu:** kategoriyi doldurmak için AI oyuncular (aynı Player yapısı, GDD 7.31).
- **Tournament (basit):** 8 kişilik tek eleme (pool YOK — M3'te gelir), rastgele seed.
- **Combat Engine (basit):** Probability ile sonuç (skill+fatigue+random) → skor + metin log.
- **Ranking (basit):** turnuva sonucu → puan → kategori sıralaması.
- **Ekranlar:** günlük durum, turnuva/maç sonucu, ranking. **Save/Load** (DB).
- **Bitti:** oyuncu yarat → birkaç gün antren → turnuvaya gir → maçları metinle gör →
  sonuç+ranking → tekrar açınca devam. Sabit seed'de sonuç tekrarlanabilir.

### M2 — Combat + Probability derinleştirme
- Silaha göre skill ağırlıkları (Flöre/Epe/Kılıç farklı davranır, GDD 9.13/18.9).
- Aksiyon-bazlı simülasyon (atak/savunma/karşılık/mesafe), effective vs permanent skill,
  küçük momentum, maç formatı (havuz 5 tuş / eleme 15 tuş), combat log seviyeleri.
- Probability: effective strength + **modifier kaydı** (neden kazandı/kaybetti), olasılık
  eğrisi, soft cap (%0/%100'den kaçın), maç seed saklama.

### M3 — Tam Turnuva Sistemi (Tournament V1)
- Pool (6 kişi round-robin), **FIE tie-break** (galibiyet oranı → indicator → toplam tuş →
  kura), Turnuva Ranking, knockout tablosu 2'nin katına yuvarlama (16/32/64/128/256),
  **bye**, seeding (1 vs N), final derece 1..N, madalya/kupa.
- **Turnuva puanları** (GDD 17.82–17.88 tablosu), 36 kategori bağımsızlığı, haftalık takvim
  (Open / İl / Türkiye Şampiyonası), turnuva sonuç kaydı + kariyer geçmişi.

### M4 — Quarter Ranking + Uluslararası + Milli Takım
- Quarter modeli (1 oyun yılı = 12 hafta), **Quarter Ranking** (kategori bazlı, quarter
  sonu sıfırlanır), Satellite/Grand Prix (ilk 16 davet), Avrupa/Dünya Kupası (milli takım
  ilk 4), "Katıl" akışı + kayıt dönemi + yedek davet (GDD 17.25–17.36).

### M5 — Günlük/Haftalık/Sezon Döngüsü (Daily Loop V1)
- Gün→hafta→ay→sezon zaman motoru; günlük plan (sabah/öğlen/akşam), fatigue/recovery,
  sharpness, injury risk, overtraining, haftalık program, yaş ilerleme, **idempotent** gün
  sonu (aynı gün iki kez işlenmez, GDD 6.42) + save.

### M6 — Gelişim Çevresi Engine'leri (GDD priority sırasıyla)
Trait → Psychology → Coach → Club → Equipment → Economy. Her biri Training/Combat/
Probability'ye **modifier** olarak bağlanır. Kulüp lisansı turnuva katılım şartı olur;
psikoloji combat performansını, ekonomi ödül/gideri yönetir.

### M7 — Dünya Simülasyonu + AI + Memory
- AI Engine: AI oyuncuların günlük/haftalık kararları; oyuncu offline iken dünya ilerler
  (Hattrick modeli, GDD 2.18/2.27). Memory Engine: kariyer olayları, rakiplikler, achievements.

### M8 — Cila & Denge
- Başsız dengeleme simülasyonları (`scripts/`, 100 oyuncu × N yıl), katsayı dengeleme,
  UI/UX geçişi (GDD 25), DB index/performans, save backup/version/migration, raporlama.

### Sonra (V2 / Future)
Multiplayer (PostgreSQL'e geçiş), Olimpiyat, üçüncülük maçı, kart/hakem sistemi, scouting,
medya, gerçek-zamanlı combat, gizli potansiyel/scout. Mimari bunları bozmadan eklenecek
şekilde kuruluyor.

---

## C. Veri Sahipliği + "Engine Tamamlandı" Tanımı

**Veri sahipliği (tek kaynak):** Player→kimlik/durum · Skill→skill/potansiyel · Trait→trait ·
Psychology→moral/motivasyon/stres · Training→antrenman/fatigue/sharpness · Coach→koç/bonus ·
Club→kulüp/tesis · Equipment→ekipman · Economy→para · Tournament→turnuva/pool/bracket/sonuç ·
Combat→maç/combat event · Ranking→ranking puan/pozisyon/geçmiş · Memory→kariyer hafıza/başarı ·
Probability→RNG/olasılık (kalıcı veri sahibi değil, servis) · Database→yalnız saklama.

**Yasak görevler (GDD 5.36):** Tournament ranking puanı hesaplamaz; Combat bracket
oluşturmaz/ranking puanı/para hesaplamaz; Training para vermez; Economy skill geliştirmez;
Ranking maç sonucu üretmez. Database hesaplamaz.

**Bir engine ancak şu 6 adım bitince "tamamlandı" (GDD 5.38):** 1) tasarım (GDD bölümü
okundu, görevler net) 2) girdi/çıktı tanımlı 3) bağımlılıklar tanımlı 4) kod 5) tekil test
(sabit seed) 6) entegrasyon testi.

---

## D. Test & Doğrulama Stratejisi

- **Birim testleri (Vitest):** saf engine fonksiyonları; olasılık içerenler **sabit seed**
  ile → tekrarlanabilir.
- **Entegrasyon testleri:** orkestrasyon (server): oyuncu oluştur → antren → turnuva → sonuç
  akışı uçtan uca.
- **Başsız denge simülasyonu (`scripts/`, `npm run sim`):** çok oyuncu × çok yıl; skill
  dağılımı, kazanma oranları, ranking makul mu diye kontrol.
- **Elle oynama (her milestone):** `npm run dev` → ilgili döngüyü tarayıcıda dene.
- **DB inceleme:** `npx prisma studio`.
- **Genel:** her milestone `npm run build && npm run lint && npm test` yeşil olmadan
  kapanmaz.

---

## E. Süreç Kuralları (her işte)

- **README + CHANGELOG güncel** (kullanıcı kuralı, CLAUDE.md §2): işi bitiren commit'in parçası.
- **GDD önce:** bir engine'e başlamadan ilgili GDD bölümü okunur, 1 paragrafla özetlenir,
  onay alınır. Kesin katsayılar ilgili engine dokümanından gelir, dengelemede güncellenir.
- **Next.js 16 uyarısı:** Next-özel kod öncesi `node_modules/next/dist/docs/` okunur (AGENTS.md).
- **Milestone yedeği:** her ana aşama sonunda commit + git tag.
- **Güvenlik:** sırlar `.env`'de, sunucu-taraflı doğrulama, kritik hesap sunucuda, `npm audit`.
- **CLAUDE.md §9 durum listesi** her aşamada güncellenir.

---

## F. Aşama Durumu (canlı takip)

- [x] **M0** — Altyapı (Prisma 7+SQLite, Vitest, seeded RNG, events, Data Service iskeleti) ✅
- [x] **M1** — Dikey dilim (oynanabilir minimal kariyer: oluştur→antren→turnuva→sonuç→ranking) ✅
- [x] **M2** — Combat + Probability derinleştirme (silah ağırlıkları, effective strength, momentum, açıklanabilirlik) ✅
- [x] **M3** — Tam turnuva sistemi (havuz 6 + FIE tie-break + seed'li eleme + bye + seviye puanları) ✅
- [ ] **M4** — Quarter Ranking + uluslararası + milli takım ← sıradaki
- [ ] **M5** — Günlük/haftalık/sezon döngüsü
- [ ] **M6** — Gelişim çevresi engine'leri
- [ ] **M7** — Dünya simülasyonu + AI + Memory
- [ ] **M8** — Cila & denge

> Bir aşama tamamlandığında burada işaretlenir ve `CHANGELOG.md`'ye yazılır.

---

## G. Backlog — izlenen derinlik notları (unutulmayacak)

Oyun sahibinin (eskrim uzmanı) geri bildirimiyle eklenen, ilerideki milestone'lara
bağlanan derinlik maddeleri. Buraya yazılır ki hiçbiri kaybolmasın.

- **Fiziksel yapı / antropometri** (2026-09-13, kullanıcı geri bildirimi): oyuncu profilinde
  **boy, kol erimi (reach), bacak/ayak** gibi statik fiziksel özellikler eksik. Bunlar
  antrenmanla gelişen *skill* değil, oyuncu *attribute*'udur; Combat'ta mesafe/erişim
  modifier'ı olarak kullanılır (özellikle Epe). **Yeri:** M5 (yaş/büyüme ile boy gençlerde
  değişir) + Combat mesafe mekaniği derinleşince ağırlıklandırılır. Player Creation'da
  üretilir ve ekranda gösterilir. (GDD 2.7–2.8 "fiziksel yapı ile farklılaşma".)
- **Mental derinlik** (2026-09-13): mevcut Mental *skill* grubu (Konsantrasyon, Soğukkanlılık)
  sığ; moral/motivasyon/özgüven/stres **Psychology Engine**'e ait. **Yeri:** M6. (GDD 11.)
- **Combat log seviyeleri** (Basit/Normal/Ayrıntılı, GDD 18.53): şu an tek düzey anlatım var;
  seçici için yapılandırılmış maç olayları (Combat Event, GDD 22.31) gerekir. **Yeri:** M-sonrası cila.
