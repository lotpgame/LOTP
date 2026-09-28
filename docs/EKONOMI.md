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

**Karar (28.09):** Eski model çok cömertti (şampiyon ~12.300 Đ/sezon). Düşürüldü. Hedef:
**şampiyonun 1 sezonu ≈ ~1 tam takım**; alt dereceler daha az. Türkiye Şampiyonası **haftalık değil,
sezonda 2 kez** (gerçekçi).

**Takvim (1 sezon = 12 hafta):** İl haftalık (12) · Türkiye sezonda 2 · Open 2 haftada bir (6) · Uluslararası 4.

**Ödül tablosu (yurt içi, önerilen):**
| Derece | İl (×12) | Türkiye (×2) | Open (×6) |
|---|--:|--:|--:|
| 🥇 1. | 60 | 400 | 120 |
| 🥈 2. | 25 | 250 | 60 |
| 🥉 3.* | 15 | 150 | 35 |

*(*) FIE: yarı finalde kaybeden **iki sporcu da 3.** (bronz maçı yok). Motor bunu zaten yapıyor.*

**Sonuç — sezonluk yurt içi:** Şampiyon ~**2.240 Đ** (≈1 takım) · 2. ~**1.160** · 3. ~**690**.
Uluslararası (kota varsa) ayrıca eklenir ama düşük tutulur.

**Sonra (release/V2):** sponsorluk (ranking'e bağlı hafif pasif gelir) + başarı primleri (ilk madalya/şampiyonluk/milli takım).

---

## 2. Denar HARCAMA (sinks)

### Fiyat listesi (gerçek fiyat oranlarına göre — araştırma 28.09)
Gerçek sıralama: **iletken yelek (lamé) en pahalı** → silah → maske → kıyafet → ayakkabı → eldiven → kablo/koruyucu → çorap.

| Ürün | Đ | | Ürün | Đ |
|---|--:|---|---|--:|
| Elektrikli Yelek (kılıç)* | 550 | | Ayakkabı | 280 |
| Elektrikli Yelek (flöre)* | 450 | | Eldiven | 150 |
| Silah | 400 | | Vücut kablosu | 100 |
| Maske (kılıç) | 320 | | Göğüs koruyucu | 90 |
| Maske (flöre/epe) | 250 | | Plastron | 80 |
| Ceket + Pantolon | 300 | | Maske kablosu | 50 |
| | | | Çorap | 30 |

*(*) "Lamé" yerine net Türkçe: **Elektrikli Yelek** (iletken). Epe'de YOK. Gerçek fiyat sırası korunur.*
**Tam takım:** Flöre ≈ 2.180 · Kılıç ≈ 2.360 · Epe ≈ 1.630 Đ.

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
