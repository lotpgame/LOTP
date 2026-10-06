# Görsel & Etkileşim Tasarımı — çocuk/genç ilgisini çekmek (sayfa sayfa)

> **Amaç:** Metin-tabanlı eskrim simülasyonunu, özellikle **çocuk (U10-U14)** ve **genç (U17+)**
> oyuncular için daha **cafcaflı / çekici** hale getirmek — 3D motor EKLEMEDEN.
> **"Cafcaflı" = kimlik + kutlama + hareket (juice) + ödül.** Ağır oyun motoru değil.
>
> **İşbölümü:** Tasarım **Yusuf + Claude**'da; **Osman uygular** (çekirdeğe fikir eklemez — [[lotp-osman-isbolumu]]).
> Hepsi **istemci tarafı** (SVG / CSS animasyon / [Lottie]) → oyun motoru (`src/engine`) değişmez, mimari korunur.
> Tasarım dili: [`docs/tasarim/pist-konsolu.md`](tasarim/pist-konsolu.md) — bu doküman onun ÜSTÜNE "şenlik katmanı" ekler.
>
> Son güncelleme: 2026-10-06. Önce bu okunur, sonra ilgili sayfa Osman'a branch+PR ile uygulatılır.

---

## 0. Temel ilkeler (her sayfada geçerli)

1. **"Benim eskrimcim" hissi** her yerde — avatar, isim, kulüp arması tekrar tekrar görünür.
2. **Her başarı kutlanır** — küçük tuştan şampiyonluğa kadar orantılı juice (lamba flash → konfeti → tam ekran).
3. **İlerleme GÖRÜNÜR** — çubuk dolar, radar büyür, kupa vitrine eklenir. Çocuk "büyüdüğünü" görmeli.
4. **Hareket amaçlı, abartı değil** — mikro animasyon (150-400ms), yormayan. **Erişilebilirlik:** `prefers-reduced-motion`
   açıksa animasyonlar sakinleşir (zorunlu).
5. **Yırtıcı para YOK** (çocuk kitlesi): kozmetikler **başarıyla** açılır; para tarafı adil/kozmetik kalır (loot box / kazanmak-için-öde yok).
6. **Mobil-önce + performans:** düşük telefonları düşün; animasyonlar CSS transform/opacity (GPU), ağır değil.

---

## 1. Global sistemler (tek yerde kur, her sayfa kullanır)

### 1.1 Avatar / Kimlik (🔥 en güçlü kanca)
- **SVG katmanlı eskrimci avatarı:** maske + üniform + silah; renk/desen değiştirilebilir. Bugün sadece baş-harf rozeti var.
- **Oluşturucu:** maske rengi, üst/pantolon rengi, kulüp arması, (opsiyonel) ten/saç. Oluşturma ekranında + Ayarlar'da.
- **Kozmetik kilidi:** şampiyonluk/madalya/milli takım ile açılan maske desenleri, altın lamba efekti, özel üniforma, kupa çerçevesi.

### 1.2 Kutlama / Juice katmanı
- **Lamba sistemi** (kırmızı/yeşil/beyaz zaten var) → tuşta flash + mikro titreme.
- **Konfeti / parıltı** bileşeni (madalya, şampiyonluk, seviye atlama).
- **Sayı artışı animasyonu** (ranking puanı, para, XP "+12" uçar).

### 1.3 Ses (opsiyonel, Ayarlar'dan kapatılabilir — zaten SoundToggle var)
- Tuş sesi, lamba "bip"i, madalya jingle'ı, seviye-atla sesi. Kısa, hafif, kapatılabilir.

### 1.4 Rozet / Kupa / Başarım görselleri
- Parlak madalya/kupa SVG'leri (altın/gümüş/bronz), rozet ikonları (GLADIUS tarzı, kendi ikonlarımız).
- Her yerde tutarlı kullanılır (profil, geçmiş, klasman).

### 1.5 Bildirim / "an" yakalama
- "Maç kartı" paylaşılabilir görsel (sonuç + skor + avatar) → arkadaşa gönderir (sosyal büyüme).

---

## 2. Sayfa sayfa

> Her sayfa: **Şu an** (kabaca) · **Ekleyebileceğimiz cafcaf** · **Öncelik** (🔥 yüksek / 🟡 orta / ⚪ düşük).

