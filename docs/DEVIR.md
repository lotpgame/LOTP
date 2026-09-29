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
- **Serbest (Osman dokunmaz):** oyun motoru (`src/engine`), sunucu (`src/server`), şema. **İstisna
  (29.09):** `careerService.ts` içinde canlı turnuva seed hatası — bkz. Karar günlüğü 2026-09-29 — Osman
  tarafı tarafından düzeltildi (Yusuf'un önceliği yetişmediği için, Osman'ın açık onayıyla). Şema/motora
  (`src/engine`) dokunulmadı, yalnız `src/server/careerService.ts`'te tohum kaynağı değişti. Senkronize
  olurken bu commit'i normal bir merge olarak al; çakışma beklenmiyor (kimse aynı satırlara dokunmadı).
- **Ekipman ikonları:** kendi GLADIUS setimiz (PR #5). Marka sitelerinden vektör çıkarılmıyor — telif riski.

## Yusuf → Osman: `aiDevMonth` DB UYGULANDI ✅ — merge edebilirsin (ama ÖNCE dalını güncelle)

**✅ Canlı DB hazır (Yusuf/Claude, 30.09):** `fix/ai-dev-month-dedup` için gereken prod adımı yapıldı —
canlı Neon'a `aiDevMonth` kolonu eklendi (`INTEGER NOT NULL DEFAULT -1`, eklemeli → **çalışan site kırılmadı**,
mevcut kod kolonu görmezden geliyor) + veri-düzeltmesi çalıştı (**23 AI → aiDevMonth=1** = güncel ay; ani
gelişim sıçraması engellendi). Doğrulandı: **8 insan kariyeri sağlam.** Yani DB tarafı tamam, **PR'ı merge edebilirsin.**

