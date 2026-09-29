# Changelog

Bu projedeki tüm önemli değişiklikler bu dosyada tutulur.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) ·
Sürümleme: [Semantic Versioning](https://semver.org/lang/tr/).

## [Unreleased]

Playtest (oyun sahibi) geri bildirimlerine göre oynanış iyileştirmeleri. Ayrıntılı liste
`docs/NOTLAR.md`.

> 🚀 **28.09.2026 — UI yenilemesi canlıya alındı.** Osman'ın tüm arayüz zinciri (`feat/ui-pul-kagidi`)
> tek merge ile `master`'a alınıp deploy edildi. Motor/şema/sunucu değişmediği için canlı test
> verisi korunur.

### Eklendi
- **Almanca (Deutsch) arayüz çevirisi tamamlandı:** sözlük TR/EN paritesiyle (~500 anahtar, `src/i18n/index.ts`)
  tam Almancaya çevrildi — önceden yalnız "kabuk" (menü/alt çubuk/ayarlar/oyuncu oluşturma) planlanmıştı ama
  sözlük o aradan beri tüm sayfaları kapsayacak şekilde büyümüştü, bu yüzden tamamı çevrildi. Doğru Almanca
  eskrim terminolojisi kullanıldı: Poule (pul), Tableau (eleme çatalı), Planche (pist), Aktive (büyükler
  kategorisi — "Senioren" Almancada veteran kategorisi anlamına geldiği için kasıtlı olarak kullanılmadı),
  Freilos (bay geçme), Leitweste (elektrikli yelek). Cinsiyet-nötr ifade tercih edildi (ör. "Charakter
  erstellen", "Fechter/in" yerine). `de` artık kendi tam sözlüğüne sahip (önceden TR'ye düşüyordu); `es`/`fr`
  hâlâ TR'ye düşüyor. TR ve EN'deki `settings.languageNote` metinlerindeki artık geçersiz "İngilizce çevirisi
  ekleniyor" notu da güncellendi (ES/FR'ye işaret ediyor). Ayrıca fark edilen, bu PR'ın kapsamı dışında kalan
  bir hata ayrı bir işe kaydedildi: "Sen yokken" antrenman raporundaki yetenek etiketleri (`gains[].label`)
  motorun sabit Türkçe etiketinden geliyor, hiçbir dilde (İngilizce dahil) i18n'den geçmiyor.
- **Canlı eleme maçında periyot/altın tuş bandı:** skor bandı (`ScoreBug`) kaydırma sırasında sabit
  (sticky) kalıyor ama anlatım aşağı akınca hangi periyotta olunduğu bilgisi ekrandan kayboluyordu —
  artık bandın üstünde küçük bir durum etiketi var: "N. Periyot" (normal), berabere kalıp "altın tuş"a
  (la belle) girildiğinde ise `--prio` altın renginde "Altın Tuş" — periyot numarasının yerini alıyor.
  Etiket, log satırlarından (periyot başlığı `▸`, "öncelik kurası" satırı) saf fonksiyonlarla çıkarılıyor
  (`ui/liveBand.ts`, testli); motorun anlatım metnine dokunulmadı. "Ara" (devre arası) zaten ayrı, gözden
  kaçmayan bir başlıkla gösterildiğinden bilinçli olarak banda eklenmedi.
- **Tema ayarları (Ayarlar → Görünüm) yeniden tasarlandı:** hazır temalar uygulamanın kendi varsayılanlarıyla
  eşleşecek şekilde yeniden adlandırıldı ve gerçek değerlerine bağlandı — **Salon (açık)**, **Pist (koyu)**,
  Gece Salonu, Eskrim Yeşili (önceki "Koyu/Açık/Gece Mavisi/Sepya" isimleri kalktı, Sepya çıkarıldı — tasarım
  planındaki dörtlüyle aynı). Aktif tema artık işaretli (✓). **WCAG kontrast uyarısı:** serbest renk seçiminde
  oran 4.5:1'in altına düşerse görünür uyarı çıkar (`ui/contrast.ts`, saf fonksiyon + testli); seçim
  engellenmiyor, yalnız uyarılıyor. İlk açılışta artık sabit bir renk tahmin edilmiyor, sayfaya zaten
  uygulanmış sistem varsayılanı okunuyor (küçük bir tutarsızlık düzeltildi). Dokunma hedefleri 44 px'e çıktı.
- **Ekipman mağazası: marka paneli + 2 yeni ikon (hazırlık):** GLADIUS vitrini artık açılır/kapanır bir
  panel (`BrandPanel.tsx`) — Yusuf'un "her marka kendi panelinde" kararına göre, ileride başka markalar
  (Leon, PBT…) eklenince yanına yeni bir panel konur. Şimdilik tek marka, varsayılan açık. Kendi ikon
  setimize **eldiven** ve **göğüs koruyucu** eklendi (`Icon.tsx`: `glove`, `chest`) — Yusuf'un genişletilmiş
  katalog isteğinde bu iki ürün için ikon yoktu. Motor tarafındaki katalog (`itemsForWeapon`, yeni ürünler)
  henüz gelmedi; bu PR yalnız hazırlık, ürün listesi/fiyat değişmedi.
- **7 günlük hafta şeridi (Bugün + Turnuvalar):** bugünden itibaren 7 gün tek bakışta — turnuva günleri kısa
  seviye etiketiyle (İL / TR / OPEN …) ve kayıt işaretiyle (✓ kayıtlısın, ○ kayıt yok, kilit = katılım hakkın
  yok, örn. sakatken), antrenman günleri haftalık plandaki seansın ikonuyla. Bugün mürekkep çerçeve + kırmızı
  çizgi. Hücreye dokununca turnuva → kayıt listesi, antrenman → plan. Yalnız mevcut veriden (sabit program,
  yaklaşan turnuvalar, plan); motor/sunucu değişmedi. Birim testleri: `tests/ui/week.test.ts`.
- **Kenar çubuğu:** masaüstünde "Turnuvaya Git" butonu artık iki satıra kırılmıyor.
- **CI (GitHub Actions):** `.github/workflows/ci.yml` — her PR ve `master` push'unda lint + test + build
  (sahte `DATABASE_URL`, gerçek DB'ye bağlanmaz). Dış katkıcı merge'leri CI yeşilse Vercel Deploy Hook ile
  canlıya çıkar (secret `VERCEL_DEPLOY_HOOK`; yoksa CI bunu kırmızıyla bildirir). ROADMAP §H R4 ✅.
- **Manşet cümleleri + WhatsApp paylaşımı:** turnuva sonucu gazete manşeti olarak ("U10 İl Şampiyonası: Deniz Aksoy
  şampiyon!", "… son 16'da", "… bronz madalya"), altında son maç, pul özeti ve katılımcı sayısı. Turnuva bitiş
  ekranında ve geçmiş turnuva sayfasının en üstünde **"WhatsApp'ta paylaş"** — hazır metin + oyunun adresi; mesajı
  oyuncu kendisi gönderir. Bugün'deki "Sen yokken" turnuva satırları da manşet cümlesiyle. Şampiyonlukta altın blok.
  Cümleler motor metni değil, mevcut sonuç verisinden çeviri şablonlarıyla kuruluyor (Türkçe ek hatası olmasın diye
  isimlere ek getirilmiyor). Birim testleri eklendi (`tests/ui/headlineText.test.ts`).
- **Turnuva sekme rayı:** telefonda aktif sekme (örn. sondaki "Sonuç") artık ekran dışında kalmıyor.
- **Pul kağıdı yeniden çizildi:** gerçek FIE pul kağıdı düzeni, yeni tasarım dilinde — köşegen taralı, galibiyet
  hücreleri ("V5") kalın ve köşede küçük işaret, mağlubiyetler soluk. **Kendi satırın ve sütunun** koyu zeminle
  (artı gibi) işaretli: satır = senin rakiplere karşı sonuçların, sütun = rakiplerin sana karşı. Telefonda ad
  sütunu yatay kaydırmada sabit kalıyor; V/TS/TR/Ind/Sıra ayrı blok, sütun başlıkları açıklamalı. Masaüstünde
  tablo paneli dolduruyor. Canlı turnuvadaki "Pul kağıdı" sekmesinde ve geçmiş turnuva sayfasında aynı.
- **Canlı maç ekranı — skor bandı + eskrim cihazı renkleri:** maçlar artık üstte yapışkan bir skor bandıyla
  izlenir. **Renkler gerçek cihaz gibi: sol kırmızı (sen), sağ yeşil (rakip)** — önceden ters idi ve renk
  iyi/kötü anlamı taşımaz; "sen" SEN etiketiyle gösterilir. Son tuşu alan tarafın lambası yanıp söner (epede
  çift tuşta ikisi birden), en yeni anlatım satırı vurgulu. Sekmeler panelin üstünde, kilitliler kilit ikonlu
  (spoiler yok, aynı). Taktik kartları ikonlu, Hızlı/Atla büyük dokunma alanı. Pul kağıdı, sonuç ekranı ve geçmiş
  turnuva sayfası yeni stile geçti.
- **Klasman yenilendi:** üstte büyük sıra numarası + iki kapı (milli takım ilk 4 · uluslararası ilk 16)
  lamba ile. Filtreler açılır liste yerine çip/segment (federasyon sırası). Liste F1 sıralama kulesi gibi:
  1. altın kenar, 2–3 çelik, senin satırın kırmızı kenar + SEN etiketi — listede aşağıdaysan ekranın
  altına yapışır, kaydırmadan yerini görürsün.
- **Yeni giriş ekranı (davet linkiyle gelen oyuncu için):** önce oyunu gösterir — koyu vitrin, örnek skor
  bandı (kırmızı sol / yeşil sağ) ve örnek maç anlatımı, "Sporcunu oluştur" butonu, 3 adım. Form: büyük
  silah kartları (ikon + kısa kural), cinsiyet segmenti, profil çipleri; ülke seçimi yerine bilgi çipi.
  Oluşturma mantığı değişmedi. Marka adı Türkçe büyük harf kuralından korundu ("PİSTE" değil "PISTE").
- **Giriş ekranı masaüstünde iki sütun:** bilgisayarda (1024 px ve üstü) solda koyu vitrin + 3 adım sabit
  durur, sağda sporcu oluşturma formu görünür; "Sporcunu oluştur" atlama butonu yalnız telefonda. Telefon
  görünümü ve oluşturma mantığı değişmedi. 1024×768, 1280×720 ve 1440×900'de kontrol edildi.
- **Antrenman haftalık planı yenilendi:** her gün için açılır liste yerine **ikonlu 5'li segment** (Teknik ·
  Fiziksel · Mental · Taktik · Dinlenme), turnuva günleri ikonla işaretli. **Kaydedilmemiş değişiklik görünür**
  ("Kaydedilmedi" + kırmızı lamba; kaydedince "Kaydedildi"), kaydedecek bir şey yoksa buton pasif. Sayfanın geri
  kalanı yeni tasarıma geçti (başlıklar, sakatlık kutusu, "Hangi antrenman neyi geliştirir?" paneli, emoji'ler
  kalktı). "Bugün" kartındaki gün adı artık kartı taşırmıyor. Plan kaydetme mantığı ve sunucu aksiyonu aynı.
- **Kalan sayfalarda emoji temizliği + yeni tasarım:** Kariyer Geçmişi (istatistiklerde kendi ikonlarımız:
  kupa, kürsü, madalya; turnuva listesinde 1. altın / 2–3 çelik kenar, madalya emojisi yok; başarı yıldızları
  ikon), Kulüp (nötr arma, tesis kalitesi segmentli), Ayarlar (ses segmenti, "Kariyeri Sil" kırmızı, sabit
  Türkçe metinler çeviriye taşındı), hata sayfası, telefonla giriş onayı, geri bildirim panosu. Çeviri
  metinlerinden emoji'ler kalktı (canlı maç metinleri canlı maç PR'ında). Kullanılmayan `klasman.nt4/intl16/
  worldNote` silindi. Motorun ürettiği maç anlatımındaki semboller (🏁 ⏱ 🏅) motor tarafında, dokunulmadı.
- **Turnuvalar sayfası yenilendi:** taktik seçimi açılır liste yerine **3'lü segment** (Atak · Dengeli ·
  Defans, ikonlu), "Kaydol"a basınca açılır → liste kısa kalır. Kayıt durumu net ("Kayıtlı · Atak", sol
  çizgi), iptal aynı yerde. Sıradaki turnuva kartı büyük geri sayımla; CANLI kartı mürekkep buton + yanıp
  sönen lamba. Ödül etiketi (klasman puanı / tecrübe). Açıklamalar ve haftalık program "Nasıl işler?" altında.
  Sunucu aksiyonları değişmedi.
- **GLADIUS mağazası yenilendi + kendi ekipman ikonlarımız:** emoji yerine elle çizilmiş SVG ikonlar
  (maske, beden ve maske kordonu, ceket, plastron, lamé, ayakkabı, çorap, çanta; silah ikonu oyuncunun
  silahına göre) ve GLADIUS monogramı — hiçbir gerçek marka/ürün görselinden kopya değil. "Kit x/10"
  tamamlama şeridi, gruplu liste, Denar yetmiyorsa eksik tutar görünür yazıyla, epede gerekmeyen parçalar
  için bilgi notu. Satın alma mantığı değişmedi.
- **"Bugün" ekranı (eski Profil) + yeni değer gösterimi:** dönen oyuncu önce bugünün görevini, sıradaki
  turnuvayı (büyük geri sayım, kayıt durumu, Kaydol) ve "Sen yokken" özetini görür (antrenman raporu +
  yokken oynanan turnuvalar tek panelde; artık her sayfanın tepesinde değil). Yetenekler **pist rayıyla**
  gösterilir: ray yaş grubu ölçeğiyle dolar (8 yaşındaki sporcuda boş çubuk yok), gerçek 0–100 değer yazılı,
  kategori ortalaması + en güçlü yetenek işaretli. Kondisyon/form 10 parçalı gösterge + durum yazısı
  (Dinç/Yorgun…). Fizik ve psikoloji tıklayınca açılır. Menüde "Profil" → "Bugün". Ölçek değerleri taslak
  (`src/app/ui/bands.ts`, antrenör onayı bekleniyor).
- **Tasarım sistemi "Pist Konsolu" — temel + ikonlar + yeni navigasyon** (`docs/tasarim/pist-konsolu.md`):
  eskrim cihazından gelen görsel dil (tema-türevli yüzey token'ları, sinyal renkleri, Barlow Condensed
  başlık fontu, tabular rakamlar). **Kendi SVG ikon setimiz** (`src/app/ui/Icon.tsx`) — kabukta emoji kalmadı.
  **Navigasyon:** telefonda altta 5 sekme (Profil · Antrenman · Turnuvalar · Klasman · Daha fazla),
  masaüstünde sol sidebar; açılır menü kalktı. İnce kimlik şeridi (maske-oval avatar). Gün çubuğu tek
  dokunuşla Turnuvalar'a götürür; tıklanabilir satırlarda ok işareti. "Bildir" artık menüde (yüzen buton
  yok), gönderim hatası görünür.

