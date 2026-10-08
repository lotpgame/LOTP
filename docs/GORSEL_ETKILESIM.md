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

---

## 6. #2 Kutlama juice'u — uygulama şartnamesi (onaylandı 06.10)

Saf CSS / Web Animations; **kütüphane yok, hafif.** `prefers-reduced-motion` açıksa efektler sakinleşir/kapanır
(**zorunlu**). Ses opsiyonel — mevcut `SoundToggle`'a bağlı. Hepsi istemci; tetikleyici veriler zaten var.

**Tetik noktaları → efekt:**
- **Tuş (sayı):** combat log'da tuş düştüğünde → **o tarafın renkli lambası** (SEN=kırmızı, RAKİP=yeşil) flash
  + skorda **"+1" uçan sayı** + skor bandında **hafif titreme**.
- **Beyaz lamba (hedef dışı):** log'da `⚪`/"Beyaz lamba" satırı → **o tarafın beyaz lambası** flash, **skor ARTMAZ.**
  **İki tarafta da olabilir** (her sporcunun kendi beyaz lambası; motorda hedef-dışı tuşu bulan tarafa göre).
- **Madalya (derece 1-3):** turnuva sonucunda → **konfeti** patlaması.
- **Şampiyonluk (derece 1 / büyük başarı):** → **kupa "pop" + bol konfeti + "Şampiyon" metni.**
- **Seviye/skill artışı, ranking yükselme (ops.):** "+X" uçan sayı / çubuk dolma.

**Nerede:** ScoreBug + canlı maç ekranı, turnuva sonuç ekranı, madalya/geçmiş. Yoğunluk küçük→büyük orantılı
(tuş < madalya < şampiyonluk). Lamba renkleri sinyal renkleri (temadan bağımsız).

**Cevap (Osman/Claude, 06.10): ✅ uygulandı — dal `feat/kutlama-efektleri`, PR [#46](https://github.com/alkanyus/LOTP/pull/46). Şema yok, motor değişmedi;
merge/yayın Yusuf'ta.** Tuş (lamba + hale, "+1", rakam sıçraması, bant titremesi), beyaz lamba (iki taraf, skor
artmaz), madalya konfetisi, şampiyonluk katmanı (kupa pop + "Şampiyon" + bol konfeti), "+X" (Sen yokken raporunda
skill kazanımı). `prefers-reduced-motion` açıkken hepsi kapalı. Şartnamenin açık bıraktığı yerlerde yorumlarım
(değiştirmek istersen tek satır):
1. **Renk:** "SEN=kırmızı, RAKİP=yeşil" — tasarım sisteminin taraf kuralı korunuyor (kırmızı = SOL, yeşil = SAĞ, oyuncuyu
   SEN etiketi söyler). Canlı periyotta oyuncu hep solda → kırmızı (şartnameyle aynı). Biten maç "Canlı izle" ile
   oynatılınca oyuncu B tarafındaysa sağda/yeşilde durur.
2. **"Canlı izle" düğmesi (eklendi):** B'den beri `/turnuva/[id]`'de maçlar yalnız geçmiş kipte (skor + Skor detayı)
   görünüyordu → tuş efektinin görüneceği ekran yoktu. Kendi maçlarına "Canlı izle" koydum (CanliMac'in var olan canlı
   kipi); skor yine baştan görünür, spoiler kuralı değişmedi. İstemezsen kaldırırım.
3. **Beyaz lamba yeri:** bandın pist ortasına bakan ucunda (gerçek cihazlardaki gibi içte), yalnız yanarken görünür →
   epede/kılıçta boş lamba durmaz. Taraf, motor satırındaki addan bulunur (motor değişmedi).
