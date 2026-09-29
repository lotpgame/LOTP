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
