# Tasarım sistemi: "Pist Konsolu"

> Arayüzün kalıcı tasarım kaynağı. UI'ya dokunan her iş önce bunu okur. Karar: Osman (UI sorumlusu),
> 2026-09-28. Süreç: 3 araştırma + mevcut ekran denetimi → 3 konsept → 2 jüri → uygulama planı.

## Neden (teşhis)

Oyun iyi çalışıyordu ama bir yönetim paneli gibi görünüyordu, eskrim olduğu anlaşılmıyordu:
her yerde zümrüt yeşili + Arial (Geist yüklüydü ama kullanılmıyordu), ikonlar emoji (her telefonda
farklı çizilir), menü açılır listenin arkasında, "bugün ne yapmalıyım?" cevabı yok, 8 yaşında başlayan
sporcu 100'lük ölçekte boş çubuklar görüyor. Kullanıcının kişisel teması başlık/alt çubuk/geri bildirim
panelinde çalışmıyordu (sabit beyaz yüzeyler). Canlı maçta taraf renkleri ters (aşağıda).

Karşılaştırılan yönler (jüri puanı /50, Creative Director · Growth): **Pist Konsolu 39 · 39** (seçildi),
Yayın/gazete 36 · 38, Kulüp dolabı 29 · 29.

## Yön

Görsel dil eskrimin kendi dünyasından: skor cihazının lambaları, 14 m pistin çizgileri, tablo gibi hizalı
rakamlar, kendi çizdiğimiz tek bir SVG ikon seti. Marka rengi yok; ana buton renksiz "mürekkep". Yayın
yönünden: manşet tarzı sonuç cümleleri (P1). Kulüp dolabından: oluşturmada büyük silah kartları (P0-9).

## Kurallar (bunlara uy — eskileri geçersiz)

1. **Renk:** `emerald-*`, `sky-*` ve gradient kartlar kalkar. Ana buton `.btn-ink`, ikincil `.btn-ghost`.
   Tek prestij rengi `--prio` (altın) — yalnız 1.'lik, şampiyonluk, altın tuş, öncelik, milli takım.
2. **Taraf renkleri (eskrim cihazı):** kırmızı = SOL, yeşil = SAĞ; iyi/kötü anlamı YOK. Canlı maçta
   oyuncu hep solda → kırmızı; "sen" renkle değil **SEN** etiketiyle belirtilir. Beyaz lamba yalnız
   flöre/kılıçta (epede yok). ⏳ Yusuf onayı bekliyor (P0-4 öncesi).
3. **Yüzeyler temadan türer:** sabit `bg-white`, `black/10`, bileşen başına `dark:` yüzey YOK. Kullan:
   `bg-arena-0/1/2`, `border-line`, ikincil metin `text-steel`, ana metin `text-ink`. Hepsi
   `--background/--foreground`'dan `color-mix` ile türer → kişisel tema her yerde çalışır.
   Temadan bağımsız sabit olanlar: `sig-red/green/white`, `prio` ve `data-scope="console"` (skor bandı).