### Düzeltildi
- **Stil sınıfları utility'leri eziyordu:** `.panel`, `.btn-ink`, `.btn-ghost`, `.kicker` … `@layer utilities`
  yerine `@layer components`'ta. Önceden üstlerine yazılan renk/kenar/gizleme sınıfları sessizce etkisizdi
  (turnuvalarda kayıtlı kartın vurgusu, ekipmanda pasif buton rengi, seviye etiketlerinin rengi).
- **Gövde fontu Arial'dı** (Geist yükleniyor ama kullanılmıyordu) → Geist Sans; Türkçe karakterler için `latin-ext`.
- **Kişisel tema** (Ayarlar → Görünüm) başlık, alt çubuk ve geri bildirim panelinde çalışmıyordu (sabit
  beyaz yüzeyler) → tüm yüzeyler temadan türer; tema ilk boyamadan önce uygulanır (yanıp sönme yok).
- **Katkı kuralları + risk listesi (dış katkı başlangıcı):** `CONTRIBUTING.md` (branch → PR → squash
  merge akışı, **canlı veri koruma** — yalnız eklemeli şema, oyuncu ilerlemesi sıfırlanmaz, "bitti" tanımı,
  güvenlik/KVKK), `.github/pull_request_template.md` (kontrol listesi) ve `docs/ROADMAP.md` **§H Riskler &
  Zayıf Noktalar** (R1 doğrulamasız telefon girişi → Google OAuth, R2 Postgres/SQLite migration tutarsızlığı,
  R3 canlı yedek, R4 CI, R5 büyük `careerService`, R6 canlı turnuva blob'u, R7–R9). Kod değişikliği yok.
- **Devir notu (Yusuf ↔ Osman):** `docs/DEVIR.md` — bekleyen kararlar (Deploy Hook, canlı maç taraf renkleri,
  yaş grubu ölçeği, telefon girişi güvenliği), testçi duyurusu taslağı, çakışma notu ve karar günlüğü;
  `docs/tasarim/onizleme/` altında UI PR'larının telefon + masaüstü önizlemeleri. `CLAUDE.md`'ye işaret satırı.
  Kod değişikliği yok.

### Düzeltildi
- **Klasman (mobil):** yaş kategorileri artık **5'li grid** — U10-U12-U14-U17-U21 üst satıra tam sığar,
  Büyükler alt satırda tam genişlik. Yatay kaydırma kalktı. Etiketler sade U-kodu: "U14 Yıldızlar"→"U14",
  "Gençler"→"U21".

### Değişti
- **Ekonomi dengesi (kazanç ↓↓ + gerçekçi fiyatlar):** Turnuva ödülleri çok düşürüldü — bir oyuncu
  sezonda girdiği tüm turnuvaları kazansa bile ~300 Đ (2. ~200 · 3. ~150); şampiyon bile 1 silah (400)
  alamaz → malzeme için Denar satın alma ihtiyacı (monetization). **Başlangıç bakiyesi 1000 → 0.**
  Malzeme fiyatları gerçek oranlara göre: **Elektrikli Yelek (eski "Lamé", en pahalı) > Ceket+Pantolon > Silah**.
  Ayrıntılı plan: [`docs/EKONOMI.md`](docs/EKONOMI.md). Şema/veri değişmedi (canlı güvenli).
- **Ayarlar → tek "Yeni Başla" butonu:** "Yeni Kariyer" ve "Kariyeri Sil" aynı işi yapıyordu (ikisi de
  kariyeri sıfırlıyordu) → tek **"Yeni Başla"** butonunda birleştirildi (silme zaten içinde; Denar bedeli aynı).
- **Dünya saati akşam 19:00'a hizalandı (deploy config):** `WORLD_EPOCH_MS` = 21 Eylül 2026 Pazartesi
  19:00 TR (16:00 UTC) → her oyun günü (ve o günün turnuvası) **her akşam TR 19:00**'da başlar; oyun
  günü/haftanın-günü gerçek güne oturur (oyun Salı = gerçek Salı, İl akşam açılır). Kod değil env değeri;
  DB'ye dokunmaz. (Yerel `.env` + Vercel env aynı değere ayarlanır.)
- **M11 çizelgesi FIE'ye göre düzeltildi:** Periyot arası **30 sn → 1 dk** (FIE-doğru; online oyuncuya
  daha rahat taktik değişim penceresi). Eleme süresi buna göre 15 tuş ≈ **11 dk**, 10 tuş ≈ **7 dk**.
  Beraberlik "altın tuş" basitleştirmesi ve pul maçlarının sıralı gösterimi FIE denetim notu olarak
  ROADMAP'e işlendi. Bundan sonra tasarım kararları FIE kurallarına karşı kontrol edilecek (kullanıcı kuralı).

