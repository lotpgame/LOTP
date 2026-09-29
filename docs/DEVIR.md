# Devir notu — Yusuf ↔ Osman

> Son güncelleme: **2026-09-29** (Osman tarafı). Açık kararlar ve işler yalnız bu dosyada tutulur.
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

Şu an karar gerektiren açık madde yok. Küçük bir not, acil değil: motorun maç anlatımı
(`src/engine/combat/index.ts`, `src/server/careerService.ts`) hâlâ "🏁 … kazandı", "⏱ Süre doldu",
"🏅 Altın tuş!" gibi emoji'li satırlar üretiyor — arayüzün geri kalanında emoji kalmadı. İstersen
kaldırabilirsin, arayüz kazananı ve altın tuşu zaten ayrıca gösteriyor. Motor tarafı olduğu için Osman
dokunmuyor.

## Osman → Yusuf: Beyaz lamba için veri lazım (açık iş)

**İstek:** Gerçek eskrim cihazlarında flöre ve kılıçta hedef dışı vuruşta **beyaz lamba** yanar (epede yok
— tüm vücut hedef). Arayüz tarafında (`ScoreBug`, canlı anlatım) bunu göstermek istiyoruz ama motor şu an
hiçbir tuşun hedef içi/dışı olduğunu bilmiyor — her tuş geçerli sayılıyor (`combat/index.ts` içinde "hedef"
kelimesi yalnız maç puanı anlamında geçiyor, isabet bölgesi kavramı hiç yok).

**İhtiyaç:** Flöre/kılıç için her tuşa (muhtemelen `resolveExchange`/tuş üretilen noktada) olasılıksal bir
"hedef dışı mı" bayrağı — gerçekçi bir oran (FIE istatistiklerine yakın, örn. flörede ~%10-20 hedef dışı)
yeterli, hassas bir model şart değil. Epede bu kavram hiç uygulanmasın (her zaman geçerli/hedef içi). Bu
bilginin maç log'una veya `MatchResult`/DTO'ya eklenmesi lazım ki arayüz lambayı doğru renkte gösterebilsin.

Aciliyeti yok. Nasıl bir veri şekli/alan adı seçtiğini **Cevap** satırına yazarsan üstüne UI'ı bağlarım.

**Cevap (Yusuf):**

## Osman → Yusuf: Vercel deploy'u kontrol eder misin? (açık iş)

**Durum:** PR #39 (`ed0adf9`, WhatsApp/sosyal medya önizleme görseli — `next/og`) 29.09 saat 15:42'de
`master`'a merge edildi. GitHub Actions'daki "deploy" adımı (Vercel Deploy Hook'a webhook tetikleme)
15:44'te yeşil bitti — ama bu yalnız Vercel'e "başla" isteğinin gittiğini gösteriyor, gerçek build'in
bittiğini değil.

**Sorun:** Aradan ~3 saat geçmesine rağmen canlı site (`lotp-one.vercel.app`) hâlâ bu commit'in kodunu
göstermiyor: `/opengraph-image` rotası 404, `<head>`'de hiç `og:*`/`twitter:*` etiketi yok. Önbellek sorunu
değil (`Cache-Control: no-store`, `X-Vercel-Cache: MISS`, `Age: 0` — sayfa her istekte taze render
ediliyor). Kod yerelde `next build && next start` (production modu) ile doğrulandı, görsel doğru
üretiliyor — yani kodda bariz bir hata görünmüyor.

**İhtiyaç:** Vercel dashboard'a bakabilir misin — `ed0adf9` commit'ine ait deployment'ın durumu ne
(Building / Failed / Queued)? Failed ise hata logunu paylaşırsan bakarım (tahminim: `next/og`/Satori
render adımı Vercel'in build ortamında bir şeye takılıyor olabilir, yerelden farklı olarak). Osman
tarafının Vercel'e erişimi yok.

**Cevap (Yusuf):**

## Osman → Yusuf: Canlı turnuvada paralel-simülasyon çakışması (olası hata)

**Bulgu (29.09, testçi gözlemi):** Aynı gün 3-4 testçi karşılaştırıldı. Turnuva SÜRERKEN her oyuncu
farklı rakip/skor görüyor; turnuva BİTİNCE herkes aynı (tek) sonucu görüyor. İkincisi normal olması
gerekirken, birincisinin sebebi kod tarafında aşağıdaki gibi görünüyor — kontrol edip onaylar mısın?

**Zincir:**
1. `startLiveTournament` (`careerService.ts:2154`) aynı `scopeKey`'e kayıtlı diğer gerçek oyuncuları
   (`coHumans`) kendi `LiveState`'ine bot gibi dahil ediyor, ama tüm simülasyonu (havuz çekimi dahil,
   `seedKey` satır 2252) ÇÖZEN OYUNCUNUN KENDİ `gs.seed`'iyle çalıştırıyor. Aynı scopeKey'deki iki farklı
   gerçek oyuncunun `gs.seed`'i farklı olduğu için, ikisi de "aynı" turnuvayı bağımsız, birbirinden farklı
   sonuçlarla simüle ediyor — iki paralel evren.
2. `attendTournament` (satır 1419-1426) ve finalize adımı (satır 2558-2578) `scopeKey` ile dedup
   kontrolü yapıyor — ama yalnız "turnuva TAMAMEN bitmiş mi" diye bakıyor. Canlı mod dakikalarca sürdüğü
   için (maç arası 10 sn bekleme + animasyon), iki oyuncu neredeyse aynı anda "katıl"a basarsa ikisi de
   "henüz yok" görüp kendi canlı simülasyonunu başlatıyor.
3. Kim ÖNCE finalize'e ulaşırsa (satır 2583 `finalizeTournament`) o kişinin simülasyonu ortak `Tournament`
   satırına yazılıyor. Sonra bitiren oyuncu için (satır 2560-2578): kendi oynadığı/izlediği maçlar yok
   sayılıyor, `finalPosition`/ödül/XP "ilk bitenin simülasyonunda ben ne yapmışım"a göre veriliyor — yani
   ikinci oyuncu kendi ekranında gördüğü sonucu değil, başkasının simülasyonundan miras kalan bir sonucu
   alıyor.

**Referans:** Offline/otomatik yol (`autoResolveTournament`, satır 2934 — "M11.3b-1") bunu doğru
çözüyor: ilk çözen herkesi TEK simülasyonda hesaplıyor, sonrakiler sadece okuyor. Canlı yolun
("M11.3b-2", satır 2163) aynı garantiyi henüz vermediği görülüyor — muhtemelen zaten planındaydı, kod
içindeki kendi notların (satır 2163, 2929) buna işaret ediyor.

**Öneri (benim, karar sende):** Canlı yolun da "ilk giren tek otorite, sonrakiler onu izler/paylaşır"
modeline geçmesi gerekebilir — belki ikinci oyuncu canlı moda hiç girmeden ilkinin simülasyonuna
bağlanır, belki başka bir kilitleme. Tasarımı sana bırakıyorum, aciliyeti test aşamasında düşük ama
canlıya çıkmadan önce netleşmeli.

**Cevap (Yusuf):**

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
| 2026-09-29 | Ekipman kataloğu teslim edildi: `itemsForWeapon` + GLOVE/CHEST slotları + mağaza UI birlikte (Yusuf tarafı ikisini de bağladı). Kalan küçük not: yeni ürünlerin EN/DE i18n adları yok, TR'ye düşüyor — acil değil, ayrı iş olarak eklenebilir | Yusuf |
| 2026-09-20 | Kalıcı giriş: Google OAuth + IP'den ülke | Yusuf |
