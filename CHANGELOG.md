# Changelog

Bu projedeki tüm önemli değişiklikler bu dosyada tutulur.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) ·
Sürümleme: [Semantic Versioning](https://semver.org/lang/tr/).

## [Unreleased]

Playtest (oyun sahibi) geri bildirimlerine göre oynanış iyileştirmeleri. Ayrıntılı liste
`docs/NOTLAR.md`.

### Eklendi (07.11 — Karakter avatarları güncellendi (erkek + kadın, 77'şer set))
- Kullanıcının `LOTP-HamGrafik/Karakterler` klasöründen **erkek (b) + kadın (g) yüz şeritleri** yeniden kesildi
  (`slice-avatars.mjs`): her set 4 yaş (8/12/16/20) → `public/img/avatars/<set>/<yaş>.webp`. Toplam **77 erkek + 77 kız**.
- Eski setler yeni çizimlerle güncellendi (özellikle erkek 20–25 setlerindeki düzeltmeler); manifest (`src/data/avatarManifest.json`) tazelendi.
- Not: `b22` farklı stilde (3D/çizgi film); kota dönünce yeniden üretilip tek set olarak re-slice edilebilir.

### Değişti (06.11 — Denar rozeti sağ-alt köşeye (saat gibi) + daha güçlü dokunma flaşı)
- **Denar rozeti** alt şeritte artık **sağ alt köşede** (üstteki saat rozetinin aynası; sol kenarlıkla ayrı). 4 nav
  düğmesi sola yayılıp ferahladı (Denar artık eşit sütun kaplamıyor).
- **Dokunma flaşı güçlendirildi**: tap-highlight %45; basınca scale 0.95 + parlaklık ×1.3 (40 ms anında); bırakınca
  260 ms yavaş geri dönüş → "biraz basılı kaldı" hissi.

### Değişti (06.11 — Ekipman Denar kaldırıldı · Sözlük açılır-kapanır · mobil dokunma geri bildirimi)
- **Ekipman'daki "Denar Kazan & Al" bölümü kaldırıldı** (artık yalnız alt menü Denar rozetinde — tek yer, kopya yok).
- **Ayarlar'da Sözlük**, Geri Bildirim'in **altına** alındı ve **açılır/kapanır** yapıldı (içinden sözlük sayfasına link).
- **Mobil dokunma geri bildirimi**: `.press` artık **anında tap-highlight** (kırmızı flaş) + daha belirgin basılma
  (scale 0.96 + parlaklık) + `touch-action: manipulation` (300 ms tap gecikmesi yok). "Dokundum mu?" belirsizliği giderildi.

### Eklendi (06.11 — Alt menüde Denar rozeti (hızlı erişim))
- **Denar rozeti** telefon-yatay alt şeritte, **Ayarlar'ın yanında** (saat rozeti gibi): bakiyeyi gösterir, tıklayınca
  **"Denar Kazan & Al"** menüsü (ödüllü reklam + paketler) pencerede açılır. `DenarBadge` + mevcut `DenarPanel` yeniden kullanıldı.
- `getCareerHeader`'a bakiye + ödüllü reklam durumu alanları eklendi (CareerNav → DenarBadge'e geçer). Migration yok.

### Değişti (06.11 — Menü yatay şerit düzeni + Sözlük Ayarlar'a taşındı)
- **Telefon-yatay üst şerit** artık **Bugün · Kulüp · Antrenman · Ekipman** (çekirdek); alt şerit **Turnuvalar · Klasman ·
  Kariyer Geçmişi · Ayarlar**. Üst şerit (PRIMARY) ilk 4 sayfadan; yatay alt şerit sütun sayısı dinamik.
- **Sözlük menüden kaldırıldı** → Ayarlar içinden açılır (Bildir gibi; sayfa `/kariyer/sozluk` aynen duruyor).

### Eklendi (06.11 — Antrenör kalitesi tesisi takip eder (olay olarak yükselir))
- **Antrenör de 30'dan başlar**; yeteneği kulübün tesis kalitesini **1:1 takip eder** (kullanıcı kararı).
- **Olay olarak yükselir:** tesis, son antrenör gelişine göre **+%20 artıp 1 hafta sabit kaldığında** eski antrenörler
  ayrılır, **yeni antrenörler** gelir (yeni isim + yetenek = güncel tesis; **uzmanlıklar aynı kalır** — kulüp geleneği).
- `src/engine/club.ts` `decideCoachUpgrade` (saf + 5 test). `getCareer` her açılışta (tesis tazelendikten sonra) kontrol eder.
- **Yeni alanlar `Club.lastCoachFacility` (30), `Club.coachPendingSinceDay` (-1)** + `coachSkill` tabanı 30 — eklemeli şema → Neon migration. 254 test.

### Değişti (06.11 — Menü sırası + Bildir Ayarlar'a taşındı)
- **Menü sırası** (kullanıcı): Bugün · Kulüp · Antrenman · Ekipman · Turnuvalar · Klasman · Kariyer Geçmişi · Sözlük · Ayarlar.
  Masaüstü sidebar bunu birebir gösterir; telefon alt çubuğu çekirdek 4 sayfa (Bugün/Antrenman/Turnuvalar/Klasman), gerisi "Daha fazla".
- **Bildir menüden kaldırıldı** → **Ayarlar** sayfasına "Geri bildirim" bölümü olarak taşındı (kullanıcı kararı).

### Eklendi (06.11 — Kulüp tesis büyüme sistemi: gerçek üye + başarı oranı)
- **Tesis artık canlı hesaplanıyor** (`src/engine/club.ts` + test): taban **30** + (gerçek üye×1.5 + başarılı
  mezun×4) × **başarı_oranı**, tavan 100. **Botlar sayılmaz** (ne üye ne mezun). "Başarılı mezun" = önem ≥ 3
  (madalya/şampiyonluk/ranking) en az bir başarısı olan gerçek oyuncu.
- **Başarı oranı kilit** (kullanıcı kararı): kalabalık ama başarısız kulüp DÜŞER — 20 kişi/5 başarılı = **43** <
  5 kişi/5 başarılı = **58**. Yeni açılan başarısız hesaplar akın edince tesis düşer; çocuklar derece yaptıkça çıkar.
- **Kulüp sayfası** (sade): **Kulüp sporcu sayısı** (gerçek) + varsa **Milli sporcu** rozeti (NATIONAL_TEAM başarısı);
  başarı sayısı/oranı ekranda gösterilmez (içte tesisi büyütür). Açıklama 9 dil (kullanıcı: "botlar sayılmaz" ibaresi çıktı).
- `getCareer` her açılışta tesisi yeniden hesaplayıp saklı değeri tazeler (üye kaybında da düşer). Antrenman verimi
  etkisi küçük tutuldu — zaten ±%10, **değişmedi** (kullanıcı: "kesinlikle çok büyük değil").
- **Yeni alan `Club.baseFacility` (varsayılan 30)** — eklemeli şema → Neon migration gerekir. 249 test.

### Eklendi (06.11 — Oyun logosu: "Legends of the Piste" marka amblemi)
- **Gerçek logo oyuna gömüldü** (kullanıcının sağladığı amblem). Giriş ekranı hero'su (yazı başlık ekran okuyucuya
  saklandı — logoda zaten yazı var) + masaüstü sidebar başlığı. Hero'da **saydam amblem** (`logo-mark.png`: koyu zemin
  parlaklıktan alfaya çevrildi → kare yok, sayfaya oturur) ve **ortalı** duruyor (kullanıcı geri bildirimi).
- **PWA / telefon ikonları logodan yenilendi**: `icon-192`, `icon-512`, `maskable-512` (Android daire kırpımı için
  tema zeminine %78 ortalandı), `apple-180`; favicon → `/icons/icon-192.png` (eski placeholder `favicon.ico` + geçici
  `app/icon.png` kaldırıldı, tek kaynak kaldı). Link önizleme görseli (og:image) mevcut `opengraph-image.tsx`'ten gelir.

### Değişti (06.11 — Ekipman sayfası cila: silme onayı + Kumbaram kalem kalem + Denar renk + flicker)
- **Dolaptan silme 2 kademeli onay** (`DiscardButton`): tek tıkla silinmiyor; "Sil?" + ✓/✗ (kullanıcı: "cat diye silinmesin").
- **Kumbaram kalem kalem**: turnuva kalemleri seviyeyle gösteriliyor — "İl · Turnuva ödülü +6", "Türkiye · Turnuva katılımı −3"
  (yeni `lvl.*` i18n, 9 dil); malzeme ürün adıyla. Gelir/gider/net zaten vardı.
- **Denar Kazan & Al renklendirildi**: reklam kartı yeşil "kazan" vurgusu + yeşil buton; paket kartı belirgin.
- **Arka plan "derinlik titremesi" düzeltildi**: açılır panellerin `backdrop-filter`'ı panel açılıp/kapanırken arka planı
  yeniden çizdiriyordu → sabit arka plan ayrı compositor katmanına alındı (`translateZ(0)`, `ArenaPage`). Migration yok. 241 test.

### Kaldırıldı (06.11 — Market'teki "ekipman maçı kazandırmaz" notu)
- Market marka panelindeki "Ekipman maçı kazandırmaz — prestij ve his içindir…" açıklaması kaldırıldı (kullanıcı kararı).

### Değişti (06.11 — Ekipman sayfası yeniden düzenlendi: Kumbaram + ayrı Market sayfası)
- **Kumbaram** (yeni panel, `src/engine/ledger.ts` + test): çocuğun **cebindeki para** + **"o hafta neye ne harcadı
  ne aldı"** kalem kalem (kullanıcı kararı 06.11). Her Denar hareketi işlem kaydına yazılır: turnuva ödülü, harçlık/hediye,
  kulüp aidatı, katılım ücreti/iadesi, **malzeme (ürün adıyla)**, reklam ödülü. Haftalık gelir/gider/net özeti + liste.
- **Market artık ayrı sayfa** (`/kariyer/market`): çok ürün + marka paneli orada; ekipman sayfası sadeleşti
  (Dolap + Kumbaram + Market linki + Denar köşesi en altta). Satın alma Market'ten; dolap combat için tazelenir.
- **Eski "ekipman seviyesi" paneli kaldırıldı** (ekipman sayfasından). Veri/combat etkisi dokunulmadı (sabit kalır).
- **Yeni alan `GameState.ledger`** (eklemeli şema → Neon migration gerekir). 241 test, tarayıcıda uçtan uca doğrulandı.

### Eklendi (06.11 — Monetization: Ödüllü reklam + Denar paketleri (Market'te "Denar" köşesi))
- **Ödüllü reklam motoru** (`src/engine/ads.ts`, saf + test): 1 reklam → **+2 Denar**, günde en çok **3**
  (`AD_DAILY_CAP`; ekonomiyi korur — 1 silah ≈ 133 reklam, "reklamla silah alınmaz"). Sayaç günlük sıfırlanır.
- **İSTENMEDEN açılmaz** (kullanıcı kararı): Market'te **"Denar Kazan & Al"** paneli — oyuncu isteyince "Reklam İzle"
  der → kısa oynatma simülasyonu (gerçek reklam ağı lansmanta buraya girer) → +Denar. Günlük kalan hak gösterilir.
- **Denar paketi** (gösterim): **TEK ürün — 1.000 Đ / £4.99** (kullanıcı kararı 06.11, sade "tok satıcı"; 500/2.000/5.000
  satılmaz). Satın alma **lansmanta** (Stripe sonra bağlanır; sahte ödeme yok). 9 dil.
- **Yeni alan `Player.lastAdDay` + `Player.adsToday`** (eklemeli şema → Neon migration gerekir). İlke korunur:
  ödeyen daha güçlü olmaz (malzeme etkisi minik+gizli), yalnız kesintisiz oynar. 235 test, tarayıcıda doğrulandı.

### Eklendi (06.11 — Dilim 3-3: Fırsat/indirim teklifleri (her malzeme))
- **Süreli fırsatlar** (`rollOffer`): ~haftada %20, oyuncunun silahına uygun **rastgele bir parça** için indirim
  (%30/40/50, 2–4 gün). Markette **indirimli fiyat + üstü çizili orijinal + "🔥 %X · Ng"** rozeti. Süre dolmadan
  alırsan indirimli; kaçırırsan gider. Satın alınca teklif tükenir. Her malzeme için (silah/ayakkabı/maske…).
- **Yeni alan `GameState.pendingOffer`** (eklemeli şema → Neon migration gerekir). Advance'de üretilir/süresi kontrol
  edilir; `buyEquipment` indirimi uygular. İlke korunur (tasarruf, güç değil). 229 test, görsel doğrulandı.
- 🎉 **Dilim 3 (olay sistemi) TAMAM** (3-1 psikoloji · 3-2 malzeme · 3-3 fırsat). Tüm büyük tasarım bitti.

### Eklendi (06.11 — Dilim 3-2: Malzeme olayları (kırılma → yedek; dengeli))
- **Malzeme olayları** (`rollWeeklyMaterial`): **nadir** (~haftada %22); olunca **1 olumsuz + 1 olumlu** (ASLA 2
  kırılma). Olumsuz: silah kırılması (→ `damageActive` aktif silahı kırar → **yedek devreye girer**, 2C) veya
  hırpalanma (dayanıklılık↓). Olumlu: **harçlık/kulüp hediyesi** (+Denar). "Sen yokken" panelinde bildirilir (9 dil).
- Antrenman advance'ine bağlandı: paslanma üstüne malzeme hasarı + net Denar (harçlık − aidat; bakiye 0 altına inmez).
  **Migration yok** (kit/balance/rapor mevcut). 228 test. Sırada: **3-3** fırsat/indirim teklifleri.

### Eklendi (05.11 — Dilim 3-1: Hayat olayları motoru (psikoloji, dengeli))
- **Olay motoru** (`src/engine/lifeEvents.ts`): çocuk→genç sporcunun kariyerinde her oyun-haftasında **1 olumlu
  + 1 olumsuz** psikoloji olayı (DENGE → oyuncu hep kötüden yılıp bırakmasın). 20 olay (koç övgüsü, aile desteği,
  sınav haftası, büyük maç stresi…), deterministik + ağırlıklı + **yaş kapılı** (sınav 10+, büyüme atağı 12–16).
  Etkiler küçük (±2–5), moral/motivasyon/özgüven/stres'e uygulanır.
- "Dünyaya yetiş"te geçilen haftalar için üretilir (uzun boşlukta son 8 hafta), **"Sen yokken"** panelinde listelenir
  (9 dil). **Migration yok** (olaylar antrenman raporuna gömülü). 226 test, görsel doğrulandı.
- Sırada: **3-2** malzeme olayları (kırılma → yedek; 1 olumsuz + 1 olumlu/harçlık) · **3-3** fırsat/indirim teklifleri.

### Eklendi (05.11 — Ekipman Dilim 2C-3: durma/paslanma (atıl parça bozulur))
- **Atıl ekipman paslanır:** uzun süre kullanılmayan (son kullanımdan +21 gün sonra) parça, "dünyaya yetiş"
  penceresinde oyun-ayı başına ~2 dayanıklılık kaybeder (`applyRestAging`); 0'da kırılır. Kullanılan parça
  (maçta aktif) paslanmaz → **tek silahı ezdirmek de, yedekleri çürütmek de kötü; 2–3 silahı dönüşümlü kullan.**
  İdempotent: ilerleme penceresi [başlangıç, güncel] bir kez işlenir (tekrar-hesaplama yok). Şema değişmedi. 224 test.
- 🎉 **Ekipman Dilim 2C TAMAM** (çoklu parça + çöp at + kullanım yıpranması + paslanma). Sırada: **Dilim 3** olay motoru.

### Eklendi (05.11 — Ekipman Dilim 2C-2: kullanım yıpranması (maç aşındırır))
- **Maç yıprandırır:** her maç sonunda **aktif** (o slottaki en sağlam, geçerli) parça aşınır (`applyMatchWear`:
  silah −5, diğer −2/maç); dayanıklılık **0'a inince KIRILIR** → yedek parça devreye girer (katılım korunur).
  `activeInSlot` en sağlam geçerli parçayı seçer; yedekler el değmeden durur. `lastUsedDay` işlenir (2C-3 paslanma için).
- Canlı + offline maç yollarına bağlandı (reputation/trait-evrimi gibi). Şema değişmedi. 223 test.
- Sırada: **2C-3** durma/paslanma (atıl parça zamanla bozulur) · **Dilim 3** olay motoru.

### Eklendi (05.11 — Ekipman Dilim 2C-1: çoklu parça (her slotta 3'e kadar) + çöp at (kullanıcı))
- **Her ekipman slotunda 1–3 yedek:** silah, kıyafet, ayakkabı… hepsinden 3'e kadar alınabilir. Çantada aynı
  slotta birden çok varsa **"1./2./3."** numaralanır. Maça katılım: slotta **en az bir sağlam** (kırık değil +
  doğru beden) parça yeter (yedek sayesinde biri kırılsa da girilir). `MAX_PER_SLOT`/`itemsInSlot`/`applyKitPurchase`
  (dolunca en yıpranmışı değişir).
