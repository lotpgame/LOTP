# Ekonomi Denge Analizi — Denar akışı & ödül/masraf dengesi

> Bu dosya, oyun-içi para (Denar) dengesinin SAYISAL analizidir. "Madalist cebinden para
> kaybediyor mu?" sorusunu seviye-seviye çözer, 3 oyuncu profili için sezonluk akış çıkarır,
> ve somut yeni değerler önerir. Kaynak kod: `src/engine/economy.ts`, `src/engine/ads.ts`,
> `src/engine/season.ts`, `src/engine/lifeEvents.ts`, `src/server/careerService.ts`.
> Tarih: 2026-11-16. Statü: ÖNERİ (uygulanmadı — değerler `economy.ts`'te TUNABLE).

---

## 0. Mekanik — nasıl ödeniyor? (koddan doğrulandı)

- **Kayıt + yol PEŞİN kesilir** (`registerForTournament`, careerService ~1538): `total = entryFee + travelCost`,
  kaydolurken bakiyeden düşer. **Çekilirsen iade** edilir. Ödül, dereceye göre SONRA eklenir.
  → Bir turnuvanın NET'i = `ödül(derece) − entryFee − travelCost`. Podyuma çıkamayan da kayıt+yol öder, ödül almaz.
- **Yetersiz bakiye → kaydolamazsın** (`entry_fee` hatası). Yani parası biten oyuncu otomatik olarak
  sadece ÜCRETSİZ İl'e düşer. Doğal bir taban.
- **Bakiye asla eksiye düşmez.** Aidat (`clubWeeklyDues`) mevcut parayla sınırlı ödenir; yetmezse o hafta
  antrenman ×0.8 (%20 düşüş) + "aidat ödenmedi" olayı. Yani baskı = borç değil, zayıf gelişim (beta-dostu).
- **Takvim (season.ts, 1 sezon = 12 hafta = 84 oyun-günü):** İl her hafta (×12) · Türkiye her hafta (×12) ·
  Open iki haftada bir (×6) · Uluslararası sezonda 4 (Satellite/Avrupa/GP/Dünya, her biri 1 kez, milli takım
  ilk-4 kotası). **Not:** Türkiye HAFTALIK (Perşembe) — brief'teki "2/sezon" güncel değil.
- **Yol masrafı sıklığı:** İl her zaman kendi şehrin → yol 0. Türkiye/Open'da ev sahibi şehir, ülkenin 12
  şehrinden deterministik seçilir → kendi şehrin çıkma olasılığı ~1/12 (≈%8). Yani Türkiye/Open'ın **~%92'si
  "yurt-içi uzak" = 5 Đ yol.** Uluslararası her zaman uzak (sabit: Sat 12 / GP 18 / Avrupa 25 / Dünya 40).
- **Zaman ölçeği:** 1 oyun-günü = 1 gerçek saat → 1 sezon (84 oyun-günü) ≈ **3,5 gerçek gün**. Reklam
  cooldown'u 2 GERÇEK saat olduğundan bir sezonda teorik tavan ~42 reklam (84 Đ); gerçekçi ~10–20 (20–40 Đ).

---

## 1. Seviye-seviye NET tablo (MEVCUT değerler)

NET = `ödül − entry − travel`. "kendi" = ev sahibi kendi şehrin (yol 0); "uzak" = yurt-içi uzak (yol 5) ya da
uluslararası sabit yol. Entry: İl 0 · Open/Türkiye 2 · Sat 5 · GP 10 · Avrupa 15 · Dünya 20.

| Seviye (senaryo) | masraf | 🥇 1. | 🥈 2. | 🥉 3./4. | podyum dışı (5.+) |
|---|--:|--:|--:|--:|--:|
| İl (hep kendi) | 0 | **+10** | **+6** | **+3** | 0 |
| Open — kendi | 2 | +8 | +4 | +1 | −2 |
| **Open — uzak** | 7 | +3 | **−1** | **−4** | −7 |
| Türkiye — kendi | 2 | +18 | +10 | +4 | −2 |
| **Türkiye — uzak** | 7 | +13 | +5 | **−1** | −7 |
| **Satellite** | 17 | +13 | +3 | **−2** | −17 |
| **Grand Prix** | 28 | +12 | +2 | **−8** | −28 |
| **Avrupa** | 40 | +10 | 0 | **−10** | −40 |
| Dünya Kupası | 60 | +40 | +20 | **0** | −60 |

**Sorun doğrulandı — madalya alıp zarar/başabaş eden dereceler (kalın):**
- Open (uzak): **2.** −1 · **3./4.** −4
- Türkiye (uzak): **3./4.** −1
- Satellite: **3./4.** −2
- Grand Prix: **3./4.** −8
- Avrupa: **2.** 0 (başabaş) · **3./4.** −10
- Dünya Kupası: **3./4.** 0 (başabaş)

Yani sorun GERÇEK ve seviye yükseldikçe büyüyor: uluslararası bronz her yerde ya zarar (GP −8, Avrupa −10) ya
tam başabaş. Eskrimde bronz = iki madalist, gerçek bir podyum başarısı; "madalya kazandım, cebimden para
gitti" hissi niş bir çocuk oyununda churn (oyuncu kaybı) riski. Asıl Denar yutucusu zaten podyum dışı geniş
kitle (kayıt+yolu öder, ödül almaz) — madalisti cezalandırmaya gerek yok.

---

## 2. Sezonluk (12 hafta) akış — 3 profil

> Podyum oranları VARSAYIM (combat simülasyonu koşturulamadı). Giriş = ödül + reklam + harçlık; çıkış = aidat
> + kayıt + yol + ekipman. Ekipman kırılması lumpy (değişken) bir kalem — ortalamayla verildi, flag'li.

**Ortak varsayımlar:** Başlangıç 50 Đ. Harçlık olayı %22/hafta, pozitif taraf ort. ~7,5 Đ → **~+20 Đ/sezon**
(negatif taraf = gear yıpranma/kırılma, aşağıda ekipman çıkışında). Reklam: casual ~10 / aktif ~28 / şampiyon
~20 Đ/sezon (VARSAYIM, gerçek-saat varlığına bağlı).

### (a) Casual — zayıf/orta, çoğunlukla ücretsiz İl
Katılım: İl ×12 (bedava) + Open ×3 (uzak). Türkiye/uluslararası yok. Kulüp düşük (facility ~20 → aidat 2/hafta → 24).
Podyum: nadir — İl'de ~3 kez 3./4. (+9) ≈ 12 Đ ödül; Open'da podyum ~0.

| Kalem | Đ |
|---|--:|
| İl ödülleri | +12 |
| Open ödülleri | +0 |
| Reklam | +10 |
| Harçlık | +20 |
| **Giriş** | **+42** |
| Aidat (12×2) | −24 |
| Open kayıt+yol (3×7) | −21 |
| Ekipman (hafif yıpranma) | ~−15 |
| **Çıkış** | **~−60** |
| **Sezon net** | **~−18** → **sezon sonu ~32 Đ** |

Casual yavaş erir ama taban koruyor (İl bedava + bakiye eksiye inmez). **Sadece bedava İl oynarsa net ≈ pozitif
başabaş** (12+10+20 − 24 ekipman hariç). Yani Open'a uzak gitmek zayıf oyuncu için para kaybettiriyor — bu
İSTENEN sink. Casual asla iflas etmez, sadece ~0'a yakın seyreder (sonra aidat kısmen ödenir, antrenman düşer).

### (b) Aktif — orta-güçlü, düzenli oyuncu
Katılım: İl ×12, Türkiye ×12, Open ×6, uluslararası ~0 (ilk-4 kotası zor). Kulüp orta (facility ~55 → aidat 6/hafta → 72).
Podyum: İl sık, Türkiye ara sıra, Open orta.

| Kalem | Đ |
|---|--:|
| İl ödülleri (1.×3,2.×3,3.×3) | +57 |
| Türkiye ödülleri (1.×1,2.×2,3.×2) | +56 |
| Open ödülleri (1.×2,2.×2,3.×1) | +35 |
| Reklam | +28 |
| Harçlık | +20 |
| **Giriş** | **~+196** |
| Aidat (12×6) | −72 |
| Türkiye kayıt+yol (12×~6,6) | ~−79 |
| Open kayıt+yol (6×~6,6) | ~−40 |
| Ekipman | ~−20 |
| **Çıkış** | **~−211** |
| **Sezon net** | **~−15** → **sezon sonu ~35 Đ** |

Aktif oyuncu su üstünde zar zor duruyor / hafif eksi. Türkiye/Open'a uzak gidip orta derece alınca kayıt+yol
ödülü yiyor. 1 silah (120) almak çok uzak. Denar KITLIĞI korunuyor ama "çok oynuyorum, hiç biriktiremiyorum"
hissi var — monetization baskısı güçlü, ama demotive edici sınırda.

### (c) Şampiyon — ulusal zirve, tüm uluslararasılara gider
Katılım: İl ×12, Türkiye ×12, Open ×6, uluslararası ×4. Kulüp üst (facility ~85 → aidat 10/hafta → 120).
Podyum: yurt-içini domine eder; uluslararası nadir madalya (orta seviye sporcu dünyada).

| Kalem | Đ |
|---|--:|
| İl ödülleri (1.×9,2.×2,3.×1) | +105 |
| Türkiye ödülleri (1.×7,2.×3,3.×2) | +188 |
| Open ödülleri (1.×4,2.×2) | +52 |
| Uluslararası ödülleri (nadir podyum) | ~+40 |
| Reklam + harçlık | +40 |
| **Giriş** | **~+425** |
| Aidat (12×10) | −120 |
| Türkiye kayıt+yol | ~−79 |
| Open kayıt+yol | ~−40 |
| Uluslararası kayıt+yol (17+28+40+60) | −145 |
| Ekipman | ~−25 |
| **Çıkış** | **~−409** |
| **Sezon net** | **~+16...+42** → **sezon sonu ~70–90 Đ** |

**Kritik gözlem:** Şampiyon bile uluslararasılara gidince ~145 Đ öder, nadiren madalya alır → uluslararası
katılım TÜM oyuncular için net Denar KAYBI (prestij/ranking için gidilir, para için değil). Bu sayede şampiyon
bile 1 sezonda 1 silah (120) alamaz → monetization anlamını korur. **Ekonomi şişmiyor; KIT ve biraz tıkanık**
(herkes ~0–90 bandında). Tasarım hedefiyle (§EKONOMI.md: "şampiyon bile 1 sezonda 1 silah alamaz") uyumlu.

---

## 3. Felsefe tercihi: A mı B mi?

- **A — "Madalya ≥ başabaş":** Podyum (ilk 3) hiçbir zaman para KAYBETTİRMEZ; madalist en azından kayıt+yolunu
  çıkarır, üstüne küçük bir ödül. Prestij/ranking asıl ödül kalır, ama "madalya aldım, fakir döndüm" hissi gider.
- **B — "Riskli bahis":** Uzak turnuva kumar; sadece şampiyon (bazen 2.) kâr eder, bronz zarar edebilir. Denar
  daha kıt, strateji katmanı ("yol parasını göze alayım mı?").

**ÖNERİ: A-hibrit (bronz = tam başabaş + küçük artı marj).** Gerekçe:
1. Sahibin şikâyeti aynen B'nin ürettiği his → saf B, çözmek istediğin sorunu KORUR. Elendi.
2. Saf cömert A (büyük madalya kârı) ekonomiyi şişirir, kıtlık/monetization bozulur. Elendi.
3. A-hibrit: her madalist **+1…+5 Đ** (başabaş üstü sembolik ödül), ama asıl yutucu KORUNUR → podyum dışı ~16–21
   kişi hâlâ kayıt+yolu öder, ödül alamaz. Denar kıt kalır (çünkü zamların çoğu BRONZA gider; bronza çoğu oyuncu
   ÇIKAMAZ). Zam, ödülü değil "madalist zararını" hedefler → şişme minimal.
4. Reklamla silah ALINMAZ ilkesi korunur: 120 Đ silah = 60 reklam = 120 gerçek saat cooldown (~5 gün aralıksız).

---

## 4. ÖNERİLEN DEĞERLER (kopyala-yapıştırlık)

**İlke:** `ödül(3.) ≥ entry + (o seviyenin uzak yol masrafı)` + küçük marj. Yol/entry/aidat/reklam DEĞİŞMEZ
(yol gerçek sink kalsın). Sadece ödül tablosu değişir.

### `PRIZE_TABLES` (economy.ts) — yeni
| Seviye | 1. | 2. | 3. | 4. | (mevcut) |
|---|--:|--:|--:|--:|---|
| İL | 10 | 6 | 3 | 3 | değişmedi |
| OPEN | **12** | **9** | **8** | **8** | 10/6/3/3 |
| TURKIYE | **22** | **14** | **9** | **9** | 20/12/6/6 |
| SATELLITE | **36** | **26** | **19** | **19** | 30/20/15/15 |
| GRAND_PRIX | **50** | **38** | **30** | **30** | 40/30/20/20 |
| EUROPEAN | **64** | **52** | **42** | **42** | 50/40/30/30 |
| WORLD_CUP | 100 | 80 | **64** | **64** | 100/80/60/60 |

```ts
// src/engine/economy.ts — PRIZE_TABLES önerilen
const PRIZE_TABLES: Record<TournamentLevel, Record<number, number>> = {
  IL:         { 1: 10, 2:  6, 3:  3, 4:  3 },
  OPEN:       { 1: 12, 2:  9, 3:  8, 4:  8 },
  TURKIYE:    { 1: 22, 2: 14, 3:  9, 4:  9 },
  SATELLITE:  { 1: 36, 2: 26, 3: 19, 4: 19 },
  GRAND_PRIX: { 1: 50, 2: 38, 3: 30, 4: 30 },
  EUROPEAN:   { 1: 64, 2: 52, 3: 42, 4: 42 },
  WORLD_CUP:  { 1: 100,2: 80, 3: 64, 4: 64 },
};
```

**Değişmeyen:** `ENTRY_FEES`, `TRAVEL_DOMESTIC_AWAY=5`, `TRAVEL_INTL` (12/18/25/40), `clubWeeklyDues`,
`AD_REWARD=2`, `AD_COOLDOWN_MS=2h`, `STARTING_BALANCE=50`. Yol gerçek sink; reklam retention; aidat seçim.

### Önerilen değerlerle NET tablo (her madalist ≥ başabaş)
| Seviye (senaryo) | masraf | 🥇 1. | 🥈 2. | 🥉 3./4. | podyum dışı |
|---|--:|--:|--:|--:|--:|
| İl | 0 | +10 | +6 | +3 | 0 |
| Open — uzak | 7 | +5 | +2 | **+1** | −7 |
| Türkiye — uzak | 7 | +15 | +7 | **+2** | −7 |
| Satellite | 17 | +19 | +9 | **+2** | −17 |
| Grand Prix | 28 | +22 | +10 | **+2** | −28 |
| Avrupa | 40 | +24 | +12 | **+2** | −40 |
| Dünya Kupası | 60 | +40 | +20 | **+4** | −60 |

Artık hiçbir madalist zarar etmiyor (en kötü +1). Podyum dışı hâlâ kayıt+yol kadar kaybediyor → sink korunuyor.

### Opsiyonel ince ayarlar (gerekirse)
- **Yol'a dokunmak istersen (alternatif kaldıraç):** Open daha "hafif" bir seviye; Open için yurt-içi yolu
  5→3 indirip ödül zammını küçültebilirsin. Ama tek tablo zammı daha sade; yolu değiştirme ÖNERİLMEZ.
- **Reklam cooldown:** Değişiklik GEREKMEZ. 2 saat zaten dengeli (sezonda ~20–40 Đ, silah alamaz). Ortalama
  izleme ölçülüp düşükse 1 saate indir (ads.ts yorumundaki plan).
- **Dünya Kupası bronz:** 60→64 küçük ama anlamlı ("Dünya'da madalya aldım, sıfır değil +4").

---

## 5. Önerilen değerlerle sezon-sonu tahminleri (özet)

| Profil | Mevcut sezon-sonu | Önerilen sezon-sonu | Yorum |
|---|--:|--:|---|
| Casual | ~32 Đ | ~35 Đ | Neredeyse aynı (çoğu bedava İl); Denar hâlâ kıt |
| Aktif | ~35 Đ | ~70–80 Đ | Madalya artık ödüyor; yine de 1 sezonda silah (120) yok |
| Şampiyon | ~70–90 Đ | ~110–130 Đ | ~1 sezon üst düzeyde = ~1 silah; kıtlık korunur, şişme yok |

**Sonuç:** A-hibrit, "madalist para kaybetti" hissini kaldırır, Denar'ı kıt tutar (ekonomi şişmez), yol masrafını
gerçek sink olarak korur ve pay-to-win'e düşmez. Asıl sink doğru yere (podyum dışı geniş kitle + uluslararası
katılım) biner. Önce AKTİF profil kazanır (en çok "boşa oynuyorum" hissi onda idi).
