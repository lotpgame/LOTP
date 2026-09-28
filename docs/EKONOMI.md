# Ekonomi & Para Kazanma Planı (Denar)

> Bu doküman, oyunun **iç ekonomisini** (Denar akışı) ve **gerçek para kazanma (monetization)**
> modelini kalıcı olarak tanımlar. Kod yazmadan önce ilgili bölüm buradan okunur.
> Kaynak: kullanıcı (Yusuf) kararları + GDD 16 (Economy). Son güncelleme: 2026-09-28.

---

## 0. Temel felsefe (değişmez)

**Denar bir "güç" değil, bir ilerleme/prestij göstergesidir.**
- Ekipmanın maça katkısı neredeyse sıfırdır (~0.003, `src/engine/equipment.ts`). Maçı **yetenek** kazanır.
- ⭐ **Bu yüzden Denar gerçek parayla satılabilir ve bu "pay-to-win" olmaz** — para, güç değil
  görünüm/prestij/konfor satın alır. App store ve etik açısından güvenli olan çizgi budur.
- 🔒 **Kural:** Denar satılırken ekipman güç vermemeli. İleride ekipmanı güçlendirmek istersek,
  "parayla alınan kozmetik" ile "maçla kazanılan performans" **ayrı** tutulur.

---

## 1. Denar KAZANMA (income)

### Şimdi (canlı) — yalnız turnuva derecesi (podyum)
`src/engine/economy.ts` → `PRIZE_TABLES`. Seviye × derece:

| Seviye | 1. | 2. | 3.* | 5.* | 9.* |
|---|---|---|---|---|---|
| İl | 100 | 60 | 40 | — | — |
| Open | 250 | 150 | 100 | 50 | — |
| Türkiye | 800 | 500 | 300 | 150 | 80 |
| Satellite | 1500 | 1000 | 700 | 400 | 200 |
| Grand Prix | 3000 | 2000 | 1400 | 800 | 400 |
| Avrupa | 5000 | 3500 | 2500 | 1500 | 800 |
| Dünya Kupası | 8000 | 5500 | 4000 | 2500 | 1200 |

*(*) FIE: aynı turda elenenler dereceyi paylaşır. Yarı finalde kaybeden **iki sporcu da 3.** olur
(bronz maçı yok) → podyumda 4 kişi ödül alır. Çeyrekte elenenler **5.**, vб. Motor bunu zaten yapıyor
(`src/engine/tournament/index.ts` — "aynı turda elenenler pozisyonu paylaşır").*

- Başlangıç bakiyesi: **1000 Đ** (`STARTING_BALANCE`).
- **Karar (28.09):** Kazanç modeli podyumda kalıyor (performansa yayma yok). Kıtlık bilinçli —
  para satışını (§3) anlamlı kılar. ⚠️ Ödemeyen test oyuncusu da oynayabilmeli; çok cezalandırıcı olmasın.

### Sonra (release / V2)
- **Sponsorluk:** ranking yükseldikçe küçük haftalık pasif gelir (prestij arttıkça sponsor).
- **Başarı primleri:** ilk madalya / şampiyonluk / milli takım → tek seferlik Đ (achievements sistemi var, M7).

---

## 2. Denar HARCAMA (sinks)

### Şimdi (canlı)
- **Ekipman alımı** (`src/engine/equipment.ts` — GLADIUS). Tek seferlik; prestij/görünüm + minik bonus.
- **"Yeni Başla"** (kariyer sıfırlama) — 250 Đ (`CAREER_RESET_COST`). Sık reroll'u caydıran sink.

### Kodla şimdi, RELEASE'te aç — Malzeme yıpranması + çocuk büyümesi
Kullanıcı kararı (28.09): **kırılma YOK** (çok sert), ama:
- **Yıpranma:** ekipman kullandıkça (turnuva/antrenman) durumu düşer → eşiğin altında **yenileme/bakım** (Đ gider).
- **Çocuk büyümesi:** her yaş aldığında (doğum günü) malzeme "küçük gelir" → **yeni beden** almak gerekir.
  Gerçek eskrimde de böyle (aileler her yıl yeni malzeme alır). Doğal **yıllık Đ gideri.**
- **Neden release'te açılır:** canlı testte oyuncuların aldığı malzemeyi eskitmek moral bozar. Önce kodlanır,
  bayrakla kapalı/çok yumuşak tutulur; release'te açılır.
- **Canlı veri:** eklemeli şema (durum/beden alanları `@default` ile), eski kayıtlar tolere edilir (CONTRIBUTING §2).

---

## 3. 💰 Gerçek para kazanma (monetization) — RELEASE işi

**Model: Hattrick tarzı.** Denar (ve kozmetik/konfor) gerçek parayla satılır; **güç satılmaz.**

**Satılabilecekler:**
- **Denar paketleri** (ör. 100 Đ = ₺X) — ana gelir.
- **Kozmetik:** özel silah/kıyafet görünümü, isim/bayrak rengi, zafer animasyonu, kulüp arması, profil rozeti.
- **"Destekçi" paketi (Hattrick gibi):** ekstra analiz/istatistik ekranları, isim rengi — güç değil, konfor + prestij.
- **Konfor:** ekstra kariyer slotu, "Yeni Başla" ücretini atlama.

**Gereksinimler (release öncesi):**
- Ödeme sağlayıcı: Türkiye **iyzico/PayTR**, global **Stripe**, mobil **App/Play Store IAP**.
- **Gerçek hesap** (Google OAuth — §4). Cihaz/çerez kimliği yetmez.
- Hukuk: KVKK, mesafeli satış sözleşmesi, fatura/vergi, iade politikası.
- 🔒 **Güvenlik:** Claude gerçek ödeme bilgisi/kart işlemez. Entegrasyon **kodunu** yazar; ödeme hesabını/
  anahtarlarını **Yusuf** kurar (Vercel/sağlayıcı panelinde, repoya girmez).

---

## 4. Kimlik paradoksu (reinstall) → gerçek hesapla çözülür

**Sorun:** Kullanıcı uygulamayı silip yeniden kurarsa "Yeni Başla" Denar bedelini ödemeden bedava
yeni kariyere başlar. Kök sebep: kimlik şu an **telefon/çerezde** (cihaz-bağımlı), gerçek hesap yok.

**Çözüm:** Release'teki **Google OAuth** (DEVIR Madde 4, 20.09 kararı) — hesap cihazdan bağımsız olunca
paradoks kendiliğinden kapanır. Şimdi ayrıca uğraşmaya değmez.

---

## 5. İş bölümü ve zamanlama

| İş | Ne zaman | Kim |
|---|---|---|
| Podyum kazancı (mevcut tablolar) | ✅ şimdi (değişmez) | — |
| "Yeni Başla" (tek buton) | ✅ yapıldı (28.09) | Claude + Osman |
| Malzeme yıpranma/büyüme | kodla şimdi, release'te aç | Claude (motor) + Osman (mağazada durum/beden göstergesi) |
| Sponsorluk + başarı primleri | release/V2 | Claude (motor) |
| Denar satışı + kozmetik + Destekçi | release | Claude (kod) + Yusuf (ödeme/hukuk) |
| Gerçek hesap (Google OAuth) — paradoksu çözer | release | Claude + Yusuf (OAuth client) |