### Değişti
- **Deploy D1 — PostgreSQL'e geçiş (Neon):** Veritabanı SQLite'tan **Neon PostgreSQL**'e taşındı. Şema
  `provider = postgresql`; `@prisma/adapter-pg` + `pg` eklendi; `client.ts` DATABASE_URL şemasına göre sürücü
  seçer (postgres→pg, file→better-sqlite3). Prisma işlem zaman aşımı **30 sn**'ye çıkarıldı (kariyer oluşturma
  ve turnuva sonu çok-sorgulu; uzak Postgres'te varsayılan 5 sn yetmiyordu). Şema `prisma db push` ile Neon'a
  yüklendi; kariyer/gün-ilerleme/turnuva-çözümü uçtan uca doğrulandı. (`.env` commit'lenmez.)

### Değişti
- **Faz 2 — takvim modeli (NOTLAR #22/#23), Slice 1–3:**
  - **Gün 00:00'da döner, etkinlik akşam 19:00'da** — `worldclock`'a `EVENT_HOUR`/`worldEventStartMs`/
    `eventDayIndex` + `world.ts` `serverEventDay`/`serverEventStartMs` eklendi (gün sınırı ile etkinlik saati ayrıldı).
  - **Gerçek takvim tarihi gösterimi** — "Q1·H1" kalktı; alt çubuk + profil "📅 28 Eylül 2026 Pazartesi"
    (TR, cihaz konumundan bağımsız); profil kartı "Sezon N". "Sıradaki turnuva" saati 19:00 etkinlik anına bağlandı.
  - **Open turnuvalar dönüşümlü (#23):** bir hafta var, bir hafta yok (İl + Türkiye her hafta kalır).
  - **19:00 etkinlik kapısı (Slice 4):** `advanceDay` + `getCareerHeader` + `attendTournament` artık günün
    etkinliğini ancak **o günün 19:00'ı geçince** işler (`serverEventDay`). Gün 00:00'da döner ama turnuva/
    antrenman akşam olur → sabah "bugün 19:00'da İl · ⌛ …" görünür, otomatik ileri gitmez. Doğrulandı.
  - **Sezon göstergesi roma rakamı** (Sezon kartı "I, II, III…").
- **Faz 3 — canlı turnuva otomatik akış (NOTLAR #25):** Manuel "geç/devam/finallere geç" butonları **kaldırıldı**;
  aşama geçişleri (pul başlangıcı, klasman, eleme kurası) artık **otomatik** ilerler (kısa "…" bekleme, `Countdown`).
  Kullanıcı yalnız **maç aralarında taktik** seçer. Turnuva-içi saat **19:00**'a çekildi (14:00 yerine) ve Schedule
  Engine anları akşama alındı (pul 19:05'ten, elemeler ~19:45'ten). Yerelde uçtan uca doğrulandı (pul→klasman→bracket
  hepsi otomatik, butonsuz). 139 test yeşil.
- **Faz 1 — playtest ayarları (NOTLAR #27/#17/#18):**
  - **Taktik isimleri sadeleşti:** "Baskı kur / Dengeli / Bekle & karşıla" → **Atak / Dengeli / Defans**
    (iç mantık aynı; yalnız görünen etiketler + açıklama).
  - **Başlangıç profili artık gerçekten yön veriyor (#17) — sıfır-toplam uzmanlaşma:** seçilen grup
    (Teknik/Fiziksel/Mental/Taktik) belirgin şekilde ağır basar, diğer gruplar o kadar düşer, **genel ortalama
    korunur** (profil seni güçlendirmez, uzmanlaştırır). Doğrulandı: seçilen kategori ~%86–94 en yüksek,
    genel ortalama dengeli profille aynı. 8 yaşta görünür olması için başlangıç çarpanı daraltıldı.
  - **U10 başlangıç değerleri gerçekçi düşürüldü:** 8 yaş çocuk artık ~8–13 reyting ile başlıyor (eskiden
    ~20–25 fazla yüksekti). Olgunlaşma eğrisi 8 yaşta %30→%15, taban (floor) 8–16→3–9. Yetişkinde tavan
    (26 yaş, potansiyele kadar ~90) korunur → 90'lara giden uzun bir gelişim yolculuğu. Denge sim korundu.
  - **Antrenman çapraz katkı (#18):** çalışılan grup tam gelişir, diğer gruplara küçük yan kazanım
    (birincil stimulusun %12'si) → teknik çalışınca mentale/taktiğe/fiziğe de az miktarda katkı gelir.
    Denge simülasyonu korundu (kazanma eğrisi + gelişim sağlıklı).
- **Oyun adı: "Project Engarde" → "Legends of the Piste"** (tarayıcı sekmesi başlığı, ana ekran başlığı,
  alt bilgi). Sadece görünen isim; kod/DB etkilenmez.

### Değişti (playtest turu 2 — NOTLAR #1-#9)
- **Ülke bayrağı (gerçek görsel):** kimlik rozetinde (şehir + milli takım) ülke bayrağı **görsel** olarak gösterilir (`Flag` bileşeni, flagcdn). Emoji bayrağı Windows'ta "TR" harfleri olarak göründüğü için görsel kullanıldı; tüm platform/ülkelerde çalışır.
- **Kondisyon en fazla %99:** hiç kimse asla tam %100 taze değil — günlük toparlanma/dinlenme/sakatlık kondisyonu 99'a getirir (yorgunluk tabanı 1). Antrenman etkisi zaten akşam 19:00'da işlenir.
- **Antrenman sayfası iconları:** Bugün 📅 · Kondisyon 🔋 · Form 🎯 (profil ile aynı).
- **Koç → Antrenör:** kulüp antrenörleri artık gerçek **ad-soyad** + **"🎓 Antrenör"** unvanı ("… Hoca" kalktı).
- **Turnuvalar yaklaşan liste gerçek tarih:** "Q1·H1·Salı" → **"📅 29 Eylül Salı 19:00"** (her turnuvanın gerçek tarihi + saati); takvim modeli tutarlılığı tamamlandı.
- **Turnuva girişi Turnuvalar sekmesinden (#5a):** alt çubukta **"Katıl" butonu KALKTI**; turnuva zamanı geldiğinde Turnuvalar sayfasında **🔴 CANLI** kartı + "Turnuvaya Gir"; biten turnuva zaten Geçmiş'te. Alt çubukta yalnız "Turnuvaya Git" yönlendirmesi + "Geç".

### Değişti
- **Şehir listesi eskrim şehirlerine indirildi:** 81 il yerine 12 şehir (İstanbul, Ankara, İzmir, Bursa,
  Kocaeli, Antalya, Konya, Trabzon, Erzurum, Mersin, Balıkesir, Adıyaman) — başlangıç seti, sonra editlenir.
  Kulüp/İl Şampiyonası kapsamı bu şehirlerden.

### Eklendi
- **Denar özel işareti (Đ + kılıç):** "D" harfinin ortasından eskrim kılıcı geçen özel para simgesi (`DenarMark`
  SVG, currentColor). Bakiye + fiyatlar + silme ücretinde kullanılır.
- **Kariyer silme Denar ücreti (NOTLAR #30):** "Yeni Kariyer" / "Kariyeri Sil" artık **Denar gerektirir**
  (`CAREER_RESET_COST` = 250, tunable) — sık reroll'u caydırır. Ayarlar ücreti gösterir; yetersizse net uyarı
  ("Turnuvalardan kazan"). Sunucuda da kapılı.
- **Turnuvalar "Sezon programı" kartı:** eski "H1–H12" aylık grid kalktı (gerçek tarih modeliyle uyumsuzdu) →
  tek sade haftalık program kartı (etkinlik 19:00, Open iki haftada bir).
- **Gladius ekipman mağazası (Denar ekonomisi):** Ekipman sayfası gerçek mağaza — marka **GLADIUS**, **Denar (Đ)**
  ile alışveriş. Katalog: silah/maske/kordon/maske kordonu/kıyafet/plastron/lamé/ayakkabı/çorap/çanta.
  Her ürün maça **çok çok az** katkı verir (~+0.003, tek yerde **tunable** — `GLADIUS_ITEMS`). Satın al → sahiplik
  (✓ Sahipsin), Denar düşer; combat'a `equipmentCombatBonus` (ihmal edilebilir). `Player.ownedEquipment` (Neon'a
  push). Denar bakiyesi = oyuncu balance'ı (turnuva ödülü). Ürün görselleri şimdilik emoji (gerçek görsel → V2).
- **#28 — Tecrübe (XP) + turnuva puan ayrımı:** **Open turnuvalar klasman puanı VERMEZ** (yalnız tecrübe);
  **İl/Türkiye/uluslararası** şampiyonalar klasman puanı + tecrübe verir. Her turnuva tecrübe (XP) kazandırır
  (havuzda elense bile katılım tecrübesi); **antrenman** da tecrübe verir (~seans başı 4, turnuvanın ~1/10'u).
  Tecrübe combat'a **küçük, tavanlı (+3)** katkı verir (deneyimli sporcu). Turnuva sonucunda ve Turnuvalar
  kartlarında **ne kazandırdığı** yazılı (🏅 klasman puanı vs ✨ tecrübe); profilde birikmiş tecrübe. `Player.experience`
  alanı eklendi (Neon'a push'landı). 141 test yeşil.
- **Faz 4 — Trait sistemi yeniden tasarımı (GDD 10, NOTLAR #21):**
  - **Genişletilmiş set:** 15 trait, 3 kategori (Karakter/Psikolojik/Rekabetçi) — GDD 10.5'ten (Disiplinli, Çalışkan,
    Tembel, Sabırlı, Sabırsız, Soğukkanlı, Baskıya Dayanıklı, Özgüvenli, Hassas, Kaygılı, Agresif, Mücadeleci,
    Risk Alan, Kontrollü, Hırslı).
  - **Kademeli açılım** (kullanıcı kararı): 8–10 yaş **1 trait** → 11'de **2** → 12+ **3** (max 3). Plan doğuşta
    üretilir, yaşla açılır; önceki "doğuşta 2 rastgele trait" kalktı.
  - **Zıt-çift kuralı** (GDD 10.28): zıt trait'ler birlikte verilmez (Çalışkan+Tembel, Agresif+Kontrollü…) — 500
    planda 0 ihlal doğrulandı. Eski "Tembel+Çalışkan aynı anda" hatası giderildi.
  - **Davranışsal etkiler** (GDD 10.22/10.24): trait'ler antrenman verimi ve combat gücüne küçük modifier verir
    (güç bonusu değil); pozitif/negatif karışık (Hassas/Kaygılı/Tembel −). **AI oyuncular da** trait alır (10.41).
  - **Yaş-havuzlu üretim (gelişim psikolojisi):** her trait yaşına-uygun havuzdan gelir — Çocukluk (mizaç/çalışma),
    Ergenlik öncesi (rekabet/öz-denetim), Ergenlik (psikoloji + ahlak). 10 yaşındaki çocuk "Hilekâr" olmaz.
  - **Ahlak/Sportmenlik ekseni (yeni):** **Dürüst / Hilekâr / Çirkef** (gamesmanship). "Küçük ama riskli":
    çirkef/hilekâr rakibin sükûnetini bozar (özellikle Hassas/Kaygılı'ya) ama kendine risk bindirir —
    Soğukkanlı/Baskıya Dayanıklı/Dürüst rakibe **zarar** eder. Combat'a rakip-etkileşimli "Sportmenlik" modifier'ı
    (`incomingGamesmanshipPenalty`). Doğrulandı: hassas rakip NET +0.62, nötr ~0, soğukkanlı −0.58. Bilimsel
    temel: itibar/dolaylı karşılıklılık + ostrasizm (kısa vade kazanç, uzun vade dışlanma → itibar sistemi V2).
  - Yoğunluk 0–4 (GDD 10.6) ve trait evrimi/olayla değişim (10.31–37) → V2 olarak not edildi.
- **Sıradaki turnuva göstergesi + gerçek saat (test haftası):** Turnuvalar sayfasının üstünde vurgulu
  kart — **sıradaki turnuva adı + gün + TR saati + canlı geri sayım** ("⌛ 4 saat 36 dakika kaldı" /
  "🟢 Şu an açık"); antrenman günlerinde alt çubukta tek satırlık ipucu ("⏰ Sıradaki: … Salı 19:00").
  Saat, dünya saatinden hesaplanır (`worldDayStartMs`), istemcide 30 sn'de bir tazelenir. Yalnız görüntü —
  DB'ye dokunmaz. `NextTournament` bileşeni + `getNextTournament`/`getCareerHeader.nextTournament`.
- **Geri bildirim / hata bildirme sistemi (test haftası):** Her kariyer sayfasında sağ altta yüzen
  **"💬 Bildir"** butonu — arkadaşların bir hata, gariplik veya fikir yazıp gönderebilir (kim + hangi
  sayfa otomatik kaydolur). Bir sayfa çökerse **dostça hata ekranı** (`error.tsx`) çıkar: "Tekrar dene" +
  tek tıkla **otomatik hata bildir**. Bildirimler **Neon**'da `Feedback` tablosunda toplanır; yalnız senin
  görebildiğin gizli-anahtarlı pano: **`/geribildirim?key=…`** (anahtar Vercel env `FEEDBACK_ADMIN_KEY`).
- **Skor renkleri (eskrim cihazı gibi):** Maç skorlarında sol taraf **yeşil** 🟢, sağ taraf **kırmızı** 🔴
  (canlı maç, replay ve pul özeti). Gerçek cihaz hissi; ilk izlenim için hoş dokunuş.
- **#5 — Öncelik / Hak-yolu (silahları gerçekten ayıran motor):** Her mübadele artık **niyet + öncelik** ile
  çözülür (`combat/priority.ts`): **Hücum / Bekle-parat-riposte / Kontra**. **Ana etmenler: mesafe** (footwork
  + kulaç) **ve zamanlama** (timing). Silaha göre: **Epe** öncelik yok → kontra + **çift tuş** (imzası);
  **Flöre** orta öncelik (iyi parat inisiyatifi çalar), eşzamanlı hücum → iptal; **Kılıç** hücum baskın,
  eşzamanlı → iptal. Katı üçgen değil — **yetenek belirler** (iyi savunan aceleci atağı yener). Taktikler
  netleştirildi: **Baskı kur / Dengeli / Bekle & karşıla**. 5 yeni test; denge simülasyonu korundu
  (yakın maçlar biraz daha çekişmeli, yetenek hâlâ baskın).

### Değişti
- **Maç gerçekçiliği (combat etkenleri):**
  - **Rakiplerin (AI) formu artık maça giriyor** — eskiden yalnız insan forma göre iyi/kötü oynardı, AI nötrdü.
    Artık herkese "Form" uygulanır (psikoloji + trait + ekipman).
  - **Tüm psikoloji maça yansıyor** — eskiden yalnız özgüven+stres etkiliyordu; artık **moral + motivasyon** da
    katkı verir (`psychologyCombatModifier`).
  - **Günün hâli (daily mood)** — o güne özel küçük form dalgalanması (herkeste; kalıcı moralden ayrı):
    bazı günler formda, bazı günler değil. `dailyMood` (üçgen dağılım, ±2.5), oyuncu+gün tohumlu.
  - **Veteran gerilemesi** — ~30 yaş sonrası kademeli düşüş (`ageCombatModifier`; combat'ta "Yaş" modifier'ı,
    kalıcı skill'i değiştirmez). Eskiden yetenek 26'da tavana oturup hiç düşmüyordu.
  - **Sakatlık süreleri gerçekçi** — artık çoğu **hafif (1–2 gün)**, bazen orta (3–5), nadiren ağır (7–14).
    Eskiden hep 3–9 gündü. (`rollInjury` gün-bazlı + şiddet dağılımı.)
  - 5 yeni test. Denge simülasyonu + tarayıcı ile doğrulandı.

### Eklendi
- **Büyük eskrim ülkeleri eklendi:** 4 kıtaya yayılmış 17 ülke (Fransa, İtalya, Almanya, Macaristan, Rusya,
  Polonya, İspanya, İngiltere, Ukrayna · ABD, Brezilya · Japonya, G. Kore, Çin, Avustralya · Mısır, Tunus + TR),
  ülke kodu + şehir listeleriyle. Klasman kıta/ülke filtresi artık gerçek ülkelerle. (Dev'de karakter yine
  IP-kilidiyle TR; bu ülkeler multiplayer'da IP ile dolar. Telefon kodları benzersiz.)
- **Sezon göstergesine yıl:** Profil "Sezon" kutusu ve alt çubuk artık **oyun-içi takvim yılını** gösterir
  (ör. `2026 · Q1·H3`); yıl `currentDate`'ten gelir, kariyer ilerledikçe değişir. Header DTO'ya `year`.
- **Kıta katmanı + 3-katmanlı klasman kapsamı:** Coğrafyaya **kıtalar** eklendi (FIE'nin 4 konfederasyonu:
  Avrupa / Asya-Okyanusya / Amerika / Afrika; `Country.continent`, `continentOfCountry`). Klasman filtresi
  artık **Dünya / Kıta / Ülke** 3 ana mod (kıta/ülke seçilince kapsam-içi 1..N sıralaması), sonra kategori
  (yaş/cinsiyet/silah). `buildRankingView` kıta/ülke kapsamı; `getCategoryRanking(categoryId, {continent?, country?})`.
  (Şu an tek ülke TR/Avrupa; yeni ülkeler eklendikçe kıtalar dolacak.)

### Değişti
- **Görsel cila (2. tur):** **Klasman** — kapsam seçici eklendi: 🌍 Dünya / ülke (İl-içi 1..N sıralaması);
  klasman aslında dünya geneli (kategori = yaş-cinsiyet-silah). **Kariyer Geçmişi** — turnuvalar için
  **Dönem (Q) filtresi** + satırlarda Q/H etiketleri. **Turnuvalar** — "oynadığın turnuvalar → Kariyer
  Geçmişi" bağlantısı. **Kulüp** — isim yanına ⚔️ logo. (`buildRankingView` ülke filtresi;
  `getCategoryRanking(categoryId, countryCode?)`.)
- **Görsel cila — profil başlığı birleştirildi:** Kariyer üst başlığı (`CareerNav`) artık zengin kimlik
  kartı (avatar + isim + silah/cinsiyet/yaş kategorisi/şehir/milli takım rozetleri) + menü; profil sayfası
  aynı kartı **tekrar etmiyor** (doğrudan durum/fizik/psikoloji/yeteneklerle başlar). Header DTO'ya
  `ageCategory`, `city`, `nationalTeam` eklendi.

### Eklendi
- **M11.4 — "Yokken neler oldu" özeti:** Offline'ken (dünya saati ilerlerken) otomatik oynanan turnuvalar
  artık kariyer sayfasında bir **özet kartı** olarak görünür (Hattrick-tarzı yakalama): turnuva adı, derecen /
  katılımcı, kazanılan puan, klasman sıran; her satır turnuva detayına (maç-içi event'ler) tıklanır. Kart ✕ ile
  kapanır. `GameState.awayReport` (JSON, son 30 turnuva; migration). Çözücü ve sonradan senkronlayan katılımcı
  için de yazılır.
- **M11.3b-2 — Canlı insan ortak örneğe katılır + iki kural:** Bugünkü turnuvayı **canlı** oynayan oyuncunun
  sahasına artık **kapsam-içi diğer kayıtlı gerçek oyuncular** da girer (bot gibi, önceden-taktikle); turnuva
  ortak örnektir (`scopeKey` + dedup), sonuç + klasman + kişisel etkiler herkese yazılır. Zaten çözülmüş bir
  ortak turnuva canlı başlatılmaz (mevcut sonuç okunur). İki kural: **uluslararası turnuvalar yalnız U17+**;
  **kayıt turnuva gününün 00:00'ında kapanır** (yalnız gelecek günler kaydedilebilir). (Tarayıcı+DB ile
  doğrulandı: canlı oynayan Ali + offline Veli **aynı** turnuvada — tek satır/24 katılımcı, ikisine ortak klasman.)
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