4. **İkon:** yalnız `src/app/ui/Icon.tsx` (24'lük ızgara, 1.75 çizgi, currentColor). **Emoji UI ikonu
   değildir** (çeviri metinlerinde de). Marka/ürün görseli kopyası yok (PBT, Allstar, Leon Paul, Uhlmann,
   Favero; FIE/Olimpiyat işaretleri yok). Ekipman markası kurgusal: GLADIUS.
5. **Tipografi:** gövde Geist Sans; başlık/kicker/marka Barlow Condensed (`.display`, `.kicker`,
   `font-display`); rakamlar `.num` (Geist Mono, tabular). Başka font yok.
6. **İkincil metin** `text-steel`, en az 13 px. `opacity-*` yalnız gerçek "pasif" durum için.
7. **Dokunma hedefi** en az 44 px (`min-h-11`), basılı hali (`active:` / `.press`). Yalnız-hover yok.
   **Tıklanabilir satırlar sağda ok (`chevron-right`) taşır** → yeni kullanıcı neye basılacağını görür.
8. **Köşe:** `rounded-md` (çip, buton) ve `rounded-xl` (panel). Panel = `.panel`, gölge yok.
9. **Hareket:** yalnız `globals.css`'teki tek blok (`@supports` + `prefers-reduced-motion`): `anim-lamp`,
   `anim-check`, `anim-live`. JS animasyon kütüphanesi yok.
10. **Metin:** dokunulan her görünür metin `t()` anahtarı olur (TR önce, sonra EN; DE/ES/FR TR'ye düşer).
11. **Navigasyon:** telefonda alt 5 sekme (Bugün, Antrenman, Turnuvalar, Klasman, Daha fazla); masaüstünde
    (lg ≥ 1024 px) sol sidebar. İkisi `CareerNav.tsx`'teki tek `MAIN`/`MORE` tanımından. Aktif sayfa:
    kırmızı "en-garde" çizgisi + `aria-current`. Bildir menüde (yüzen buton yok).
12. **Özel sınıflar `@layer components` içinde** (`.panel`, `.btn-ink`, `.btn-ghost`, `.kicker`, `.num` …) →
    Tailwind utility'leri her zaman üstün gelir: `btn-ghost text-sig-red`, `panel border-ink`, `btn-ink lg:hidden`
    doğrudan çalışır. Bu sınıfları `@layer utilities`'e geri taşıma (orada kaynak sırası utility'leri eziyordu;
    düzeltmeden önce `lg:hidden` ve renk/kenar değiştiricileri sessizce etkisizdi).
13. **Masaüstü (lg):** tek dar telefon sütunu bırakma. Giriş = iki sütun (sol vitrin `sticky h-svh`, sağ form).
    Sabit yükseklikli flex sütunda çocuklara `shrink-0` + `justify-center-safe` + `overflow-y-auto` —
    yoksa `overflow-hidden` taşıyan skor bandı alçak ekranda (1280×720) ezilir.

## Uygulandı

- **P0-1 Temel** (2026-09-28): `globals.css` token'ları, Barlow Condensed + `latin-ext`, Arial kalktı,
  kişisel tema ilk boyamadan önce (`next/script` beforeInteractive, yalnız `#hex` kabul), footer `t()`.
- **P0-2 İkon seti** (kısmi): `ui/Icon.tsx` — navigasyon, silahlar, antrenman kategorileri, durum ikonları.
  Kabuk (menü, başlık, gün çubuğu, raporlar) emojisiz. Sayfa içerikleri P0-5…10'da.
- **P0-3 Navigasyon:** telefon alt sekmeler + "Daha fazla" alt sayfası, masaüstü sol sidebar, ince kimlik
  şeridi (maske-oval avatar), gün çubuğu tek dokunuşla Turnuvalar'a, Bildir menüde (portal pencere).

- **P0-5 Bugün ekranı** (eski Profil, menüde "Bugün"): bugünün görevi (antrenman/turnuva/sakatlık) → sıradaki
  turnuva kartı (seviye etiketi, büyük geri sayım, kayıt lambası / Kaydol) → "Sen yokken" (antrenman raporu +
  yokken oynanan turnuvalar tek panel, tek kapatma) → Reyting/Kondisyon/Form → Yetenekler → Fizik/Psikoloji
  (tıklayınca açılır). Raporlar artık her sayfanın tepesinde değil.
- **P0-6 Değer gösterimi:** `ui/Piste.tsx` (PisteRail, PisteLine, Segments) + `ui/bands.ts`. Yetenek rayı yaş grubu
  ölçeğiyle dolar, gerçek 0–100 değer yazılı; kategori ortalaması, en güçlü yetenekte altın nokta. Kondisyon/form
  10 parçalı gösterge + durum yazısı (Dinç/Yorgun…, trafik lambası rengi yok). ⏳ Ölçek (U10=30, U12=45, U14=60,
  U17=80, üstü 100) taslak — Yusuf onaylayacak (`bands.ts`).

- **P0-7 GLADIUS mağazası:** kendi çizdiğimiz 9 yuva ikonu (maske, beden/maske kordonu, ceket, plastron, lamé,
  ayakkabı, çorap, çanta) + silah ikonu oyuncunun silahına göre + GLADIUS monogramı. "Kit x/10" şeridi, gruplar
  (Silah ve kordonlar · Koruma · Ayak · Aksesuar), "+0.003" çipi yerine prestij notu, yetmeyen Denar görünür
  yazı ("Eksik: Đ 120"), epede maske kordonu/lamé için "Epede gerekmez" bilgisi (satın alma serbest).
  Ürün adları `t("gladius.<id>.name")`, yoksa motor adı. Eski ekipman seviyesi tıklayınca açılır.

- **P0-8 Turnuvalar:** üstte sıradaki turnuva kartı (Kaydol → listedeki yere kaydırır) veya CANLI kartı
  (mürekkep buton + yanıp sönen kırmızı lamba). Yaklaşan liste: seviye etiketi, ödül etiketi, kayıtlıysa
  sol mürekkep çizgi + "Kayıtlı · Atak". **Taktik seçimi 3'lü segment** (`ui/TacticSegment.tsx`, gerçek radio,
  JS yok) "Kaydol"a basınca açılır; iptal aynı formda (`formAction`). Listedeki butonlar ikincil — ekranda tek
  ana buton. Açıklamalar + haftalık program "Nasıl işler?" altında. Taktik ikonları: atak (ok), dengeli
  (terazi), defans (kalkan).

