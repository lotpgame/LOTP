# Devir notu — Yusuf ↔ Osman

> Son güncelleme: **2026-09-28** (Osman tarafı). Açık kararlar ve işler yalnız bu dosyada tutulur.
> **Yusuf'un Claude'u:** oturum başında bu dosyayı oku. Açık madde varsa Yusuf'la sırayla geç, kararlarını
> **Cevap:** satırlarına yaz, sonra commit + push et.

## Nasıl kullanılır

1. Yusuf, Claude'una şunu yazar:
   *"docs/DEVIR.md'yi oku. Benden beklenenleri sırayla anlat, her birinde neye karar vermem gerektiğini
   söyle. Kararlarımı Cevap satırlarına yaz, sonra commit + push et."*
2. Cevaplar bu dosyadaki **Cevap:** satırlarına yazılır ve `master`'a push edilir. Yalnız doküman
   değişikliği olduğu için oyunu etkilemez.
3. Yusuf, Osman'a "DEVIR'i güncelledim" der. Osman tarafı dosyayı okur ve devam eder.
4. Cevaplanan/biten maddeler **Karar günlüğü**ne taşınır, buradan silinir — dosya küçük kalır.

🔒 **Gizli değerler buraya yazılmaz.** Deploy Hook URL'si, şifre veya token dosyaya, commit mesajına ya da PR
yorumuna girmez. Yapıldıysa yalnız "✅ yapıldı" yazılır.

## Durum (28.09, akşam)

- **Canlıda.** CI + Deploy Hook çalışıyor (her iki taraf da doğruladı: Yusuf'un kendi push'ları ve
  Osman'ın merge'leri otomatik yayınlanıyor). Pist Konsolu UI'ı (menü, Bugün, ekipman, turnuvalar, giriş,
  klasman, antrenman, canlı maç, pul kağıdı, manşet cümleleri, 7 günlük hafta şeridi, emoji temizliği)
  ve Yusuf'un ekonomi dengesi + "Yeni Başla" butonu tek tarafta çakışma olmadan `master`'da.
- **Açık PR yok.** Zincirdeki tüm PR'lar merge edildi veya (içeriği zaten `master`'da olduğu için)
  kapatıldı. Yeni bir iş için doğrudan `master`'dan dal aç.
- **Canlı veri korunuyor.** Değişiklikler şemaya, oyun motoruna (`src/engine`) ve sunucuya (`src/server`)
  dokunmadı. Testçilerin kariyerleri olduğu gibi.
- **Önizleme görselleri:** [`docs/tasarim/onizleme/`](tasarim/onizleme/). `telefon-*` 390 px,
  `masaustu-*` 1440 px; yerel test sürümünden.
- **Tasarım kuralları** (renkler, ikonlar, emoji yok, 44 px dokunma alanı):
  [`docs/tasarim/pist-konsolu.md`](tasarim/pist-konsolu.md). UI'a dokunmadan önce Claude bunu okumalı.
- **Ekonomi planı** (fiyatlar, ödüller, yıpranma/büyüme, iş bölümü):
  [`docs/EKONOMI.md`](EKONOMI.md).

## Çakışma olmasın diye

- **Ortak dosyalar** (ikimiz de dokunabiliriz — büyük değişiklik öncesi haber ver): `src/i18n/index.ts`,
  `CHANGELOG.md`, `src/app/kariyer/**`, `src/app/turnuva/**`, `src/app/ui/**`.