**⚠️ AMA ÖNCE DALINI GÜNCELLE (yoksa Yusuf tarafının işleri geri gider):** Dalın `9b335ce`'den (paralel-sim
fix) ayrılmış. O günden bu yana master'a giren ve **dalında OLMAYAN** işler:
- **Ekipman kataloğu** (silaha göre `itemsForWeapon` + eldiven/göğüs) — `equipment.ts`, `ekipman/page.tsx`
- **Beyaz lamba** (flöre hedef-dışı) — `combat/index.ts`
- **Kondisyon gece toparlanma (#35)** — `careerService.ts` ← **seninkiyle AYNI dosya, çakışır**
- Ekonomi dengesi, Yeni Başla, klasman mobil, sakatlık 1-2 gün, `docs/TURNUVA_MULTIPLAYER.md` + DEVIR/CHANGELOG/NOTLAR

Merge'den önce **güncel master'ı dalına çek (rebase/merge) ve çakışmaları çöz.** Özellikle:
`careerService.ts` → **benim kondisyon düzeltmem + senin AI-dev fix'in İKİSİ de kalmalı**; `DEVIR.md` →
benim güncel notlarım korunmalı (dalın eski DEVIR'i geri almasın). Rebase sonrası `npx vitest run` yeşil kalmalı.

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

**Cevap (Yusuf/Claude, 29.09): ✅ Motora eklendi.** FIE doğrulandı → **yalnız FLÖRE** (kılıç/epede beyaz lamba
YOK — kılıçta hedef-dışı zaten hiç yanmaz, epede tüm vücut geçerli). `combat/index.ts`: flörede tek taraf tuş
bulduğunda **%15** (`FOIL_OFF_TARGET_PROB`, tunable) olasılıkla hedef-dışı → sayı yok, hamle durur.
**UI sözleşmesi:** maç log'una şu satır düşer → `⚪ Beyaz lamba — {ad} hedef dışına dokundu. Sayı yok.`
(EN: `⚪ White light — …`). Canlı oynatmada/pul kağıdında bu satırı yakalayıp **beyaz lambayı** flash'layabilirsin
(satır `⚪` ile başlıyor / "Beyaz lamba"/"White light" içeriyor). Hem tam maç hem canlı periyot yolunda çalışır.

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

**Cevap (Yusuf/Claude, 30.09): ✅ ÇÖZÜLDÜ (kendiliğinden).** Canlıda `lotp-one.vercel.app/opengraph-image`
artık **1200×630 görseli servis ediyor** (og rotası çalışıyor). Yani #39 deploy'u inmiş — muhtemelen ilk
gecikmeydi ya da sonraki bir push tetikledi. Deploy pipeline çalışıyor; sonraki push'lar canlıya iniyor.

## Canlı turnuva paralel-simülasyon çakışması — ✅ ara düzeltme + B kararı

**Bulgu (Osman, 29.09):** Aynı scopeKey'deki 2+ gerçek oyuncu turnuvayı kendi `gs.seed`'iyle AYRI
simüle ediyordu → herkes farklı sonuç görüyordu ("paralel evren").

**✅ Ara düzeltme (Osman, `9b335ce`):** Canlı turnuva seed'i artık PAYLAŞILAN `tour:${scopeKey}` →
aynı kapsamdaki herkes AYNI deterministik bracket/sonucu üretir. Acil tutarsızlık giderildi (testte yeterli).

**Karar (Yusuf, 29.09): B — gerçek-zamanlı çok-oyunculu turnuva (release öncesi mimari kilometre taşı).**
256+ gerçek oyuncu, hepsi taktik verir, herkes TEK gerçekliği yaşar; istemci-güdümlü akış sunucu-otoriteliye
taşınır. Ara düzeltme tutarlılığı sağladı; B tam gerçek-zamanlı taktik senkronu + ölçeği getirecek.
Tam tasarım: [`docs/TURNUVA_MULTIPLAYER.md`](TURNUVA_MULTIPLAYER.md).

## Yusuf → Osman: B'yi SEN üstlen — Gerçek-zamanlı çok-oyunculu turnuva (açık iş)

**Devir (Yusuf, 30.09):** 256+ gerçek oyuncu, hepsi taktik verir, herkes TEK gerçekliği yaşar. Bu mimari
kilometre taşını **Osman tarafı üstlenecek** (kendi AI'ı kodlar). Yusuf/Claude **tam tasarımı** hazırladı;
sen **onaylayınca** fazları (0→4) uygularsın. Aynı GitHub → tasarım sende zaten.

- **Tasarım (oku):** [`docs/TURNUVA_MULTIPLAYER.md`](TURNUVA_MULTIPLAYER.md) — ilkeler, bileşenler,
  yaşam döngüsü, **Faz 0–4**, açık kararlar (tik tetikleme, taktik penceresi, ölçek…).
- **Çakışma önleme:** bu iş sürerken **Claude canlı-turnuva SUNUCU koduna dokunmaz**
  (`careerService` canlı yol, `startLiveTournament`, `finalizeTournament`). Sen serbestçe yeniden yazarsın.
  Yusuf tarafı yalnız motor kurallarına (skill/economy/combat/conditioning) devam eder.
- **Açık kararları** (`docs/TURNUVA_MULTIPLAYER.md` §5) uygularken takıldığın olursa **Cevap** satırına yaz,
  Yusuf netleştirir.

**Cevap (Osman):**

## Karar günlüğü

| Tarih | Karar | Kim |
|---|---|---|
| 2026-09-29 | Canlı turnuva paralel-simülasyon hatası düzeltildi: `startLiveTournament`'ta tohum artık çözen oyuncunun `gs.seed`'i değil PAYLAŞILAN `scopeKey`; AI seçimi `orderBy: id asc`; çekim listesi karıştırmadan önce id'ye sıralanıyor. Yusuf'un önceliği yetişmediği için Osman'ın açık onayıyla `src/server` istisnası kullanıldı. Testler yeşil (168/168) + yeni regresyon testi (`rng.test.ts`). Ayrı, DAHA BÜYÜK bir bulgu henüz düzeltilmedi: `worldAdvanceTx`'teki AI aylık gelişim/yorgunluk toparlanması da her insanın kendi gün-ilerletmesinde tekrar tetiklenebiliyor (şema değişikliği + mevcut veriyi bozmadan geçiş gerektiriyor) — Osman'a ayrı raporlandı, onay bekliyor | Osman + Claude |
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
| 2026-09-30 | B (256+ gerçek-zamanlı çok-oyunculu turnuva) uygulaması **Osman tarafına devredildi**; tasarım Yusuf/Claude'dan (`docs/TURNUVA_MULTIPLAYER.md`), kod Osman AI'ı. Claude canlı-turnuva sunucu koduna dokunmaz (çakışma önleme) | Yusuf |
| 2026-09-20 | Kalıcı giriş: Google OAuth + IP'den ülke | Yusuf |