- **P0-9 Giriş ekranı:** koyu vitrin (her zaman koyu, `data-scope="console"`) — marka adı (`lang="en"`, Türkçe
  büyük harf "PİSTE" yapmasın), kısa tanıtım, **örnek skor bandı** (`ui/ScoreBug.tsx`, "Sporcu A/B" — gerçek
  sporcu değil) + 4 satır örnek anlatım (sabit yükseklik, hareketsiz), "Sporcunu oluştur" → forma kaydırır.
  3 adım (antrenman · turnuva günleri · klasman). Form: **büyük silah kartları** (ikon + kısa kural: flöre gövde/
  öncelik, epe tüm vücut/çift tuş, kılıç bel üstü/kesme), cinsiyet segmenti, profil çipleri, ülke bilgi çipi
  (seçim yok). Aynı `name/value` → `createCareerAction` değişmedi (temiz tarayıcıda uçtan uca test edildi).
  Konsol kapsamında `--arena-0` da koyu (mürekkep buton yazısı okunur).

- **P0-10 Klasman:** üstte "senin durumun" paneli (büyük sıra numarası + iki kapı lambası: milli takım ilk 4,
  uluslararası ilk 16 — altın = kapı açık). Kapsam segmenti (Dünya/Kıta/Ülke) + kategori çipleri (yaş:
  U10 · U12 · U14 Yıldızlar · U17 · Gençler · Büyükler; silah; cinsiyet), 44 px. Liste = **sıralama kulesi**
  (`RankingTower` in `parts.tsx`; kullanılmayan eski `RankingTable` yerine): 1. altın kenar, 2–3 çelik,
  kendi satırın kırmızı kenar + SEN etiketi ve aşağıdaysan alt çubuğun üstüne yapışır (sticky).

- **Giriş ekranı masaüstü:** lg'de iki sütun — solda vitrin (başlık 72 px) + 3 adım sabit, sağda form; atlama
  butonu yalnız telefonda (sarmalayıcıyla, bkz. kural 12). 1024×768 · 1280×720 · 1440×900 · 390 kontrol edildi.