4. **"Madalya/geçmiş":** kutlama turnuva sonuç ekranında oynar; Kariyer Geçmişi'nden eski bir turnuva açılınca aynı
   ekran geldiği için orada da oynar. Kupa vitrini (#3) gelince aynı bileşen "yeni" rozetlerde kullanılabilir.
5. **"Büyük başarı":** şimdilik yalnız şampiyonluk (milli takım daveti sonuç ekranında yok).
6. **Ses eklenmedi:** opsiyonel; §5'teki "ses varsayılan açık mı kapalı mı?" kararı açık ve mevcut ayar varsayılan
   **açık** — karar gelince kısa bip + madalya jingle'ı (dosyasız, WebAudio) eklenir.
7. **Sıralama yükselmesi "+X":** eski sıra verisi sonuç ekranında yok → yalnız skill kazanımında.

---

## 7. #3 Kupa/madalya vitrini + kariyer zaman çizgisi — uygulama şartnamesi (onaylandı 06.10)

**Yer:** Kariyer Geçmişi sayfası (`/kariyer/gecmis`). Saf HTML/CSS/SVG + Tabler ikon; hafif, dış sanat yok.
**Veri kaynağı:** Achievements/Memory engine (veri sahibi oradadır — **okur**, yeni başarı üretmez).

**Kupa vitrini (ızgara):** başarı türüne göre rozet —
- Şampiyonluk → `ti-trophy` (altın); Derece madalyaları → `ti-medal` **altın/gümüş/bronz** (metal renkleri, sinyal değil);
  Milli takım → `ti-flag` (accent); Klasman 1.liği → `ti-crown` (altın).
- Her rozet: **sayı** (×N) + **son kazanım tam tarihi**.
- **Kilitli hedefler** (henüz kazanılmamış üst kademe: Avrupa Kupası, Dünya Kupası, Olimpiyat) → soluk + `ti-lock`
  + "kilitli" → "daha var, topla" hissi (koleksiyon motivasyonu).

**Kariyer zaman çizgisi (kronolojik):** her düğüm = **tam tarih** (gün · ay · yıl, **GMT**) + olay + tür ikonu.
Büyük dönüm noktaları (ilk şampiyonluk, milli takım daveti) **vurgulu** (accent etiket). En sona "sırada…" düğümü
(bir sonraki hedef) opsiyonel.

**Tam tarih (önemli):** her başarı **kazanıldığı dünya-gününü (worldDay)** saklamalı → gösterimde GMT takvim
tarihine çevrilir (`worldDayStartMs` → `toLocaleDateString("tr-TR",{timeZone:"UTC",...})`). Yeni başarılarda tarih
kaydı **zorunlu**; eski kayıtta yoksa çeyrek/sezon'a düş (geriye uyumlu, eklemeli şema). İl=Salı, Türkiye=Perşembe
olduğundan tarihler oyun takvimiyle tutarlı.

**Renkler:** altın `#e0b23f`/koyu metin `#8a6410`, gümüş `#eceef1`/`#5a6068`, bronz `#f3e3d5`/`#7a4e2b`.
**Teslim:** Osman branch + PR; canlıya Yusuf alır.

**Cevap (Osman/Claude, 06.10): ✅ uygulandı — dal `feat/kupa-vitrini`, PR [#47](https://github.com/alkanyus/LOTP/pull/47) (#46'nın üstüne kurulu; merge/yayın
Yusuf'ta).**

🚨 **Squash'tan ÖNCE prod DB:** şema yalnız EKLEMELİ — `Achievement.worldDay` (INTEGER, boş olabilir). B'deki gibi
`migrate deploy` DEĞİL: `npx prisma db execute --file prisma/migrations/20261006190000_achievement_worldday/migration.sql`
(prod `DATABASE_URL` ile). Yerelde aynı komutla uygulandı, ardından `db push` "already in sync" dedi. Kod yeni sütunu
yazdığı için önce DB, sonra kod.

Uygulananlar: vitrin (9 rozet: şampiyonluk, altın/gümüş/bronz madalya, milli takım, klasman 1.liği + kilitli Avrupa
Şampiyonası / Dünya Kupası / Olimpiyat; her biri ×N + son kazanım tarihi), zaman çizgisi (eskiden yeniye, GMT tam tarih,
dönüm noktası etiketi, sonda "Sırada: …"); yeni başarılar kazanıldığı dünya gününü yazar (canlı turnuva + eski yol).
Uçtan uca: yerelde hızlandırılmış saatle bir turnuva oynandı → yeni "İlk Turnuva" başarısı `worldDay` ile yazıldı,
sayfada "6 Ekim 2026" göründü. Şartnamenin açık bıraktığı yerlerde yorumlarım (değiştirmek istersen tek satır):
1. **Kaynak:** şampiyonluk ve altın/gümüş/bronz sayıları turnuva derecelerinden okunur (başarı kaydında derece yok);
   milli takım ve klasman 1.liği başarılardan. Altın madalya sayısı = şampiyonluk sayısı (eskrimde şampiyon altın da
   alır) — istersen altın rozetini kaldırırım.
2. **Kilitli hedefler** o seviyede madalyayla (ilk 3) açılır; oyundaki adlarıyla "Avrupa Şampiyonası" (şartnamede
   Avrupa Kupası) ve "Dünya Kupası". Olimpiyat seviyesi oyunda yok → şimdilik hep kilitli.
3. **Kazanılmamış normal rozetler** gri boş yuva + "Henüz yok" (kilit ikonu yalnız üst kademe hedeflerinde).
4. **Renkler:** metal renkleri şartnamedeki gibi (disk zemini + ikon). Altın çiftinin kontrastı 2,7:1 (gümüş 5,5,
   bronz 5,7) → yazılar diskin dışında, tema renginde; ikon da koyulaşsın istersen `#5c4108` (4,8:1). "Accent" =
   tasarım sistemindeki tek prestij rengi `--prio` (milli takım için zaten izinli) → bayrak rozeti prio çerçeveli.
   Tabler yerine kendi ikon setimize bayrak + taç eklendi (pist-konsolu kural 4: ikon yalnız `Icon.tsx`).
5. **Dönüm noktası** = ilk şampiyonluk, milli takım, klasman 1.liği. İlk şampiyonlukta motor iki kayıt yazıyor
   ("İlk Şampiyonluk" + "Şampiyonluk") → zaman çizgisinde tek düğüm.
6. **Eski başarılar:** tarih yok → "Q1" gibi çeyrek. Mevcut `date` alanından toplu doldurmak mümkün ama her eski
   kariyerde gün sayısının dünya günüyle aynı olduğundan emin değilim → yapmadım.
7. **Sayfa düzeni:** vitrin en üstte → istatistikler → zaman çizgisi → Turnuvalarım → Rakiplikler. Önem yıldızlı eski
   "Başarılar" listesi kalktı (aynı kayıtlar artık zaman çizgisinde).
8. **Ek düzeltme:** "Turnuvalarım" tarihi oyun-içi takvimdendi ("16.01.2026") ve aynı sayfadaki vitrinle çelişiyordu →
   artık turnuvanın dünya gününden GMT tarihi (eski turnuvada tarih yok, "Q · H" kalır).

---

## 8. #4 Bugün ekranı cila — uygulama şartnamesi (onaylandı 06.10)

**Yer:** **Bugün / ana ekran** (`/kariyer`, alt menü ilk sekme) — en çok görülen ekran. Bugünkü aktivite +
sıradaki turnuva kartları aynen kalır; aşağıdakiler eklenir/zenginleşir. Saf SVG/CSS; hafif, dış sanat yok.

- **Büyük profil başlığı:** isim + silah/kategori/kulüp + büyük **reyting**. (Avatar park edildiği için şimdilik
  baş-harf rozeti; avatar gelince oraya girer.)
- **Skill radar grafiği:** eksenler Skill engine gruplarından/alt-skillerinden; **dolu alan = şimdiki**,
  **kesikli = geçen çeyrek** → büyüyen eksende **yeşil "+N"**. Veri: Skill engine (permanent skill, ondalık →
  UI'da yuvarla). Radar geometrisi istemcide hesaplanır. (İstenirse ayrı "Yetenekler detay"ında da kullanılır.)
- **Form/Kondisyon ışıltısı:** çubuklar; değer yüksekken (ör. ≥%70) hafif **nabız/parıltı**. Veri: conditioning
  (sharpness/fatigue). **`prefers-reduced-motion` → parıltı kapalı** (zorunlu).
- **Son başarılar şeridi:** Memory'den son rozetler; **yeni** olan vurgulu (kısa parıltı). (#3 vitriniyle aynı
  rozet dili.)

**Renkler:** sinyal/metal renkleri temadan bağımsız; radar/accent tema değişkenleri. **Teslim:** Osman branch + PR.

**Cevap (Osman/Claude, 06.10): ✅ uygulandı — dal `feat/bugun-cila`, PR [#48](https://github.com/alkanyus/LOTP/pull/48) (#47'nin üstüne kurulu; merge/yayın
Yusuf'ta).**

🚨 **Squash'tan ÖNCE prod DB (2. SQL, #47'ninkinden sonra):** şema yalnız EKLEMELİ — `GameState.skillQuarterBase`
(TEXT, boş olabilir): `npx prisma db execute --file prisma/migrations/20261006210000_skill_quarter_base/migration.sql`.
Yerelde aynı komutla uygulandı, `db push` "already in sync" dedi.

Uygulananlar: büyük profil başlığı (baş-harf rozeti, isim, silah · kategori · yaş, kulüp, sağda büyük reyting),
yetenek radarı (dolu = şimdi, kesikli = geçen çeyrek, büyüyen eksende yeşil "+N"), kondisyon/form çubuklarında ≥%70
ışıltı, "Son başarılar" şeridi (yeni olan parıltılı). Uçtan uca: yerelde gün ilerleyince çeyrek başı değerleri o günün
antrenmanından önce kaydedildi. Yorumlarım (değiştirmek istersen tek satır):
1. **Radar eksenleri** = 10 alt yetenek (şartname "gruplar/alt yetenekler" diyordu; 4 eksen elmas gibi kalıyordu).
   Ölçek, altındaki yetenek çubuklarıyla aynı yaş grubu bandı (U10 = 30 …) → iki gösterim aynı şeyi söyler.
2. **"Geçen çeyrek" verisi yoktu** → `GameState.skillQuarterBase`: her çeyreğin ilk işlenen gününde, antrenmandan önce
   yetenekler dondurulur (çeyrek başı = geçen çeyreğin sonu). Mevcut oyuncularda ilk kayıt güncellemeden sonraki ilk gün
   ilerlemesinde olur; canlı dünya hâlâ 1. çeyrekte (2. çeyrek ~14 Aralık) → o zamana kadar kesikli çizgi "güncelleme
   günü"nü gösterir, sonra gerçek "geçen çeyrek". Kayıt yokken kesikli çizgi ve "+N" hiç çizilmez.
3. **"+N"** tam sayıya yuvarlanır, en az +1 olunca görünür. Renk şartnamedeki gibi yeşil (`--sig-green`) — tasarım
   sisteminde yeşil "sağ taraf" demek; şartname açıkça yeşil istediği için böyle bıraktım.
4. **Reyting** büyük başlığa taşındı → altındaki üçlü değer kutusundan reyting kalktı (kondisyon + form kaldı), aynı
   sayı iki kez yazmasın diye.
5. **Kulüp** satırında kulüp adı (yoksa şehir) bayrakla; yaş korunuyor.
6. **Işıltı** eşiği ≥ %70 (şartnamenin örneği), mürekkep renginde yavaş nabız (2,4 sn); trafik lambası rengi yok.
7. **Son başarılar:** en yeni 6 rozet, sayfanın üstünde (§2.2 "üstte parlayan rozet şeridi"); "Vitrin ›" Kariyer
   Geçmişi'ne gider; başarı yoksa şerit hiç görünmez. "Yeni" = son 3 dünya gününde kazanılan ("görüldü" bilgisi
   tutulmadığı için güne bağlı); yeni rozetin diski 3 kez halka saçar ve altında "Yeni" yazar (hareket kapalıyken de
   anlaşılsın diye).
8. **Rozet dili** vitrinle ortak modülde (`src/app/ui/achievementBadge.ts`). Başarı kaydı dereceyi tutmadığı için
   "İlk Madalya" / "Uluslararası Madalya" nötr metal (gümüş), "Quarter Ranking İlk 3" bronz.

---

## 9. #1 Avatar — karakter yüz portreleri (tasarım kaydı, onaylandı 08.10)

> ℹ️ **Osman'a devir yalnız [`DEVIR.md`](DEVIR.md)'de** (kendi içinde tam). Bu bölüm bizim (Yusuf+Claude) tasarım kaydımızdır; Osman bu dosyaya yönlendirilmez.

**Karar (Yusuf, 08.10):** Avatar = **karakter YÜZ portreleri** ("setten seç" — katmanlı oluşturucu DEĞİL; maske fikri **iptal**). Kullanıcının attığı **lisanslı çizgi-film çocuk-sporcu seti STİL referansıdır — KOPYALANMAZ.** Osman **AI ile ÖZGÜN (telifsiz) bir set ÜRETİR** (benzer çekicilik/kalitede). Claude'un sohbetteki SVG örnekleri yalnız **konsept** (sade vektör); hedef kalite referanstaki gibi cafcaflı/gölgeli çizgi-film.

**Sanat yönü (Osman'ın AI'ına — şartname):**
- Dairesel kadrajda **baş-omuz portresi**; küçük boyutta (40–60 px) net okunur.
- **Tek tutarlı stil** + **çeşitlilik**: farklı ten tonu, saç, cinsiyet → herkes kendini bulur.
- Çocuk-dostu, canlı, pozitif. Eskrim dokunuşu opsiyonel (kıyafet yakası/aksesuar); **yüz görünür** (maske zorunlu değil).
- **Şeffaf arka plan PNG** (daire kadrajı uygulama çizer). İlk set ~10–14 varyant.
- **Telifsiz:** AI üretimi, bizim; referans sitenin görseli hiçbir biçimde kullanılmaz.

**Yaşlandırma (açık madde — Yusuf sordu 08.10):** İleride her karakterin **çocuk / genç / yetişkin** varyantı üretilip avatar **oyuncunun yaş kategorisiyle büyüyebilir** (U10→U17→Büyükler). **İLK denemede STATİK** (tek yaş; 3× sanat gerektirmesin) — yaşlandırma **sonraki adım / V2**.

**Sistem (kod):**
- Şema **eklemeli**: `Player.avatar` (TEXT, nullable; seçilen avatar id). Boşsa **varsayılan silüet** → mevcut oyuncular bozulmaz, sonra seçerler.
- **Seçici:** Sporcu Oluşturma ekranı + Ayarlar → Görünüm (ızgara, seçili halka — Claude mockup'ı sohbette).
- **Gösterim:** Kimlik kartı (baş-harf rozetinin yerine), klasman / turnuva / milli takım / pul kağıdı listelerinde küçük yuvarlak.
- Hepsi istemci + statik görsel varlık; motor (`src/engine`) değişmez.

**İlk adım ("bir denesin bakalım ne çıkar" — Yusuf):** Osman **3–4 örnek portre** üretsin + seçici/kimlik kartına bağlasın (silüet varsayılan). Yusuf+Claude onaylar → tam set + tüm ekranlar.

**Teslim:** branch + PR; canlıya Yusuf alır. Şema eklemeli → merge öncesi prod DB adımı ([[DEVIR]] deseni).