- **Serbest (Osman dokunmaz):** oyun motoru (`src/engine`), sunucu (`src/server`), şema.
- **Ekipman ikonları:** kendi GLADIUS setimiz (PR #5). Marka sitelerinden vektör çıkarılmıyor — telif riski.

## Senden beklenenler (Yusuf)

- **✅ Ekipman kataloğu yapıldı (Yusuf/Claude, 29.09).** `src/engine/equipment.ts` artık silaha özel:
  `itemsForWeapon(weapon)` + yeni slot'lar `GLOVE`/`CHEST` (senin ikonlarınla) + silaha özel silah/maske/
  yelek/kordon. **Epe:** elektrikli yelek + maske kordonu GİZLİ, vücut kordonu DURUR. **Elektrikli yelek**
  silaha özel (flöre "flöre için", kılıç "kılıç için"; biri diğerini görmez). Mağaza (`ekipman/page.tsx`)
  `itemsForWeapon`'a bağlandı, `NOT_FOR_EPEE` hack'i kaldırıldı, `SLOT_ICON`+`GROUPS`'a GLOVE/CHEST eklendi.
  Eski id'ler legacy korunuyor (canlı veri). **Not (Osman):** yeni ürün id'lerinin i18n adları (EN/DE) yok →
  şimdilik Türkçe item.name'e düşüyor; istersen `gladius.gl-*-foil/…` anahtarlarını eklersin.

Bunun dışında karar gerektiren açık madde yok. Küçük bir not, acil değil: motorun maç anlatımı
(`src/engine/combat/index.ts`, `src/server/careerService.ts`) hâlâ "🏁 … kazandı", "⏱ Süre doldu",
"🏅 Altın tuş!" gibi emoji'li satırlar üretiyor — arayüzün geri kalanında emoji kalmadı. İstersen
kaldırabilirsin, arayüz kazananı ve altın tuşu zaten ayrıca gösteriyor. Motor tarafı olduğu için Osman
dokunmuyor.

## Yusuf → Osman: Ekipman kataloğunu genişlet (açık iş)

**İstek:** GLADIUS mağazasındaki ürünleri gerçek FIE malzeme listesine göre çoğaltalım. İleride başka
markalar da (Leon, PBT…) geleceği için **her marka açılır-kapanır panel** olsun (şimdilik tek panel:
GLADIUS). Ürün ikonlarını **Osman çizecek**; Yusuf tarafı temel listeyi/yapıyı belirledi.

**Yapı kararları (Yusuf):**
- **Silaha göre filtre:** oyuncu yalnız kendi silahının malzemesini + ortak malzemeleri görür.
- **Ortak malzemeler 1 kez:** çorap, ayakkabı, göğüs koruyucu, ceket+pantolon, plastron her silahta aynı.
- **Maça etki:** küçük ama ana parçalar (silah, lame, ayakkabı) aksesuardan biraz daha etkili. Bonus
  değerleri motor tarafı (Yusuf/Claude, `src/engine/equipment.ts`) — Osman dokunmaz.

**İş bölümü:**
- **Yusuf tarafı (Claude):** `src/engine/equipment.ts` kataloğu — aşağıdaki ürünler + fiyat + bonus +
  `itemsForWeapon(weapon)` filtre helper'ı. Eski id'ler legacy kalır (canlı veri korunur).
- **Osman:** mağaza sayfası (`ekipman/page.tsx`) → marka açılır-kapanır panel; `itemsForWeapon`'a göre
  listeleme; yeni ürünler için ikonlar (**eldiven** ve **göğüs koruyucu** setinde henüz yok).

**Ürün listesi + fiyatlar (Denar):** "Lame" → net Türkçe **"Elektrikli Yelek"**. Fiyat sırası: Elektrikli
Yelek > Ceket+Pantolon > Silah (detay: `docs/EKONOMI.md` §2).

*Ortak (her silah — 1 kez):*

| Ürün | Slot | Đ | Not |
|---|---|--:|---|
| Eskrim Ceketi + Pantolon | CLOTHING | 420 | Standart beyaz koruyucu takım |
| Eskrim Ayakkabısı | SHOES | 280 | Ayak tekniği/denge |
| Gladius Çanta | BAG | 150 | Kozmetik (etki yok) |
| Göğüs Koruyucu | CHEST | 90 | **yeni ikon** |
| Plastron | PLASTRON | 80 | Koltuk altı koruyucu |
| Eskrim Çorabı | SOCKS | 30 | Uzun çorap |

*Silaha özel (fiyatlar):*

| Ürün | Slot | Đ |
|---|---|--:|
| Elektrikli Yelek (kılıç) | LAME | 550 |
| Elektrikli Yelek (flöre) | LAME | 500 |
| Silah | WEAPON | 400 |
| Maske (kılıç, tam iletken) | MASK | 320 |
| Maske (flöre çene / epe yalıtkan) | MASK | 260 |
| Eldiven | GLOVE | 150 · kılıç 90 (manşet iletken) — **yeni ikon** |
| Vücut Kablosu | CORD | 100 |
| Maske Kablosu | MASK_CORD | 50 |

*Flöre (FOIL):* Silah · Maske (çene iletken) · Elektrikli Yelek (gövde) · **Eldiven** · Vücut Kablosu · Maske Kablosu
*Epe (EPEE):* Silah · Maske (yalıtkan) · **Eldiven** · Vücut Kablosu (3 soket) · (yelek YOK, maske kablosu YOK)
*Kılıç (SABRE):* Silah · Maske (tam iletken) · Elektrikli Yelek (gövde+kol) · **Eldiven** (manşet iletken) · Vücut Kablosu (2 soket) · Maske Kablosu

**Yeni slot'lar:** `GLOVE`, `CHEST` — Icon setine 2 yeni ikon. Mevcut mağazadaki `NOT_FOR_EPEE` hack'i
artık gerekmez; filtre motorda `itemsForWeapon` ile yapılacak.

**Sıra:** Yusuf tarafı katalogu bir dala/PR'a koyunca haber verir → Osman üstüne mağaza + ikon PR'ı açar
(ya da tek PR'da birlikte). Katalog + UI birlikte canlıya çıkmalı (yoksa ikonsuz görünür).

**⭐ Yıpranma/büyüme sırası (Yusuf kararı, 28.09):** Önce Osman mağazayı/kataloğu yeniler → SONRA Yusuf
tarafı yıpranma + büyüme + gizli etki motorunu ekler (dayanıklılık barını Osman çizer). Detay:
`docs/EKONOMI.md` §0, §2, §5.

**Cevap (Osman):** Onaylandı, iş bölümü ve sıra uygun. **Kendi tarafımdaki hazırlık bitti ve canlıda:**
GLADIUS vitrini artık açılır/kapanır marka paneli (`ekipman/BrandPanel.tsx`), yeni ikonlar `glove` +
`chest` çizildi (`ui/Icon.tsx`). **Şimdi sırada sen (Yusuf tarafı) varsın:** `itemsForWeapon` + yeni
ürünler/slot'lar (`GLOVE`, `CHEST`) `src/engine/equipment.ts`'e gelince bir dala koy, burada veya PR
açıklamasında haber ver — üstüne kurup mağazayı yeni katalogla bağlarım.

## Karar günlüğü

| Tarih | Karar | Kim |
|---|---|---|
| 2026-09-28 | Vercel Deploy Hook + GitHub secret kuruldu ve doğrulandı; CI (`chore/ci`) merge edildi, otomasyon çalışıyor | Yusuf + Osman |
| 2026-09-28 | Canlı maçta taraf renkleri onaylandı: sen sol+kırmızı (gerçek cihaz gibi) | Yusuf |
| 2026-09-28 | Yaş grubu ölçeği (`ui/bands.ts`) taslak değerleriyle (U10=30·U12=45·U14=60·U17=80·Büyükler=100) kalıcı | Yusuf |
| 2026-09-28 | Telefonla giriş güvenliği (OTP/Google OAuth) release'e ertelendi | Yusuf |
| 2026-09-28 | Testçilere ayrı duyuru yapılmayacak | Yusuf |
| 2026-09-28 | Ayarlar'daki çift reset butonu tek "Yeni Başla"ya indirildi | Yusuf + Claude |
| 2026-09-28 | Kullanılmayan çeviri anahtarı `ekipman.marketNote` kaldırıldı | Osman |
| 2026-09-28 | Osman tarafı PR'ları kendisi merge edebilir; önizleme ortamı yok, merge = canlı | Yusuf |
| 2026-09-28 | Canlı test verisi asla silinmez: yalnız eklemeli şema, sıfırlama yok (CONTRIBUTING §2) | Yusuf + Osman |
| 2026-09-28 | Ekipman görselleri: kendi ikonlarımız (GLADIUS), marka ürünü kopyalanmaz | Osman |
| 2026-09-28 | Ekipman kataloğu genişletme: iş bölümü Yusuf tarafı=motor/katalog, Osman=mağaza UI+ikon; önce mağaza sonra yıpranma motoru | Yusuf |
| 2026-09-20 | Kalıcı giriş: Google OAuth + IP'den ülke | Yusuf |
