# Ekipman Yaşam Döngüsü + Olay (Event) Sistemi — Tasarım

> Kaynak: Yusuf kararları (05.11) + `docs/EKONOMI.md`. Kod yazmadan önce buradan okunur.
> İlke: **pay-to-win YOK.** Başlangıç takımı bedava → herkes maça girer; para = görünüm/konfor/hız, güç değil.

## 1. Amaç
Gerçekçi bir ekipman döngüsü (beden/yıpranma/kırılma) + kariyer olayları (moral + malzeme) kurmak; bu, hem
oyunu zenginleştirir hem **Denar talebini** (sağlıklı, adil) doğurur. Oyuncuların çoğu çocuk → bedava zemin şart.

## 2. Ekipman modeli (yeni: `equipmentState`)
Şu an `Player.ownedEquipment` = sadece id CSV'si (beden/dayanıklılık/kırık YOK). Genişletilecek:
- **Yeni alan `Player.equipmentState` (JSON, eklemeli, nullable).** Her parça için durum:
  `{ slot, itemId, size, durability (0–100), broken }`. Boş/eski kayıt → kod toleranslı (başlangıç takımına düşer).
- **Beden (`size`):**
  - **Silah (ve iletken parçalar):** yaş kategorisine bağlı — **U10 → 0, U12 → 2, U14+ → 5.**
  - **Dış giyim (kıyafet/ayakkabı/maske/yelek):** bedene bağlı, **20 yaşına kadar her 2 yılda** büyür.
  - **Beden-bağımsız:** kordon, çorap, plastron (değişmez).
- **Dayanıklılık:** kullandıkça (turnuva/antrenman) düşer; düşünce etkisi (özgüven) azalır; 0'a yakınsa yenileme.
- **Kırık (`broken`):** olay sonucu (bkz. §4) bir parça (özellikle silah) kırılabilir → o parça geçersiz.

## 2b. Çoklu silah yönetimi + yıpranma (KARAR, Yusuf) — Dilim 2
Gerçek eskrimde sporcu **birden çok silah** taşır (biri kırılırsa yedek). Oyunda da:
- Oyuncu **1., 2., 3. silaha** sahip olabilir (aynı slotta birden çok parça, her birinin KENDİ dayanıklılığı).
- Çantada/markette silah "Gladius Flöre" yerine **"1. Silah", "2. Silah", "3. Silah"** diye gösterilir (altında marka/model + dayanıklılık).
- **Maça girerken aktif silah** seçilir (ör. en sağlam olanı); maçta o yıpranır → oyuncu rotasyon yapar (dayanıklılığı dengeler).
- **İki tür yıpranma:**
  1. **Kullanım yıpranması:** maç/antrenmanda kullandıkça dayanıklılık düşer (çok kullanılan silah çabuk biter).
  2. **Durma yıpranması (paslanma/sertleşme):** uzun süre KULLANILMAYAN silah da bozulur (paslanır, sertleşir) → dayanıklılık/esneklik düşer.
  → Denge: tek silahı sürekli kullanmak da, çok silahı atıl bırakmak da kötü. İdeal: 2-3 silahı dönüşümlü kullan.
- Kırılma (olay, §5) bir silahı aniden bitirir → yedek devreye girer; yedeği yoksa yeni/tamir gerekir (ama hep ucuz zemin var).
- **Veri:** `equipmentState` WEAPON slotu **liste** olur: `[{itemId, size, durability, broken, lastUsedDay}]`; `lastUsedDay`
  durma-yıpranmasını hesaplar. Model eklemeli (eski tek-silah kayıt → 1. silah olarak okunur).

