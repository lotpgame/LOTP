# Changelog

Bu projedeki tüm önemli değişiklikler bu dosyada tutulur.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) ·
Sürümleme: [Semantic Versioning](https://semver.org/lang/tr/).

## [Unreleased]

Playtest (oyun sahibi) geri bildirimlerine göre oynanış iyileştirmeleri. Ayrıntılı liste
`docs/NOTLAR.md`.

### Değişti
- **M11 çizelgesi FIE'ye göre düzeltildi:** Periyot arası **30 sn → 1 dk** (FIE-doğru; online oyuncuya
  daha rahat taktik değişim penceresi). Eleme süresi buna göre 15 tuş ≈ **11 dk**, 10 tuş ≈ **7 dk**.
  Beraberlik "altın tuş" basitleştirmesi ve pul maçlarının sıralı gösterimi FIE denetim notu olarak
  ROADMAP'e işlendi. Bundan sonra tasarım kararları FIE kurallarına karşı kontrol edilecek (kullanıcı kuralı).

### Eklendi
- **M11.3b-1 — Ortak turnuva örneği (asıl çok-oyunculu çekirdek):** Bir turnuva günü artık **paylaşılan
  örnek**tir. Gruplama: **İl = ülke+şehir**, Türkiye/Open = ülke, uluslararası = dünya (her il kendi İl'ini
  oynar). Aynı kapsama kayıtlı **tüm gerçek oyuncular tek turnuvada** oynar (saha 24'e AI ile tamamlanır);
  sonuç + ortak Quarter Ranking + kişisel etkiler herkes için yazılır. `Tournament.scopeKey` ile **dedup**
  (bir kez oluşturulur, sonrakiler okur/gününü ilerletir). `finalizeTournament` çoklu-oyuncuya genişledi;
  yeni gruplama yardımcıları (`geoScopeForLevel`, `tournamentScopeKey`). Şema: `Tournament.scopeKey` (migration).
  (Tarayıcı + DB ile doğrulandı: İstanbul'lu iki gerçek oyuncu **aynı** turnuvada — tek satır, 24 katılımcı,
  ikisine de ortak klasman.)
- **M11.3a — Birleşik periyot motoru + taktik kaynağı:** `simulateBoutByPeriods` (saf, combat) — bir maçı
  **periyot periyot** çözer; her periyot öncesi her tarafın taktiği kaynağından gelir (AI=stil, offline=
  önceden/default, online=canlı). Süre bitince yüksek skor, son periyotta eşitse altın tuş. Offline otomatik
  oynatma (`autoResolveTournament`) artık eleme maçlarını periyot-bazlı çözer → maç logu **periyot kırılımlı**
  (offline oyuncu maç-içi event'leri görür). `simulateTournament`'a `byPeriods` opsiyonu. 5 yeni test.
  (Tarayıcıda doğrulandı: offline turnuvanın eleme maçında "1./2./3. Periyot — sen: Defansif, rakip: …".)
- **M11.2 — Çizelgeli offline otomatik oynatma + ortak klasman:** Kayıtlı bir turnuvanın günü, sen
  offline'ken (dünya saati o günü geçtiyse) sunucu turnuvayı **otomatik oynatır**: sen **önceden verdiğin
  taktikle** (bot gibi), AI'lar kendi stilleriyle; saha = sen + kategorindeki AI havuzu. Combat sunucuda,
  sonuç + ödül + ortak **Quarter Ranking** + başarılar canlı yolla aynı `finalizeTournament`'a yazılır.
  `advanceDay` artık geçmiş+kayıtlı turnuvaları otomatik çözer; canlı **"Katıl" yalnız BUGÜN'ün** turnuvasında.
  (Tarayıcıda doğrulandı: kayıt → dünya saati ilerletildi → turnuva Ofansif taktiğiyle otomatik oynandı.)
- **M11.1 — Zaman çizelgesi motoru (saf):** `src/engine/schedule/` — turnuvanın gün-içi dakika-bazlı
  çizelgesini deterministik üretir (DB/combat yok). Sabitler FIE-uyumlu (periyot 3 dk, periyot arası 1 dk).
  `poolPlan` (11:05'ten sıralı, 4 dk tempo), `dePlan` (14:00 elemeler + 17:00 yarı/final), periyot ve
  **taktik değişim pencereleri** (online oyuncunun periyot arası taktik verdiği anlar). 12 test.
- **M10.2 — Turnuvaya kayıt + önceden taktik:** Turnuvalar sayfasına **"Yaklaşan Turnuvalar"** — önümüzdeki
  turnuvalara **kaydol / güncelle / iptal** + **taktiğini önceden seç** (ortak dünyada turnuva sunucuca
  otomatik oynanacak; offline'ken varsayılan/verilen taktikle). Uluslararası turnuvalar uygunluk (ilk16/ilk4)
  kilidiyle. `Registration` modeli (playerId + worldDay + level + taktik). Otomatik oynatma → M11.
- **Dil menüsü açılır kapanır + 5 dil (TR/EN/DE/ES/FR):** İlk ekran ve Ayarlar'daki dil seçimi butonlar
  yerine **açılır menü** (`LangSelect`). Almanca/İspanyolca/Fransızca eklendi (çevirileri sonra; şimdilik
  Türkçe'ye düşer). Yeni metinler artık yalnız Türkçe yazılıyor, tüm dillere sonra çevrilecek (kullanıcı kararı).
- **M10.1a — Ortak dünya saati (temel):** `src/engine/worldclock.ts` — oyun zamanı **gerçek zamandan**
  türetilir (Hattrick): `worldDayIndex = floor((now − epoch) / gün)`, cron gerekmez. 1 oyun-günü = 1
  gerçek gün; epoch bir Pazartesi (gerçek Salı = İl turnuvası); `season.ts` ile hizalı; dev'de config ile
  hızlandırılır. Saf + 6 test. **Zaman modeli kilitlendi** (ROADMAP §B2/M10): 1 gerçek yıl = +4 yaş,
  kariyer ~5+ gerçek yıla yayılır; "Haftayı İlerle" kalkacak (M10.1b). Offline+kayıtlı → varsayılan/son taktik.
  Sunucu tarafı ayar `src/server/world.ts` (`serverWorldDay`, `WORLD_MS_PER_DAY` env ile dev'de hızlandırma).
- **M9.2b — Telefonla giriş + anonim kariyeri bağlama:** `/giris` sayfası — ülke koduyla telefon
  numarası → giriş. Kayıtlıysa o hesaba giriş (başka cihazdan aynı numara = aynı kariyer); boştaysa
  bu cihazdaki **anonim kariyeri telefona bağlar** (kaybolmaz). `User.phone` (E.164, benzersiz),
  `signInWithPhone`/`signOut`. **NOT: OTP/SMS doğrulaması yok** (dev adımı; gerçek SMS yayına alırken,
  M9.3). Desteklenmeyen ülke → "henüz eklenmedi". Oluşturma ekranına "Telefonla giriş" bağlantısı.
- **M9.2a — Coğrafya modeli (telefon → ülke → şehir):** `src/engine/geo.ts` — ülke-kodu→ülke eşlemesi
  (`+90 → TR`), ülkeye ait sınırlı şehir listesi, telefon normalize + doğrulama (`parsePhone`). Ülkeler
  **adım adım** eklenecek (önce TR; desteklenmeyen kod → "henüz eklenmedi"). Saf/test edilebilir (+6 test).
  Sonraki: telefon tabanlı giriş (M9.2b) + oluşturma ekranında ülke otomatik (M9.2c). Gerçek SMS/OTP →
  yayına alırken (SMS servisi kullanıcı hesabı gerektirir); geliştirmede dev kodu.
- **M9.1 — Kimlik + veri sahipliği (çok oyunculu temeli):** `User` modeli + **çerez tabanlı anonim
  hesap**; `Player.userId` / `GameState.userId` (insan oyuncu kullanıcıya bağlı, **AI ortak/`null`**).
  `loadState` / `hasCareer` / `createCareer` / `resetCareer` artık **mevcut kullanıcıya** göre çalışır
  (eski tek-global `findFirst()` gitti; `resetCareer` yalnız kendi kariyerini siler, ortak dünyayı korur).
  **AI havuzu ORTAK** — yalnız ilk kariyer oluşturmada üretilir, sonraki oyuncular aynı AI'lara karşı
  oynar (ortak dünya hedefi). Migration `m9_user_ownership` (SQLite). Gerçek giriş (e-posta/şifre) +
  Postgres → M9.2/M9.3.
- **Kondisyon = Dayanıklılık'a bağlandı (gerçekçi model):** "Dayanıklılık" yeteneği artık ölü değil —
  **günlük toparlanmayı** ve **maç yorgunluğu direncini** yönetiyor (`conditioning.dailyRecovery`,
  `matchFatigueMultiplier`). Fit sporcu turnuvalar arası daha hızlı toparlar ve maçta daha az yorulur.
- **7 günlük antrenman planı:** Plan artık haftanın **her günü** için (Pzt..Paz); her güne antrenman
  **veya Dinlenme** koyabilirsin. Turnuva günü seçtiğin seans yalnız o turnuvaya **katılmazsan** uygulanır
  (skip-day artık plana bağlı — "hangi antrenman" belirsizliği bitti). Her gün ağır antrenman → yorgunluk
  + sakatlık riski birikir → araya dinlenme koymaya zorlar (risk/ödül).
- **V2 yol haritası — Çok Oyunculu / Ortak Dünya (asıl hedef):** `docs/ROADMAP.md` §B2. **Model kararı
  (2026-09-20): ASENKRON ortak dünya (Hattrick)** — Ali/Mehmet/Jack tek dünyada, aynı turnuva/klasmanda;
  turnuvaya önceden kaydol + taktiği önceden ver → sunucu oynatır (offline olsan bile) → kendi maçlarını
  replay izlersin; AI/turnuva/klasman ORTAK. "Haftayı İlerle" kalkar, taktik önceden verilir. Revize
  aşamalar: **M9** kimlik + kalıcı DB (User + `Player.userId`, AI ortak; Postgres) → **M10** `World`
  singleton + sunucu saati + kayıt/önceden-taktik → **M11** ortak turnuva simülasyonu + klasman (replay)
  → **M12** ölçek & servis.
- **Alt sekme çubuklu turnuva ekranı (yazı, ikonsuz):** Turnuva tek sayfada, altta **sekme çubuğuyla**
  gezilir: **Pul kağıdı · Pul maçları · Klasman · Elemeler · Sonuç**. Sekmeler **turnuva ilerledikçe
  açılır** (kilitli başlar; kilitliye tıklanınca "Bu bölüm henüz açılmadı"). Aktif/oynanacak bölüm
  otomatik seçilir; geçmiş bölümler serbest gezilir; gelecek bölümler kilitli olduğu için **spoiler yok**.
  (`TournamentTabs`, `LiveState.stage`, tek `advanceLiveStage` aksiyonu.)
- **Aşama akışı:** Pul kuraları → pul maçları → pul kağıdı → klasman → eleme kurası (o turun eşleşmeleri,
  skor yok) → eleme maçı (yalnız senin maçın) → kazanınca sonraki turun kurası → … → sonuç.
- **Maç bitince "Sonuçlar işleniyor…" beklemesi:** Maç biter bitmez pul sonucu / klasman / sonraki
  tur / turnuva sonucu **hemen fırlamaz** — kısa bir bekleme sonrası ilgili sekme otomatik açılır.
  Geri sayım sayısı gösterilmez; yalnız "…işleniyor" yazısı akar (`Countdown`).
- **Pul kağıdı canlı dolar:** İlk pul maçından sonra "Pul kağıdı" sekmesi açılır ve her maç bittikçe
  ızgara **canlı dolar** (yalnız senin pulun; diğer puller pul bitince "Diğer puller" katlanırında).
- **Pul klasmanı gerçekçi:** Turnuva klasmanı artık **G-M** (galibiyet-mağlubiyet), **averaj** (Ind) ve
  **atılan tuş** (TV) sütunlarıyla — gerçek pul klasmanı gibi.
- **Elemede spoiler yok (gerçekçi):** Canlı turnuvada eleme aşamasında **çatal/tüm eşleşmeler hiç
  gösterilmez** — yalnız o an oynanacak turun **kurası** (isimler, skor yok) ve **senin maçın** görünür.
  Motor sonraki turu önden hesaplasa bile "henüz olmamış" sonuçlar ekrana sızmaz. Tam çatal yalnız
  turnuva bitince **Kariyer Geçmişi**'ndeki turnuva detay sayfasında görülür.
- **Pul kağıdı (poule sheet):** Turnuvada pul sonuçları artık klasik **FIE pul kağıdı** olarak —
  NxN sonuç ızgarası (V5 = galibiyet/attığın tuş, sayı = mağlubiyette attığın tuş) + V/TS/TR/Ind/Sıra
  sütunları; hem canlı ekranda hem sonuç/geçmiş ekranında. (`PoolSheetDTO`, `buildPoolSheets`, `PulKagidi`.)
- **Eleme çatalı (bracket):** Eleme tablosu tur tur **sütunlu çatal** görünümüne çevrildi (Son 32 → …
  → Final, yatay kaydırmalı, senin maçın vurgulu).
- **Canlı turnuva üst bilgi çubuğu:** Ekranın üstünde **🔋 Kondisyon · 🎯 Keskinlik · ⭐ Güç** (turnuva
  boyunca güncel — kondisyon maçlarla düşer).

### Değiştirdi
- **"Haftayı İlerle" kalktı → dünya saati gerçek zamanla akar (M10.1b):** Zaman artık oyuncu-güdümlü
  değil; sayfa açılınca kariyer şimdiki dünya gününe **otomatik yetişir** (antrenman/iyileşme uygulanır),
  uygun turnuva gününde **Katıl / Geç** için durur. Alt çubukta 🌍 dünya günü göstergesi; "İlerle" butonu yok.
  Yaş **kariyer açılış çıpasına** göre (dünyaya sonradan katılan doğru yaşta başlar; `GameState.careerStartDay`).
  Kariyer oluşturma dünya anına sabitlenir. (Geçici: turnuvaya girilmezse o günde bekler → offline oto-oynatma M10.2.)
- **Pul maçları sabit liste:** "Pul maçları" sekmesi artık tüm maçları **sabit** gösterir (oynanan =
  skor+açılır detay, sıradaki = işaretli, kalanlar = kilitli). Böylece maçlar "kendiliğinden ekrana
  düşmez" — hepsi baştan görünür (kullanıcı geri bildirimi).
- **Pul kağıdında yalnız senin pulun:** Öne çıkan senin havuzun; diğer puller pul bitince katlanır kutuda.
- **İlerleme butonu üstte:** "Devam / Elemeye Geç / Maça geç / Pul maçlarına başla" artık **durum
  çubuğunun (reyting) hemen altında** — aşağı kaydırmadan basılır.
- **Turnuva sonucu ekranı sadeleşti:** "Tüm tabloyu gör" butonu kaldırıldı — sonuç açıklanınca pul
  kağıdı / pul maçları / klasman sekmelerden gezilebildiği için gereksiz; yalnız **Eve Dön** kaldı.
- **"(sen)" etiketi kaldırıldı:** Klasman, pul kağıdı ve pul kurasında insanın satırı zaten vurgulu
  olduğu için "(sen)" yazısı kaldırıldı; elemede periyot kartı da artık **karakterin adını** yazıyor.
- **Canlı maç skoru event geçtikçe güncellenir:** Üstteki skor, açıklanan son tuşa göre canlı ilerler
  (önceden bitene kadar "• • •" idi).
- **Biten pul maçları katlanır:** Canlı ekranda oynanmış pul maçları artık **skor + açılır detay**
  (yalnız o an oynanan maç canlı akar).
- **Pul maçı numaralandırma:** "Pul 4 · 1. maç, 2. maç…" olarak gösteriliyor (karışıklık giderildi).

### Düzeltildi
- **Kondisyon dengesi (kademeli toparlanma):** Toparlanma artık düz −10/gün değil, **Dayanıklılık'a
  göre** (~%80–96 ile maça girilir, her sabah %100'e ışınlanmak yok); maç yorgunluğu tabanı hafif
  düşürüldü (`tuş×0,45`, taban 2). Makul plan (arada dinlenme, 2 turnuva) → maça ~%80+; her gün ağır
  antrenman + 3 turnuva → kondisyon çöker (dinlenme şart). Trace ile doğrulandı.
- **Sıradaki maç paneli önceki maçın çerçevesinin içinde görünüyordu:** Panel artık maç kartının
  **dışında**, ayrı kutu olarak (algı karışıklığı giderildi; `CanliMac`/`CanliPeriyot` afterDone kart dışına alındı).
- **Biten eleme maçı tüm logu baştan (1. periyot) oynatıyordu:** Artık önceki periyotlar **anında**
  görünür, yalnız **son periyot** animasyonla akar (`CanliMac instantThrough` = son periyot başlangıcı).
  Böylece "2. periyot taktiği verince maç 1. periyottan başlıyor" algısı giderildi (skor zaten devam ediyordu).
- **Kondisyon çok hızlı tükeniyordu:** İnsan oyuncuya **doğal günlük toparlanma** eklendi
  (`DAY_BASE_RECOVERY`); antrenman yükü bunun üzerine biner. Önceden yalnız REST günü (−12) topluyordu
  ve doğal toparlanma yoktu → varsayılan planla haftada ~+53 yorgunluk birikiyor, kondisyon 2 ayda
  tükeniyordu. Artık normal program kondisyonu hafif toparlar (~−13/hafta), ağır turnuvalar düşürür.
- **Pul son maçı bitmeden sonuç çıkması:** Son pul maçı canlı akarken "Pul sonuçlarını gör" paneli
  hemen görünüyordu (spoiler). Artık panel **maç animasyonu bitince** görünür (`CanliMac afterDone`).
- **Eleme çatalı skoru maç sürerken görünüyordu (spoiler):** Senin animasyonu süren eleme maçının
  skoru, üstteki çatalda maç kartında akmadan önce görünüyordu. Artık o turdaki maçın skoru
  animasyon bitene kadar **gizli** (`•`), maç bitince açılır. (`LiveTournamentDTO.currentRound`.)
- **Devre arası paneli 1. periyot bitmeden görünmesi:** Periyot canlı akarken alttaki devre arası
  paneli ve skoru hemen çıkıyordu (spoiler). Artık **periyot animasyonu bitince** görünür ve periyot
  skoru animasyon bitene kadar gizli (`CanliPeriyot afterDone` + gizli skor).

### Eklendi
- **Ayarlar sayfası (⚙️) + dil / ses / kariyer yönetimi:** Menüye **Ayarlar** eklendi; "Yeni Kariyer"
  menüden buraya taşındı. **Ses aç/kapa** (tercih saklanır; müzik/efektler yakında). **Kariyeri Sil**
  (onaylı) + **Yeni Kariyer**.
- **Tam İngilizce dil desteği (TR/EN):** Cookie tabanlı i18n (`src/i18n`, sözlük + `t()`; server/client
  ayrımı). Dil oyuncu oluşturma ekranından da seçilebilir. **Tüm arayüz çevrildi** — menü, alt çubuk,
  oluşturma ekranı, Profil, Antrenman, Turnuvalar, Klasman, Kulüp, Ekipman, Kariyer Geçmişi, Ayarlar,
  canlı turnuva + sonuç/replay ekranları, ve **maç anlatımları** (tuş-tuş/periyot/la belle) dahil.
  Motor etiketleri (silah/cinsiyet/turnuva/antrenman/taktik/yetenek/tur/gün) careerService DTO'larında
  dile göre üretilir; kalıcı loglar üretildikleri dilde kalır.
- **Antrenman türü açıklamaları:** Antrenman sayfasına "Hangi antrenman neyi geliştirir?" bölümü —
  her tür (Teknik/Fiziksel/Taktik/Mental) hangi skill'leri geliştirir + yorgunluk yükü; Dinlenme notu.
- **Antrenman sonrası haber kartı:** "İlerle" sonrası üstte özet — kazanılan skill'ler ("+0.6 Dayanıklılık,
  +0.5 Hız…"), **🔋 kondisyon** ve **🎯 keskinlik** değişimi, sakatlık uyarısı; ✕ ile kapanır.
  (`GameState.lastReport` + migration `training_report`, `CareerHeaderDTO.report`, layout haber çubuğu.)
- **Zamanlı atak eventleri — yaşa göre (GDD 18.9–18.26):** Tuş anlatımı artık "kaç zamanlı"
  (tempo) aksiyona göre katmanlı. **U10 sadece tek zamanlı**; **U12 ~%35 çift zamanlı** (feint/beat/
  parat-riposta); **U14+ 3–4 zamanlı** karmaşık diziler (degaje, prise-de-fer, çift feint…). Her
  silaha özel cümle havuzu → event çeşitliliği çok arttı. Tempo, anlatım RNG'sinden seçilir → skoru
  bozmaz. (`TOUCH_LINES_BY_TEMPO`, `TEMPO_MIX`, `pickTempo`.)
- **Periyot sistemi + devre arası taktik (GDD 18.7–18.8):** Eleme maçları **3 periyot × 3 dk**
  (havuz tek 3 dk periyot — değişmedi). İnsanın eleme maçı **periyot periyot** oynanır; her periyot
  bitince maç bitmediyse **devre arası** ekranında **taktik değiştirilebilir**. Tuş-başı saat silaha
  ve yaşa göre ilerler (kılıç hızlı, **epe yavaş → 3. periyoda sarkar**; küçük kategoriler erken bitirir).
  Süre dolabildiği için tuşsuz turlar (tempo kaybı, GDD 18.24) modellendi. 3. periyot sonu berabere →
  **altın tuş / öncelik dakikası (la belle, FIE t.40–41)** — alt kategorilerde nadir, üst kategoride
  (özellikle epe) daha olası. (`simulatePeriod`, `simulateLaBelle`, `LiveState.liveMatch`, `CanliPeriyot`.)
- **Antrenman menü ikonu** 🏋️ → 🎯 (eskrim antrenmanına daha uygun).
- **Tuş-tuş maç anlatımı (GDD 18.54):** Maç logu artık her tuşu ayrı satırda anlatır —
  özellikle 15 tuşluk elemede detay görünür. Silaha uygun eskrim terimleriyle: flöre'de
  parat-riposta/flèche/hücum hakkı, epe'de bilek/point-in-line/açı (angulation)/çift tuş,
  kılıçta baş-yanak kesme/flèche. Her satırda güncel skor (A–B) + durum notu ("üst üste 3!",
  "eşitlik", "maç sayısı!") ve 🏁 kapanış. Anlatım **ayrı bir RNG akışından** seçilir
  (`createRng(seed + ":narr")`) → maçın skoru/determinizmi değişmez, testler korunur.
  (`TOUCH_LINES` in `src/engine/combat/index.ts`; canlı izleme akış hızı 800/250 ms'ye çekildi.)
- **Görsel cila (başlangıç):** Sayıların ağır bastığı arayüze çocuklar için çekicilik — **Profil**
  sayfasına degrade **kimlik afişi** (avatar + isim + silah/kategori/yaş rozetleri), durum kartlarına
  ikon; **Kariyer Geçmişi** kartlaştırıldı. Emoji/SVG tabanlı, tema-uyumlu (ekstra görsel dosyası yok).
  Diğer sayfalara (Antrenman/Turnuvalar/Klasman/Kulüp/Ekipman) aynı dil yayılacak.
- **Geçmiş turnuvalar yeniden izlenebilir:** Kariyer Geçmişi'ne **🏟 Turnuvalarım** listesi eklendi;
  her turnuvaya dokununca pul + eleme maçları (kaydedilmiş combat log'uyla) tekrar izlenir. Daha önce
  turnuva sonuç/replay ekranına (`/turnuva/[id]`) menüden ulaşılamıyordu. (`getCareerHistory` +
  `CareerHistoryDTO.tournaments`, `src/app/kariyer/gecmis/page.tsx`.)

### Değiştirdi
- **İsimlendirme:** "Genel Güç" → **Reyting** (⭐; İngilizce karşılığı "Overall"), "Keskinlik" → **Form**
  (🎯; maça hazır olma — antrenman/maçla artar, atıl kalınca düşer). Motor alanı (`sharpness`/`overall`) aynı.
- **Profil yetenekleri sadeleşti:** Tavan sayısı ("/51 tavan") ve açıklama metni kaldırıldı — yalnız
  mevcut değer + çubuk.
- **Antrenman sayfası:** "Hangi antrenman neyi geliştirir?" artık **tıkla-aç hint** (kapalı gelir);
  sayfaya **mevcut yeteneklerin** listesi eklendi (neyin eksik, profile dönmeden görülür).
- **Turnuvayı geçince (evde kalınca) hafif GENEL antrenman:** Tüm becerilere az katkı + düşük yorgunluk;
  turnuvaya girenlerle gelişim farkı açmaz (önceden planın 1. seansı tam uygulanıyordu).
- **Yaş-orantılı yetenek gelişimi + gerçekçi tavan (GDD 9.11/9.19–9.35 + oyun sahibi kararı):**
  Her oyuncunun gizli **yetişkin potansiyeli** artık düşüğe eğimli dağılıyor (çoğu <65, elit ~80-86,
  olağanüstü ~86-90 nadir) ve **mutlak tavan 90** — 95/100 imkânsız. Gelişim **yaşa orantılı**: 8
  yaşında düşük başlar, tavana ancak ~26 yaşında (olgunlaşma eğrisi) açılır → 10 yaşındaki çocuk
  yetişkin tavanına ulaşamaz. Gelişim tüm kariyere yayılır (eskiden ~14'te platoya oturuyordu); en
  yetenekli oyuncu bile 30'larda ancak ~80'e gelir, **90'lar pratikte görülmez**. (`maturity`,
  `skillAgeCeiling`, `HARD_CEILING`, yeni `generateStartingSkills` + `growSkill maxNow`; AI gelişimi de yaş-tavanlı.)
- **Yetenek tavanı ekranda:** Profil'de "32.6 / 51 tavan" + çubukta tavan işareti + açıklama (herkes 100 olamaz).
- **U10 eleme formatı (FIE/USA Fencing gençler):** U10 eleme maçları artık **10 tuş / 2 periyot**
  (1. periyot 5 tuşta veya 3 dk'da biter); **U12 ve üstü 15 tuş / 3 periyot**. Havuz her kategoride
  5 tuş / tek periyot (değişmedi). (`deFormat`, `simulatePeriod` `periodCap`.)
- **Bitmiş turnuva tablosunda "Canlı İzle" → "📋 Skor detayı":** Turnuva bitince açılan tam tabloda
  ("Tüm tabloyu gör" / Geçmiş) "Senin Maçların" artık geçmiş maçları **canlı izleme** yerine skoru
  doğrudan gösterir; **Skor detayı** ile tuş-tuş döküm açılıp kapanır. Canlı izleme yalnızca maçın
  gerçekten o an oynandığı canlı turnuva ekranında kalır. (`CanliMac` `past` kipi.)
- **Yaş-kategori ilerlemesi (GDD 7.9 / 19.8):** Oyuncu yaşlandıkça kategori otomatik ilerler —
  **U10 → U12 → U14 → U17 → U21 → Senior** (her oyun yılı/Q yaş +1). Kategori değişince o kategorinin
  klasmanı sıfırdan başlar (GDD 19.8). Rakip kadrosu oyuncuyla **aynı yaşta** üretildiği için kategoriyi
  birlikte atlar → saha hep dolu kalır. (`currentIdentity`, `generateAiOpponents` `age` seçeneği.)
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
- **Şehir listesi Türkiye'nin 81 ilini kapsıyor** (oluşturma ekranı + kulüp havuzu).
- **Arayüz cilası (playtest):** Profil'de sezon **"Q1 / H4"** (büyük H), **"Genel Güç"** etiketi,
  fizik notu kaldırıldı, el **Sağ/Sol** (Sağlak/Solak yerine). Ekipman'da market/tahsis açıklaması.
  Tüm ay göstergeleri büyük **H**.
- **Turnuvalar → aylık takvim:** H1–H12 kartları (bu ay vurgulu, geçmiş aylar soluk); her ayın
  turnuva günleri (İl Salı · Türkiye Perşembe · Open Cmt) + o ayın uluslararası organizasyonu.
- **Klasman sekmesi zenginleşti:** "Türkiye Erkek Epe U10 klasmanında X. sıradasın" cümlesi;
  sıralama tablosunda **kulüp** adları; **yaş/cinsiyet/silah filtresiyle** başka kategorilerin
  klasmanına bakma (çok oyunculuda dolu, `getCategoryRanking`). AI oyunculara da kulüp atanıyor.
- **Kulüpte 2 antrenör, her biri 2 uzmanlık:** her kulüpte eşit yetenekli 2 antrenör; her hocaya
  4 antrenman türünden 2'si düşer → ikisi birlikte **4 türü de kapsar** (dengeli kulüp portresi, her
  şehir için). Uzmanlık CSV (`Club.coach2Name/coach2Specialty`, migration `two_coaches`). Birden çok
  kulüp havuzu (şehirler) → AI'lar dağıtılıyor.
- **Ekipman sayfasından "Yükselt" kaldırıldı:** şimdilik kulübün tahsis ettiği standart ekipman;
  seçim/market ileride (sayfada açıklama notu).
- **Sakatlık gün-bazlı ölçek:** süre 3–9 **oyun günü** (turnuvadan da gelebilir); İlerle ile
  dinlenerek geçilir.
- **Turnuvaya girmediğin gün artık antrenman yapılır:** "Geç" (bir turnuvayı atlamak) o günü boşa
  harcamıyor — planın 1. seansıyla antrenman uygulanır (skill gelişimi + yorgunluk/sakatlık riski).
  Böylece denge: Katıl = ranking + keskinlik + tecrübe (ama yorgunluk); Geç = antrenman (ranking yok).
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
