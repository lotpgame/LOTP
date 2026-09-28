# Devir notu — Yusuf ↔ Osman

> Son güncelleme: **2026-09-28** (Osman tarafı). Açık kararlar ve işler yalnız bu dosyada tutulur.
> **Yusuf'un Claude'u:** oturum başında bu dosyayı oku. Aşağıdaki "Senden beklenenler" listesini Yusuf'la
> sırayla geç, kararlarını **Cevap:** satırlarına yaz, sonra commit + push et.

## Nasıl kullanılır

1. Yusuf, Claude'una şunu yazar:
   *"docs/DEVIR.md'yi oku. Benden beklenenleri sırayla anlat, her birinde neye karar vermem gerektiğini
   söyle. Kararlarımı Cevap satırlarına yaz, sonra commit + push et."*
2. Cevaplar bu dosyadaki **Cevap:** satırlarına yazılır ve `master`'a push edilir. Yalnız doküman
   değişikliği olduğu için oyunu etkilemez.
3. Yusuf, Osman'a "DEVIR'i güncelledim" der. Osman tarafı dosyayı okur ve devam eder.

🔒 **Gizli değerler buraya yazılmaz.** Deploy Hook URL'si, şifre veya token dosyaya, commit mesajına ya da PR
yorumuna girmez. Yapıldıysa yalnız "✅ yapıldı" yazılır.

## Durum (28.09)

- **⚠️ GÜNCELLEME (28.09, Yusuf):** Tüm UI zinciri (`feat/ui-pul-kagidi`) tek merge commit'iyle
  doğrudan `master`'a alındı ve canlıya çıkarıldı (Yusuf'un push'u → Vercel deploy). Deploy Hook
  (Madde 1) beklenmeden gidildi; senin push'ların için hook hâlâ gerekli, kurmanı öneririz.
  Açık PR'ların (#2–#16) artık master'da; GitHub'da otomatik "merged"/kapanmış görünebilir.
- **Canlı veri korunuyor.** Merge şemaya, oyun motoruna (`src/engine`) ve sunucuya (`src/server`)
  dokunmuyor. Testçilerin kariyerleri olduğu gibi kalır.
- **Önizleme görselleri:** [`docs/tasarim/onizleme/`](tasarim/onizleme/). `telefon-*` 390 px,
  `masaustu-*` 1440 px; yerel test sürümünden alındı.
- **Tasarım kuralları** (renkler, ikonlar, emoji yok, 44 px dokunma alanı):
  [`docs/tasarim/pist-konsolu.md`](tasarim/pist-konsolu.md). UI'a dokunmadan önce Claude bunu okumalı.

