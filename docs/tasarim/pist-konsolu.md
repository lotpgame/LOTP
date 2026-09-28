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

## Sırada (P0)

4. Canlı maç: skor bandı, doğru taraf renkleri, üstte kilitli sekmeler, 44 px kontroller *(Yusuf onayı)*
10. Klasman: F1 sıralama kulesi (timing tower) tarzı

## P1 (sonra)

Pul kağıdı yeniden çizimi · manşet cümleleri (+ WhatsApp paylaşım metni, kullanıcı kendisi gönderir) ·
canlıda periyot/ara/altın tuş bandı · 7 günlük hafta şeridi · antrenman planında ikonlu segment seçici ·
tema ön ayarları yeniden adlandırma + kontrast uyarısı · Almanca etiket uzunlukları · Bugün'de kimlik
kartı · eleme ağacı yatay kaydırma · Kulüp arması (nötr kalkan) · Instagram içi tarayıcı uyarısı ·
WhatsApp önizleme görseli (`next/og`) · sözlük sayfası · beyaz lamba (silah bilgisi DTO'ya eklenince) ·
Geçmiş sayfası sıralama kulesi tarzı.

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