### 2.1 Giriş & Sporcu Oluşturma (`/`)  — ilk izlenim, en kritik hook
- **Şu an:** başlık, mini maç önizleme animasyonu, oluşturma formu.
- **Cafcaf:**
  - **Canlı avatar önizleme:** form doldurulurken eskrimci anında güncellenir (silah seçince silah değişir, renk seçince üniforma).
  - Arka planda hafif animasyonlu pist / lamba parıltısı.
  - "Kariyere Başla" butonunda kıvılcım + geçiş animasyonu (sahaya giriş hissi).
- **Öncelik:** 🔥 (ilk 30 saniye çocuğu yakalar ya da kaybeder).

### 2.2 Bugün / Ana ekran (`/kariyer`)
- **Şu an:** profil kartı (avatar, silah/kategori/yaş/şehir), bugünkü aktivite, sıradaki turnuva, yetenekler.
- **Cafcaf:**
  - **Büyük avatar** + kulüp arması; ruh hali/form ışıltısı (iyi formda parlar).
  - **Skill radar grafiği** (büyüdükçe dolar) — "geçen aya göre +" vurgusu.
  - Günlük "selam" / küçük hedef ("Bugün antrenman seni %X güçlendirir").
  - Yeni başarı varsa üstte **parlayan rozet şeridi**.
- **Öncelik:** 🔥 (en çok görülen ekran).

### 2.3 Antrenman (`/kariyer/antrenman`)
- **Şu an:** kondisyon/form kartları, haftalık plan (gün × tip ızgarası), seçim butonları.
- **Cafcaf:**
  - Seçince **dolma animasyonu** + mikro ikon canlanması; plan kaydedilince onay parıltısı.
  - Kondisyon/form **çubukları yumuşak doluş**; aşırı antrenman uyarısı kırmızı nabız.
  - "Bu hafta seni en çok X geliştirir" **ön-izleme** (küçük artış oku).
- **Öncelik:** 🟡.

### 2.4 Turnuvalar (`/kariyer/turnuvalar`)
- **Şu an:** sıradaki turnuva kartı + geri sayım, 7 gün şeridi, yaklaşan liste, taktik değiştir.
- **Cafcaf:**
  - Geri sayım **canlı tik** + son saatte nabız; "sıradaki" kartı seviye rengiyle (İl/Türkiye/Open) parlar.
  - Taktik seçimi **kart-çevirme** gibi görsel; kayıt olunca "hazırsın" rozeti.
  - 7 gün şeridinde turnuva günleri **ikon + ışıltı**.
- **Öncelik:** 🟡.

### 2.5 Maç / Canlı turnuva (`/turnuva/[id]`, canlı) — 🔥🔥 EN BÜYÜK WOW
- **Şu an:** skor bandı (ScoreBug), tuş-tuş metin anlatımı, lamba satırları, pul kağıdı.
- **Cafcaf:**
  - **Hafif 2D animasyonlu pist:** iki figür, metne göre ileri-geri / hamle / parad / riposte (SVG + CSS/Lottie).
    3D değil, çizgi-film. "Maçımı İZLİYORUM" hissi — çocuk için en çarpıcı şey.
  - Tuşta **lamba flash + skor sıçraması + mikro ekran titremesi**; altın tuş özel efekt.
  - Tur/periyot geçişi animasyonu; galibiyette figür zafer pozu + konfeti.
- **Öncelik:** 🔥 (yüksek çaba ama en yüksek etki; Faz 3 canlı akışıyla birlikte düşünülmeli — B/Osman).

### 2.6 Klasman (`/kariyer/klasman`)
- **Şu an:** kategori sıralaması, milli takım/uluslararası kapı çizgileri.
- **Cafcaf:**
  - Kendi satırın **vurgulu + avatar**; sıralama değişince "↑2 / ↓1" animasyonlu rozet.
  - İlk 4 / ilk 16 çizgilerinde **kapı ışıltısı** ("milli takıma 2 sıra kaldı!").
  - Rakip vurgusu ("X seni geçti").
- **Öncelik:** 🟡 (gençler için rekabet motivasyonu yüksek).

### 2.7 Kulüp (`/kariyer/kulup`)
- **Cafcaf:** kulüp arması/rozeti, kulüp rengi; "kulüp gururu" (kulüp sıralaması/katkın), antrenör kartı avatarı.
- **Öncelik:** ⚪ / 🟡.

