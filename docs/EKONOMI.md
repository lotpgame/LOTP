# Ekonomi & Para Kazanma Planı (Denar)

> Oyunun iç ekonomisi (Denar akışı) ve gerçek para kazanma (monetization) modeli.
> Kod yazmadan önce ilgili bölüm buradan okunur. Kaynak: kullanıcı (Yusuf) kararları + GDD 16.
> Son güncelleme: 2026-09-28.

---

## 0. Temel felsefe (değişmez)

**Denar bir ilerleme/prestij birimidir; malzeme önemli bir ihtiyaçtır.**

- Ekipmanın maça etkisi **orta ve adil**: taze tam takım ~**+2-3 efektif güç**, yıprandıkça **0'a** düşer.
  Hissedilir ama **yetenek her zaman baskındır** (etki belirleyici değil).
- ⭐ **Değerler oyuncuya GÖSTERİLMEZ (üstü kapalı).** "+2 güç" gibi sayı yazılmaz. Etki,
  **"pistteki duruş + psikolojik üstünlük"** diliyle anlatılır. Uygulama tercihen **özgüven/psikoloji
  kanalından** işler (iyi/taze ekipman → özgüven ↑ → zaten combat'a etki eder). Böylece hem gizli hem tutarlı.
- ⭐ **Pay-to-win DEĞİL:** malzeme **oyun içi Denar ile herkes tarafından karşılanabilir kalır**
  (§1 dengesi bunu garanti eder). Gerçek para **zaman kazandırır, güç satmaz**. Tehlikeli eşik:
  oyun-içi kazançla bakım imkânsız olursa → pay-to-win olur; **bunu yapmayız.**

---

## 1. Denar KAZANMA (income) — Dengeli

**Karar (28.09, Yusuf):** Kazanç **çok düşük.** Hedef net: bir oyuncu 1 sezonda **girdiği tüm turnuvaları
kazansa bile** eline geçen Denar ≈ yalnız **1 SİLAH** (~400) alabilecek kadar. Seyreklendirme **gelir
bazında** (ödül düşürme) — **turnuva sayısı/takvim DEĞİŞMEDİ.** Türkiye haftalık kalır, sadece ödülü minik.
Denar kıt → asıl ödül ranking/prestij; monetization böyle anlam kazanır.

**Takvim (1 sezon = 12 hafta, değişmedi):** İl haftalık (12) · Türkiye haftalık (12) · Open 2 haftada bir (6) · Uluslararası 4.

**Ödül tablosu (yurt içi — canlıda):**
| Derece | İl (×12) | Türkiye (×12) | Open (×6) |
|---|--:|--:|--:|
| 🥇 1. | 8 | 18 | 15 |
| 🥈 2. | 4 | 10 | 8 |
| 🥉 3.* | 2 | 6 | 4 |

*(*) FIE: yarı finalde kaybeden **iki sporcu da 3.** (bronz maçı yok). Motor bunu zaten yapıyor.*

**Sonuç — sezonluk yurt içi:** Şampiyon ~**300 Đ** · 2. ~**200** · 3. ~**150**.
Uluslararası (kota varsa, yılda 4): şampiyon +~190 (elit + prestij; yine küçük).

**Başlangıç bakiyesi: 0 Đ** (`STARTING_BALANCE`, 28.09) — yeni oyuncu Denar'sız başlar (bedava para yok).
Şampiyon bile 1 sezonda 1 silah (400) alamaz → malzeme için Denar satın alma ihtiyacı doğar (monetization).

**Sonra (release/V2):** sponsorluk (ranking'e bağlı hafif pasif gelir) + başarı primleri (ilk madalya/şampiyonluk/milli takım).

---

## 2. Denar HARCAMA (sinks)

### Fiyat listesi (gerçek fiyat oranlarına göre — araştırma 28.09)
Gerçek sıralama: **iletken yelek (lamé) en pahalı** → silah → maske → kıyafet → ayakkabı → eldiven → kablo/koruyucu → çorap.

| Ürün | Đ | | Ürün | Đ |
|---|--:|---|---|--:|
| Elektrikli Yelek (kılıç)* | 550 | | Maske (flöre/epe) | 260 |
| Elektrikli Yelek (flöre)* | 500 | | Eldiven | 150 |
| Ceket + Pantolon** | 420 | | Vücut kablosu | 100 |
| Silah | 400 | | Göğüs koruyucu | 90 |
| Maske (kılıç) | 320 | | Plastron | 80 |
| Ayakkabı | 280 | | Maske kablosu | 50 |
| | | | Çorap | 30 |

*(*) "Lamé" yerine net Türkçe: **Elektrikli Yelek** (iletken). Epe'de YOK. Gerçek fiyat sırası korunur.*
*(**) Gerçek dünyada ceket+pantolon takımı silahtan pahalıdır (Yusuf, 28.09) → sıralama: yelek > takım > silah.*
**Tam takım:** Flöre ≈ 2.180 · Kılıç ≈ 2.360 · Epe ≈ 1.630 Đ.
*(Not: canlıya şimdi alınan generic katalogda tek "Elektrikli Yelek" 500; silaha özel ayrım genişletilmiş katalogla release'te.)*

### Yıpranma + büyüme (kodla, RELEASE'te aç)
- **Yıpranma (dayanıklılık):** her ürünün 0–100 dayanıklılığı; kullandıkça (turnuva/antrenman) düşer.
  Düştükçe etkisi (özgüven katkısı) azalır → mağazada **dayanıklılık barı** görünür → oyuncu yeniler.
  Öneri: tam takım ~1 sezonda yenileme noktasına gelir.
- **Büyüme (8 yaş→):** her yaş +1'de "dış" parçalar (kıyafet/ayakkabı/maske/yelek) küçük gelir → yeni beden.
  Kablo/çorap beden-bağımsız. Gerçek eskrimde de böyle.
- **Etki gizli:** dayanıklılık/etki sayı olarak yazılmaz; "duruş/özgüven" diliyle (§0).
- **Denge:** sezonluk üst-bakım ~1.000–1.500 Đ. Şampiyon (~2.240) kendi karşılar; orta/zayıf açık verir → Denar alır.
- **Canlı veri:** eklemeli şema (`equipmentState` JSON, `@default`), eski kayıtlar tolere edilir (CONTRIBUTING §2).

### Diğer
- **"Yeni Başla"** (kariyer sıfırlama) — 250 Đ. ✅ tek buton yapıldı (28.09).

---

## 3. 💰 Gerçek para kazanma (monetization) — RELEASE işi

**Model: Hattrick tarzı** — Denar + kozmetik + konfor satılır; **güç satılmaz** (§0).
- **Denar paketleri** (ör. 100 Đ = ₺X) — ana gelir.
- **Kozmetik:** özel görünümler, isim/bayrak rengi, zafer animasyonu, kulüp arması, rozet.
- **"Destekçi" paketi:** ekstra analiz/istatistik ekranları — güç değil, konfor + prestij.
- **Konfor:** ekstra kariyer slotu, "Yeni Başla" ücretini atlama.

**Gereksinimler:** ödeme sağlayıcı (iyzico/PayTR/Stripe/IAP) · gerçek hesap (Google OAuth, §4) ·
hukuk (KVKK, mesafeli satış, fatura, iade). 🔒 Claude ödeme bilgisi işlemez; kodu yazar, hesabı Yusuf kurar.

---

## 4. Kimlik paradoksu (reinstall) → gerçek hesapla çözülür

Uygulama silinip kurulunca "Yeni Başla" bedeli ödenmeden bedava başlanır (kimlik cihaz/çerezde).
**Çözüm:** release'teki Google OAuth (hesap cihazdan bağımsız) → paradoks kapanır. Şimdi uğraşmaya değmez.

---

## 5. İş bölümü ve zamanlama

| İş | Ne zaman | Kim |
|---|---|---|
| "Yeni Başla" (tek buton) | ✅ yapıldı (28.09) | Claude + Osman |
| Ödül tablosu düşürme (economy.ts) | şimdi (güvenli) | Claude |
| Türkiye 2/sezon (season.ts) | şimdi/yakında (antrenman modeli kontrolüyle) | Claude |
| Gerçekçi fiyatlar + "Elektrikli Yelek" adı (equipment.ts) | şimdi (güvenli) | Claude |
| Genişletilmiş katalog (silaha özel + eldiven/göğüs) + yıpranma/büyüme + gizli etki | release | Claude (motor) + Osman (mağaza UI: dayanıklılık barı, "küçük geldi", flavor metin) |
| Sponsorluk + başarı primleri | release/V2 | Claude |
| Denar satışı + kozmetik + Destekçi | release | Claude (kod) + Yusuf (ödeme/hukuk) |
| Gerçek hesap (Google OAuth) — paradoksu çözer | release | Claude + Yusuf |
