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
- Denge: olaylar seyrek; olumsuz malzeme olayı (kırılma) Denar talebi doğurur ama hep **ucuz tamir** alternatifi var (kilit yok).
- Not: Trait evrimi (Katman 2) zaten büyük olaylara bağlı; bu sistem onunla uyumlu (olay → Memory/Psychology → Trait).

## 6. Ekipman sayfası (UI) + Market
- **Üst: "Malzeme Çantam"** — oyuncunun mevcut takımı: her parça + beden + dayanıklılık barı + (varsa) "KIRIK"/"küçük" rozeti.
- **Alt: "Market (Gladius)"** — satın alınabilir Gladius ürünleri (doğru beden), fiyat (Denar), "Al" butonu + bakiye.
- Kırık/küçük/yıpranan parça için **kısayol:** "yenile/tamir et" → markette ilgili ürün.

## 7. Denar musluğu (bu tasarımın yaktığı Denar — özet)
Katılım ücreti · beden yükseltme (yaş) · büyüme kıyafeti (2 yıl) · kırık silah tamiri/yenileme · yıpranma yenileme ·
(+ ayrı: kozmetik). Kazanç: turnuva (kıt) + **reklam izle → küçük Denar** (katılım ücretini çıkarır, silah ALMAZ) + (V2) prim/sponsor.

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