- **Antrenman:** haftalık plan = gün başına ikonlu 5'li radio segment (aynı `slot0..6` değerleri →
  `setTrainingPlanAction` değişmedi); kaydedilmemiş değişiklik "Kaydedilmedi" + kırmızı lamba, kaydedince
  onay ikonu; temiz durumda buton pasif. Kelime değerli `Stat` → `word` (dar başlık fontu; mono gün adı
  390 px'te taşıyordu). Yerelde uçtan uca test: seç → Kaydedilmedi → kaydet → Kaydedildi → yenile → kalıcı.

- **Emoji temizliği (kalan sayfalar):** Geçmiş (`Stat` + yeni ikonlar `trophy`/`podium`/`medal`, turnuva satırı
  kule dili: 1. `prio`, 2–3 `steel` kenar; önem yıldızı = `rating` ikonu), Kulüp (nötr arma = `club` ikonu,
  tesis = `Segments`), Ayarlar (segment, tehlikeli işlem `sig-red`), hata sayfası, geri bildirim panosu
  (lamba + yazı), telefonla giriş onayı. Kalan tek emoji kaynağı: motorun maç anlatımı (`src/engine/combat`,
  `src/server/careerService.ts`) — Yusuf'un alanı. Metin içindeki ok (→, ←) tipografidir, ikon değil.

- **P0-4 Canlı maç** *(✅ Yusuf'un taraf rengi onayıyla canlıya alındı, 28.09)*: `ScoreBug` hem eleme periyotlarında
  (`CanliPeriyot`) hem pul/geçmiş maçlarda (`CanliMac`) — oyuncu hep SOLDA = KIRMIZI + SEN etiketi, rakip sağ yeşil.
  Son tuşu alan tarafın lambası bir kez yanıp söner (epede çift tuşta ikisi); skor yine yalnız satır açıldıkça
  değişir. En yeni anlatım satırı tuşu alan tarafın renginde sol çizgiyle, eskiler soluk. Hızlı/Atla 44 px segment.
  Sekmeler panelin ÜSTÜNDE, kilitli olanlar kilit ikonlu (spoiler mantığı aynı). Taktik kartları ikonlu. Bitmiş
  pul maçı satırında sonuç ikonla (✓/✗), skor taraf renginde. Sonuç ekranında altın yalnız şampiyonlukta.
  Pul kağıdı ve geçmiş turnuva sayfası da token'lara geçti. Ortak parçalar: `turnuva/canli/matchParts.tsx`.

- **Hafta şeridi:** `kariyer/week.ts` (saf `buildWeek` + `todayFromHeader`, testli) + `kariyer/WeekStrip.tsx`. Şerit
  başlıktaki "bugün" (kariyer günü) ile başlar → Bugün kartı/alt çubukla hep aynı gün; kariyer dünya gününün gerisindeyse
  aradaki günler (kaydı kapanmış) programdan okunur (yalnız yurt içi turnuva; uluslararası yaş kuralı sunucuda, UI'da
  tekrar edilmez). Gelecek günler `getUpcomingTournaments` (kayıt + hak). 7 sütun
  `panel` hücre, ≥ 76 px yükseklik; etiket `levelShort.*`, gün `dayShort.*`; bugün `border-ink` + kırmızı alt çizgi.

- **Pul kağıdı:** `figure.panel` + başlık (Pul N), tablo `border-separate` (sticky ad sütunu için; kenarlar hücre
  başına `border-t/l`). Hücre 36 px, köşegen `.hatch` (yeni sınıf), galibiyet `V5` kalın mürekkep + köşe noktası,
  mağlubiyet `text-steel`. Kendi satır + sütun `bg-arena-2` (artı), satır başında kırmızı kenar. Özet blok
  (V/TS/TR/Ind/Sıra) `border-l-2` ile ayrı, başlıkta `title` açıklaması. Tablo `num font-normal`: rakamlar mono ama
  kalın yalnız V, sıra ve galibiyet. Ad sütunu `w-full` → masaüstünde tablo paneli doldurur, telefonda kayar.

- **Manşet:** `ui/headlineText.ts` (saf: `buildHeadline`, `lastBoutFrom`, `headlineShareText`; testli) + `ui/HeadlineCard.tsx`
  (üst 2 px mürekkep çizgi, kicker, `display` 26 px başlık, 14 px alt satır; şampiyonlukta solda 6 px `prio` blok;
  `whatsAppHref` → `https://wa.me/?text=…`, adres isteğin host'undan). Şablon kuralı: değişken isme ek yok
  (`{tournament}: {name} …`, `{opp} karşısında`), tur ekleri sabit anahtarlarda (`son 16'da`, `son 64'te`). Kullanım:
  canlı bitiş ekranı, `/turnuva/[id]` üstü, Bugün "Sen yokken" satırları. Dosya adları bilerek farklı (`headlineText` /
  `HeadlineCard`): Windows'ta büyük/küçük harf duyarsız → `headline.ts` + `Headline.tsx` import karışır.

- **Ekipman marka paneli (hazırlık):** `ekipman/BrandPanel.tsx` — `.panel group` üstünde `<details>`, aynı
  `chevron-down` + `group-open:rotate-180` deseni (antrenman/turnuvalar/klasman ile aynı). Yeni marka =
  yeni bir `<BrandPanel>`; katalog verisi hâlâ motor tarafında (`GLADIUS_ITEMS`), bileşen yalnız kabuk.
  Yeni ikonlar `glove`, `chest` — jacket/plastron ile aynı yükseklikte (3–21 viewBox), tek ana path + 1
  ince aksan çizgisi. Kontrol: `<details>`'te tek eleman `offsetHeight`/`content-visibility` ölçümü
  yanıltıcı (Chromium kapalıyken elemente kendi boyutunu geri verebilir) — gerçek sinyal
  `document.documentElement.scrollHeight` (sayfa toplamı) veya ekran görüntüsü.

- **Tema ayarları:** `ui/contrast.ts` (saf `contrastRatio`, WCAG formülü, testli) + `ThemeSettings.tsx`.
  Hazır temalar `globals.css`'teki gerçek varsayılanlarla birebir (Salon #f4f5f2/#111418, Pist #0b0e12/#e8ecf0);
  aktif olan `aria-pressed` + check ikonuyla işaretli. İlk render'da sabit renk tahmin etmek yerine
  `getComputedStyle` ile sayfaya zaten uygulanmış (no-flash script'in bıraktığı) değer okunuyor. Kontrast
  uyarısı `text-sig-red` (bu danger/warning kullanımı `CareerResetButton`'daki gibi — sig-red'in "SOL taraf"
  anlamı yalnız maç bağlamında geçerli, genel tehlike/uyarı rengi olarak kullanımı önceden yerleşik).

- **Canlı periyot/altın tuş bandı:** `ScoreBug` sticky kalırken anlatım aşağı akınca "hangi periyottayım"
  bilgisi kayboluyordu (gerçek eskrim cihazlarında bu ayrı bir gösterge). `ui/liveBand.ts` (saf: `currentPeriodNo`,
  `isPriorityPhase`, `periodBand`, testli) log satırlarını okuyup ScoreBug'a yeni `band` prop'unu besliyor:
  normalde "N. Periyot" (`text-console-steel`), "öncelik kurası" (la belle) satırı açılınca periyot numarasının
  yerine `--prio` altın renginde "Altın Tuş" geçiyor. `CanliPeriyot` (canlı eleme periyodu) ve `CanliMac`'te
  (pul/geçmiş maç tekrarı, final periyodun altın tuşu buradan izlenir) ortak kullanılıyor; pul maçlarında
  periyot başlığı olmadığı için band otomatik gizli. Bilinçli kapsam dışı: **devre arası** ("ara") bandı — o
  durum zaten `afterDone` panelinin kendi başlığıyla (`canli.break`) hemen altta, kaydırma olmadan görünüyor,
  ScoreBug bandına eklemek yinelenen bilgi olurdu. Motorun anlatım metnine (`src/engine/combat`,
  `src/server/careerService.ts`) dokunulmadı — tespit yalnız var olan log satırlarını okur (regex, TR/EN).
  Görsel doğrulama: gerçek `ScoreBug` bileşeni geçici bir Next sayfasında (`globals.css` derlenmiş haliyle)
  üç durumda (normal periyot / altın tuş / bantsız) ekran görüntüsüyle kontrol edildi, sonra rota silindi —
  test karakterinin hızlı dünya saati bu oturumda sakatlanmış durumdaydı, gerçek canlı maçla tekrar test
  bir sonraki oturuma kaldı.

- **Almanca (Deutsch) çeviri:** Osman'a önce kapsam soruldu — "sadece layout sağlamlığı" mı yoksa "gerçek
  çeviri" mi; sonra sözlüğün artık ~500 anahtara çıktığı (`nav`/`bar`/`settings`/`create` dışında `canli`,
  `klasman`, `gecmis`, `ekipman`, `turnuvalar`, `antrenman`… her şey) bulgusuyla geri dönüldü, "kabuk" mu
  "tümü" mü diye tekrar soruldu — cevap: tümü. `src/i18n/index.ts`'e TR∪EN'in tam birleşimini kapsayan yeni
  bir `DE` sözlüğü eklendi (script ile doğrulandı: eksik/fazla/tekrar anahtar yok). Doğru Almanca eskrim
  terimleri kullanıldı (Poule, Tableau, Planche, Freilos, Leitweste); "Aktive" bilinçli seçildi — Almanca
  eskrimde "Senioren" veteran kategorisi demek, TR/EN'deki "Büyükler/Seniors" (açık kategori) karşılığı değil.
  Cinsiyetli isim gerektiren yerlerde ("sporcunu oluştur" vb.) "Fechter/in" yerine nötr "Charakter" tercih
  edildi. `V5` gibi uluslararası pul-kağıdı notasyonu (kodda sabit, çevrilmiyor) metne çevrilmeden bırakıldı.
  Görsel doğrulama: Ayarlar → Dil → Deutsch seçilip masaüstü + 375 px'te Bugün/Ayarlar ekranları kontrol
  edildi, taşma/kırpılma yok (`nav.gecmis` → tek kelime "Karriereverlauf" bile dar kolonda rahat sığıyor).
  Yol üstünde bulunan, bu işin kapsamı DIŞINDA kalan bir hata ayrı işe kaydedildi (spawn_task): "Sen yokken"
  antrenman raporundaki yetenek kazanım etiketleri (`careerService.ts` `gains[].label`) motorun
  (`engine/skill/skills.ts`) sabit Türkçe `label` alanından geliyor, i18n'den hiç geçmiyor — İngilizce dahil
  her dilde Türkçe görünüyor.

- **Antrenman raporu yetenek etiketleri — i18n'e bağlandı:** yukarıdaki bulgunun düzeltmesi (Osman "başlat
  chipi" dedi, aynı oturumda yapıldı — spawn_task tıklanamadığı için doğrudan burada). `TrainingReport.gains`
  artık sabit `label` yerine `key` (`SkillKey`) yazıyor (`careerService.ts` ~1294); `kariyer/page.tsx`
  `t(locale, "skill." + key)` ile render zamanında çeviriyor — YETENEKLER bölümünün zaten yaptığı gibi.
  Geriye dönük uyumluluk: `gains` tipi `{ key?: SkillKey; label?: string; delta }` — bu değişiklikten önce
  DB'ye yazılmış, henüz okunmamış eski raporlarda yalnız `label` olabilir, sayfa `key` yoksa `label`'a
  düşüyor (canlı veri kaybı yok, CONTRIBUTING §2). Doğrulama: Almanca'da yeni oluşan bir rapor
  ("Trainingsbericht") kontrol edildi — "Schnelligkeit/Ausdauer/Angriff/Abwehr…" doğru çevrildi.

- **Bugün'de kimlik kartı:** Osman'a önce yön soruldu — mevcut ince kimlik şeridini (`CareerNav.tsx`, her
  sayfada) kart gibi giydirmek mi, yoksa Bugün'e AYRI yeni bir kart eklemek mi. Cevap: yeni ayrı kart, şerit
  dokunulmadan kalsın. `KimlikKarti.tsx` — üstte 2 px `border-t-ink` (HeadlineCard'daki mürekkep çizgi
  motifiyle aynı aile), büyük maske-oval avatar (CareerNav'daki `Avatar` ile aynı desen, `parts.tsx`'teki
  ortak `initials()`), isim + milli takım rozeti, silah ikonu + kategori + yaş + şehir bayrağıyla (aynı
  `meta` düzeni CareerNav'daki gibi, yalnız 14px'e büyütülmüş). Alt şerit `border-t border-line` ile ayrı:
  "Lisans No" (`c.code`, motorun GDD 7.4'te zaten kalıcı görünür kimlik olarak ürettiği "P-000001" formatı)
  + Sezon Roma rakamı. Bilinçli olarak reyting/kondisyon/form YOK — bir federasyon kimlik kartında olmayan,
  günlük değişen performans metrikleri; onlar zaten hemen altındaki "Üç anahtar değer" bölümünde. `toRoman`
  page.tsx'ten `parts.tsx`'e taşındı (iki dosyada da lazımdı, tekrar yerine ortak). Yalnız mevcut DTO'lardan
  (`CareerDTO` + `CareerHeaderDTO`, ikisi de zaten Bugün sayfasında yükleniyordu) — yeni sunucu verisi yok.
  Görsel doğrulama: masaüstü + 375 px, Pist (koyu) temada kontrol edildi — taşma yok, avatar/rozet/meta satırı
  CareerNav ile tutarlı görünüyor. (Salon/açık temada ekran görüntüsü bu oturumun headless Chrome'unda görsel
  bir render hatası verdi — `getComputedStyle` ile doğrudan doğrulandı: `--background`/`--foreground` ve
  panel arka planı doğru şekilde açık değerlere dönüyordu, kart yalnızca zaten kanıtlanmış `panel`/`text-steel`
  sınıflarını kullanıyor, yeni bir renk yolu yok — bu yüzden ek risk görülmedi.)

- **Eleme çatalı — yatay kaydırma keşfedilebilir hale geldi:** kod incelemesinde `overflow-x-auto` zaten
  vardı, bu yüzden "yatay kaydırma" maddesi ilk bakışta çözülmüş görünüyordu. Gerçek sorun `getComputedStyle`/
  `scrollWidth` ile doğrulandı: 24 kişilik bir turnuvada (SON32→SON16→ÇEYREK→YARI→FİNAL, 5 tur) kolonlar
  tam olarak viewport genişliğine denk geliyordu (170px×2 ≈ 341px client width) — yani hiçbir "dilim" ekranda
  kalmıyordu ve kullanıcı kaydırılabilir olduğunu fark edemiyordu. Çözüm: kolon genişliği 150px'e indirildi
  (bir sonraki turdan görünür bir dilim bırakacak şekilde), `snap-x snap-proximity` + kolon başına `snap-start`
  eklendi (tur turdan tura "yapışıyor"), başlığın yanına 1'den fazla tur varsa görünen bir "Yana kaydır →"
  ipucu kondu. Kart stili de token'lara taşındı: `rounded-lg`/`text-xs` → `rounded-md`/`text-[13px]`; kendi
  maçların artık Klasman tablosundaki "sen" işaretiyle aynı desende (`border-l-2 border-l-sig-red`) — önceden
  yalnız `border-ink bg-arena-1` idi, tutarsızdı. Başlık `text-lg font-semibold` → `display text-[20px]`.
  Bilinçli kapsam dışı: bu sayfadaki (`/turnuva/[id]`) diğer üç başlık ("Senin Maçların", "Pul Kağıtları",
  "Turnuva Sıralaması") hâlâ eski `text-lg font-semibold` — tüm sayfa Pist Konsolu'na hiç taşınmamış, bu ayrı
  ve daha büyük bir iş olurdu. Gerçek bağlayıcı çizgili "ağaç" görselleştirmesi (turlar arası kazanan
  bağlantısı) de bilinçli yapılmadı — BYE'lı asimetrik turlarda doğru hizalama matematiği ayrı bir efor,
  mevcut "yan yana sütun" gösterimi (skorlarla) turnuvayı takip etmek için yeterli. Görsel doğrulama: 375 px'te
  gerçek bir 24 kişilik geçmiş turnuvada test edildi — dilim doğru görünüyor, `scrollLeft` script ile sona
  kadar kaydırılıp FİNAL kolonunun tam göründüğü doğrulandı.

## Sırada

P0 tamamlandı. Sonraki adımlar P1 listesinden.

## P1 (sonra)

Instagram içi tarayıcı uyarısı · WhatsApp önizleme görseli (`next/og`) · sözlük sayfası · beyaz lamba
(silah bilgisi DTO'ya eklenince). Ayrıca: `/turnuva/[id]` sayfasının kalan başlıkları Pist Konsolu'na
taşınmadı (bkz. yukarıdaki not) — ayrı bir madde olarak eklenebilir.

## Bilerek yapılmayanlar

7-segment/LED font (hesap makinesi hissi) · kırmızıyı buton/"canlı" rengi yapmak (canlı = mürekkep butonda
lamba noktası) · el yazısı, gazete kağıdı zemini · rastgele kulüp renkleri, arma üretici · FUT benzeri
parlak/dönen sporcu kartı · pul/eleme için damga, bilet görselleri · ekranda birden fazla metalik (lamé)
öğe · uygulama içinde yapay zekâ ile üretilmiş dekor objeleri · ürün fotoğrafı veya çizilmiş kopya.

## Referanslar

Football Manager 26 arayüzü (Bugün merkezi, başparmak hizasında aksiyon) · Hattrick HT Live (olay olay
gerilim, skor satır çözülünce değişir) · eskrim lamba kuralları (kırmızı sol, yeşil sağ, beyaz yalnız
flöre/kılıç) · pist geometrisi (14 m, orta çizgi, ±2 m en-garde, uyarı bölgeleri) · F1 TV grafikleri
(sıralama kulesi, altın yalnız şampiyonluk) · Top Eleven antrenman (değişim çipleri) · Türkiye Eskrim
Federasyonu klasman sıralaması (kategori/silah/cinsiyet terimleri; logo/kimlik kullanılmaz).