### 2.8 Ekipman / Mağaza (`/kariyer/ekipman`)
- **Şu an:** silaha göre katalog, markalar (açılır pencere), slotlar.
- **Cafcaf:**
  - Ürün kartları **parlak ikon** (GLADIUS) + "takınca avatara yansısın" (önizleme).
  - Satın alma **kutu-açılış** hissi (abartısız, loot box DEĞİL — satın aldığın belli).
  - Yıpranma görseli (eşya eskidikçe soluklaşır → yenileme isteği doğal gelir).
- **Öncelik:** 🟡.

### 2.9 Kariyer Geçmişi (`/kariyer/gecmis`)
- **Cafcaf:** **Kariyer zaman çizgisi** (ilk il şampiyonası → milli takım → dünya kupası) — görsel timeline.
  **Kupa/madalya vitrini** (parlak koleksiyon). Rakiplikler kartı. En gurur anları "öne çıkan" kartlar.
- **Öncelik:** 🔥 (koleksiyon = uzun vadeli bağlılık; çocuk "biriktirmeyi" sever).

### 2.10 Sözlük (`/kariyer/sozluk`)
- **Cafcaf:** terim kartlarına **küçük animasyonlu diyagram** (parad-riposte nedir — mini canlandırma).
  Eğitici + eğlenceli, yeni başlayan çocuk için değerli.
- **Öncelik:** ⚪.

### 2.11 Ayarlar (`/kariyer/ayarlar`)
- **Şu an:** dil, görünüm (tema + Klasik/Yatay), ses, yeni başla.
- **Cafcaf:** **Avatar düzenleme** buraya; tema önizlemeleri canlı; (ileride) kozmetik vitrini.
- **Öncelik:** 🟡 (avatar düzenleme kimlik için önemli).

---

## 3. Öncelik / yol haritası (çaba × etki)

| Sıra | İş | Etki | Çaba | Not |
|---|---|---|---|---|
| 1 | **Avatar + kimlik sistemi** (SVG katmanlı, oluşturucu, önizleme) | 🔥 | Orta | Global 1.1; oluşturma + Bugün + Ayarlar'da görünür |
| 2 | **Kutlama/juice katmanı** (lamba flash, konfeti, sayı artışı) | 🔥 | Düşük | Global 1.2; hızlı "his" kazandırır |
| 3 | **Kupa/rozet vitrini + kariyer zaman çizgisi** (Geçmiş) | 🔥 | Orta | Koleksiyon = bağlılık |
| 4 | **Bugün ekranı cila** (büyük avatar, radar, başarı şeridi) | 🔥 | Orta | En çok görülen ekran |
| 5 | **Animasyonlu pist** (maç izleme) | 🔥🔥 | Yüksek | B/Faz 3 ile birlikte (Osman); en büyük wow |
| 6 | Klasman/Turnuva/Antrenman mikro-animasyonları | 🟡 | Düşük-Orta | Dağıtık cila |
| 7 | Ekipman önizleme + yıpranma görseli, Sözlük diyagramları | 🟡/⚪ | Orta | Derinlik |

**Öneri sırası:** 1 → 2 → 3/4 paralel → sonra 5 (büyük iş, B ile). Hızlı "wow" için **2 (juice)** ilk gün yapılabilir.

---

## 4. Teknik notlar (Osman için)
- **Kütüphaneler:** mümkünse saf **CSS/SVG**; karmaşık karakter animasyonu için **Lottie** (hafif JSON, tasarımcı dostu).
  Yeni ağır bağımlılık eklemeden önce gerekçe (CLAUDE.md §6).
- **Performans:** yalnız `transform`/`opacity` animasyonu; mobilde 60fps hedef; görseller optimize SVG.
- **Erişilebilirlik:** `prefers-reduced-motion` + ses kapatma (var) zorunlu.
- **Mimari:** hepsi istemci; motor/sunucu değişmez. Kozmetik kilidi başarıya bağlı (veri sahibi: Memory/Achievements — okur, yeni alan gerekirse eklemeli şema).
- **Teslim:** branch + PR, master'a push/deploy yok — Yusuf/Claude canlıya alır ([[DEVIR]] teslim kuralı).

---

## 5. Açık sorular (Yusuf karar verecek)
- Avatar ne kadar detaylı? (basit renk/desen mi, yüz/saç dahil mi?)
- Kozmetikler yalnız başarıyla mı açılsın, yoksa Denar ile (adil, kozmetik) satın alma da olsun mu?
- Animasyonlu pist: tam figür animasyonu mu, yoksa sembolik (nokta/çubuk ileri-geri) mi? (çaba farkı büyük)
- Ses varsayılan açık mı kapalı mı?