## 3. Başlangıç takımı + beden/büyüme kuralları
- **Kariyer başında (8 yaş):** tam Gladius takımı **bedava** verilir, **doğru beden** (U10 → size 0), dayanıklılık %100.
- **8→10 arası:** malzeme ihtiyacı yok (tek istisna: silah kırılırsa).
- **Yaş kategorisi atlayınca (U10→U12→U14):** silah (+iletken parçalar) **yeni beden** gerektirir → marketten alınır.
- **Her 2 yıl (20'ye kadar):** dış giyim küçük gelir → yeni beden kıyafet/ayakkabı/maske/yelek.
- **Yıpranma:** zamanla tüm parçalar aşınır → yenileme/tamir.

## 4. Maça katılım kuralı (gerçekçilik + bedava zemin)
- Maça/turnuvaya girmek için: **tam + doğru beden + kırık olmayan** geçerli takım gerekir.
- Başlangıç takımı bunu garç başta sağlar; sonra oyuncu beden/kırık/yıpranmayı yönetir.
- **Katılım ÜCRETİ:** küçük Denar (o seviyenin ödülünün altında; engel değil, denge aracı). İl ucuz/bedava, üst seviye artar.
- Eksik/kırık/yanlış beden → "maça giremezsin: X eksik/kırık/küçük" uyarısı + markete yönlendirme.

## 5. Olay (Event) sistemi
Yeni hafif motor: `src/engine/events/` (ya da `lifeEvents.ts`). Kariyer ilerledikçe (haftalık/antrenman/turnuva)
**deterministik (seeded), nadir** olaylar üretir. İki tür:
- **Psikoloji/moral olayları** (Psychology'ye delta): olumlu ("formdasın → moral ↑"), olumsuz ("kötü gün → stres ↑").
- **Malzeme olayları:** "antrenmanda silah kırıldı → broken" (→ tamir/yenile), "ayakkabı yıprandı" vb.
- Her olay: `{ key, kind: PSYCH|MATERIAL, etki, i18n metni }`. Sonuç uygulanır + **bildirilir** ("Sen yokken" paneli + anlık).
- **Sıklık (KARAR, Yusuf):** **~haftada 2 olay** (seeded, deterministik). Sık çıktığı için **etkiler KÜÇÜK** (dengeyi bozmaz).
- **Ağırlık:** çoğu **psikoloji/renk** olayı; **malzeme-kırılma NADİR** (düşük ağırlık) — haftada silah kırılmaz. Kırılma
  olunca hep **ucuz tamir** alternatifi var (kilit yok).
- Not: Trait evrimi (Katman 2) zaten büyük olaylara bağlı; bu sistem onunla uyumlu (olay → Memory/Psychology → Trait).

### 5b. Olay kataloğu — **30 olay** (~haftada 2 çıkar; genişletilebilir)
Etkiler KÜÇÜK (sık çıkar), olumlu/olumsuz dengeli. "çocuk sporcu" temalı (okul-spor dengesi dahil, gerçekçi).
Dağılım: 11 olumlu + 10 olumsuz psikoloji, 6 malzeme-olumsuz (kırılma NADİR ağırlıkta), 3 malzeme-olumlu.

**Psikoloji/moral — OLUMLU**
| key | etki | örnek metin |
|---|---|---|
| goodDay | moral ↑ | "Bugün formda hissediyorsun — her şey yolunda gidiyor." |
| coachPraise | özgüven ↑, motivasyon ↑ | "Koçun antrenmanda seni övdü." |
| familySupport | moral ↑, stres ↓ | "Ailen maçına geldi, desteklerini hissettin." |
| goodSleep | stres ↓ | "İyi dinlendin, zihnin berrak." |
| smallGoal | motivasyon ↑ | "Koyduğun küçük hedefe ulaştın." |
| inspiredByEvent | motivasyon ↑ | "Büyük bir turnuvayı izledin, ilham aldın." |
| newFriendClub | moral ↑ | "Kulübe yeni bir arkadaş katıldı, antrenman keyifli." |
| teammateWin | moral ↑ | "Kulüp arkadaşın madalya aldı, sevindin." |
| coachTip | özgüven ↑ | "Koçtan işine yarayan bir ipucu aldın." |
| restDayFun | stres ↓ | "Dinlenme gününde iyi vakit geçirdin." |
| newGearJoy | motivasyon ↑ | "Yeni ekipmanınla antrenman keyifliydi." |

**Psikoloji/moral — OLUMSUZ**
| key | etki | örnek metin |
|---|---|---|
| badDay | moral ↓ | "Morali bozuk bir gün; aklın dağınık." |
| coachCritique | özgüven ↓, stres ↑ | "Koçun sert eleştirdi, biraz yıkıldın." |
| schoolBusy | motivasyon ↓, stres ↑ | "Okulda yoğun bir hafta — spora vakit zor." |
| examWeek | motivasyon ↓ | "Sınav haftası; kafan derslerde." |
| slumpTraining | özgüven ↓ | "Antrenmanda üst üste hata yaptın." |
| rivalryTension | stres ↑ | "Bir rakiple araların gerildi." |
| minorIllness | keskinlik ↓ (kısa) | "Hafif hastalandın, birkaç gün düşük tempo." |
| nervousBigMatch | stres ↑ | "Büyük maç öncesi gerginsin." |
| growthSpurt | özgüven ↓ (kısa) | "Hızlı büyüdün, hareketlerin biraz dağıldı." |
| travelTired | keskinlik ↓ (kısa) | "Uzak turnuva dönüşü yorgunsun." |

**Malzeme — OLUMSUZ (Denar talebi doğurur; ama hep ucuz alternatif var → kilit yok)**
| key | etki | örnek metin |
|---|---|---|
| weaponBroke | silah KIRIK | "Antrenmanda silahın kırıldı — yeni gerek ya da tamir." |
| cordFault | kordon KIRIK (ucuz) | "Vücut kordonun arızalandı." |
| maskCordSnap | maske kordonu KIRIK (ucuz) | "Maske kordonun koptu." |
| shoesWorn | ayakkabı dayanıklılık ↓↓ | "Ayakkabın iyice yıprandı." |
| clothingTear | kıyafet dayanıklılık ↓↓ | "Kıyafetin yırtıldı." |
| lameIssue | yelek dayanıklılık ↓↓ | "Elektrikli yeleğin sorun çıkardı." |

**Malzeme — OLUMLU / rahatlatıcı (nadir)**
| key | etki | örnek metin |
|---|---|---|
| clubLoanGear | geçici yedek (kilit açılır) | "Kulüp sana yedek ekipman ödünç verdi." |
| secondHandDeal | ucuz fırsat (indirimli parça) | "İkinci el bir parça fırsatı çıktı." |
| clubGift | bedava küçük parça / az Denar | "Kulüp bir parça hediye etti." |

### 5c. Genişletilmiş olay kategorileri (05.11, Yusuf — çocuk→genç sporcu hayatı)
Yaşa duyarlı: bazıları yalnız ergenlikte (büyüme atağı, dikkat dağınıklığı). Etkiler küçük.

**Okul / hayat dengesi** (çocuk olduğu için kritik)
| key | etki | metin |
|---|---|---|
| goodReport | moral ↑ | "Karnen iyi geldi, keyfin yerinde." |
| examWeek* | motivasyon ↓, antrenman zamanı ↓ | "Sınav haftası — spora az vakit." |
| teacherSupport | moral ↑ | "Öğretmenin spora destek oldu." |
| schoolClash | (bir turnuvayı kaçırma riski) | "Okul etkinliği antrenmana denk geldi." |
| holidayCamp | gelişim fırsatı (kamp) | "Tatilde yoğun kampa katılabilirsin." |

**Fizik / sağlık** (yaşa duyarlı)
| key | etki | metin |
|---|---|---|
| growthSpurt* | özgüven ↓ (kısa, ergenlik) | "Hızlı büyüdün, koordinasyonun bir süre dağınık." |
| wellRested | kondisyon ↑ | "İyi dinlendin, formun yerinde." |
| travelFatigue | keskinlik ↓ | "Uzak turnuva dönüşü yorgunsun." |
| mildIllness | keskinlik ↓ (kısa) | "Hafif hastalandın." |

**Sosyal / ilişki**
| key | etki | metin |
|---|---|---|
| rivalryBorn | motivasyon ↑, stres ↑ | "Bir rakiple çekişme başladı." |
| teammateLeft | moral ↓ | "Yakın antrenman arkadaşın kulüpten ayrıldı." |
| newCoachVibe | motivasyon ↑/↓ | "Koçunla yeni bir dönem." |

**Kariyer / ilham**
| key | etki | metin |
|---|---|---|
| metIdol | motivasyon ↑↑ (nadir) | "İdolünle tanıştın, imza aldın!" |
| inPress | moral ↑, itibar ↑ | "Adın yerel haberde geçti." |
| scoutCall | motivasyon ↑ (ileride seçme) | "Bir yetenek seçmesine çağrıldın." |

**Harçlık / çeşitli**
| key | etki | metin |
|---|---|---|
| pocketMoney | az Denar | "Biraz harçlık biriktirdin." |
| gearLove | motivasyon ↑ | "Yeni ekipmanınla çalışmak keyifli." |
| poorCare | durability ↓ (bakımsızlık) | "Ekipmanına iyi bakmadın, çabuk yıprandı." |
| seasonStart | motivasyon ↑ | "Yeni sezon, yeni heyecan." |

*(\*) yaş kapılı: examWeek/growthSpurt daha çok okul-çağı/ergenlik.*

### 5d. 💰 Fırsat / indirim mekaniği (süreli teklifler) — KARAR (Yusuf)
Bazı malzeme olayları bir **süreli satın-alma teklifi** üretir (markette "fırsat" olarak görünür):
- **İçerik:** hangi parça (ör. tam istediğin özellikte 2. el Epe) + **indirim** (ör. %50) + **son gün** (ör. 2 gün sonra kapanır).
- **Örnekler:** "İkinci el silah %50", "Bu hafta ayakkabıda %30", kulüp hediyesi (bedava parça), devralınan ekipman.
- **Oyuncu:** süre dolmadan alırsa indirimli Denar'a sahip olur; kaçırırsa teklif gider ("kaçırma" hissi → markete canlılık).
- **Her malzeme için** olabilir (silah, kıyafet, ayakkabı…).
- **Veri (eklemeli):** `GameState.pendingOffer` JSON — `{ itemId, discountPct, expiresDay }` (ya da liste). Market bunu okur,
  indirimli fiyatı + geri sayımı gösterir; satın alım indirimi uygular; süre geçince temizlenir. (Migration: küçük, sonra.)
- İlke korunur: fırsatlar **kolaylık/tasarruf** verir, güç değil (pay-to-win değil).

## 6. Ekipman sayfası (UI) + Market
- **Üst: "Malzeme Çantam"** — oyuncunun mevcut takımı: her parça + beden + dayanıklılık barı + (varsa) "KIRIK"/"küçük" rozeti.
- **Alt: "Market (Gladius)"** — satın alınabilir Gladius ürünleri (doğru beden), fiyat (Denar), "Al" butonu + bakiye.
- Kırık/küçük/yıpranan parça için **kısayol:** "yenile/tamir et" → markette ilgili ürün.

## 6b. Kulüp aidatı (düzenli Denar gideri) — KARAR (Yusuf)
- Oyuncu bir kulübe bağlı (gerçekte çocuk sporcu aidat öder). **Düzenli (ör. aylık = her oyun-ayında) küçük Denar aidatı.**
- Kulüp kalitesine bağlı olabilir: **daha iyi kulüp = daha yüksek aidat** (daha iyi antrenman karşılığı) → anlamlı seçim
  (ucuz kulüp/az gelişim ↔ pahalı kulüp/çok gelişim). İleride kulüp değiştirme bununla dengelenir.
- **Adillik:** aidat küçük tutulur; turnuva ödülü + reklam ödülü temel aidatı karşılar. Ödenmezse: sert ceza değil,
  yumuşak sonuç (ör. uyarı, geçici antrenman kalitesi düşüşü) — çocuğu oyundan atmaz.
- Denge kalibrasyonu Dilim 4'te (katılım ücreti + aidat + reklam ödülü birlikte ayarlanır).

## 7. Denar musluğu (bu tasarımın yaktığı Denar — özet)
Katılım ücreti · **kulüp aidatı (düzenli)** · beden yükseltme (yaş) · büyüme kıyafeti (2 yıl) · kırık silah tamiri/yenileme ·
yıpranma yenileme · (+ ayrı: kozmetik, asıl büyük musluk) · (opsiyonel) uluslararası seyahat.
Kazanç: turnuva (kıt) + **reklam izle → küçük Denar** (katılım/aidat çıkar, silah ALMAZ) + (V2) prim/sponsor.

## 8. Uygulama DİLİMLERİ (küçük, güvenli, canlı veriyi korur)
1. **Dilim 1 — Ekipman durumu + başlangıç takımı + sayfa/market:** `equipmentState` JSON (eklemeli), kariyer başında
   bedava tam takım, ekipman sayfası "Malzeme Çantam" + "Market" ayrımı, beden gösterimi. (Dayanıklılık görünür ama etkisiz başlar.)
2. **Dilim 2 — Beden/büyüme + katılım kuralı:** yaş kategorisi → silah bedeni; 2 yılda kıyafet; maça "geçerli takım" şartı
   + katılım ücreti. Eksik/kırık/küçük uyarıları.
3. **Dilim 3 — Olay motoru:** psikoloji + malzeme (kırılma) olayları, bildirim; yıpranmayı olaylara/zamana bağla.
4. **Dilim 4 — Reklam ödülü + ince denge:** "reklam izle → Denar" (önce stub/placeholder; gerçek reklam SDK + çocuk/UK
   hukuk ayrı), katılım ücreti ↔ ödül dengesi kalibrasyonu.
Her dilim: eklemeli şema (Neon migration), test, canlı veri korunur.

> Migration gereken alanlar: `Player.equipmentState` (Dilim 1). Diğer dilimler çoğunlukla kod + mevcut alanlar.