- **Çöp at (`discardKitItem`/`discardEquipment`):** her parçanın yanında × ile çantadan atılır (iade yok) —
  ileride marka değişiminde (eldekini at, yenisini al) işe yarar. Market: parça başına **"N. Al"** + dolu "3/3".
- Şema değişmedi (equipmentState mevcut). 222 test, görsel doğrulandı. Sırada: 2C-2 (iki tür yıpranma).

### Eklendi (05.11 — Ekipman Dilim 2B-3: kulüp aidatı (düzenli Denar))
- **Kulüp aidatı:** oyuncu "dünyaya yetiş"irken geçilen her oyun-ayında (7 gün) küçük Denar öder
  (`clubMonthlyDues`, kulüp `coachSkill`'ine bağlı: 0→1 … 100→4 Đ/ay — iyi kulüp daha pahalı). **Yumuşak:**
  bakiyeyi 0'ın altına indirmez (ödeyemezse elindeki kadar, ceza yok). Şema değişmedi.
- 🎉 **Ekipman Dilim 2 TAMAM** (2A silah bedeni · 2B-1 kıyafet büyümesi · 2B-2 katılım kuralı+ücreti · 2B-3 aidat).
  Sırada: 2C (çoklu silah + iki tür yıpranma) ve Dilim 3 (30 olaylı olay motoru).

### Eklendi (05.11 — Ekipman Dilim 2B-2: maça katılım kuralı + katılım ücreti)
- **Katılım kuralı:** turnuvaya YENİ kayıtta takım **tam + doğru beden + kırık değil** olmalı (`validateKit`).
  Değilse yumuşak uyarı (`err.kit_small`/`kit_broken`/`kit_incomplete`) + Ekipman'a yönlendir. Mevcut oyuncular
  başlangıç takımıyla U10'da geçerli (kimse kilitlenmez).
- **Katılım ücreti** (`entryFee`): İl **bedava**, Open 2, Ulusal 3, uluslararası 5–15 Đ — hepsi o seviyenin
  1. ödülünün altında (engel değil). Yeni kayıtta düşülür, kayıt iptalinde iade edilir. Şema değişmedi. 221 test.

### Eklendi (05.11 — Ekipman Dilim 2B-1: kıyafet büyümesi (her 2 yıl))
- **Gövde bedeni:** kıyafet/ayakkabı/maske/yelek artık **yaşla büyür** (`bodySize`: 8→0, her 2 yıl +1, 20'de donar).
  Oyuncu büyüyünce bu parçalar **"KÜÇÜK GELDİ"** olur → yeni beden gerekir. `requiredSize` artık yaş + kategori
  alır (silah→kategori 0/2/5, kıyafet→gövde). `sizeLabel`→`weaponSizeLabel` (U-etiketi yalnız silahta). Şema yok.

### Eklendi (05.11 — Ekipman Dilim 2A: silah bedeni (yaş → 0/2/5))
- **Silah bedeni yaş kategorisine bağlı:** U10→0, U12→2, U14+→5 (`requiredSize`/`sizeLabel`/`kitItemFits`).
  Çantada beden rozeti (U10/U12/U14+); oyuncu büyüyüp silahı küçük gelince **"KÜÇÜK GELDİ"** uyarısı (kırmızı) →
  yenileme sinyali. Market satın alımı parçayı **oyuncunun güncel kategorisinin bedeniyle** verir; başlangıç
  takımı da doğru bedende. Şema değişmedi (migration yok). 9 dil, 220 test.
- Not: kıyafet büyümesi (2 yıl), maça katılım kuralı + ücreti, kulüp aidatı → Dilim 2B; çoklu silah + yıpranma → 2C.

### Değişti (05.11 — Ekipman: "Malzeme Çantam" açılır/kapanır panel (Market gibi))
- "Malzeme Çantam" artık Market/GLADIUS gibi **açılır-kapanır panel** (chevron, çanta ikonu). İleride yeni markalar
  geldiğinde her biri Gladius gibi kendi açılır-kapanır panelinde durur.
- Tasarım notu (docs): **çoklu silah yönetimi** (1./2./3. silah, her birinin dayanıklılığı) + **iki tür yıpranma**
  (kullanım + durma/paslanma-sertleşme) Dilim 2'ye eklendi.

### Eklendi (05.11 — Ekipman Dilim 1: malzeme çantası + bedava başlangıç takımı (docs/EKIPMAN_VE_OLAYLAR.md))
- **Malzeme çantası modeli (`equipmentState` JSON, eklemeli):** her parçanın **beden + dayanıklılık + kırık**
  durumu (`KitItemState`). `starterKit` / `resolveKit` / `applyKitPurchase` (saf, test). Eski kayıt (null) →
  başlangıç takımına düşer (herkes tam çanta görür).
- **Bedava başlangıç takımı:** yeni oyuncu 8 yaşında **tam Gladius takımı** ile başlar (doğru slotlar, beden 0,
  %100) — herkes maça girebilir (paywall değil). createCareer hem `ownedEquipment` hem `equipmentState` yazar.
- **Ekipman sayfası yeniden düzen:** üstte **"Malzeme Çantam"** (parça + beden rozeti U10/U12/U14 + dayanıklılık
  barı + KIRIK), altta **"Market (Gladius)"**. Market "sahip" rozetleri çantadan türetilir (eski oyuncu da tutarlı).
- **Yeni alan `Player.equipmentState`** (eklemeli şema → Neon migration gerekir). Satın alım çantayı günceller.
  Beden→yaş, katılım kuralı, yıpranma/kırılma Dilim 2–3'te. 219 test; görsel doğrulandı.

### Eklendi (05.11 — Trait Katman 2 / Dilim 3: evrim bildirimi "Sen yokken" panelinde (hikâye))
- Trait değişince **"Sen yokken" panelinde bildirim**: dönüşümde *"Karakterin olgunlaştı: Sabırsız →
  Soğukkanlı"* (eski üstü çizili), edinmede *"Yeni bir karakter özelliği: + Özgüvenli"* (9 dil). Mevcut trait
  etiketleri kullanılır. Kapatınca (mevcut ✕) temizlenir (`clearTraitReport`, clearAllReports'a eklendi).
- **Yeni alan `GameState.traitReport`** (eklemeli şema → Neon migration gerekir): son 10 evrim notu (JSON).
  `applyTraitEvolution` değişim olunca oyuncunun GameState'ine notu yazar (kendi içinde). getCareerHeader →
  `traitEvents`. Yerelde görsel doğrulandı (ekran görüntüsü), tsc + 216 test yeşil.
- 🎉 **Trait Katman 2 TAMAM** (Dilim 1 motor + Dilim 2 bağlama + Dilim 3 bildirim). Tam 0–4 intensity modeli
  hâlâ V2.

### Eklendi (05.11 — Trait Katman 2 / Dilim 2: evrim canlı akışa bağlandı (GDD 10.37))
- **`applyTraitEvolution`** (`src/server/traitEvolution.ts`, ortak modül): turnuva bitişinde kariyer
  sinyallerini (başarılar, koç skoru, oynanan turnuva, yaş, son düşüş) okuyup `evolveTraits`'i çağırır;
  değişim olursa oyuncunun trait planını + `lastTraitEventDay`'i yazar. **Cooldown'da erken çıkar** → turnuva
  başına ek maliyet ~0. Hem canlı (`liveTournament`) hem offline (`finalizeTournament`) yola bağlandı;
  başarılar yazıldıktan SONRA çalışır (bu turnuvanın sonucu da sinyale girer).
- **Yeni alan `Player.lastTraitEventDay`** (eklemeli şema → Neon migration gerekir). `applyTraitChange`
  (saf): dönüşümde eski trait çıkar, yenisi şu anki yaşla aktif olur (zıt-çift kalmaz). +1 test.
- **NOT:** değişim şimdilik **sessiz** uygulanır (profil trait rozetleri güncellenir); açıklayıcı bildirim
  ("Karakterin değişti: Sabırsız → Soğukkanlı") **Dilim 3**'te eklenecek. Gerçek DB'ye karşı smoke doğrulandı.

### Eklendi (05.11 — Trait Katman 2 / Dilim 1: yaşanmışlıkla trait evrimi (motor) (GDD 10.31–10.37))
- **`evolveTraits`** (saf motor, trait.ts): kariyer sinyallerine göre (yaş, şampiyonluk/madalya/milli takım,
  koç kalitesi, tecrübe, son düşüş) EN FAZLA BİR trait değişimi önerir. **Dönüşüm** (Sabırsız→Sabırlı,
  Kaygılı→Soğukkanlı, Hassas→Özgüvenli, Tembel→Çalışkan, Özgüven↓→Hassas) + **edinme** (boş slotta
  Özgüvenli/Baskıya Dayanıklı). Ani değil: **cooldown** (1 oyun-yılı) + **yaş kapısı** (gençken sık, ~20
  sonrası oturur) + düşük olasılık. Deterministik (seeded). Max 3 trait + zıt-çift korunur.
- Henüz canlıya BAĞLANMADI (Dilim 2: turnuva bitişine kancala + kalıcılık + migration; Dilim 3: bildirim).
  15 test (cooldown, dönüşüm, max-3, yaş kapısı, determinizm).

### Eklendi (05.11 — avatar havuzu 60 sete çıktı (kullanıcı üretimi))
- Yeni şeritler dilimlendi: **23 erkek** (`b01–b23`) + **37 kız** (`g01–g37`) = **60 set** (eskiden 42).
  `b21–b23` farklı oranda (3:2) geldiği için çene kesilmesin diye özel (daha ferah) kırpımla yeniden
  dilimlendi; diğerleri standart. Kod değişmeden havuz büyüdü (`pickAvatar` manifestten okur).

### Kaldırıldı (01.11 — ölü kod temizliği (knip ile tarama))
- **4 kullanılmayan dosya silindi** (344 satır): `ViewSettings.tsx`, `LiveTournamentPanel.tsx` (eski canlı
  turnuva paneli, podyum modeline geçince atıl kaldı), `engine/events.ts` (M0 iskelet, hiç kullanılmadı),
  `server/dataService.ts` (M0 iskelet). Hiçbir yerden import edilmiyorlardı.
- **~20 tamamen ölü export temizlendi:** `TOURNAMENT_PRESTIGE`, `WEAPON/GENDER/PROFILE/TRAINING_LABEL_TR`,
  `TRAIT_CATEGORY_LABEL`, `traitLabels`, `DAY_NAMES_TR`+`dayNameTR`, `dailyRecovery`, `ageGroup`,
  `rankingTrackForLevel`, `upgradeEquipment`(+action), `clearReport/ClearAwayReportAction`, `LAST_NAMES`,
  `AVATAR_STAGES`, `DE_PERIODS`, `avatarPoolSize` (çoğu i18n'e geçince atıl kalan eski TR etiket sabitleri).
- Dokunulmadı: zincirli/riskli olanlar (ACH_TONE), **çıkış (`signOut`) yarım-özellik** (butona bağlı değil —
  silelim mi yoksa çıkış butonu mu ekleyelim, kullanıcıya soruldu), `pg`/`dotenv` (knip yanlış pozitif; prod'da
  kullanılıyor). tsc + 214 test + lint yeşil.

### Eklendi (01.11 — itibar/fair-play ekseni: Çirkef/Hilekâr uzun vadede bedel ödetir (kullanıcı kararı))
- **İtibar (reputation) alanı** eklendi (`Player.reputation` 0–100, varsayılan 100; eklemeli şema → Neon
  migration gerekir). Turnuva SONRASI güncellenir: **Çirkef** aktifse en çok düşer (−4), **Hilekâr** az düşer
  (−2.5), **Dürüst** yavaş toparlar (+1.5), nötr zamanla tavana sürüklenir (+0.5). `reputationAfterEvent`
  (motor, saf) iki persist noktasına bağlandı (canlı + offline turnuva).
- **Gösterim:** Psikoloji panelinde "İtibar" çubuğu (9 dil). Karar: *risk + itibar cezası* — çirkeflik anlık
  durumsal avantaj verir (mevcut gamesmanship) ama uzun vadede itibar düşer.
- **V2 kancası:** düşük itibarın oyun-içi somut cezası (hakem/kart/dışlanma) ileride; şimdilik alan birikir +
  görünür. Test: çirkef düşüşü > hilekâr, dürüst toparlar, 0–100 sınırı, 10 turnuvada birikim.

### Düzeltildi (01.11 — zıt trait'ler birlikte görünmez (okuma-anı güvencesi))
- **Zıt/çift trait temizliği okuma anında** (`activeTraitKeys` → yeni `sanitizeTraitKeys`): bir oyuncuda
  zıt trait çifti (ör. Çalışkan↔Tembel) veya tekrar asla aktif olmaz; çelişkide **erken oluşan** (küçük
  unlockAge) tutulur. Üretim (`generateTraitPlan`) zaten zıt-çift vermiyordu; bu değişiklik **faz4 öncesi
  üretilmiş eski/canlı kayıtları** veri silmeden güvenceye alır (CLAUDE.md: canlı veri korunur, eklemeli).
- Test: 5000 tohumda üretim hiç zıt/çift vermiyor; zıt-harita simetrik; bozuk eski plan okuma anında
  temizleniyor (`tests/engine/environment.test.ts`).

### Eklendi (01.11 — avatar havuzu 42 sete çıktı (kullanıcı üretimi))
- Yeni avatar şeritleri dilimlendi: **15 erkek** (`b01–b15`) + **27 kız** (`g01–g27`) = **42 set**
  (eskiden 15). Her set 4 yaş (8/12/16/20). `scripts/slice-avatars.mjs` ile üretildi, manifest güncel.
  Kod değişmeden havuz büyüdü (`pickAvatar` manifestten okur).

### Düzeltildi (01.11 — ulusal şampiyona rozeti de kendi ülkesiyle (kullanıcı))
- Turnuva **seviye rozetleri** (yaklaşan liste `LevelTag` + "sıradaki" kartı + haftalık şerit `WeekStrip`)
  ulusal şampiyonayı artık **oyuncunun kendi ülkesiyle** gösterir: GB oyuncu → "İNGİLTERE" rozeti (eskiden
  sabit "Türkiye"/"TR" basılıyordu). 29.10 düzeltmesi yalnız turnuva **adını** çözmüştü; rozet hâlâ generic
  `levelTag.TURKIYE`/`levelShort.TURKIYE` kullanıyordu. `LevelTag`/`WeekStrip` artık `country` koduyla
  `country.<kod>` çevirisini basıyor; çağrı yerlerine `c.countryCode`/`h.countryCode` geçirildi.

### Düzeltildi (29.10 — ulusal şampiyona adı her ülke için kendi adıyla (kullanıcı))
- Bugünkü etkinlik + haftalık program etiketleri ulusal şampiyonayı artık **her oyuncunun kendi ülkesiyle**
  gösterir (GB → "İngiltere Şampiyonası", DE → "Almanya Şampiyonası"…). Eskiden generic `tournament.TURKIYE`
  (= "Türkiye Şampiyonası") herkese basılıyordu. `getCareer`/`getCareerHeader` artık `tournamentDisplayName`
  (ülke koduyla) kullanıyor — "sıradaki turnuva" kartıyla tutarlı.

### Eklendi (28.10 — PWA: telefonda "app gibi" (kullanıcı hedefi))
- Oyun artık **PWA**: telefonda **"Ana Ekrana Ekle" → tam ekran app** gibi açılır (kendi ikonu, açılış
  rengi, **YATAY** yön). `src/app/manifest.ts` (standalone · landscape · tema `#0b0e12`), ikonlar
  (192/512/maskable + apple-touch, geçici çapraz-kılıç amblemi), minimal **service worker** (`public/sw.js`
  + `ServiceWorkerRegister`), iOS meta (`appleWebApp` + `viewport-fit=cover` → çentikli ekranda tam ekran).
- **İndirme uyarısı** (`InstallPrompt`, landing): tarayıcıda + yüklü değilken → **Android**'de tek-dokunuş
  "Yükle" butonu (`beforeinstallprompt`), **iOS Safari**'de "Paylaş → Ana Ekrana Ekle" yönergesi (Apple
  otomatik butona izin vermez). Kapatılabilir (bir kez), 9 dil.
- **Mağaza (App Store/Play) onayı GEREKMEZ** — PWA tarayıcıdan yüklenir; mağaza ileride ayrı/opsiyonel adım.
  Özel logo gelince geçici ikon değişir.

### Eklendi (28.10 — avatar: otomatik, cinsiyete göre (kullanıcı kararı))
- **Oyuncu avatarı**: her oyuncu (insan + AI) cinsiyetine göre **OTOMATİK** yüz alır — **seçim ekranı yok**.
  **Yaşa göre portre** (8/12/16/20; büyüdükçe avatar da büyür). **Kutu + oval köşe** çerçeve (3:4, tam yüz;
  kırpma/boşluk/bulanıklık yok). Gösterim: kimlik kartı + menü şeridi + sidebar + **klasman**, **milli takım**,
  **kariyer geçmişi (rakipler)** ve **turnuva (seeding + final sıralama)** listeleri.
- `Player.avatar` (opsiyonel; boş → harf rozeti/fallback). Havuz = **manifest** (`src/data/avatarManifest.json`,
  slicer üretir) → yeni set eklenince **kod değişmeden** büyür. `pickAvatar` deterministik + test.
- Şerit→4 kare kesme scripti `scripts/slice-avatars.mjs` (manifest üretir). Havuz: 6 erkek (`b01–b06`) +
  9 kız (`g01–g09`) = 15 set; yeni şerit eklendikçe artar.
- **NOT:** canlıya ALINMADI — `Player.avatar` için Neon migration + (opsiyonel) listelerin geri kalanı sonra.

### Değişti (27.10 — bölgesel/şehir klasmanı + İl artık ulusala karışmaz (kullanıcı kararı))
- **İl turnuvaları → ŞEHİR klasmanı** (yeni `CITY:<ülke>#<şehir>` scope). İl ARTIK ULUSALA PUAN VERMEZ
  (eski hata: İl puanları DOMESTIC'e yazılıyordu → ulusal liste tek şehirle doluyordu). İl yine tecrübe +
  kendi şehir klasmanını besler — yerel/sık döngü, oyuncuyu oyuna bağlayan motivasyon.
- **Ulusal klasman yalnız ülke şampiyonasından** (Türkiye/Almanya…). Milli takım + uluslararası uygunluk
  (ilk 4) artık saf ulusal şampiyona performansından (daha gerçekçi).
- **Open sadece tecrübe** · **uluslararası → dünya/kıta** (ikisi de değişmedi).
- **Klasman ekranı: kapsam seçici** — Şehir (varsayılan) · Ülke · Kıta · Dünya. Şehir sekmesinde şehir
  seçici: başka şehirlerin klasmanına da bakılır (arkadaşını gör).
- Engine: `rankingScopeForLevel(level, geo)` (Ranking veri sahibi); puan yazma/okuma yerleri (canlı + "sen
  yokken" + legacy finalize) şehir-kapsamlı. **Şema değişikliği YOK** (scope zaten serbest metin). Geçiş:
  eski DOMESTIC'teki İl puanları Quarter sonunda temizlenir. Test: "İl → şehir, ulusala puan vermez"
  (`tests/engine/ranking.test.ts`).

### Değişti (25.10 — gün seçici/şerit netliği (kullanıcı))
- **Antrenman gün seçici** (Teknik/Fiziksel/Mental/Taktik/Dinlenme): 5'li segment artık camsı koyu şerit
  üstünde (`bg-black/35` + blur) ve etiketler daha parlak (`text-ink/75`) → fotoğraf üstünde net.
- **"Önümüzdeki 7 gün" şeridi** (Bugün + Turnuvalar, `WeekStrip`): gün kısaltmaları ve seans ikonu artık
  parlak (`text-ink/80`), gri yerine → faded görünüm giderildi. Bugün hücresi en belirgin (kalın + çerçeve).

### Değişti (25.10 — arena sayfalarında yazı netliği (kullanıcı: "yazılar sönük"))
- Fotoğraf/camsı zemin üstünde yazı daha net: `[data-arena]` için **hafif gölge** (`text-shadow`),
  bir tık daha kalın (ağırlık 530) ve **ikincil (gri) metin biraz daha parlak** (`--steel`→`#b4bcc6`).
  Kural konsol kapsamından sonra/katmansız → `--steel` geçersiz kılma güvenle uygulanır. Şeffaflık
  ve arka planlar aynı (kullanıcı onayladı).

### Değişti (25.10 — oyun artık YALNIZ yatay (app kararı))
- **Oyun sadece yatay (landscape) oynanır** — seçenek kaldırıldı. `data-view` her zaman `landscape`
  (`src/app/layout.tsx`); eski "Oyun düzeni" (klasik/yatay) tercihi Ayarlar'dan çıkarıldı (`ViewSettings`
  artık kullanılmıyor). Neden: app yatay-öncelikli kullanılacak, yatay menü (üstte 4 sekme + GMT saat,
  altta 5 sayfa) esas düzen.
- **`RotateGate`** (`src/app/RotateGate.tsx`): cihaz dik tutulunca tüm ekranı kaplayan "Telefonunu yan
  çevir" uyarısı — GERÇEK cihaz yönüne göre (CSS `portrait:` media, `data-view`'dan bağımsız).
  Masaüstünde (lg) çıkmaz. 9 dilde (`rotate.title`/`rotate.desc`). Nazik eğilen telefon ikonu
  (`@keyframes rotateHint`, reduced-motion'da durur).

### Değişti (25.10 — görsel: TÜM sayfalara temalı tam-sayfa arka plan (Champ Manager tarzı))
- **Her sayfaya kendi temalı fotoğrafı** (AI üretimi, özgün) sabit tam-sayfa arka plan olarak eklendi:
  Bugün, Antrenman, Turnuvalar, Klasman (+Milli), Ekipman, Kulüp, Sözlük, Geçmiş, Ayarlar, Geri bildirim.
  Görseller WebP'ye sıkıştırıldı (`public/img/bg-*.webp`, 10 görsel toplam ~0.9MB; kaynak PNG ~20MB'den).
- **Ortak `ArenaPage` bileşeni** (`src/app/ArenaPage.tsx`): sabit arka plan (z-0) + karartma + içerik (z-10) +
  `data-scope="console"` → kullanıcı teması ne olursa olsun (açık "Salon" teması dahil) yazı/panel okunur
  kalır (fotoğraflar koyu olduğu için sayfa bilerek koyu "arena"). Mobilde yatay ve dikey garanti görünür.
- Antrenman artık ortak bileşeni kullanıyor; eski tekil görsel `salle-antrenman.webp` kaldırıldı.
- Not: Milli takım sayfasının kendi görseli yok → şimdilik Klasman görselini paylaşıyor (ileride ayrı görsel).
- **Camsı paneller (glassmorphism):** arka plan daha çok görünsün diye arena sayfalarında paneller yarı
  şeffaf + arkası bulanık (`[data-arena] .panel`: `rgba(13,17,23,.46)` + `backdrop-blur`) → fotoğraf
  panelin ardından yumuşakça görünür, yazı okunur kalır. Karartma katmanı da hafifletildi (dim 68→60).
  Antrenman hero bandı inceltildi + şeffaflaştırıldı (`bg-black/35`→`/25` + blur, daha az dikey boşluk).
  Düz metin okunurluğu için arena sayfalarında varsayılan yazı ağırlığı bir tık artırıldı (400→500;
  açık ağırlıklı/başlık öğeleri değişmez).
- **Daha şeffaf + açılır-kapanır bölümler (kullanıcı isteği):** paneller bir tık daha şeffaf
  (`rgba(…,.46)`→`.38`), karartma 60; Antrenman hero bandındaki opak `data-scope="console"` kaldırıldı
  (artık gerçekten yarı şeffaf). Bölüm başlıkları **açılır-kapanır** (antrenmandaki gibi `CollapsibleSection`):
  **Kariyer Geçmişi** (vitrin/zaman çizgisi/turnuvalarım/rakipler), **Ayarlar** (dil/görünüm/ses/kariyer),
  **Bugün** (yetenekler), **Sözlük** (her terim grubu). Tek-içerikli/birincil sayfalar (klasman tablosu,
  turnuva listesi #yaklasan çapası, kulüp kartı, ekipman—zaten açılır panel) olduğu gibi bırakıldı.

### Değişti (19.10 — görsel: antrenman sayfası yenilendi (gençlere göre, mobil))
- **Eskrim salonu TÜM SAYFA arka planı (Champ Manager tarzı):** AI üretimi (özgün) salon görseli sabit arka planda
  (`public/img/salle-antrenman.webp`) + koyu katman; içerik/kartlar üstünde "yüzer". İnce/kompakt hero şeridi
  (Antrenman·gün + **Kondisyon/Form** enerji barları). Sürükleyici "antrenman salonundayım" hissi.
- **Antrenman türleri renk-kodlu:** 🔵 Teknik · 🔴 Fiziksel · 🟢 Taktik · 🟣 Mental · ⚪ Dinlenme (renkli ikon rozeti).
- **Açılır-kapanır bölümler** (`CollapsibleSection` + `InfoNote`): Haftalık Plan açık; "Ne geliştirir" + "Yeteneklerin"
  kapalı (dokun → aç). Mobil + genç kitle: taranabilir akordeon, az metin duvarı. Native `<details>`, JS yok.

### Eklendi (19.10 — İKİ klasman (yurt-içi + dünya) + Kıta Şampiyonası + uluslararası uygunluk ülke ilk 4)
- **İki ayrı klasman** (Ranking tablosuna `scope` eklendi — migration `ranking_scope`):
  - **DOMESTIC (ülke klasmanı):** yalnız **İl + Ulusal** şampiyona puanları → milli takım (ülke ilk 4) +
    uluslararası uygunluk buradan. Uluslararası sonuçlar ülke klasmanını **ETKİLEMEZ** (kullanıcı kuralı).
  - **WORLD (dünya klasmanı):** uluslararası turnuva puanları (Satellite/Kıta/GP/Dünya Kupası). Klasman
    sayfası: **Ülke**=DOMESTIC, **Dünya**=WORLD, **Kıta**=WORLD kıtaya filtreli.
- **Uluslararası uygunluk = oyuncunun ÜLKESİNİN ilk 4'ü** (milli takım). 4 turnuvanın tamamı TOP16 değil **TOP4**
  (`season.ts`); kontrol **yurt-içi (DOMESTIC)** rank'e bakar (`buildRankingView` country scope her yerde).
- **Kıta Şampiyonası:** eski tek "Avrupa" seviyesi artık **oyuncunun KITASI** (Avrupa/Asya-Okyanusya/Amerika/
  Afrika) — kıta-kapsamlı saha (`geoScopeForLevel`/`selectFieldAi` kıta), adı izleyicinin dilinde
  ("U17 Asya-Okyanusya Şampiyonası"). Satellite/GP/Dünya Kupası tüm dünya (karışık).
- Puan yazımı DOĞRU klasmana yönlenir (`rankingTrackForLevel` — finalize + canlı turnuva). tsc + 205 test +
  saf/DB doğrulama script'leri yeşil. ⚠️ **Prod'a migration + kod BİRLİKTE gider** (unique key değişti).

### Düzeltildi (19.10 — milli takım oyuncunun kendi ülkesi)
- **Milli takım kadrosu** (`getNationalTeam`) ve **rozeti** (`nationalTeam`) artık oyuncunun **kendi ülkesinin**
  o kategorideki ilk 4'ü (önceden GLOBAL ilk 4 → Alman'ın milli takımında Türkler çıkabiliyordu). Ülke-içi rank
  (`buildRankingView` country scope) ile. Not: uluslararası turnuva **uygunluğu** şimdilik global rank'te kaldı
  (çok-ülke davet modeli ayrı tasarım kararı).

### Eklendi (19.10 — UI dili bağlanılan ülkeden otomatik (IP))
- **Dil, bağlanılan ülkeye göre otomatik:** cookie yoksa Vercel `x-vercel-ip-country` → o ülkenin dili
  (Alman→Almanca, Çinli→Çince, Fransız→Fransızca…). Dili desteklenmeyen ülke → İngilizce; IP yok/yerel → Türkçe.
  Kullanıcı elle dil seçerse (LangSelect) o cookie **önceliklidir** (otomatik ezilmez). `localeForCountry` eşlemesi
  (18 ülke → 9 dil). Böylece oyuncu nereden bağlandıysa UI o dilde + ülkesi ön-seçili + o ülke bayrağı/turnuva/klasmanı.

### Düzeltildi (19.10 — bayrak oyuncunun kendi ülkesi (sabit TR değil))
- Kimlik kartı, üst şerit (CareerNav) ve milli takım sayfasında bayrak **sabit 🇹🇷** idi → artık oyuncunun
  **gerçek ülkesi** (oluşturduğu/doğduğu ülke). Alman → 🇩🇪, İngiliz → 🇬🇧. Milli takım etiketi de ülkeye göre
  ("İngiltere Erkek Flöre U10"). `getCareer`/`getCareerHeader` DTO'suna `countryCode` eklendi (human.nationality'den).

### Düzeltildi (19.10 — KRİTİK: sporcu oluşturma kırıktı (country iletilmiyordu))
- `createCareerAction` formdaki **`country` alanını `createCareer`'a geçmiyordu** → 18-ülke push'undan beri
  `createPlayerSchema` (zorunlu `country`) Zod'da patlıyor, **her ülkede** (TR dahil) sporcu oluşturma "bir
  şeyler ters gitti" veriyordu. Tek satır düzeltme: `country: formData.get("country")`. Hotfix push.

### Eklendi (18.10 — IP'den ülke ön-seçimi (akıllı varsayılan)) — ✅ CANLIDA (19.10)
- **Oluşturma formu ülkeyi IP'den ön-seçer:** Vercel'in ücretsiz `x-vercel-ip-country` header'ı (dış servis
  YOK, IP saklanmaz/loglanmaz). Ziyaretçinin ülkesi 18 ülkeden biriyse form ona + o ülkenin şehirlerine
  ön-ayarlanır; değilse/yerelde → TR. **Zorlama değil** — oyuncu listeden değiştirebilir (VPN/çifte vatandaş).
  (Eski V2 "IP ile ülke" — Vercel yerel geo sağladığı için kolayca V1'e alındı.)

### Değişti (18.10 — 18 ülke: kulüpler + ulusal turnuva ülkeye göre) — ✅ CANLIDA (19.10)
- **Kulüpler artık ülkenin kendi dilinde + kendi şehrinde:** "Berlin Fechtclub", "London Fencing Club",
  "Madrid Club de Esgrima", "Moscow Фехтовальный клуб"… (`clubNameFor`, geo.ts, 18 ülke eki). **Koç adları da**
  kulübün ülkesinden (Berlin kulübü → Alman koç; `firstNamesFor/lastNamesFor` ülke havuzu).
- **Ulusal şampiyona oyuncunun kendi ülkesi:** "U10 **Almanya** Şampiyonası · Berlin" (önceden herkese
  "Türkiye Şampiyonası · <TR şehri>"). Ev sahibi şehir artık oyuncunun **ülkesinin** şehirlerinden; ulusal
  turnuva adında **ülke adı** (izleyicinin dilinde). Open da ülke şehrinden; uluslararası (Satellite/GP) dünya
  şehrinden. `tournamentHostCity`/`tournamentHostFrom`/`tournamentDisplayName` ülke-duyarlı; ülke kodu
  `loadState` human include'u + scopeKey'den gelir. tsc + 205 test + prod build yeşil.

### Eklendi (18.10 — 18 ülke launch: ülke seçimi + bölgesel bot nüfusu) — ✅ CANLIDA (19.10)
- **Parça 1 — Ülke+şehir seçimi:** oluşturma formuna ülke (18, bayraklı) + o ülkenin şehirleri
  (`CountryCitySelect`; ülke değişince şehir güncellenir). Telefon kalktığı için bölge buradan belirlenir
  (IP otomatiği V2). `createPlayerSchema.country`; `createCareer` seçilen ülkeyi kullanır; sunucu doğrulaması.
- **Parça 2 — Saha kapsamı:** İl = oyuncunun **şehri** (bölge), Türkiye/Open = **ülke** geneli, uluslararası =
  çok-uluslu karışık. `selectFieldAi` İl'de şehre göre filtreler; **RETIRED botlar sahaya girmez**.
- **Parça 3 — Bölgesel bot nüfusu (`ensureBucketBots`):** her (ülke+şehir+cinsiyet+silah) bölgesi
  **16 kişiye** bot ile tamamlanır (bot = 16 − gerçek oyuncu). Gerçek oyuncu katıldıkça en yeni bot **emekli**
  (RETIRED; veri korunur). **Gerçek oyuncuya limit yok** — 16 insan olunca bot 0'lanır, 17. oyuncu sorunsuz kaydolur.
  Eski "tek kohort, ilk oyuncuya göre tohumla" modeli kaldırıldı; yabancı AI havuzu (uluslararası) korundu.
- **Doğrulama:** taze sqlite DB'de uçtan uca script — 11/11 geçti (16'ya dolum, idempotent, İl=şehir,
  Türkiye=ülke, emekli hariç, delete-on-join, 17. oyuncu engellenmez). tsc + 205 test + prod build yeşil.
- ⚠️ **PUSH BEKLEMEDE:** canlı test dünyasında İl kapsamını değiştirir → kullanıcı onayıyla push edilecek
  (ideali: lansmanda taze dünya).

### Değişti (18.10 — sporcu oluşturma: şehir listesi alfabetik)
- Oluşturma formundaki **şehir açılır menüsü alfabetik** sıralanıyor (Türkçe sıralama: İ/ı/ş/ç/ğ/ö/ü doğru).
  Yalnız **gösterim** sıralanır; `TR_CITIES` kaynak dizisinin sırası (turnuva ev sahibi şehrinin deterministik
  seçimi) değişmez.

### Eklendi (18.10 — ✅ Google ile giriş CANLIDA)
- **Google girişi prod'da çalışıyor** (https://lotp-one.vercel.app): giriş → sporcu oluştur → oyun, uçtan uca
  doğrulandı. Vercel'e `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` env eklendi; Google tarafında redirect URI
  (localhost + prod) + test kullanıcısı hazır. (Uygulama hâlâ "Testing" modunda → herkese açmak için "Publish".)
- Yol boyunca çözülenler: ilk `invalid_client` = Vercel'deki secret değeri birebir değildi (düzeltildi);
  geçici `?why=` / `?cerr=` teşhisleriyle nedenler saptanıp giderildi, `?cerr=` ham-hata teşhisi geri alındı.
- ⚠️ Güvenlik: Client secret geliştirme sırasında sohbette geçti → **lansman öncesi rotate edilecek**
  (Google "+ Add secret" → yeni değer → `.env` + Vercel güncelle → eskisini sil).

### Değişti (18.10 — Google callback dayanıklılığı: 500 yerine nazik hata + retry)
- **Callback artık asla 500 vermiyor:** token değişimi veya giriş adımı hata atarsa yakalanıp `?auth=error`
  ile nazik uyarıya dönülüyor (`app/api/auth/google/callback/route.ts` try/catch).
- **Token isteği 3 kez deneniyor** (`postToken`, kısa backoff) — aralıklı ağ/TLS hatalarına karşı dayanıklı.
  (Bazı yerel ağlarda güvenlik yazılımı Node'un HTTPS'ini keser; prod'da gerekmez, zararsız ek sağlamlık.)
- Not: Tam giriş testi **Vercel'de** yapılır — yerel makinenin Google'a TLS bağlantısı güvenlik yazılımınca
  aktif kesildiği için yerelde token değişimi tamamlanamıyor (kod/secret doğru, ortam sorunu).

### Eklendi (18.10 — Google giriş hatası artık sessiz değil, 9 dilde)
- **Google girişi başarısız olursa** (`?auth=error`) veya **yapılandırılmamışsa** (`?auth=unconfigured`) ana sayfa
  artık **kullanıcının dilinde** kısa bir uyarı gösteriyor (önceden sessizce ana sayfaya dönüyordu). `auth.error` +
  `auth.unconfigured` anahtarları 9 dilde; uyarı Google butonunun üstünde amber bant olarak çıkar.
- İnceleme notu: Google OAuth akışı (state/CSRF çerezi, token→e-posta, mevcut kariyeri bağlama) sağlam; tek
  eksik bu sessiz-hata geri bildirimiydi — kapatıldı. Kayıt **botlara takılmıyor** (doğrulandı: `createCareer`
  her zaman insan oyuncuyu oluşturur, bot-sayısı kapısı yok) → "17. gerçek oyuncu" senaryosu zaten güvenli.

### Eklendi (18.10 — yumuşak hata mesajları 9 dilde)
- **Nadir "yumuşak" hatalar artık kullanıcının dilinde** gösteriliyor (generic hata sayfası yerine). Yeni
  `GameError(code, msg)` sınıfı (`careerService.ts`): kayıt/katılım/ekipman gibi aksiyonlarda atılan 12
  beklenen durum (gün geçti, kayıt kapandı, sakat, turnuva saati gelmedi, rakip yok, ekipman max, ürün yok…)
  koda bağlandı.
- **Aksiyonlar** (`registerTournamentAction`, `attendTournamentAction`, `upgrade/buyEquipmentAction`) bu hatayı
  yakalayıp ilgili sayfaya `?err=<kod>` ile yönlendiriyor; sayfa (`turnuvalar`/`kariyer`/`ekipman`) üstünde
  kapatılabilir **`ErrorBanner`** çıkıyor. `err.*` anahtarları **9 dilde** (TR/EN/DE/FR/ES/IT/RU/PT/ZH × 11 kod).
- Bilinmeyen/çevirisiz kod → banner çizilmez (generic akış korunur). Güvenli: prod'a bağımsız, Google auth'tan ayrı.

### Değişti (18.10 — Google ile giriş (telefon girişi kaldırıldı)) — ✅ CANLIDA
- **Telefon girişi tamamen kaldırıldı** (`signInWithPhone`, `GirisForm`, `/giris` formu). Giriş artık **Google
  ile**: hafif OAuth (`/api/auth/google` + `/callback`, next-auth YOK) → e-postadan User eşleşir, mevcut çerez
  sistemine köprü (`completeGoogleSignIn`). Mevcut anonim kariyer varsa Google'a bağlanır (korunur).
- **Ana sayfa kapısı:** Google yoksa → "Google ile devam et"; girişli + kariyer yoksa → sporcu oluştur;
  kariyer varsa → oyna. `auth.*` metinleri 9 dilde. `/giris` → ana sayfaya yönlendirir.
- ✅ **Prod'a alındı (18.10):** Vercel env eklendi, deploy edildi, uçtan uca test geçti (yukarıdaki "CANLIDA" notu).

### Eklendi (15.10 — çok-ülkeli dünya: AI uyrukları + yerel/uluslararası saha kuralı)
- **Yabancı AI havuzu** eklendi (`FOREIGN_AI_POOL`, eskrim gücüne göre ağırlıklı; 32 AI). Dünya tohumlanırken
  ev ülkesi (TR) AI'larına ek olarak yabancı AI'lar kendi ülkelerinin şehrinde kulüple oluşturulur; isim+uyruk
  kendi ülkesinden (**Türk isimli AI asla İspanyol bayrağıyla çıkmaz** — test: `player.test.ts`).
- **Saha seçimi seviyeye göre** (`selectFieldAi`): **yerel** (İl/Türkiye/Open) → yalnız ev ülkesinden rakip;
  **uluslararası** (Satellite/Avrupa/GP/Dünya) → tüm havuzdan çok-uluslu karışık (scope anahtarıyla deterministik).
  Böylece Madrid'li bir çocuk Almanya'daki yerel turnuvada çıkmaz; ancak uluslararası sahada karşılaşır.
- ⚠️ **Yalnız sıfır dünyada etkili** (`if (!aiExists)`): mevcut prod/local'de AI zaten TR tohumlandığı için
  geriye dönük değişmez — temiz başlangıçta (lansman) devreye girer. Canlı veriye zararsız.

### Eklendi (15.10 — ülke genişletme + bot isim havuzu altyapısı)
- **Şehirler yerel/özgün yazıma çevrildi** (geo.ts): München, Warszawa, Beijing, Kyiv, Moscow… (18 ülke, 5'er
  şehir; Latin-dışı → yaygın romanizasyon). Ülke/kıta adları zaten 9 dilde mevcuttu.
- **Ülke-bazlı bot isim havuzları** (`names.ts`): 18 ülke × (~20 erkek + ~20 kadın ad + ~20 soyad) ≈ 1080 isim.
  `firstNamesFor(gender, countryCode)` / `lastNamesFor(countryCode)` — bilinmeyen ülke → TR fallback.
  `generateAiOpponents` artık `countries` havuzu alıyor; her AI'da `countryCode`. **Varsayılan TR → mevcut
  davranış korunur** (dünya hâlâ TR; çok-ülkeli tohumlama ayrı adım).

### Eklendi (14.10 — Çince (zh) dil desteği TAM — 9. dil)
- **Çince (`zh`, 简体) eklendi ve tam:** 617 anahtarlık ZH arayüz (TR paritesi, `DICT.zh`); maç anlatımı
  (havuzlar+satır-içi+careerService); sözlük ZH; ekipman (22 ürün); tarih `zh-CN`. Eskrim terimleri Çince
  (花剑/重剑/佩剑, 防守, 还击, 击打, 弓步, 飞刺, 转移…).
- **Oyun artık 9 dilde TAM:** TR/EN/DE/FR/ES/IT/RU/PT/ZH — arayüz + maç anlatımı + sözlük + ekipman, hepsi
  birbirine paritede (0 eksik).

### Eklendi (14.10 — Portekizce (pt) dil desteği TAM — 8. dil)
- **Portekizce (`pt`) eklendi ve tam:** 617 anahtarlık PT arayüz (TR paritesi, `DICT.pt`); maç anlatımı
  (havuzlar+satır-içi+careerService); sözlük PT; ekipman (22 ürün); tarih `pt-BR`. Eskrim terimleri Portekizce
  (florete/espada/sabre, parada, resposta, batida, afundo, flecha, desengajamento…).

### Eklendi (14.10 — Rusça (ru) dil desteği TAM — 7. dil)
- **Rusça (`ru`) eklendi ve tam:** `Locale`/`LOCALES`/`LABEL` + 617 anahtarlık RU arayüz (TR ile birebir parite,
  `DICT.ru`); maç anlatım havuzları + satır-içi satırlar + careerService Rusça; sözlük RU bölümü; ekipman adları
  (22 ürün); tarih yereli `ru-RU`. Eskrim terimleri Rusça (рапира/шпага/сабля, защита, ответ, батман, выпад, флеш…).
- Altyapı: anlatım havuzları + `pickLoc` esnek hale getirildi (`Partial<Record<Locale,...>>` + TR fallback) →
  yeni dil artık "sadece ekleme", her çağrı yerini elle gezmek gerekmiyor.

### Düzeltildi (14.10 — kenar yüzeyler de 6 dilde: hata sayfası + ülke/kıta adları)
- **Hata sayfası (`error.tsx`) 6 dile çevrildi** — artık çökme ekranı dil çerezine göre (TR/EN/DE/FR/ES/IT);
  `error.*` anahtarları eklendi (dil istemcide çerezden okunur).
- **Ülke ve kıta adları çevrildi** (`country.*`, `continent.*` — 17 ülke + 4 kıta × 6 dil). Klasman filtresi
  artık "Italy/Italie/Italia…" gösteriyor (önce ham Türkçe "İtalya"ydı); kayıt ekranındaki ülke de `t()`'den.
- Not: Şehir adları ve AI oyuncu/antrenör adları Türkçe (proper noun — tasarım; uluslararası isim havuzu V2).

### Düzeltildi (14.10 — 6 dilde arayüz TAM: hiçbir dilde Türkçe'ye düşen metin kalmadı)
- **EN'de eksik 21, DE'de eksik 12 anahtar** (olay anı/podium satırları + EN'de settings/gecmis/klasman/turnuvalar)
  çevrilip eklendi → 6 dilin hepsi TR ile birebir parite (0 eksik, 0 tekrar). Olay anları (podium) artık 6 dilde.
- **Ekipman (mağaza) adları 6 dile çevrildi.** Katalogda tek Türkçe ad/açıklama vardı (diğer diller Türkçe'ye
  düşüyordu, silaha-özel ürünlerde İngilizce bile); `equipment.ts`'e yerel ad/açıklama tablosu (`ITEM_I18N`) +
  `itemName`/`itemDesc` eklendi, mağaza sayfası ona bağlandı. 22 ürün × 5 dil (TR katalog fallback).

### Eklendi (14.10 — İtalyanca dil desteği TAM (UI + maç anlatımı + sözlük))
- **İtalyanca (`it`) 6. dil olarak eklendi ve tam.** `Locale`/`LOCALES`/`LOCALE_LABEL`'a `it` eklendi; 590
  anahtarlık İtalyanca UI sözlüğü (TR ile birebir parite, `DICT.it = IT`); combat havuzları + satır-içi maç
  satırları + careerService İtalyanca; sözlük İtalyanca bölümü; tarih yereli `it-IT`. Eskrim terimleri İtalyanca
  (fioretto/spada/sciabola, parata, risposta, cavazione, battuta, affondo, frecciata, presa di ferro, rimessa…).
- Durum: **6 dil (TR/EN/DE/FR/ES/IT) UI + maç anlatımı + sözlük → hepsi TAM.**

### Eklendi (14.10 — İspanyolca + Almanca maç anlatımı; İspanyolca sözlük)
- **İspanyolca ve Almanca maç anlatımı tamamlandı.** combat havuzlarına (`ACTION_LINES`, `TOUCH_LINES_BY_TEMPO`,
  `REF_EVENTS_BY_WEAPON`) `de` ve `es` eklendi; `narrLocale` 5 dili döndürüyor; `pickLoc` map biçimine geçti ve
  tüm satır-içi maç/periyot/altın-tuş satırları 5 dilde. careerService canlı maç satırları da DE/ES.
- **İspanyolca sözlük bölümü** eklendi (`glossaryFor` es).
- Durum: **UI + maç anlatımı + sözlük → TR/EN/DE/FR/ES hepsi TAM.**

### Eklendi (14.10 — İspanyolca arayüz (UI) çevirisi)
- **İspanyolca (`es`) arayüzü tam çevrildi** (590 anahtar, TR ile birebir parite; `DICT.es = ES`).

### Eklendi (14.10 — Fransızca dil desteği TAM (UI + maç anlatımı + sözlük))
- **Fransızca (`fr`) artık tam çevrili.** Arayüzün 590 metni Fransızca'ya çevrildi (`src/i18n` → `FR` sözlüğü,
  anahtar paritesi TR ile birebir), `DICT.fr` TR fallback'inden gerçek FR'ye geçti.
- **Maç anlatımı Fransızca:** combat anlatım havuzları (`ACTION_LINES`, `TOUCH_LINES_BY_TEMPO`,
  `REF_EVENTS_BY_WEAPON`) + tüm satır-içi maç/periyot/altın-tuş satırları FR'ye açıldı (`narrLocale` + `pickLoc`
  yardımcısı); eskrim terimleri Fransızca aslıyla (fente, flèche, battement, dégagement, coupé, appel, prise de
  fer, remise, riposte, contre-attaque…). Canlı insan maçı (careerService) periyot satırları da FR.
- **Sözlük sayfasına Fransızca bölüm** eklendi. Tarih yerelleri FR'de `fr-FR`.
- Durum: **TR/EN/DE/FR tam**; **ES hâlâ TR'ye düşüyor** (sıradaki iş). DE'nin maç anlatımı hâlâ TR'ye düşüyor
  (ayrı iş). Not: dünya-saati tarih etiketlerinin bir kısmı hâlâ TR biçiminde (GMT kuralı, ayrı konu).

### Değişti (14.10 — maç anlatımı Türkçeleştirildi; terimler resmi sözlükten (playtest))
- **Türkçe maç anlatımındaki parantez-içi yabancı terimler kaldırıldı** ("parad altı (sixte)" → "parad altı",
  "baş kesme (tête)" → "baş kesme", "açı vererek (angulation)" → "açı vererek", corps-à-corps → "vücut teması",
  flash → "lamba yandı" vb.).
- **Eskrim terimleri Türkiye Eskrim Federasyonu resmi sözlüğünden alındı** (eskrim.org.tr, Fransızca–Türkçe):
  **bate** (battement), **kupe** (coupé), **fleş** (flèche), **degaje** (dégagé), **apel** (appel),
  **priz de fer** (prise-de-fer), **römiz** (remise), **kontr atak** (stop-hit). Ayrıca **parad→parat** ve
  **riposta→ripost** sözlük yazımına uyduruldu. `feint` (oyun sahibi kararıyla) yerleşik terim olarak korundu.
  Sadece **TR** havuzu değişti; EN dokunulmadı (Fransızca/Almanca dil desteği geldiğinde yabancı terimler o
  dillerde yaşayacak).

### Eklendi (14.10 — oyun içi sözlüğe eskrim terimleri)
- **Sözlük sayfasına** (`/kariyer/sozluk`) maç anlatımında geçen eskrim terimleri eklendi: Hamle, Fleş, Feint,
  Bate, Degaje, Kupe, Apel, Priz de fer, Römiz, Uzatılmış Kol, Vücut Teması (her biri Fransızca/İngilizce aslıyla).
  TR "Riposte" başlığı "Ripost" olarak düzeltildi. **İngilizce ve Almanca sözlüğe de** aynı terimler eklendi
  (Lunge/Ausfall, Flèche, Feint/Finte, Beat/Battuta, Disengage/Degagement, Cut-over/Coupé, Appel/Appell,
  Prise de fer, Remise, Point in line, Corps-à-corps). (es/fr hâlâ TR'ye düşüyor — henüz ayrı çeviri yok.)

### Eklendi (12.10 — maç içi HAKEM olayları (sayı getirmeyen; playtest))
- **Maç akışına hakem olayları** eklendi (tempo/iptal turlarında, sayı getirmez): **"flash geldi ama hakem geçersiz
  saydı"**, **vücut teması (corps-à-corps)**, **çift lamba — öncelik yok**, **ayak çaprazı** (kılıç), **sarı kart**,
  "uç piste değdi" vb. Silaha göre (epede corps-à-corps serbest ama durdurur; kılıçta corps-à-corps/çapraz yasak).
  Sıklık gerçekçi: **epe ~1/maç, flöre/kılıç ~3/maç** (öncelik silahlarında hakem durması daha sık). Ayrı RNG →
  maç sonucu/skoru ETKİLENMEZ (yalnız anlatım zenginleşir). Hem havuz hem eleme maçlarında.

### Düzeltildi (12.10 — U10 KURAL DÜZELTMESİ: 2 periyot (geri alındı))
- **U10 eleme yeniden 2 PERİYOT** (10 tuş; 1. periyot 3 dk veya 5 tuşta biter, sonra 10'a) — USA Fencing gençler
  (SYC) kuralıyla doğrulandı. Dünkü "U10 max 3 periyot + tempo ayarı" değişikliği **kurala aykırıydı, geri alındı**
  (`deFormat` U10 3→2, `CATEGORY_TIME_FACTOR` U10 1.45→0.8). U12+ 15 tuş / 3 periyot zaten doğruydu — dokunulmadı.
  (Eskrim terimli anlatım + periyot "başladı/bitti" işaretleri + zamanlama değişiklikleri KALDI — bağımsız.)

### Değişti (12.10 — psikoloji renk + U10 periyot dengesi (playtest))
- **Psikoloji çubukları renklendi:** moral/motivasyon/özgüven **yüksek=yeşil** (trafik); **stres TERS** (yüksek=kırmızı).
  (Başarı rozetleri zaten altın/gümüş/bronz renkliydi.)
- **U10 3. periyot dengesi:** ölçümde U10 eleme maçları **%100 oranında 2 periyotta bitiyordu** (p3 hiç yok). Tuş
  temposu ayarlandı (`CATEGORY_TIME_FACTOR` U10 0.8→1.45) → artık **~%28'i 3. periyoda** gidiyor; çoğu 2 periyot,
  hepsi hâlâ 10 tuşa ulaşıyor. Pul zaman-kutulu olmadığından (hep 5 tuş) etkilenmez.

### Değişti (11.10 — antrenman renk + klasman ilk 4 + maçta "SEN" yazısı → renk (playtest))
- **Antrenman sayfası** kondisyon/form çubukları da trafik lambası renginde (kırmızı/sarı/yeşil).
- **Klasman:** milli takım belirteci **ilk 3 → ilk 4** (3 asil değil; ilk 4 milli takım + Avrupa maçlarına gider) → altın kenar.
- **Maç skor bandında "SEN" yazısı kaldırıldı:** kendi adın **senin rengin (--me)** ile vurgulanır (klasmanla tutarlı,
  "colored font" kuralı). `youLabel` prop'u tüm ScoreBug çağrılarından temizlendi.

### Eklendi/Düzeltildi (11.10 — turnuva şehir adları + gün etiketi düzeltmesi (playtest))
- **Turnuvalarda şehir adı:** **İl** turnuvası artık oyuncunun ŞEHRİNİ gösterir ("U10 **Kocaeli** Şampiyonası" —
  "İl" yerine). **Türkiye/Open/Satellite/Grand Prix** turnuvaları o güne göre **deterministik ev sahibi şehir**
  alır ("U10 Türkiye Şampiyonası **· İstanbul**"); herkes aynı şehri görür. Sıradaki kart, yaklaşanlar listesi ve
  sonuç/geçmiş başlıkları şehirli.
- **Düzeltme:** `dayOfWeek` negatif-güvenli yapıldı (dev'de kısa dünya saati sınırında 7-gün şeridi "dayShort.-1"
  gösterebiliyordu; prod'da olmazdı ama savunmacı düzeltme).

### Düzeltildi/Değişti (11.10 — renklendirme + sadeleştirme (playtest))
- **Hata düzeltme:** turnuva seviye rengi (`levelColor`) client modülündeydi, sunucu bileşeni çağırınca Turnuvalar
  sayfası hata veriyordu → saf fonksiyon ayrı `levelColor.ts`'e taşındı (hem sunucu hem istemci kullanır).
- **Kondisyon/Form + kulüp TESİS KALİTESİ çubukları trafik lambası renginde:** düşük **kırmızı**, orta **sarı (amber)**,
  yüksek **yeşil** (`Segments traffic`). Durum yazısı korundu.
- **Kaldırılan açıklamalar:** yeteneklerdeki "Raylar U10 ölçeğinde…", klasmandaki "Kulüp sıralaması/dünya klasmanı V2",
  kulüpteki "Tesis ve antrenörler… (kulüp değiştirme ileride)" notları (gereksiz).
- **Turnuva kartları seviyeye göre renkli:** İl→yeşil, Türkiye→kırmızı, Open→nötr, Satellite→mavi, Avrupa→mor,
  Grand Prix→amber, Dünya Kupası→altın. Kartta hafif arka plan tinti + seviye renkli sol şerit; seviye etiketi (LevelTag) de renkli.
- **Kaldırıldı:** yetenekler altındaki "Raylar U10 ölçeğinde dolar…" açıklaması (gereksiz).

### Eklendi/Değişti (11.10 — eleme çatalı yenileme + maç anlatımı eskrim terimleri + periyot işaretleri (playtest))
- **Eleme çatalı yenilendi (#55):** her maç temiz bir kart — **kazanan kalın/net, kaybeden soluk**; SENİN maçların
  `--me` ile vurgulu (yolunu turlar boyunca izlersin); finalin kazananı **kupa (şampiyon)**. Bay (bye) tabloyu
  ikili-ağaç yapmadığı için sıkı bağlantı çizgisi yerine kart vurgusu (mobil-dostu, bay'a dayanıklı). Ayrı `Bracket` bileşeni.
- **Maç anlatımı EskRİM TERİMLERİYLE zenginleşti:** havuz çok genişletildi (bate/çelme, dégajé, parat-riposta, feint,
  flèche, coupé, appel, angulation, prise-de-fer, point-in-line, arrêt…). **Paratlar numaralı:** flöre/epe **4/6/7/8**
  (quarte/sixte/septime/octave), **kılıç 5 (quinte, baş) + 3 (tierce)**. **U10'a da 2 zamanlı** eklendi (bate/dégajé/parat-riposta
  çocuk maçlarında da çıkar; 3-4'lü uzun diziler U10'da yok). Test yeni kurala göre güncellendi.
- **Periyot işaretleri (#52):** eleme log'unda **"N. Periyot başladı"** (başlık) + **"⏸ N. periyot bitti — X–Y"** satırı.

### Değişti (11.10 — hazırlıkta maçtaki gibi lambalı skor bandı (playtest))
- **HAZIRLIK (podyum) artık ScoreBug gösterir** (maçtaki gibi kırmızı/yeşil lambalı bant): yeni maçta **adın (sol/kırmızı,
  SEN) 0–0 rakip (sağ/yeşil)**, bantta "{tur} · Maç başlıyor"; devre arasında o ana dek skor + "N. periyot başlıyor".
  Rakip belli değilse (eleme bekleniyor) metin. DTO'ya izleyenin adı eklendi (`live.youName`).

### Düzeltildi/Değişti (11.10 — canlı maç spoiler + ekran cilası (playtest))
- **SPOILER düzeltildi (BÜYÜK):** maç sunucuda oynama başında çözülünce sonucu hemen hazır oluyordu → **"Senin
  Maçların"** (geçmiş) ve **eleme çatalı**, podyumda O AN oynanan maçın FİNAL skorunu gösterip animasyonu spoil
  ediyordu. Artık podyumdaki maç, animasyon penceresi bitene (serverNow < playStart+animMs) kadar geçmişte/çatalda
  **gizli** ("oynanıyor"); oynama bitince düşer.
- **Maç anlatımı TERS akar:** son gelen tuş **en üstte** kalır (yeni→eski, yukarıdan aşağı) — kullanıcı tercihi.
- **"Canlı turnuva" + GMT saat rozeti** podyumdan **turnuva başlığının hizasına** taşındı (sağ üst); podyum sadeleşti.
- Eleme çatalından gereksiz **"Yana kaydır"** ipucu kaldırıldı. **Pul sonucu** kartı yeni format ("2)" ön eki kaldırıldı → başlık "Pul Sonucun" + cümle.

### Değişti (11.10 — periyot "pencere başında çözülür": tam sunucu-zaman hizası (kullanıcı modeli))
- **Eleme periyodu artık OYNANMAYA BAŞLADIĞI an çözülür** (önceden periyot sonunda). `liveStepMinute` eleme için
  `turBaşı + (p-1)×1.5` (eski `+1` kaldırıldı) → periyot oynama penceresi **başında** çözülür, istemci 1 oyun-dk
  animasyonla oynatır, **sonuç +1 dk sonra** belli olur. Böylece saat etiketi kullanıcı modeliyle **birebir** hizalanır:
  eleme tur 1 periyotları **18:20–21 / 18:21:30–22:30 / 18:23–24** (oynama pencereleri), aralarda 30 sn taktik.
  Taktik penceresi = oynama başı anı (periyot oynanmadan önce kilitlenir). Havuz zaten böyleydi (maç [5,6]…).
  Testler güncellendi (eleme oynama başları 20/21.5/23). 204 test + build yeşil.
- **Eleme maçı en çok 3 periyot + baraja ulaşınca erken bitiş (motor):** `deFormat` U10 artık **10 tuş / en çok 3 periyot**
  (önceden sabit 2). Maç tuş barajına (U10 10, büyükler 15) ulaşınca **erken biter** → çoğu maç 2 periyotta, yakın/düşük
  tempolu maçlar 3. periyoda gider (büyük yaşlarda daha sık). Erken-bitiş mekanizması zaten vardı; U10'un üst sınırı 3'e çıktı.
- **Periyot/pul maçı TAM 1 oyun-dakikası oynanır** (podyum animasyonu `animMs` 0.7→1.0 oyun-dk). Kalan süre hazırlık/taktik:
  havuzda 1 dk, eleme periyot arası 30 sn → kullanıcının "1 dk oyna, 30 sn taktik" modeline oturur.
- **Zamanlama:** pul sonuçları **T+17 → T+15** (`poolResultsMinute`); **KLASMAN T+16** (sonuç+1 dk), **ELEME ÇATALI T+17**
  (sonuç+2 dk) — kademeli açılış (#43). Eleme turları arası **5 → 6 dk** (`deStepMinutes`: 3 periyotluk maç ~4 oyun-dk + 2 dk ara).
  Turlar: Son 32 T+20 · Son 16 T+26 · Çeyrek T+32 · Yarı T+38 · Final T+44.

### Eklendi/Değişti (11.10 — #51 PODYUM aşama modeli + turnuva ekranı düzeni (NOTLAR #49/#50/#51/#52/#44))
- **Podyum (#51):** canlı turnuva ekranının üstünde tek **podyum** (`LivePodium`) — sunucu-zamanına göre **OYNAMA**
  (o an akan maç + hangi periyot) ↔ **HAZIRLIK** (sıradaki maç/periyot + taktik + geri sayım) arasında geçer.
  Taktik artık ayrı panelde değil, **podyumda akan/sıradaki maça ait**. Podyumun altında tek **"Sıradaki: X"** satırı
  (elemede sonuç sızmasın diye maç bitene dek gizli). "Olay anı" yerine o an NE olduğu yazılır ("Pul maçları devam
  ediyor" / "{tur} · {p}. periyot oynanıyor"). Devre arasında **tur + o ana dek skor + "N. periyot başlıyor"** gösterilir.
- **Biten maç geçmişe düşer (#49):** oynama bitince maç podyumdan düşüp **"Senin Maçların"** (katlanır) bölümüne iner;
  podyum sıradaki hazırlığa geçer. **Pul maç etiketi (#50):** "Pul 1" → **"Pul 1 · N. maç"** (havuz-içi sıra).
- **Klasman + eleme çatalı açılır-kapanır (#44):** ikisi de katlanabilir ayrı bölümler; düzen **eleme çatalı → pul
  sonucu/bay bilgisi → turnuva klasmanı**. Bay netliği: bay geçtiysen + ilk eleme rakibin belli değilse
  "önceki tur sonuçları bekleniyor" bilgisi.
- **Ekran sadeleştirme:** başlık altına **turnuva tarihi** (saat zaten podyumda), üstteki "Kariyere dön" linki kaldırıldı
  (altta buton zaten var), taktik gönderim geri bildirimi tek satır (çift "gönderildi" düzeltildi).

### Değişti (11.10 — canlı maç animasyonu SUNUCU-ZAMAN senkronu (NOTLAR #45/#49/#54 çekirdeği))
- **Baştan sarma / asılı maç / replay kökten çözüldü (#45/#49):** canlı "podyum" maçının animasyonu artık
  istemcinin mount anından değil **sunucu saatinden** sürer. Açılan satır sayısı `now`'ın saf fonksiyonudur:
  `reveal = floor + ((now − playStart) / animMs) × kalan satır`. Sayfa tazelense/otomatik-yenilense/remount olsa da
  animasyon **doğru noktaya oturur** (sıfırlanmaz); biten maç (`now ≫ playStart + animMs`) anında tam açılır —
  yeniden oynamaz. Canlı doğrulandı (yerel offline test).
- **Spoiler azaldı (#54 çekirdeği):** oynarken yalnız o ana kadarki **canlı skor** gösterilir, final skor oynama
  bitene kadar sızmaz (çapa sunucu-zamanlı olduğundan tüm izleyiciler aynı anı görür).
- Sunucu, podyum maçının çapasını (`playStartAt` + `animMs`) `getTournament` canlı DTO'sunda verir (podyum maçı =
  o an oynanan/son çözülen senin maçın; animasyon süresi 1 oyun-dakikası, dünya saati kısaysa orantılı kısa).

### Değişti (11.10 — canlı turnuva yazım katmanı Prisma'ya taşındı; yerel offline test ortamı)
- **Prod sağlamlaştırma + offline test:** canlı turnuvanın toplu `UPDATE ... FROM (VALUES …)` ham SQL blokları
  (Postgres'e özel `::cast`, `v(…)` kolon adı, `NOW()`) **Prisma tipli update'lere** çevrildi. Tek kod yolu artık
  hem Postgres (prod/Neon) hem SQLite (yerel) çalışır; her canlı adımda yalnız birkaç satır güncellendiği için
  performans farkı ihmal edilebilir. Advisory lock (`pg_advisory_xact_lock`) yalnız Postgres'te çalışır; SQLite'ta
  (tek bağlantı, serialize) atlanır. Davranış/sonuç aynı — 204 test yeşil.
- **Yerel offline test ortamı:** ayrı SQLite DB (`prisma/dev-local.db`, `.gitignore`'da) + kısaltılmış dünya saati
  ile canlı turnuva uçtan uca iterasyon yapılabilir (prod verisine dokunmadan). `datasource provider` yereli
  çalıştırırken geçici `sqlite`, commit/prod'da `postgresql` (Prisma 7 adapter ile şema sağlayıcısı eşleşmeli).

### Kaldırıldı (06.10 — Bugün sayfası sadeleştirildi, NOTLAR #38)
- Bugün ekranından (`/kariyer`) çıkarıldı: **"Son başarılar" şeridi**, **"Bugün · antrenman/turnuva" aktivite
  bölümü**, **"Sıradaki turnuva" kartı**. **"Önümüzdeki 7 gün" şeridi** kaldı — zaten bugünkü etkinliği +
  sıradaki turnuvayı gösterdiği için diğerleri gereksiz tekrardı. Kimlik kartı, kondisyon/form, yetenek
  radarı, "sen yokken" raporu aynen duruyor.

### Değişti (07.10 — turnuva saati GMT etiketi + ölü kod temizliği)
- **Yaklaşan turnuva kartları** artık saat yanında **"GMT"** etiketi gösterir ("8 Ekim Perşembe 18:00 GMT")
  → sıradaki turnuva kartıyla tutarlı, oyuncu saati yerel sanmaz (NOTLAR #19).
- **Ölü kod kaldırıldı:** `RecentAchievements.tsx` bileşeni + `getRecentAchievements`/`RecentAchievementDTO`
  (Bugün sayfası sadeleştirmesinden #38 sonra hiçbir yerde kullanılmıyordu). Davranış değişmez.

### Eklendi/Değişti (08.10 — taktik penceresi genişletildi + turnuva klasmanı + aşamalı çatal (NOTLAR #43/#44/#45))
- **Periyot arası taktik penceresi genişletildi (#45):** 30 sn çok kısaydı → pencere artık **tüm periyot dilimi**
  (periyot çözülene kadar taktik set/değiştir edilebilir). Panel üstte olduğundan kolay yakalanır.
- **Turnuva klasmanı / seeding tablosu (#44):** pul bitince tüm oyuncuların **seed sırası + G-M + averaj** listesi
  gösterilir (kendi satırın vurgulu); eleme öncesi "diğerleri ne yapmış" verisi.
- **Aşamalı açılış (#43):** pul bitince önce **klasman**, ~**30 sn sonra eleme çatalı** görünür (o aralıkta oyuncu
  klasmanı inceler). Dev'de dünya günü kısaltılınca süre orantılı kısalır.

### Değişti (08.10 — turnuva ekranı canlı düzen + canlı maç oynatma yeniden (NOTLAR #41/#42/#45/#46/#47/#48))
Canlı turnuva ekranı (`/turnuva/[id]`) 2b canlı test geri bildirimlerine göre yeniden düzenlendi:
- **Canlı düzen (podyum):** üstte **olay anı** (taktik paneli + o an oynanan maç), ortada **klasman/bay bilgisi +
  eleme çatalı**, en altta **katlanır pul kağıtları + geçmiş maçlar** (ekran sadeleşir). Eski "en altta çatal,
  üstünde pul" ters düzeni düzeltildi. Bitmiş turnuvada inceleme düzeni korundu.
- **"Baştan sarma" bitti:** o an oynanan maç tek üst blokta **stabil React key** + `instantThrough` ile gösterilir →
  sayfa tazelenince (4 sn) animasyon sıfırlanmıyor; eleme maçında **önceki periyotlar anında**, yalnız o anki periyot
  satır satır akar. Olay anı + taktik paneli üstte olduğu için tazeleme "başa atsa" da oyuncu ilgili yerde kalır.
- **Tempo:** maç ~50 sn'ye yayıldı (satır başına 1.8–3.8 sn) — daha okunur.
- **Kaldırıldı:** canlı maçtaki "Hızlı"/"Atla" düğmeleri + biten maçtaki "Tekrar izle" (biten maça "Skor detayı"
  yeterli).
- **Bay (bye) bildirimi:** üst sırada bitip 1. turu atlayan oyuncuya bayrak + vurgu rengiyle açık bilgi.
- Not: pul sonrası +30sn aşamalı açılış (#43) ve tam seeding tablosu (#44) sonraki adıma bırakıldı; taktik
  penceresinin 30 sn'de yakalanması yeni düzende test edilecek.

### Düzeltildi (07.10 — bitmiş turnuva offline dönen oyuncuya "CANLI" görünüyordu)
- Offline (örn. 4-5 gün) dönen oyuncuya, canlı penceresi çoktan kapanmış bir turnuva ana ekranda **"CANLI /
  turnuvaya gir"** olarak gösteriliyordu (özellikle GMT gece yarısı–18:00 arası: `eventDay` hâlâ dünkü turnuva).
  Üstelik `canAttend=true` olduğu için otomatik senkron (`AutoAdvance`) hiç çalışmıyor, hesap o ekranda **takılı**
  kalıyordu. Artık turnuva **canlı penceresi** (18:00 GMT + ~110 dk) kapandıysa "CANLI" gösterilmez; kayıtlıysan
  turnuva otomatik oynanıp sonucu **"sen yokken"** raporuna düşer (antrenman gibi), Geçmiş'ten açıp bakarsın.
  `isLive` artık `gün === eventDay && canlı pencere açık` (sunucu, `tournamentStillLive`). Bir dahaki açılışta
  takılı hesaplar kendiliğinden çözülür.

### Eklendi (07.10 — "Kendi rengin": kişiye özel vurgu rengi)
- **Ayarlar → Görünüm'e "Kendi rengin" eklendi** (serbest renk seçici + önizleme + kontrast uyarısı,
  localStorage, no-flash boot). Klasman, turnuva sıralaması, Milli Takım ve pul kağıdında **kendi adın +
  "sen" satır kenarı** artık bu renkte. Yeni `--me` CSS değişkeni (varsayılan = sig-red kırmızısı) tüm
  "sen" göstergelerini tek yerden sürüyor; seçilen renk her iki temada geçerli. Tema renk sistemiyle aynı desen.

### Değişti (07.10 — kendi adın "SEN/(sen)" etiketi yerine renkli font)
- Klasman, turnuva final sıralaması ve Milli Takım listelerinde oyuncunun **kendi adı artık "(sen)"/"SEN"
  etiketiyle değil, kendi renginde (varsayılan kırmızı) + kalın fontla** ayırt ediliyor (satır kenarıyla uyumlu).
  Daha temiz görünüm; metin tekrarı kalktı.

### Eklendi (07.10 — Milli Takım sayfası)
- Profildeki **"Milli Takım" rozeti artık tıklanabilir** → `/kariyer/milli`. Milli takım = kategori Quarter
  Ranking **ilk 4**'ü (tek kaynak `NATIONAL_TEAM_SIZE`). Sayfa kadroyu **overall reytingleriyle** gösterir
  (milli oyuncuları yakından tanı), sen vurgulu.
- **Kategori filtresi** (Klasman'daki gibi yaş/silah/cinsiyet çipleri): başka kategorilerin milli takımlarına
  da bakılır. `getNationalTeam(categoryId)` + `getNationalTeamAction`.

### Değişti (07.10 — kariyer geçmişi: Q·H etiketleri → gerçek tarih, NOTLAR #22)
- Geçmiş turnuva satırı, kariyer zaman çizgisi, kupa vitrini "son kazanım" ve "sen yokken" (away) turnuva
  etiketi artık **gerçek takvim tarihini** (GMT) gösteriyor; "Q1 · H3" kalktı. `worldDay` yoksa (eski kayıt)
  oyun-içi `date`e düşer → asla bare "Q" yazmaz (NOTLAR #22: gösterim = gerçek takvim tarihi).
- Turnuva filtresi çipleri (Q = oyun yılı) artık **takvim yılını** içerir ("2026 · Q1") → yıllar geçince
  hangi dönem olduğu belirsiz kalmaz. Q ile filtreleme korundu; Q mekanik olarak arkada (gösterimde yok).

### Eklendi (07.10 — turnuva canlı oynatma, Aşama 2b: eleme periyot-periyot + periyot arası taktik)
> **Şema eklemeli:** `Match.deState` (TEXT, nullable) → squash'tan ÖNCE prod'a
> `npx prisma db execute --file prisma/migrations/20261007120000_match_destate/migration.sql` (uygulandı 07.10).
- **Eleme maçı artık periyot periyot çözülüyor** (`liveTournament`): her eleme turu `dePeriods` (3 / U10 2) alt-adıma
  bölünür; her alt-adım bir periyodu çözer. Kilitli kadans (NOTLAR #39): **1 periyot ~1 dk, periyot arası 30 sn**
  (`LIVE_SCHEDULE.dePeriodMinutes`/`dePeriodBreakMinutes`). Kombat simülasyonunun kendi periyodu FIE gerçekçiliği için
  3 dk kalır — bu yalnız gerçek-dünya tempo/pencere ayarıdır.
- **Periyot arası taktik penceresi:** oyuncu maç başında + her periyot arasında (30 sn) taktik değiştirebilir; pencere,
  periyodun OYNANMAYA başladığı an kapanır (`liveStepWindowClose*`). Panelde başlık "N. periyot taktiği" olur.
- **Devam eden eleme maçı canlı izlenir:** periyotlar açıldıkça log/skor büyür; `CanliMac` yeni satırları akıtır
  (maç bitmeden periyot periyot görünür). Devam eden maçın durumu `Match.deState` (DeBoutState JSON) ile saklanır.
- **Determinizm güvencesi:** combat'ta paylaşılan `advanceDeBoutPeriod` çekirdeği — her periyotta aynı taktik verilirse
  periyot-adım çözüm, atomik `simulateBoutByPeriods` ile BİREBİR aynı sonucu verir (testle kanıtlı).
- Testler 204/204 (eleme periyot determinizmi + periyot arası taktik + uçtan uca yeni).

### Değişti (07.10 — turnuva canlı oynatma, Aşama 2a: tempo)
- Canlı maç artık **okunabilir tempoda ~1 dk'ya yayılıyor** (`CanliMac`): satır başına açılma süresi log
  uzunluğuna göre hesaplanıp 1.2–3 sn arasına sıkıştırılıyor (kullanıcı geri bildirimi: "yazılar çok hızlı
  geldiğinde sıkıntı"). "Hızlı" düğmesi hâlâ 250 ms'e indiriyor. Sonuç artık cat diye patlamıyor, izleniyor.

### Kaldırıldı (07.10 — geçmiş maçta "Canlı izle", NOTLAR #39)
- Bitmiş/geçmiş maçta **"Canlı izle" (replay) düğmesi kaldırıldı** (`CanliMac`): geçmiş maç = gitmiş maç,
  gereksiz yere motoru/animasyonu yormaz. Geçmiş maçta artık yalnız **skor + "Skor detayı"** (tuş-tuş döküm)
  var; detay düğmesi tam genişlik tek buton oldu. Canlı maç izleme aynen duruyor.

### Eklendi (06.10 — turnuva canlı oynatma, Aşama 1)
- Canlı turnuvada oyuncunun **en yeni maçı artık otomatik CANLI akar** (`CanliMac` autoPlay): tuş-tuş
  anlatım, skor bandında lamba flash (kırmızı/yeşil/beyaz) + tuş efekti — sonuç anında patlamak yerine
  izlenir. Önceki maçlar durağan sonuç (past) gösterir. (Sunucu çözümü değişmedi; yalnız gösterim.)
  Sıradaki: eleme maçında periyot-periyot taktik penceresi (Aşama 2b — sunucu motoru değişikliği).

> ✅ **30.09.2026 — B Faz 0+1 canlıda.** Şema göçü Yusuf tarafından prod'a uygulandı, PR #41 merge edildi.
> Canlı turnuva artık sunucu-otoriteli. Ayrıntı: DEVIR.md Karar günlüğü.

### Eklendi (06.10 — Bugün ekranı cilası, GORSEL_ETKILESIM #4)
> Dal + PR #48 (#47'nin üstüne; şartname `docs/GORSEL_ETKILESIM.md` §8). **Şema eklemeli:**
> `GameState.skillQuarterBase` → squash'tan ÖNCE prod'a
> `npx prisma db execute --file prisma/migrations/20261006210000_skill_quarter_base/migration.sql`.
- **Büyük profil başlığı:** baş-harf rozeti, isim, silah · kategori · yaş, kulüp, sağda büyük reyting (reyting artık
  değer kutularında tekrar edilmez; kondisyon + form kaldı).
- **Yetenek radarı:** 10 alt yetenek ekseni; dolu alan = şimdi, kesikli = geçen çeyrek, büyüyen eksende yeşil "+N"
  (tam sayıya yuvarlı). Ölçek yetenek çubuklarıyla aynı yaş bandı. Geometri saf ve testli (`src/app/ui/radar.ts`).
- **Geçen çeyrek verisi:** her çeyreğin ilk işlenen gününde yetenekler antrenmandan önce dondurulur
  (`src/engine/skill/quarterBase.ts`, testli); mevcut oyuncularda ilk kayıt güncellemeden sonraki ilk gün ilerlemesinde.
- **Form/kondisyon ışıltısı:** değer ≥ %70 iken dolu çubuk parçaları yavaşça parlar; hareketi azalt açıkken yok.
- **Son başarılar şeridi** (sayfanın üstünde): en yeni 6 rozet, vitrinle aynı rozet dili (ortak
  `src/app/ui/achievementBadge.ts`); son 3 günde kazanılan "Yeni" etiketli, diski kısa bir halka parıltısıyla açılır.
- Testler 199/199 (radar geometrisi + çeyrek başı kaydı yeni). Yerelde uçtan uca: gün ilerleyince çeyrek başı
  değerleri kaydedildi; telefonda koyu/açık temada kontrol edildi.

### Eklendi (06.10 — Kupa vitrini + kariyer zaman çizgisi, GORSEL_ETKILESIM #3)
> Dal + PR #47 (#46'nın üstüne; Yusuf'un şartnamesi `docs/GORSEL_ETKILESIM.md` §7). **Şema eklemeli:**
> `Achievement.worldDay` → squash'tan ÖNCE prod'a
> `npx prisma db execute --file prisma/migrations/20261006190000_achievement_worldday/migration.sql`.
- **Kupa vitrini** (Kariyer Geçmişi'nin en üstü): şampiyonluk, altın/gümüş/bronz madalya, milli takım, klasman 1.liği
  rozetleri — her biri kaç kez (×N) + son kazanımın tam tarihi; kazanılmamışlar gri yuva; üst kademe hedefleri (Avrupa
  Şampiyonası, Dünya Kupası, Olimpiyat) kilitli. Metal renkleri şartnamedeki gibi (`--metal-*`, tema değiştirmez).
- **Kariyer zaman çizgisi:** başarılar eskiden yeniye; her düğüm GMT tam tarih + olay + ikon; ilk şampiyonluk, milli
  takım, klasman 1.liği "Dönüm noktası" etiketli; sonda "Sırada: …" (ulaşılmamış ilk kariyer basamağı). Önem yıldızlı
  eski "Başarılar" listesi kalktı.
- **Tarih:** yeni başarılar kazanıldığı dünya gününü yazar (canlı turnuva + eski yol); eski kayıtlarda çeyrek (Q).
  "Turnuvalarım" da oyun-içi takvim tarihi yerine turnuvanın dünya gününden GMT tarihini gösterir.
- İkon setine bayrak + taç; başarı adları çevriliyor (TR/EN/DE). Saf hesap `src/app/ui/showcase.ts` (6 test, toplam
  193/193). Yerelde uçtan uca: turnuva bitince yeni başarı `worldDay` ile yazıldı, sayfada GMT tarihiyle göründü.

### Eklendi (06.10 — Kutlama efektleri, GORSEL_ETKILESIM #2)
> Dal + PR #46 (Yusuf'un şartnamesi: `docs/GORSEL_ETKILESIM.md` §6; `master`'a push/deploy yok). **Şema yok, motor
> değişmedi, prod DB adımı yok** — hepsi istemci + saf CSS, kütüphane yok. B Faz 2-4'ün üstüne kurulu.
- **Tuş:** canlı anlatımda tuş düşünce o tarafın lambası büyüyüp hale saçar, skor rakamı sıçrar, rakamın omzundan
  **"+1"** yükselir (sol kırmızı / sağ yeşil; epede çift tuşta iki taraf), skor bandı hafif titrer (`ScoreBug` `hitFx`).
  Giriş ekranındaki duran örnek bant değişmedi.
- **Beyaz lamba:** `⚪` satırı açılınca hedef dışına dokunan sporcunun beyaz lambası bandın pist ortasına bakan ucunda
  yanar, **skor artmaz**; iki tarafta da olabilir. Taraf, motor satırındaki addan bulunur (`whiteLampSide`, testli:
  "Ali" / "Ali Kaya" gibi önek adlarda uzun ad kazanır, aynı adda lamba yanmaz).
- **Canlı izle:** `/turnuva/[id]`'de kendi maçlarında "Canlı izle" + "Skor detayı" yan yana — biten maç skor bandıyla
  satır satır yeniden oynar (tuş efektleri burada görünür), bitince "Tekrar izle / Kapat". SEN etiketi doğru tarafta.
- **Madalya (2.–3.):** sonuç kartından konfeti patlaması. **Şampiyonluk:** tam ekran katman — kupa kartı yaylanarak
  açılır, "Şampiyon" yazısı, bol konfeti (patlama + yağmur); ~3 sn sonra kendiliğinden kalkar, dokunmayı engellemez.
  Konfeti renkleri eskrim lambaları + altın (`Celebration` → `HeadlineCard`: yeni ve eski sonuç ekranı).
- **"+X" kazanım:** "Sen yokken" antrenman raporunda skill kazanım rakamları sırayla yerine süzülür.
- **Erişilebilirlik:** yeni hareketlerin hepsi `globals.css`'teki tek hareket bloğunda (`prefers-reduced-motion:
  no-preference`); şenlik öğelerinin taban hali görünmez → hareketi azalt açıkken "+1", konfeti, kupa katmanı hiç belirmez.
- Ses eklenmedi (şartnamede opsiyonel; GORSEL §5 "ses varsayılan açık mı?" kararı bekleniyor). Testler 187/187
  (`whiteLampSide` + madalya işareti yeni).

### Eklendi (06.10 — B Faz 2-4: canlı turnuva TUR TUR, taktik pencereleri, canlı panel, ölçek)
> ⚠️ **Dal + PR (Yusuf'un şartnamesi, teslim kuralı):** `master`'a push/deploy yok; Yusuf squash edip alır.
> **Şema eklemeli** — merge'den ÖNCE prod'a `npx prisma db push` (bkz. DEVIR.md).
- **Faz 2 — tur tur çözüm (kilitli çizelge, T = 18:00 GMT):** turnuva artık tek seferde hesaplanmıyor. T+0'da
  havuzlar çekilir (en çok **6 kişi/havuz**, havuz sayısı katılımcıya göre; havuz-içi round-robin en çok 5 tur),
  havuz turları **T+5/7/9/11/13**'te, havuz sonuçları + eleme tablosu **T+17**'de, eleme turları **T+20'den 10 dk'da
  bir** finale kadar sunucuda çözülür. Her maçın kendi tohumu var (turnuva anahtarı + aşama + tur + yer) → kim,
  ne zaman, kaç kez çözerse çözsün aynı sonuç; iki tarayıcı birebir aynısını görür. Oyuncu anlık görüntüsü
  (skill/kondisyon/form) çekimde DB'ye yazılır, turnuva boyunca ondan oynanır.
- **Taktik penceresi:** oyuncu, **sıradaki kendi maçı** için önceki turun çözümünden bu turun çözümüne kadar
  taktik gönderir (havuzda ~2 dk, elemede 10 dk; ilk eleme penceresi 3 dk). Göndermeyen yedek kaynakla oynar:
  **kayıtlı taktik → son kullanılan → Dengeli**. Taktik seti combat motorundaki üçlü (yeni taktik yok).
- **Başlangıç-öncesi taktik (06.10 kuralı):** kayıtlı oyuncu o günün turnuvası için taktiğini **18:00 GMT'ye kadar**
  değiştirebilir ("Yaklaşan turnuvalar"da bugün de listelenir; "Sıradaki turnuva" kartında "Taktiği değiştir").
  Yeni kayıt yine gün-00:00'da kapanır; 18:00'dan sonra değişiklik reddedilir (tur pencereleri devralır).
- **Faz 3 — canlı panel (`/turnuva/[id]`):** sıradaki adım + saniye saniye geri sayım (sunucu saatine göre),
  sıradaki maçın/rakibin, açıkken etkin kapalıyken kilitli taktik formu, "göndermezsen: …" bilgisi, bay/elendin
  durumları. Sayfa **4 sn'de bir** sunucudan tazelenir, geri sayım bitince hemen; manuel "geç/oyna" yok. Pul
  kağıtları ve eleme çatalı çözüldükçe dolar (eşleşmeler isimleriyle, skor maç çözülünce).
- **Faz 4 — ölçek + sağlamlık:** sert oyuncu tavanı yok (ölçek = kategori-bazlı paralel turnuvalar); tek turnuva
  saha hedefi `MAX_FIELD = 256` (büyütülebilir sabit). Tur çözümü **toplu DB yazımı** (tek `UPDATE … FROM VALUES`),
  turnuva başına **Postgres advisory lock + `step` koşullu güncelleme** → eşzamanlı istekler aynı turu iki kez
  çözmez. Taktik gönderimi **doğrulanır** (GDD 23.57: geçerli taktik + katılımcı + sürüyor + sıradaki adımda kendi
  maçı + pencere açık), **istek sınırı** (23.58: 60 sn'de 10) ve her deneme **olay kaydı**na yazılır (23.59:
  `TournamentEvent` — çekim, adım, taktik, red, final).
- **Saf motor:** `src/engine/tournament/live.ts` (çekim, round-robin, eleme tablosu, adım çözümü, başsız
  simülasyon) + `src/engine/schedule` `LIVE_SCHEDULE`. **Sunucu:** yeni `src/server/liveTournament.ts`
  (ROADMAP R5: careerService'ten ayrı modül). B Faz 1'in anında-çöz + görünürlük gecikmesi kaldırıldı
  (`resolveScopedTournament` + stagger); eski (Faz 1) turnuvalar okunmaya devam eder.
- **Gün akışı:** turnuva sürerken oyuncu turnuva gününde kalır (izler/taktik verir); bitince "Kariyere dön" ya da
  sonraki "Turnuvaya Gir" günü ilerletir. Kayıtsız girip sahada oynayan oyuncunun günü de kayıtlı gibi kapanır
  ("yokken" özeti dahil, ayrıca antrenman uygulanmaz).
- **Testler:** +14 (`live-tournament.test.ts`): kadans, max-6 havuz, round-robin, deterministik çekim, bay'lı
  tablo, taktik kaynağı, sabit tohumla "gönderilen taktikle çözülür", **256 kişilik** uçtan uca, iç içe
  koşan paralel turnuvalar, idempotent yeniden çözüm. 183/183 yeşil.
- **Yerel uçtan uca (gerçek tarayıcı + PGlite, çizelge 1/4 hızda):** başlangıç-öncesi taktik değişikliği; kayıtsız
  tetikleyen + kayıtlı oyuncu aynı sahada; arayüzden gönderilen taktik o turun maçında kullanıldı, göndermeyen
  kayıtlı/son taktikle oynadı; 3 eşzamanlı istek bir turu bir kez çözdü; geçersiz/katılımcı-dışı/maçsız taktik
  reddedildi, 10 denemeden sonra istek sınırı devreye girdi.
- **Not:** master'daki CI, `ViewSettings.tsx` lint hatası yüzünden kırmızıydı (effect içinde senkron `setState`);
  `NextTournament`'taki desenle düzeltildi (davranış aynı).

### Değiştirildi (05.10 — oyun zamanı TR saati → GMT dünya saati)
- **Karar (Yusuf):** Oyun zamanı artık **GMT (dünya saati)**. TR saati kullanılmaz; oyuncu bulunduğu
  bölgeye göre kendi yerel saatine çevirir. Gün başı **00:00 GMT**'de döner, günlük etkinlik (turnuva)
  **18:00 GMT**'de olur (önceki 19:00 TR).
- `worldclock.ts`: `EVENT_HOUR = 18`; `WORLD_EPOCH_MS = Date.UTC(2026,8,21,0,0,0)` = `1789948800000`
  (21 Eylül 2026 Pzt **00:00 UTC**). Eski epoch 20 Eylül 21:00 UTC'ydi (00:00 TR çapası); gün sınırı
  +3 saat kaydırılıp 00:00 GMT yapıldı — **dayIndex haftası korundu, canlı kariyerler bozulmadı.**
- Gösterim GMT'ye çevrildi: turnuva saatleri, "sıradaki turnuva" kartı, tarih etiketleri
  (`timeZone: "UTC"`). "TR saati" ibaresi kaldırıldı (`next.trTime` = "GMT"). Kullanıcıya görünen
  "19:00" uyarı metni 18:00 GMT oldu.
- Test: `worldclock.test.ts` artık "etkinlik **18:00 GMT**" + "epoch Pzt 00:00 GMT" pinliyor.
- **Prod aksiyonu:** Vercel env `WORLD_EPOCH_MS = 1789948800000` (kod ile aynı) olmalı — aksi halde
  canlıda saat kayar (bkz. CLAUDE.md §7).

### Eklendi (05.10 — Ayarlar → Görünüm: Klasik / Yatay düzen)
- Mobilde **yatay (landscape) düzen** seçeneği: üstte 4 ince sekme + sağ üstte canlı **GMT saat rozeti**
  (`WorldClockBadge`), altta 5 ince sekme, ortada tam içerik; alt gün çubuğu gizlenir. Tercih `localStorage`'da
  (kişiye/cihaza özel), `<html data-view>` + `vland:` Tailwind varyantıyla **anında** uygulanır (yanıp
  sönmesiz boot script). **Varsayılan Klasik (dikey)** → mevcut oyuncular için hiçbir değişiklik yok.

### Düzeltildi (03.10 — kayıtsız oyuncu "Turnuvaya Gir"e basınca sahaya alınmıyordu)
- **Bulgu (Yusuf, 02.10):** "Turnuvaya gir" görünüyor, tıklanıyor ama içeri girmiyor; "kaydol / canlı / devam
  ediyor" karışık görünüyor; turnuva başladıktan sonra gelen oyuncu giremiyor.
- **Kök sebep (B Faz 1'de benim eklediğim regresyon):** `resolveScopedTournament` alanı yalnız KAYIT
  satırlarından kuruyordu — "çözücü her zaman dahil" yorumuna rağmen çözücü kayıt satırından süzülünce
  kayıtsız oyuncu sahada yoktu. Başka kayıtlı gerçek oyuncu da yoksa alan boş kalıp `null` dönüyor ve
  `attendTournament` hiçbir tepki vermeden günü ilerletiyordu (butona basıyorsun, sayfa yenileniyor,
  turnuva yok, günün gitmiş). Eski canlı akışta (`startLiveTournament`) canlı katılan kayıt aramadan hep
  sahadaydı; ben offline yolun alan kurma mantığını paylaşırken bunu kaybettim. (Test hep önceden
  kaydettiğim oyuncularla yapıldığı için görünmedi.)
- **Düzeltme:** tetikleyen oyuncu artık kayıt şartı olmadan sahaya dahil (kayıtsızsa kendi varsayılan
  taktiği); sahada rakip olamıyorsa gün sessizce harcanmıyor — açık hata. Turnuva kurulduktan SONRA gelen
  kayıtsız oyuncu bracket'e eklenemez (tek gerçeklik): sayfayı **izleyici** olarak açar — "sahada değildin"
  notu, Senin Maçların bölümü ve sahte "sondan birinci" başlığı yok, şampiyon + klasman görünür
  (`TournamentResultDTO.youParticipated`, yeni `idp.spectator` TR/EN/DE).
- **Doğrulandı (yerel, gerçek tarayıcı, gerçek saat 19:15 TR'ye ayarlı):** kayıtsız 1. oyuncu "Turnuvaya
  Gir" → `/turnuva/1`, DB'de 24 katılımcıda insan olarak var (23 AI dolgu); kayıtsız 2. oyuncu sonradan
  gelince aynı `/turnuva/1`'i izleyici olarak görüyor (DB'de katılımcı değil). Şema/veri değişmedi.

### Düzeltildi (02.10 — dünya saati 3 saat kayıyordu, turnuva girişi 19:00 değil 22:00'de açılıyordu)
- **Bulgu (Yusuf, canlı test, 02.10):** 19:15'te turnuvaya girmeye çalışan oyuncu hata alıyordu
  ("Turnuva saati henüz gelmedi — bugün 19:00'da başlar."), kayıt/canlı ekranları da birbiriyle
  çelişen durum gösteriyordu ("kaydol" ile "turnuva canlı" aynı anda).
- **Kök sebep:** `src/engine/worldclock.ts`'teki `WORLD_EPOCH_MS` **UTC** gece yarısına sabitlenmişti;
  günlük etkinlik anı (`EVENT_HOUR=19`) bu epoch'tan oran olarak hesaplanınca gerçekte **19:00 UTC =
  22:00 TR saatinde** tetikleniyordu — kod kendi mantığına göre doğruydu, ama "19:00" hem hata
  mesajında hem herkesin kafasında TR saatiydi. 3 saatlik fark her gün tekrarlıyordu.
- **Düzeltme:** `WORLD_EPOCH_MS` 3 saat geriye çekildi (`Date.UTC(2026,0,4,21,0,0)` = 5 Ocak 2026
  Pazartesi 00:00 **TR saati**). Pazartesi-çapa özelliği (dayIndex%7 → gerçek haftanın günü) korundu,
  yalnız TR yerel saatine göre. Yeni test: günlük etkinlik anı artık gerçekten 19:00 TR'de tetikleniyor
  (`tests/engine/worldclock.test.ts`); eski "epoch UTC Pazartesi" testi "epoch TR Pazartesi 00:00"
  olarak güncellendi. 169/169 test yeşil.
- **Not:** Vercel'de `WORLD_EPOCH_MS` ortam değişkeni ayrıca ayarlıysa onun da güncellenmesi gerekir
  (kod içi varsayılan değer yalnız env var YOKSA devreye girer) — bkz. DEVIR.md.

### Eklendi (30.09 — Beyaz lamba UI)
- **Turnuva sonuç sayfasında (`/turnuva/[id]`) beyaz lamba görünür oldu:** Yusuf'un motora eklediği
  (#37) `⚪ Beyaz lamba — {ad} hedef dışına dokundu. Sayı yok.` log satırı artık tuş-tuş dökümünde
  (`Skor detayı`) düz metin olarak kaybolmuyor — aydınlık bir şerit + `lamp-white` ışıltılı nokta ile
  öne çıkıyor (gerçek eskrim cihazındaki beyaz lamba gibi). `CanliMac` (bitmiş maç dökümü, yeni turnuva
  akışının kullandığı yol) + `LogLines` (eski canlı-animasyonlu yol, geriye dönük uyumluluk için) ikisinde
  de eklendi. Gerçek bir maç logunda (mevcut turnuva verisi) tarayıcıda görsel olarak doğrulandı.
  **Bilinçli yapılmadı:** eski canlı-izleme ekranındaki (`ScoreBug`) kırmızı/yeşil skor lambalarına üçüncü
  bir "beyaz" flaş rengi eklenmedi — o ekran B Faz 1 ile emekliye ayrıldığı için orana uymuyordu.

### Eklendi (30.09 — B Faz 0: server-authoritative turnuva, kanonik şema)
- **`Match` tablosu artık PENDING (henüz çözülmemiş) maçları da tutabiliyor** (`docs/TURNUVA_MULTIPLAYER.md`
  §2.1, §4 Faz 0): yeni `status` (PENDING|RESOLVED, varsayılan RESOLVED — mevcut kayıtlar etkilenmez) ve
  `scheduledAt` alanları eklendi; `playerAId`/`playerBId`/`scoreA`/`scoreB`/`winnerId`/`log` artık nullable
  (bracket turnuva başında oyuncular/skor belli olmadan önceden yazılabilsin diye — `seed` YİNE de baştan
  bilinir, çünkü deterministik `f(scopeKey, tur, maçIndex)`'ten türetiliyor, oyunculardan bağımsız).
  `getTournament`/`getCareerHistory` artık açıkça `status: "RESOLVED"` filtreliyor (tamamlanmış turnuva
  kaydı sayfası hâlâ yalnız bitmiş maçları gösteriyor — davranış değişmedi, yalnız temel kondu). Bu faz
  tek başına HİÇBİR kullanıcı-görünür davranışı değiştirmiyor — sadece Faz 1'in (sunucu-tik çözümleme)
  üzerine kurulacağı zemin. Build+test(168)+lint yeşil.

### Değişti (30.09 — B Faz 1: canlı turnuva artık sunucu-otoriteli)
- **Canlı turnuva artık istemci-güdümlü DEĞİL** (`docs/TURNUVA_MULTIPLAYER.md` Faz 1) — bu, Osman'ın
  29.09'da bulduğu "paralel evren" hatasının KÖKTEN çözümü (önceki `tour:${scopeKey}` düzeltmesi yalnız
  ara tedbirdi). "Katıl"a basınca sunucu turnuvayı TEK SEFERDE, kayıtlı taktiklerle çözer
  (`resolveScopedTournament`, offline otomatik yolla — `autoResolveTournament` — AYNI fonksiyonu
  paylaşıyor) ve `finalizeTournament` sonucu hemen kesinleştirir (ödül/ranking/vs.). **Görünürlük**
  ise tur tur açılır (`Match.status`/`scheduledAt`, ~1 dk/tur + aralarda küçük kayma) — spoiler
  olmasın diye tüm turnuva açılana kadar şampiyon/klasman/pul kağıdı gizli kalır. Kapsam-içi HERKES
  (kim ilk bassa da) aynı `/turnuva/[id]` sayfasını izler; eski ayrı `/turnuva/canli` akışı yalnız
  daha önce başlamış (B öncesi) oturumlar bitene kadar yaşıyor, yeni turnuvalar hiç oraya girmiyor.
  `getTournament` artık hem bitmiş hem "hâlâ açılıyor" turnuvaları gösteriyor (`isFullyRevealed`
  bayrağı); sayfa periyodik kendini tazeliyor (`LiveAutoRefresh`, ilk sürüm — Faz 3'te gerçek
  polling/senkrona taşınacak). Doğrulama: gerçek tarayıcıda kariyer oluşturuldu, turnuvaya katılıp
  `/turnuva/[id]`'ye yönlendirildiği, kendi pul maçlarının birkaç dakika içinde gerçek isim/skorla
  açıldığı, eleme çatalının (kendi maçı dahil) hâlâ kilitli kaldığı doğrudan izlendi. Build+test
  (168)+lint yeşil. **Bilinçli yapılmadı (sonraki fazlar):** gerçek-zamanlı taktik gönderimi (Faz 2),
  gerçek canlı senkron/polling (Faz 3), 256 ölçek + cron liveness (Faz 4).

> ✅ **30.09.2026 — `20260930000000_m11_5_ai_dev_month` migration'ı production'a uygulandı (Yusuf).**
> 23 AI'nın `aiDevMonth`'u doğru başlangıç değerine ayarlandı, 8 insan kariyeri sağlam doğrulandı, site
> kesintisiz. PR #40 doğru sırayla (önce DB, sonra kod) merge edildi. Ayrıntı: DEVIR.md Karar günlüğü.

### Düzeltildi (30.09 — AI havuzu aylık gelişim çakışması)
- **Ortak AI rakip havuzunun aylık beceri gelişimi, her insanın kendi gün ilerletmesinde AYNI ayı
  geçtiğinde tekrar tekrar işlenebiliyordu** — `worldAdvanceTx`'te "bu ay zaten işlendi mi?" kontrolü
  yoktu; her geçiş TÜM AI'ların o ayki gelişimini yeniden zar atıp uyguluyordu. Birkaç test oyuncusu
  zamanla aynı ayı geçtiğinde bu, AI rakiplerin tasarlanandan hızlı/tutarsız gelişmesine yol açabiliyordu.
  Düzeltme: her AI artık kendi `aiDevMonth` (en son işlenen ay) alanını taşıyor; bir ay yalnız BİR KERE,
  atomik bir "hak ediş" (`updateMany` + koşullu `WHERE aiDevMonth < ay`) ile işleniyor — aynı anda iki
  insan aynı AI'yı aynı ay için işlemeye çalışırsa yalnız biri kazanır, kaybeden sessizce atlar (Postgres
  satır kilidi bunu güvenli yapar, doğrulandı). Tohum da artık çözen kişiye değil sabit `ai.id + ay`'a
  bağlı — kim kazanırsa kazansın sonuç aynı. Mevcut AI'lar migration'da "en ileri gitmiş insanın vardığı
  aya kadar zaten işlenmiş" olarak başlatılıyor (ani telafi sıçraması olmasın diye). Doğrulama: gerçek
  Prisma client'ıyla atomik hak ediş + veri-düzeltme senaryoları test edildi (beklenen sonuçlar), tam
  build+test+lint yeşil, gerçek kariyer oluşturma akışı tarayıcıda hatasız çalıştı. **Bilinçli
  yapılmadı:** aynı fonksiyondaki günlük AI yorgunluk toparlanması da benzer şekilde tekrarlanabiliyor
  ama "0'ın altına inmez" sınırı olduğu için kendi kendini sınırlıyor (daha az zararlı) — şimdilik
  dokunulmadı. Ayrıntı: `docs/DEVIR.md`.
- **Bağımsız bulgu:** `prisma/migrations/migration_lock.toml` hâlâ `sqlite` yazıyordu, `schema.prisma`
  ise çoktan `postgresql`e geçmişti — ikisi tutarsızdı. Ayrıca en eski migration dosyaları (`AUTOINCREMENT`
  gibi) hâlâ ham SQLite söz dizimi içeriyor; sıfırdan bir Postgres veritabanına migration geçmişini
  baştan uygulamak (`prisma migrate deploy`) bu yüzden başarısız oluyor — gerçek şema muhtemelen hep
  `db push` ile senkronize edilmiş. Lock dosyası düzeltildi (`postgresql`); eski migration'ları yeniden
  yazmak ayrı, büyük ve riskli bir iş — bugün yapılmadı, bilgi amaçlı not düşüldü.

> 🚀 **28.09.2026 — UI yenilemesi canlıya alındı.** Osman'ın tüm arayüz zinciri (`feat/ui-pul-kagidi`)
> tek merge ile `master`'a alınıp deploy edildi. Motor/şema/sunucu değişmediği için canlı test
> verisi korunur.

### Eklendi
- **Beyaz lamba (flöre hedef-dışı):** Motor artık flörede tek taraf tuş bulduğunda **%15** olasılıkla
  (`FOIL_OFF_TARGET_PROB`, tunable) hedef-dışı üretir → sayı yok, hamle durur, log'a `⚪ Beyaz lamba …`
  satırı düşer (UI beyaz lambayı buradan gösterir). **Yalnız flöre** (FIE: kılıç/epede beyaz lamba yok).
  Hem tam maç hem canlı periyot yolunda çalışır. Daha gerçekçi flöre temposu.
- **WhatsApp/sosyal medya önizleme görseli:** `src/app/opengraph-image.tsx` (`next/og` `ImageResponse`) —
  bağlantı paylaşılınca (WhatsApp, Instagram DM, vb.) artık düz metin yerine markalı bir kart görünüyor:
  koyu Pist Konsolu arka planı, altın üst çizgi, "LEGENDS OF THE PISTE" başlığı, "Eskrim kariyer
  simülasyonu" alt yazısı, kırmızı/yeşil/altın üç sinyal noktası (eskrim lambalarına gönderme). Paylaşılan
  bağlantı hep site kökü olduğu için (`HeadlineCard.tsx` `whatsAppHref`, sonuca özel URL yok) tek sabit
  görsel yeterli — build zamanında üretilip önbelleğe alınıyor, her istekte yeniden hesaplanmıyor. **Yol
  üstünde gerçek bir eksik bulundu ve düzeltildi:** `metadataBase` hiç ayarlanmamıştı — `next build` bunu
  açıkça uyarıyordu ("using http://localhost:3000"), düzeltilmeseydi canlıda `og:image` bağlantısı
  `localhost:3000`'e işaret edip önizleme tamamen kırık olurdu. Kök `layout.tsx`'e eklendi (proje tek alan
  adında, `https://lotp-one.vercel.app` sabit). Doğrulama: gerçek bir production build (`next start`,
  `next dev` değil) ile hem üretilen görsel bizzat indirilip incelendi (Türkçe "ü" karakteri dahil doğru
  render ediyor) hem de `<meta property="og:image">`'in doğru mutlak URL'e çözüldüğü (`next dev`'de bilerek
  `localhost` gösterip yalnız gerçek production modunda doğru domaine döndüğü) `curl` ile teyit edildi.
- **Sözlük sayfası:** "Daha fazla" menüsünde yeni bir sayfa (`/kariyer/sozluk`) — 24 terim, iki bölüm:
  Eskrim Terimleri (Flöre/Epe/Kılıç, hedef, öncelik, tuş, pul, eleme, bay, averaj, seri başı, altın tuş,
  parat/riposte/kontra, milli takım, **beyaz lamba** — henüz uygulanmamış olsa da gerçek bir eskrim kavramı
  olduğu için dahil edildi) ve Oyun Terimleri (sezon, kondisyon, form, yorgunluk, Quarter Ranking, lisans no,
  Denar). TR/EN/DE — Almanca'da doğru eskrim terminolojisi (Poule, Direktausscheidung, Vorrecht, Freilos,
  Setzung). İçerik ana i18n sözlüğünden ayrı bir dosyada (`sozluk/glossary.ts`) — uzun biçimli, yalnız bu
  sayfaya özel metin, kısa UI etiketleriyle karışmasın diye. Yeni ikon: `glossary` (açık kitap, iki sayfa +
  orta sırt) — kendi çizimimiz, üçüncü taraf ikon değil.
- **Instagram uygulama içi tarayıcı uyarısı:** Instagram'ın kendi tarayıcısında (WhatsApp'ta paylaşılan
  bağlantı Instagram DM/bio'suna yapıştırılıp açıldığında vb.) oturum/localStorage bazı durumlarda
  güvenilir kalıcı olmayabiliyor. Artık `User-Agent`'ta "Instagram" tespit edilirse (`ui/inAppBrowser.ts`,
  saf fonksiyon + testli) kök layout'ta (her sayfada) ince, kapatılabilir bir bant çıkıyor: "sağ üstteki
  ⋯'den Tarayıcıda Aç'ı seç". Tespit sunucuda yapılıyor (`next/headers`) — gösterilme kararında yanıp sönme
  yok; yalnız "daha önce kapatıldı mı" bilgisi istemci-only (localStorage), o da varsayılan olarak
  "gösterilir" kabul edilip gerekirse kısa bir an sonra gizleniyor (tam tersi — varsayılan gizli, gerekirse
  göster — ilk ziyaretçide bandın hiç görünmemesine yol açan gerçek bir hataydı, düzeltildi). Renk nötr
  (steel/ink, `sig-red` değil) — bu bir hata değil, bir öneri. Facebook/Messenger'ın uygulama içi tarayıcısı
  bilinçli olarak kapsam dışı — yalnız Instagram istenmişti, aynı mekanizma kolayca genişletilebilir.
- **`/turnuva/[id]` sayfasının kalan başlıkları Pist Konsolu'na taşındı:** bir önceki maddede bilinçli
  kapsam dışı bırakılan üç başlık ("Senin Maçların", "Pul Kağıtları", "Turnuva Sıralaması") + sayfa başlığı
  (turnuva adı) artık `text-lg font-semibold`/`text-2xl font-bold` yerine `display` token'ında. Turnuva
  Sıralaması listesi de Klasman tablosundaki "sen" deseniyle hizalandı: kırmızı sol çizgi (`bg-sig-red`)
  kendi satırında, altın çizgi (`bg-prio`) şampiyonda (sen değilsen) — önceden yalnız `bg-arena-2
  font-semibold` idi, ayrımı yalnız kalın yazı sağlıyordu. Osman'ın onayıyla: bağlayıcı çizgili gerçek
  "ağaç" görselleştirmesi bilinçli olarak hâlâ yapılmadı — BYE'lı asimetrik hizalama matematiği değer/risk
  oranı düşük ayrı bir efor.
- **Eleme çatalı (turnuva sonucu sayfası) — yatay kaydırma keşfedilebilir hale geldi:** `/turnuva/[id]`
  sayfasındaki "Eleme Çatalı" bölümünde yatay kaydırma zaten vardı (`overflow-x-auto`) ama görünürde hiçbir
  ipucu yoktu — geniş turnuvalarda (ör. 24 kişilik, 5 tur) yalnız ilk 2 tur ekrana tam sığıyor, sonraki
  turlar hiç göstergesi olmadan ekran dışında kalıyordu. Artık: başlığın yanında "Yana kaydır →" ipucu (yalnız
  1'den fazla tur varsa), kolon genişliği 170→150 px'e küçültülüp sonraki turdan bir dilim ekranda bırakılacak
  şekilde ayarlandı (peek), `scroll-snap` ile kaydırma turdan tura düzgün "yapışıyor". Kart stili tokenlara
  taşındı (`rounded-lg`/`text-xs` → `rounded-md`/`text-[13px]`), kendi maçların artık rest of app ile tutarlı
  kırmızı sol çizgiyle işaretli (`border-l-sig-red`, Klasman tablosundaki "sen" işaretiyle aynı desen).
  Başlık da `text-lg font-semibold`den `display` token'ına geçti. Bilinçli kapsam dışı: bu sayfadaki diğer
  başlıklar ("Senin Maçların", "Pul Kağıtları", "Turnuva Sıralaması") ve bağlayıcı çizgili gerçek "ağaç"
  görselleştirmesi — ayrı, daha büyük bir "sayfayı Pist Konsolu'na taşı" işi olurdu.
- **Bugün sayfasına kimlik kartı:** `KimlikKarti.tsx` — federasyon lisans kartı hissi veren, sayfanın
  kendi içeriği olan bir kimlik gösterimi (`CareerNav`'daki her sayfada görünen ince kabuk şeridinden
  ayrı — o kalıyor, bu yeni kart Bugün'ün ilk göreceğin şeyi olarak yanına ekleniyor). Büyük avatar, isim,
  milli takım rozeti, silah/kategori/yaş/şehir, alt satırda "Lisans No" (oyuncunun `code` alanı, GDD 7.4)
  ve sezon Roma rakamı. Bilinçli olarak reyting/kondisyon/form YOK — onlar hemen altındaki "Üç anahtar
  değer" bölümünde zaten var, kart yalnız kimliğe odaklanıyor. `toRoman` artık `parts.tsx`'te ortak (önceden
  yalnız bu sayfada tekildi). Yeni i18n anahtarı: `profil.licenseNo` (TR/EN/DE). Osman'a önce yön soruldu:
  "yeni ayrı kart" mı "mevcut şeridi kart gibi giydir" mi — cevap: yeni ayrı kart.
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

### Düzeltildi (29.09 — canlı turnuva paralel-simülasyon çakışması)
- **Aynı gün/kategori/seviyede birden fazla gerçek oyuncu turnuvaya CANLI katılırsa, her biri kendi
  turnuvasını birbirinden habersiz, farklı sonuçlarla simüle ediyordu** — testçi gözlemi: turnuva sürerken
  herkes farklı rakip/skor görüyor, turnuva bitince herkes (ilk biten kişinin simülasyonuna göre) aynı
  sonucu görüyordu; ikinci biten oyuncunun kendi oynadığı maçlar sessizce yok sayılıyordu. Sebep:
  `startLiveTournament` (`careerService.ts`) ortak `scopeKey`'e kayıtlı diğer gerçek oyuncuları kendi
  simülasyonuna dahil ediyordu ama pul çekimini ve TÜM maç sonuçlarını ÇÖZEN OYUNCUNUN KENDİ `gs.seed`'iyle
  hesaplıyordu — aynı scopeKey'deki iki farklı oyuncunun seed'i farklı olduğu için iki paralel evren
  oluşuyordu. Ayrıca `take: aiNeeded` sırasız olduğu ve karıştırılacak liste "önce ben, sonra diğerleri"
  sırasında olduğu için (Fisher–Yates konum bazlı) seed aynı olsa bile çekim farklı çıkabilirdi. Düzeltme:
  tohum artık `scopeKey`'den türetiliyor (paylaşılan, kişiden bağımsız), AI seçimi `orderBy: id asc` ile
  sabitlendi, çekime giren liste karıştırmadan önce id'ye göre sıralanıyor. Offline/otomatik turnuva yolu
  (`autoResolveTournament`) zaten doğruydu (tek çözen + dedup) — dokunulmadı. Yeni regresyon testi:
  `tests/engine/probability/rng.test.ts` (shuffle'ın girdi sırasına duyarlı olduğunu ve sıralamanın bunu
  nasıl düzelttiğini kanıtlıyor). Ayrıntı: `docs/DEVIR.md` "Canlı turnuvada paralel-simülasyon çakışması".
  **Bilinçli yapılmadı (ayrı, daha büyük bulgu):** `worldAdvanceTx`'teki AI havuzu aylık gelişim/yorgunluk
  toparlanması da benzer bir sınıf sorun taşıyor (her insan kendi gün-ilerletmesinde AYNI ayı tekrar
  işleyebiliyor) — şema değişikliği + mevcut AI verisini bozmadan geçiş gerektiriyor, ayrı onay bekliyor.

### Düzeltildi
- **Antrenman raporu yetenek etiketleri hiç çevrilmiyordu:** "Sen yokken" panelindeki kazanım etiketleri
  ("+0.7 Atak" gibi) her dilde — İngilizce dahil — sabit Türkçe kalıyordu, çünkü `careerService.ts`
  (`gains[].label`) motorun (`engine/skill/skills.ts`) sabit TR etiketini doğrudan DB'ye yazıp öyle
  gösteriyordu, i18n'den hiç geçmiyordu. Artık `label` yerine `key` yazılıyor, sayfa (`kariyer/page.tsx`)
  `t(locale, "skill." + key)` ile dile göre çeviriyor — sayfanın altındaki YETENEKLER bölümüyle aynı yol.
  Geriye dönük uyumlu: bu değişiklikten önce yazılmış, henüz okunmamış eski raporlarda hâlâ yalnız sabit
  `label` olabilir — sayfa `key` yoksa `label`'a düşüyor, canlı veri kaybı yok (CONTRIBUTING §2).
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
- **Ekipman mağazası silaha göre filtrelendi + genişledi:** `itemsForWeapon` — oyuncu yalnız kendi silahının
  + ortak ürünlerini görür. **Epe'de** elektrikli yelek (eski "lamé") ve **maske kordonu** artık gizli
  (vücut kordonu durur); önceden "gerekmez" yazıp yine gösteriyordu. **Elektrikli yelek silaha özel**
  (flöreciye "flöre için", kılıççıya "kılıç için" — biri diğerini görmez). Yeni ürünler: **eldiven** +
  **göğüs koruyucu** (Osman'ın ikonlarıyla). Eski satın alınmış ekipman korunur (legacy).
- **Sakatlık süresi kısaltıldı (#36):** tüm sakatlıklar artık **1-2 gün** (eskiden nadiren 7-14 güne kadar
  çıkıyordu — test için çok uzundu). Ağır kademeler test sonrası geri gelebilir.
- **Klasman (mobil):** yaş kategorileri artık **5'li grid** — U10-U12-U14-U17-U21 üst satıra tam sığar,
  Büyükler alt satırda tam genişlik. Yatay kaydırma kalktı. Etiketler sade U-kodu: "U14 Yıldızlar"→"U14",
  "Gençler"→"U21".

### Değişti
- **Kondisyon: gece tam toparlanma (#35):** Artık her yeni gün **~%99 kondisyonla** başlanır; o günkü
  antrenman/maç akşam yorar, uyku ertesi sabah toparlar. Yorgunluk **günler arası birikmez** → antrenman
  aşırı-yük sakatlığı pratikte kalktı (maç-içi/turnuva-günü yorgunluğu + sakatlığı **kalır**). Dayanıklılık
  artık maç-içi yorgunlukta önemli. (Kullanıcı kararı: "sabahları %99".)
- **Antrenman gelişim hızı yumuşatıldı (#34):** seans başına birincil kazanım `PRIMARY_STIMULUS` 0.6→0.36
  (gösterim ~+0.5 → ~+0.3) → oyuncu yaş-tavanına birkaç haftada değil **sezon boyunca** yaklaşır
  ("sürekli gelişiyorum" hissi; tavan aynı). Yan (spill) etki `SPILL_FRACTION` 0.12→0.10 (~0.1 → ~0.05).
  Sim ile doğrulandı (combat/gelişim/sakatlık dengesi korundu).
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
