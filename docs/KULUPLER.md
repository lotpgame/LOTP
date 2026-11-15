# Kulüp Abonelik Sistemi (Premium Kulüpler) — Tasarım & Plan

> **Durum:** TASARIM — *launch sonrası* inşa edilecek (oyuncu tabanı oluşunca). Kullanıcı (Yusuf) kararı, 15.11.
> **Model:** Sosyal / prestij (**pay-to-win YOK**). **B2B odaklı:** gerçek eskrim kulüpleri kendi dijital kulüplerini açar.
> Kod yazmadan önce bu doküman okunur. Fiyat/rakamlar tunable — Yusuf ayarlar.

---

## 1. Vizyon

İki kaynak:
1. **Tutkulu oyuncu** kendi kulübünü kurar (kendi sporcusu + topluluk).
2. **Gerçek eskrim kulüpleri** (asıl hedef): oyun yayılınca kulüpler **kendi markalı dijital kulüplerini** ister.
   Öğrencileri o bayrak altında oynar → kulüp **aylık abone** olur. Hem gelir, hem **organik büyüme** (her kulüp kendi
   öğrencilerini oyuna getirir). Reklam/paket'ten çok daha güçlü ve sürdürülebilir bir gelir modeli.

**Satış hedefi birey değil, KULÜP.** Fiyat (£) kulüp bütçesinden ödenir; bu yüzden TR bireysel oyuncuya pahalı olması sorun değil.

## 2. Temel ilke: PAY-TO-WIN YOK (değişmez)

Mevcut ilke (docs/EKONOMI.md): *"ödeyen daha güçlü olmaz, yalnız kesintisiz oynar."*
Premium kulüp **antrenman hızına DOKUNMAZ** — gelişim herkeste aynı organik tesis modeliyle işler. Abonelik yalnız
**marka + kadro + prestij/görünürlük** verir. Oyun adil kalır. (Not: bu yüzden eski "facility level 3/4/5 = daha iyi
tesis" fikri bırakıldı; tier'lar kadro/özelleştirme/görünürlüğe göre.)

## 3. Premium kulüp ne sunar?

- 🎨 **Markalı kimlik:** kendi **adı + logosu + renkleri** (gerçek kulübün kimliği). Logo yüklenir (moderasyon şart — §7).
- 👥 **Kadro:** gerçek oyuncular **katılır** (davet / başvuru-onay). Kapasite tier'a göre.
- 🏆 **Prestij & görünürlük:** kulüp sayfası, **kulüp sıralaması** (üyelerin toplam/ortalama başarısı), rozet, vitrinde öne çıkma.
- 📣 **Kulüp duyuruları** (menajer → üyeler), kulüp içi kimlik hissi.
- ❌ **Antrenman avantajı YOK** (ilke gereği).

## 4. Tier'lar & fiyat (öneri — tunable)

| Tier | £/ay | Kadro (gerçek oyuncu) | Ekstra |
|---|---|---|---|
| **Kulüp** | 9.99 | **10** | isim + logo + renk, kulüp sayfası + kulüp sıralaması, rozet |
| **Kulüp+** | 14.99 | **15** | + şehir vitrininde öne çıkma, kulüp duyuruları, özel arma |
| **Elit** | 19.99 | **20** | + ülke vitrininde öne çıkma, en üst özelleştirme, öncelikli destek |

Ödeme: **Stripe (web)** → App Store/Play kesintisi yok (web PWA avantajı). Para birimi Stripe'ta otomatik.

## 5. Teknik gereksinimler (YENİ sosyal katman)

Şu an kulüpler **şehre göre otomatik** atanıyor (sahiplik/katılma yok). Premium için eklenecekler (hepsi **eklemeli şema**,
canlı veri korunur — CONTRIBUTING §2):

- **Kulüp sahipliği:** `Club.ownerUserId`, `tier`, `subscriptionStatus`, `rosterCap`, marka alanları (ad override, logo, renk).
- **Kulüp kurma akışı:** ad + logo (yükleme + moderasyon) + renk; tier seçimi → Stripe checkout.
- **Katıl / davet:** oyuncu, şehir-otomatik kulübü yerine bir premium kulübe **katılabilir** (davet kodu / başvuru-onay).
  → mevcut "şehre göre tek kulüp" modeli genişler (oyuncunun kulübü seçilebilir olur).
- **Kadro yönetimi:** menajer onayı, kapasite (tier) zorlaması, üye çıkarma.
- **Kulüp sayfası + kulüp sıralaması:** üyelerin sonuçlarından (bireysel klasman karışmaz) toplanan kulüp skoru.
- **Botlarla uyum:** premium kulüpler şehir-otomatik kulüplerle **yan yana** yaşar; turnuva alanı/bot doldurma bozulmaz.
- **Stripe:** 3 ürün (tier), checkout, subscription, **webhook** (active / past_due / canceled), müşteri **billing portal** (iptal/kart).

## 6. Antrenman & adalet (netlik)

- Antrenman hızı = organik tesis modeli (clubTrainingBase, facility kademesi) — **premium kulüpte de aynı.**
- Premium kulübün `facility`'si yine üye/başarıyla **organik** hesaplanır (sabit yüksek verilmez). İstenirse premium kulübe
  küçük bir **taban koruması** (facility belli bir alt sınırın altına düşmesin) düşünülebilir — ama bu "biraz daha iyi
  antrenman" demek olur → **pay-to-win sınırı.** Varsayılan: **yok** (tam adil). Karar Yusuf'a bırakıldı (§9).

## 7. İptal / abonelik biterse (veri korunur)

- Abonelik **past_due / canceled** → kulüp **premium özelliklerini kaybeder:** özel logo/ad/renk gizlenir (nötr'e döner),
  kadro kapasitesi normale iner, vitrinden çıkar. **Üyelerin kariyerleri ETKİLENMEZ** (canlı veri korunur).
- Tekrar abone olunca premium kimlik **geri yüklenir** (veri silinmez, pasifleşir).
- **Logo moderasyonu:** kullanıcı yüklemesi → uygunsuz/telifli içerik riski. Yükleme sonrası **onay** (manuel/otomatik) şart.

## 8. Build fazları (launch sonrası)

1. **Faz 0 — Ön satış/ilgi:** gerçek kulüplere vizyonu göster (bu doküman + görseller). İlgi varsa önceliklendir.
2. **Faz 1 — Kulüp sahipliği & markalama:** şema (owner/tier/branding), kulüp kurma + logo (moderasyon), kulüp sayfası.
3. **Faz 2 — Katıl/kadro:** davet/başvuru-onay, kadro yönetimi, şehir-otomatik modelin genişlemesi.
4. **Faz 3 — Stripe abonelik:** 3 tier, checkout, webhook, billing portal, past_due/cancel akışı.
5. **Faz 4 — Prestij:** kulüp sıralaması, vitrin/öne çıkma, duyurular, rozetler.

## 9. Açık kararlar (Yusuf verecek)

1. **Kadro sayıları** 10/15/20 kalsın mı, değişsin mi?
2. **Taban tesis koruması** (§6) olsun mu (minik avantaj, pay-to-win sınırında) yoksa **tam adil** (hiç antrenman etkisi yok) mi?
3. **Katılım modeli:** davet kodu mu, başvuru-onay mı, ikisi de mi?
4. Fiyatlar £9.99/14.99/19.99 sabit mi, bölgesel mi?