| PR | İçerik | Merge için bekleyen |
|---|---|---|
| [#2](https://github.com/alkanyus/LOTP/pull/2) | CI (lint + test + build) + Vercel Deploy Hook | **Madde 1** |
| [#3](https://github.com/alkanyus/LOTP/pull/3) | Temel: renkler, fontlar, ikon seti, yeni menü (telefonda altta 5 sekme, masaüstünde sol sidebar) | #2 |
| [#4](https://github.com/alkanyus/LOTP/pull/4) | Bugün ekranı + yaş grubuna göre değer çubukları | **Madde 3** |
| [#5](https://github.com/alkanyus/LOTP/pull/5) | GLADIUS mağazası + kendi ekipman ikonlarımız | #4 |
| [#6](https://github.com/alkanyus/LOTP/pull/6) | Turnuvalar: 3 butonlu taktik seçimi, net kayıt durumu | #5 |
| [#7](https://github.com/alkanyus/LOTP/pull/7) | Yeni giriş ekranı (sporcu oluşturma) | #6 |
| [#8](https://github.com/alkanyus/LOTP/pull/8) | Klasman: sıralama kulesi | #7 |
| [#11](https://github.com/alkanyus/LOTP/pull/11) | Giriş ekranı masaüstünde iki sütun (solda vitrin, sağda form) | #8 |
| [#12](https://github.com/alkanyus/LOTP/pull/12) | Antrenman planı: ikonlu 5'li seçim, "Kaydedilmedi" uyarısı | #11 |
| [#14](https://github.com/alkanyus/LOTP/pull/14) | Kalan sayfalarda emoji temizliği (Geçmiş, Kulüp, Ayarlar …) + stil katmanı düzeltmesi | #12 |
| [#9](https://github.com/alkanyus/LOTP/pull/9) | Canlı maç: skor bandı, cihaz renkleri | **Madde 2** (+ #14) |
| [#16](https://github.com/alkanyus/LOTP/pull/16) | Pul kağıdı yeniden çizildi (FIE düzeni, kendi satır + sütun işaretli) | #9 |
| [#18](https://github.com/alkanyus/LOTP/pull/18) | Manşet cümleleri ("U10 İl Şampiyonası: … şampiyon!") + WhatsApp'ta paylaş | #16 |

PR'lar zincirli: her biri bir öncekinin üstüne kurulu, tablodaki sırayla merge edilir. #9 zincirin sonuna
(#14'ün üstüne) taşındı; #9, #16 ve #18 renk kararını (Madde 2) bekler, üstlerindekiler beklemez.

## Senden beklenenler (Yusuf)

### 1. 🔴 Vercel Deploy Hook — bütün merge'leri bekletiyor (~5 dk)

**Neden:** Vercel Hobby, proje sahibi olmayan birinin (`gencosman10`) commit'ini deploy etmiyor. Hata:
*"Git author gencosman10 must have access…"*. Yani biz merge etsek de canlıya çıkmaz. PR #2'deki CI,
merge'den sonra Vercel'e hook ile "deploy et" der. Senin kendi push'ların eskisi gibi otomatik deploy
olur; CI senin commit'lerinde hook'u çağırmaz, çift deploy olmaz.

1. vercel.com → LOTP projesi → **Settings → Git → Deploy Hooks**.
   Name: `github-actions`, Branch: `master` → **Create Hook** → çıkan URL'yi kopyala.
2. github.com/alkanyus/LOTP → **Settings → Secrets and variables → Actions → New repository secret**.
   Name: `VERCEL_DEPLOY_HOOK`, Secret: kopyaladığın URL → **Add secret**.
3. URL'yi kimseye gönderme. Bilen herkes deploy tetikleyebilir. Buraya da yazma.

**Cevap:** ✅ Vercel Deploy Hook + GitHub secret `VERCEL_DEPLOY_HOOK` kuruldu ve doğrulandı (Yusuf, 28.09).
➡️ **Kalan tek adım: PR #2 (`chore/ci`) merge** — merge edince `ci.yml` canlıya iner ve otomasyon başlar.
Osman, hook hazır: #2'yi merge edebilirsin (kendi PR'ın, CI'yı sen doğrula).

### 2. 🟠 Canlı maçta taraf renkleri (PR #9)

**Ne değişti:** Oyuncu artık hep **solda ve kırmızı**, rakip sağda ve yeşil. Gerçek eskrim cihazında da
sol kırmızı, sağ yeşildir. Önceki kodda "sen yeşil, rakip kırmızı" idi.

- Renk iyi/kötü anlamına gelmiyor. Hangisinin sen olduğunu skor bandındaki **SEN** etiketi gösteriyor.
- Görseller: [`telefon-4-canli-mac.png`](tasarim/onizleme/telefon-4-canli-mac.png) ve
  [`masaustu-5-canli-mac.png`](tasarim/onizleme/masaustu-5-canli-mac.png).

Seçenekler:

- **(a) Onay.** #9 merge edilir; testçilere duyurulur (Madde 5).
- **(b) Eskisi gibi kalsın** (sen yeşil). #9'u buna göre değiştiririz.

**Cevap:** (a) Onaylandı — sol+kırmızı düzeni uygun (Yusuf, 28.09). #9 canlıya alındı.

### 3. 🟠 Yaş grubu ölçeği (PR #4)

**Ne değişti:** Bugün ekranındaki yetenek çubukları artık 0–100'e göre değil, yaş grubunun üst sınırına göre
dolar. Eskiden 8 yaşındaki bir sporcunun 12'lik değeri boş çubuk gibi görünüyordu.

- Mutlak değer (örn. 13.4) yine yanında yazar.
- Motor değerleri değişmez; bu yalnız görünüm.
- Tablo [`src/app/ui/bands.ts`](../src/app/ui/bands.ts) içinde:
  `U10 = 30 · U12 = 45 · U14 = 60 · U17 = 80 · sonrası = 100`.

Bu sayılar bizim tahminimiz. Sen antrenörsün: bu yaş grubunda **iyi bir sporcu** motorda tipik olarak kaça
ulaşır? Claude'undan `src/engine` içindeki gelişim/potansiyel eğrisine bakıp her yaş grubu için öneri
isteyebilirsin.

**Cevap:** Taslak uygun (Yusuf, 28.09) — U10=30 · U12=45 · U14=60 · U17=80 · Büyükler=100 canlıda kalsın.
İleride antrenör gözüyle ince ayar yapılabilir.

### 4. 🔴 Telefonla giriş güvenliği (ROADMAP §H R1)

**Açık:** Telefonla giriş doğrulamasız (OTP yok). Kayıtlı bir numarayı yazan herkes o hesaba girebiliyor.
Site canlı olduğu için bu gerçek bir risk.

Doğrulama eklemek kimseyi dışarıda bırakmaz: kimlik 5 yıllık çerezde duruyor, mevcut cihazlarda oynamaya
devam edilir.

Seçenekler:

- **(a) Hızlı önlem, şimdi.** Biz yaparız, 1 PR. Telefonla giriş yalnız "bu cihazı numarama bağla" olur;
  başka birinin hesabına giriş kapanır.
  *Bedeli:* Google girişi gelene kadar yeni bir cihazdan eski hesaba geçilemez.
- **(b) Kalıcı çözüm: Google ile giriş** (20.09'daki kararın). Şunlar gerekiyor:
  - Google Cloud'da OAuth client (Client ID + Client Secret) oluşturman; bunu yalnız sen yapabilirsin.
  - Bu değerleri Vercel ortam değişkenlerine eklemen. Buraya yazma.
  - Kod kısmını biz de yazabiliriz, sen de.
- **(a) + (b):** önce hızlı önlem, sonra Google.

**Cevap:** ERTELENDİ — oyun release edilirken yapılacak (Yusuf, 28.09). Şimdilik gündemde değil.

### 5. 🟡 Testçilere duyuru (merge günü)

Merge'ler canlıya çıkınca testçiler yeni görünümü görecek. Hata sanılmasın diye kısa bir duyuru öneriyoruz.
Taslak (WhatsApp için, istediğin gibi değiştir):

> Oyunun görünümü yenilendi. Menü artık telefonda altta, bilgisayarda solda. "Profil"in adı "Bugün" oldu;
> yeteneklerin aynı sayfanın altında. Canlı maçta artık hep soldasın ve kırmızısın, gerçek eskrim cihazındaki
> gibi. Turnuva bitince sonucunu WhatsApp'ta paylaşabilirsin. Kariyerin ve ilerlemen aynen duruyor. Bir sorun görürsen "Bildir" butonunu kullan.

**Cevap:** Gerek yok (Yusuf, 28.09) — duyuru yapılmayacak.

## Çakışma olmasın diye

- **Açık PR'ların dokunduğu dosyalar:**
  - `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/actions.ts`
  - `src/app/kariyer/**`, `src/app/turnuva/**`, `src/app/ui/**`
  - `src/i18n/index.ts`, `CHANGELOG.md`

  Bunlar merge olana kadar bu dosyalarda büyük değişiklik yapacaksan önce Osman'a haber ver. En çok
  çakışan dosya `src/i18n/index.ts`.
- **Serbest:** Oyun motoru (`src/engine`), sunucu (`src/server`) ve şema. Biz bunlara dokunmuyoruz.
- **Ekipman ikonları:** biz çizdik (PR #5, kendi GLADIUS seti). PBT sitesinden vektör çıkarmana gerek yok.
  Marka ürünlerini kopyalamak telif riski taşıyor.

## Senin alanında fark ettiklerimiz (acil değil, bilgi için)

Bunlar oyun motoru ve sunucu tarafında. O dosyalara biz dokunmuyoruz, karar senin:

- **Maç anlatımında emoji:** `src/engine/combat/index.ts` ve `src/server/careerService.ts` "🏁 … maçı kazandı",
  "⏱ Süre doldu", "🏅 Altın tuş!" satırlarını üretiyor. Arayüzün geri kalanında emoji kalmadı; istersen bu
  sembolleri kaldırabilirsin. Arayüz zaten kazananı ve altın tuşu ayrıca gösteriyor.
- **Ayarlar'da iki buton aynı işi yapıyor:** "Yeni Kariyer" ve "Kariyeri Sil" ikisi de `resetCareerAction`'ı
  çağırıyor. Bilerek mi? → ✅ ÇÖZÜLDÜ (Yusuf/Claude, 28.09): tek **"Yeni Başla"** butonuna indirildi.
  Dokunulan dosyalar: `src/app/kariyer/ayarlar/page.tsx` + `src/i18n/index.ts` (settings.newCareer*).
- **Kullanılmayan çeviri anahtarı:** `ekipman.marketNote` hiçbir yerde kullanılmıyor.

## Osman tarafının sıradaki işleri

1. Hook gelince #2 merge → sonra #3 … #8, #11, #12, #14 sırayla merge. Her biri canlıya çıkar, şema değişmez.
2. #9, #16, #18: Madde 2 cevaplanınca bu sırayla merge.
3. Madde 4'ün cevabına göre giriş güvenliği PR'ı.
4. Sonra (P1):
   - beyaz lamba (flöre/kılıç geçersiz tuş)

## Yusuf → Osman: yeni iş — Ekipman kataloğunu genişlet

**İstek (Yusuf):** GLADIUS mağazasındaki ürünleri gerçek FIE malzeme listesine göre çoğaltalım.
İleride başka markalar da (Leon, PBT…) geleceği için **her marka açılır-kapanır panel** olsun
(şimdilik tek panel: GLADIUS). Ürün ikonlarını **sen çizeceksin** (kendi setinde, senin stilinde);
biz burada sadece **temel listeyi/yapıyı** belirliyoruz.

**Yapı kararları (Yusuf):**
- **Silaha göre filtre:** oyuncu yalnız kendi silahının malzemesini + ortak malzemeleri görür
  (epeciye lame/maske kablosu gösterilmez).
- **Ortak malzemeler 1 kez:** çorap, ayakkabı, göğüs koruyucu, ceket+pantolon, plastron her silahta aynı.
- **Maça etki:** küçük ama ana parçalar (silah, lame, ayakkabı) aksesuardan biraz daha etkili.
  ⚠️ Bu etki/bonus değerleri **motor tarafı (Yusuf/Claude, `src/engine/equipment.ts`)** — sen dokunma;
  sen mağaza görünümü + ikonları yap. Katalog verisini (id, slot, fiyat, bonus) Claude ekleyecek.

**İş bölümü:**
- **Claude (Yusuf tarafı):** `src/engine/equipment.ts` kataloğu (aşağıdaki ürünler + fiyat + bonus +
  silah filtresi helper'ı `itemsForWeapon(weapon)`). Eski id'ler legacy tutulur (canlı veri korunur).
- **Osman:** mağaza sayfası (`ekipman/page.tsx`) → marka açılır-kapanır panel; silaha göre listeleme
  (`itemsForWeapon`); yeni ürünler için ikonlar (**eldiven** ve **göğüs koruyucu** setinde henüz yok).

**Ürün listesi (temel):**

*Ortak (her silah — 1 kez):*

| Ürün | Slot | Not |
|---|---|---|
| Eskrim Ceketi + Pantolon | CLOTHING | Standart beyaz koruyucu takım |
| Plastron | PLASTRON | Koltuk altı koruyucu |
| Göğüs Koruyucu | CHEST | **yeni ikon** |
| Eskrim Ayakkabısı | SHOES | Ayak tekniği/denge |
| Eskrim Çorabı | SOCKS | Uzun çorap |
| Gladius Çanta | BAG | Kozmetik (etki yok) |

*Flöre (FOIL):* Silah · Maske (çene iletken) · Lame (gövde) · **Eldiven** (yeni ikon) · Vücut Kablosu · Maske Kablosu
*Epe (EPEE):* Silah · Maske (yalıtkan) · **Eldiven** (yeni ikon) · Vücut Kablosu (3 soket) · **(lame YOK, maske kablosu YOK)**
*Kılıç (SABRE):* Silah · Maske (tam iletken) · Lame (gövde+kol) · **Eldiven** (yeni ikon, manşet iletken) · Vücut Kablosu (2 soket) · Maske Kablosu

**Yeni slot'lar:** `GLOVE` (eldiven), `CHEST` (göğüs koruyucu) — Icon setine 2 yeni ikon.
**Not:** mevcut mağazandaki `NOT_FOR_EPEE` (lame/maske kablosu gizleme) hack'i artık gerekmez;
filtre motorda `itemsForWeapon` ile yapılacak.

**Sıra:** Claude katalogu bir dala/PR'a koyunca haber verir → sen üstüne mağaza + ikon PR'ı açarsın
(ya da tek PR'da birlikte). Katalog + UI birlikte canlıya çıkmalı (yoksa ikonsuz görünür).

**Cevap (Osman):**

## Karar günlüğü

| Tarih | Karar | Kim |
|---|---|---|
| 2026-09-28 | Osman tarafı PR'ları kendisi merge edebilir; önizleme ortamı yok, merge = canlı | Yusuf |
| 2026-09-28 | Canlı test verisi asla silinmez: yalnız eklemeli şema, sıfırlama yok (CONTRIBUTING §2) | Yusuf + Osman |
| 2026-09-28 | Ekipman görselleri: kendi ikonlarımız (GLADIUS), marka ürünü kopyalanmaz | Osman |
| 2026-09-20 | Kalıcı giriş: Google OAuth + IP'den ülke | Yusuf |
