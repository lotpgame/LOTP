# Changelog

Bu projedeki tüm önemli değişiklikler bu dosyada tutulur.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) ·
Sürümleme: [Semantic Versioning](https://semver.org/lang/tr/).

## [Unreleased]

Playtest (oyun sahibi) geri bildirimlerine göre oynanış iyileştirmeleri. Ayrıntılı liste
`docs/NOTLAR.md`.

### Düzeltildi/Değişti (11.10 — renklendirme + sadeleştirme (playtest))
- **Hata düzeltme:** turnuva seviye rengi (`levelColor`) client modülündeydi, sunucu bileşeni çağırınca Turnuvalar
  sayfası hata veriyordu → saf fonksiyon ayrı `levelColor.ts`'e taşındı (hem sunucu hem istemci kullanır).
- **Kondisyon/Form + kulüp TESİS KALİTESİ çubukları trafik lambası renginde:** düşük **kırmızı**, orta **sarı (amber)**,
  yüksek **yeşil** (`Segments traffic`). Durum yazısı korundu.
- **Kaldırılan açıklamalar:** yeteneklerdeki "Raylar U10 ölçeğinde…", klasmandaki "Kulüp sıralaması/dünya klasmanı V2",
  kulüpteki "Tesis ve antrenörler… (kulüp değiştirme ileride)" notları (gereksiz).
- **Turnuva kartları seviyeye göre renkli:** İl→yeşil, Türkiye→kırmızı, Open→nötr, Satellite→mavi, Avrupa→mor,
  Grand Prix→amber, Dünya Kupası→altın. Kartta hafif arka plan tinti + seviye renkli sol şerit; seviye etiketi (LevelTag) de renkli.
- **Kaldırıldı:** yetenekler altındaki "Raylar U10 ölçeğinde dolar…" açıklaması (gereksiz).

### Eklendi/Değişti (11.10 — eleme çatalı yenileme + maç anlatımı eskrim terimleri + periyot işaretleri (playtest))
- **Eleme çatalı yenilendi (#55):** her maç temiz bir kart — **kazanan kalın/net, kaybeden soluk**; SENİN maçların
  `--me` ile vurgulu (yolunu turlar boyunca izlersin); finalin kazananı **kupa (şampiyon)**. Bay (bye) tabloyu
  ikili-ağaç yapmadığı için sıkı bağlantı çizgisi yerine kart vurgusu (mobil-dostu, bay'a dayanıklı). Ayrı `Bracket` bileşeni.
- **Maç anlatımı EskRİM TERİMLERİYLE zenginleşti:** havuz çok genişletildi (bate/çelme, dégajé, parat-riposta, feint,
  flèche, coupé, appel, angulation, prise-de-fer, point-in-line, arrêt…). **Paratlar numaralı:** flöre/epe **4/6/7/8**
  (quarte/sixte/septime/octave), **kılıç 5 (quinte, baş) + 3 (tierce)**. **U10'a da 2 zamanlı** eklendi (bate/dégajé/parat-riposta
  çocuk maçlarında da çıkar; 3-4'lü uzun diziler U10'da yok). Test yeni kurala göre güncellendi.
- **Periyot işaretleri (#52):** eleme log'unda **"N. Periyot başladı"** (başlık) + **"⏸ N. periyot bitti — X–Y"** satırı.

### Değişti (11.10 — hazırlıkta maçtaki gibi lambalı skor bandı (playtest))
- **HAZIRLIK (podyum) artık ScoreBug gösterir** (maçtaki gibi kırmızı/yeşil lambalı bant): yeni maçta **adın (sol/kırmızı,
  SEN) 0–0 rakip (sağ/yeşil)**, bantta "{tur} · Maç başlıyor"; devre arasında o ana dek skor + "N. periyot başlıyor".
  Rakip belli değilse (eleme bekleniyor) metin. DTO'ya izleyenin adı eklendi (`live.youName`).

### Düzeltildi/Değişti (11.10 — canlı maç spoiler + ekran cilası (playtest))
- **SPOILER düzeltildi (BÜYÜK):** maç sunucuda oynama başında çözülünce sonucu hemen hazır oluyordu → **"Senin
  Maçların"** (geçmiş) ve **eleme çatalı**, podyumda O AN oynanan maçın FİNAL skorunu gösterip animasyonu spoil
  ediyordu. Artık podyumdaki maç, animasyon penceresi bitene (serverNow < playStart+animMs) kadar geçmişte/çatalda
  **gizli** ("oynanıyor"); oynama bitince düşer.
- **Maç anlatımı TERS akar:** son gelen tuş **en üstte** kalır (yeni→eski, yukarıdan aşağı) — kullanıcı tercihi.
- **"Canlı turnuva" + GMT saat rozeti** podyumdan **turnuva başlığının hizasına** taşındı (sağ üst); podyum sadeleşti.
- Eleme çatalından gereksiz **"Yana kaydır"** ipucu kaldırıldı. **Pul sonucu** kartı yeni format ("2)" ön eki kaldırıldı → başlık "Pul Sonucun" + cümle.

### Değişti (11.10 — periyot "pencere başında çözülür": tam sunucu-zaman hizası (kullanıcı modeli))
- **Eleme periyodu artık OYNANMAYA BAŞLADIĞI an çözülür** (önceden periyot sonunda). `liveStepMinute` eleme için
  `turBaşı + (p-1)×1.5` (eski `+1` kaldırıldı) → periyot oynama penceresi **başında** çözülür, istemci 1 oyun-dk
  animasyonla oynatır, **sonuç +1 dk sonra** belli olur. Böylece saat etiketi kullanıcı modeliyle **birebir** hizalanır:
  eleme tur 1 periyotları **18:20–21 / 18:21:30–22:30 / 18:23–24** (oynama pencereleri), aralarda 30 sn taktik.
  Taktik penceresi = oynama başı anı (periyot oynanmadan önce kilitlenir). Havuz zaten böyleydi (maç [5,6]…).
  Testler güncellendi (eleme oynama başları 20/21.5/23). 204 test + build yeşil.
- **Eleme maçı en çok 3 periyot + baraja ulaşınca erken bitiş (motor):** `deFormat` U10 artık **10 tuş / en çok 3 periyot**
  (önceden sabit 2). Maç tuş barajına (U10 10, büyükler 15) ulaşınca **erken biter** → çoğu maç 2 periyotta, yakın/düşük
  tempolu maçlar 3. periyoda gider (büyük yaşlarda daha sık). Erken-bitiş mekanizması zaten vardı; U10'un üst sınırı 3'e çıktı.
- **Periyot/pul maçı TAM 1 oyun-dakikası oynanır** (podyum animasyonu `animMs` 0.7→1.0 oyun-dk). Kalan süre hazırlık/taktik:
  havuzda 1 dk, eleme periyot arası 30 sn → kullanıcının "1 dk oyna, 30 sn taktik" modeline oturur.
- **Zamanlama:** pul sonuçları **T+17 → T+15** (`poolResultsMinute`); **KLASMAN T+16** (sonuç+1 dk), **ELEME ÇATALI T+17**
  (sonuç+2 dk) — kademeli açılış (#43). Eleme turları arası **5 → 6 dk** (`deStepMinutes`: 3 periyotluk maç ~4 oyun-dk + 2 dk ara).
  Turlar: Son 32 T+20 · Son 16 T+26 · Çeyrek T+32 · Yarı T+38 · Final T+44.

### Eklendi/Değişti (11.10 — #51 PODYUM aşama modeli + turnuva ekranı düzeni (NOTLAR #49/#50/#51/#52/#44))
- **Podyum (#51):** canlı turnuva ekranının üstünde tek **podyum** (`LivePodium`) — sunucu-zamanına göre **OYNAMA**
  (o an akan maç + hangi periyot) ↔ **HAZIRLIK** (sıradaki maç/periyot + taktik + geri sayım) arasında geçer.
  Taktik artık ayrı panelde değil, **podyumda akan/sıradaki maça ait**. Podyumun altında tek **"Sıradaki: X"** satırı
  (elemede sonuç sızmasın diye maç bitene dek gizli). "Olay anı" yerine o an NE olduğu yazılır ("Pul maçları devam
  ediyor" / "{tur} · {p}. periyot oynanıyor"). Devre arasında **tur + o ana dek skor + "N. periyot başlıyor"** gösterilir.
- **Biten maç geçmişe düşer (#49):** oynama bitince maç podyumdan düşüp **"Senin Maçların"** (katlanır) bölümüne iner;
  podyum sıradaki hazırlığa geçer. **Pul maç etiketi (#50):** "Pul 1" → **"Pul 1 · N. maç"** (havuz-içi sıra).
- **Klasman + eleme çatalı açılır-kapanır (#44):** ikisi de katlanabilir ayrı bölümler; düzen **eleme çatalı → pul
  sonucu/bay bilgisi → turnuva klasmanı**. Bay netliği: bay geçtiysen + ilk eleme rakibin belli değilse
  "önceki tur sonuçları bekleniyor" bilgisi.
- **Ekran sadeleştirme:** başlık altına **turnuva tarihi** (saat zaten podyumda), üstteki "Kariyere dön" linki kaldırıldı
  (altta buton zaten var), taktik gönderim geri bildirimi tek satır (çift "gönderildi" düzeltildi).

### Değişti (11.10 — canlı maç animasyonu SUNUCU-ZAMAN senkronu (NOTLAR #45/#49/#54 çekirdeği))
- **Baştan sarma / asılı maç / replay kökten çözüldü (#45/#49):** canlı "podyum" maçının animasyonu artık
  istemcinin mount anından değil **sunucu saatinden** sürer. Açılan satır sayısı `now`'ın saf fonksiyonudur:
  `reveal = floor + ((now − playStart) / animMs) × kalan satır`. Sayfa tazelense/otomatik-yenilense/remount olsa da
  animasyon **doğru noktaya oturur** (sıfırlanmaz); biten maç (`now ≫ playStart + animMs`) anında tam açılır —
  yeniden oynamaz. Canlı doğrulandı (yerel offline test).
- **Spoiler azaldı (#54 çekirdeği):** oynarken yalnız o ana kadarki **canlı skor** gösterilir, final skor oynama
  bitene kadar sızmaz (çapa sunucu-zamanlı olduğundan tüm izleyiciler aynı anı görür).
- Sunucu, podyum maçının çapasını (`playStartAt` + `animMs`) `getTournament` canlı DTO'sunda verir (podyum maçı =
  o an oynanan/son çözülen senin maçın; animasyon süresi 1 oyun-dakikası, dünya saati kısaysa orantılı kısa).

### Değişti (11.10 — canlı turnuva yazım katmanı Prisma'ya taşındı; yerel offline test ortamı)
- **Prod sağlamlaştırma + offline test:** canlı turnuvanın toplu `UPDATE ... FROM (VALUES …)` ham SQL blokları
  (Postgres'e özel `::cast`, `v(…)` kolon adı, `NOW()`) **Prisma tipli update'lere** çevrildi. Tek kod yolu artık
  hem Postgres (prod/Neon) hem SQLite (yerel) çalışır; her canlı adımda yalnız birkaç satır güncellendiği için
  performans farkı ihmal edilebilir. Advisory lock (`pg_advisory_xact_lock`) yalnız Postgres'te çalışır; SQLite'ta
  (tek bağlantı, serialize) atlanır. Davranış/sonuç aynı — 204 test yeşil.
- **Yerel offline test ortamı:** ayrı SQLite DB (`prisma/dev-local.db`, `.gitignore`'da) + kısaltılmış dünya saati
  ile canlı turnuva uçtan uca iterasyon yapılabilir (prod verisine dokunmadan). `datasource provider` yereli
  çalıştırırken geçici `sqlite`, commit/prod'da `postgresql` (Prisma 7 adapter ile şema sağlayıcısı eşleşmeli).

### Kaldırıldı (06.10 — Bugün sayfası sadeleştirildi, NOTLAR #38)
- Bugün ekranından (`/kariyer`) çıkarıldı: **"Son başarılar" şeridi**, **"Bugün · antrenman/turnuva" aktivite
  bölümü**, **"Sıradaki turnuva" kartı**. **"Önümüzdeki 7 gün" şeridi** kaldı — zaten bugünkü etkinliği +
  sıradaki turnuvayı gösterdiği için diğerleri gereksiz tekrardı. Kimlik kartı, kondisyon/form, yetenek
  radarı, "sen yokken" raporu aynen duruyor.

### Değişti (07.10 — turnuva saati GMT etiketi + ölü kod temizliği)
- **Yaklaşan turnuva kartları** artık saat yanında **"GMT"** etiketi gösterir ("8 Ekim Perşembe 18:00 GMT")
  → sıradaki turnuva kartıyla tutarlı, oyuncu saati yerel sanmaz (NOTLAR #19).
- **Ölü kod kaldırıldı:** `RecentAchievements.tsx` bileşeni + `getRecentAchievements`/`RecentAchievementDTO`
  (Bugün sayfası sadeleştirmesinden #38 sonra hiçbir yerde kullanılmıyordu). Davranış değişmez.

### Eklendi/Değişti (08.10 — taktik penceresi genişletildi + turnuva klasmanı + aşamalı çatal (NOTLAR #43/#44/#45))
- **Periyot arası taktik penceresi genişletildi (#45):** 30 sn çok kısaydı → pencere artık **tüm periyot dilimi**
  (periyot çözülene kadar taktik set/değiştir edilebilir). Panel üstte olduğundan kolay yakalanır.
- **Turnuva klasmanı / seeding tablosu (#44):** pul bitince tüm oyuncuların **seed sırası + G-M + averaj** listesi
  gösterilir (kendi satırın vurgulu); eleme öncesi "diğerleri ne yapmış" verisi.
- **Aşamalı açılış (#43):** pul bitince önce **klasman**, ~**30 sn sonra eleme çatalı** görünür (o aralıkta oyuncu
  klasmanı inceler). Dev'de dünya günü kısaltılınca süre orantılı kısalır.

### Değişti (08.10 — turnuva ekranı canlı düzen + canlı maç oynatma yeniden (NOTLAR #41/#42/#45/#46/#47/#48))
Canlı turnuva ekranı (`/turnuva/[id]`) 2b canlı test geri bildirimlerine göre yeniden düzenlendi:
- **Canlı düzen (podyum):** üstte **olay anı** (taktik paneli + o an oynanan maç), ortada **klasman/bay bilgisi +
  eleme çatalı**, en altta **katlanır pul kağıtları + geçmiş maçlar** (ekran sadeleşir). Eski "en altta çatal,
  üstünde pul" ters düzeni düzeltildi. Bitmiş turnuvada inceleme düzeni korundu.
- **"Baştan sarma" bitti:** o an oynanan maç tek üst blokta **stabil React key** + `instantThrough` ile gösterilir →
  sayfa tazelenince (4 sn) animasyon sıfırlanmıyor; eleme maçında **önceki periyotlar anında**, yalnız o anki periyot
  satır satır akar. Olay anı + taktik paneli üstte olduğu için tazeleme "başa atsa" da oyuncu ilgili yerde kalır.
- **Tempo:** maç ~50 sn'ye yayıldı (satır başına 1.8–3.8 sn) — daha okunur.
- **Kaldırıldı:** canlı maçtaki "Hızlı"/"Atla" düğmeleri + biten maçtaki "Tekrar izle" (biten maça "Skor detayı"
  yeterli).
- **Bay (bye) bildirimi:** üst sırada bitip 1. turu atlayan oyuncuya bayrak + vurgu rengiyle açık bilgi.
- Not: pul sonrası +30sn aşamalı açılış (#43) ve tam seeding tablosu (#44) sonraki adıma bırakıldı; taktik
  penceresinin 30 sn'de yakalanması yeni düzende test edilecek.

### Düzeltildi (07.10 — bitmiş turnuva offline dönen oyuncuya "CANLI" görünüyordu)
- Offline (örn. 4-5 gün) dönen oyuncuya, canlı penceresi çoktan kapanmış bir turnuva ana ekranda **"CANLI /
  turnuvaya gir"** olarak gösteriliyordu (özellikle GMT gece yarısı–18:00 arası: `eventDay` hâlâ dünkü turnuva).
  Üstelik `canAttend=true` olduğu için otomatik senkron (`AutoAdvance`) hiç çalışmıyor, hesap o ekranda **takılı**
  kalıyordu. Artık turnuva **canlı penceresi** (18:00 GMT + ~110 dk) kapandıysa "CANLI" gösterilmez; kayıtlıysan
  turnuva otomatik oynanıp sonucu **"sen yokken"** raporuna düşer (antrenman gibi), Geçmiş'ten açıp bakarsın.
  `isLive` artık `gün === eventDay && canlı pencere açık` (sunucu, `tournamentStillLive`). Bir dahaki açılışta
  takılı hesaplar kendiliğinden çözülür.

### Eklendi (07.10 — "Kendi rengin": kişiye özel vurgu rengi)
- **Ayarlar → Görünüm'e "Kendi rengin" eklendi** (serbest renk seçici + önizleme + kontrast uyarısı,
  localStorage, no-flash boot). Klasman, turnuva sıralaması, Milli Takım ve pul kağıdında **kendi adın +
  "sen" satır kenarı** artık bu renkte. Yeni `--me` CSS değişkeni (varsayılan = sig-red kırmızısı) tüm
  "sen" göstergelerini tek yerden sürüyor; seçilen renk her iki temada geçerli. Tema renk sistemiyle aynı desen.

### Değişti (07.10 — kendi adın "SEN/(sen)" etiketi yerine renkli font)
- Klasman, turnuva final sıralaması ve Milli Takım listelerinde oyuncunun **kendi adı artık "(sen)"/"SEN"
  etiketiyle değil, kendi renginde (varsayılan kırmızı) + kalın fontla** ayırt ediliyor (satır kenarıyla uyumlu).
  Daha temiz görünüm; metin tekrarı kalktı.

### Eklendi (07.10 — Milli Takım sayfası)
- Profildeki **"Milli Takım" rozeti artık tıklanabilir** → `/kariyer/milli`. Milli takım = kategori Quarter
  Ranking **ilk 4**'ü (tek kaynak `NATIONAL_TEAM_SIZE`). Sayfa kadroyu **overall reytingleriyle** gösterir
  (milli oyuncuları yakından tanı), sen vurgulu.
- **Kategori filtresi** (Klasman'daki gibi yaş/silah/cinsiyet çipleri): başka kategorilerin milli takımlarına
  da bakılır. `getNationalTeam(categoryId)` + `getNationalTeamAction`.

### Değişti (07.10 — kariyer geçmişi: Q·H etiketleri → gerçek tarih, NOTLAR #22)
- Geçmiş turnuva satırı, kariyer zaman çizgisi, kupa vitrini "son kazanım" ve "sen yokken" (away) turnuva
  etiketi artık **gerçek takvim tarihini** (GMT) gösteriyor; "Q1 · H3" kalktı. `worldDay` yoksa (eski kayıt)
  oyun-içi `date`e düşer → asla bare "Q" yazmaz (NOTLAR #22: gösterim = gerçek takvim tarihi).
- Turnuva filtresi çipleri (Q = oyun yılı) artık **takvim yılını** içerir ("2026 · Q1") → yıllar geçince
  hangi dönem olduğu belirsiz kalmaz. Q ile filtreleme korundu; Q mekanik olarak arkada (gösterimde yok).

### Eklendi (07.10 — turnuva canlı oynatma, Aşama 2b: eleme periyot-periyot + periyot arası taktik)
> **Şema eklemeli:** `Match.deState` (TEXT, nullable) → squash'tan ÖNCE prod'a
> `npx prisma db execute --file prisma/migrations/20261007120000_match_destate/migration.sql` (uygulandı 07.10).
- **Eleme maçı artık periyot periyot çözülüyor** (`liveTournament`): her eleme turu `dePeriods` (3 / U10 2) alt-adıma
  bölünür; her alt-adım bir periyodu çözer. Kilitli kadans (NOTLAR #39): **1 periyot ~1 dk, periyot arası 30 sn**
  (`LIVE_SCHEDULE.dePeriodMinutes`/`dePeriodBreakMinutes`). Kombat simülasyonunun kendi periyodu FIE gerçekçiliği için
  3 dk kalır — bu yalnız gerçek-dünya tempo/pencere ayarıdır.
- **Periyot arası taktik penceresi:** oyuncu maç başında + her periyot arasında (30 sn) taktik değiştirebilir; pencere,
  periyodun OYNANMAYA başladığı an kapanır (`liveStepWindowClose*`). Panelde başlık "N. periyot taktiği" olur.
- **Devam eden eleme maçı canlı izlenir:** periyotlar açıldıkça log/skor büyür; `CanliMac` yeni satırları akıtır
  (maç bitmeden periyot periyot görünür). Devam eden maçın durumu `Match.deState` (DeBoutState JSON) ile saklanır.
- **Determinizm güvencesi:** combat'ta paylaşılan `advanceDeBoutPeriod` çekirdeği — her periyotta aynı taktik verilirse
  periyot-adım çözüm, atomik `simulateBoutByPeriods` ile BİREBİR aynı sonucu verir (testle kanıtlı).
- Testler 204/204 (eleme periyot determinizmi + periyot arası taktik + uçtan uca yeni).

### Değişti (07.10 — turnuva canlı oynatma, Aşama 2a: tempo)
- Canlı maç artık **okunabilir tempoda ~1 dk'ya yayılıyor** (`CanliMac`): satır başına açılma süresi log
  uzunluğuna göre hesaplanıp 1.2–3 sn arasına sıkıştırılıyor (kullanıcı geri bildirimi: "yazılar çok hızlı
  geldiğinde sıkıntı"). "Hızlı" düğmesi hâlâ 250 ms'e indiriyor. Sonuç artık cat diye patlamıyor, izleniyor.

### Kaldırıldı (07.10 — geçmiş maçta "Canlı izle", NOTLAR #39)
- Bitmiş/geçmiş maçta **"Canlı izle" (replay) düğmesi kaldırıldı** (`CanliMac`): geçmiş maç = gitmiş maç,
  gereksiz yere motoru/animasyonu yormaz. Geçmiş maçta artık yalnız **skor + "Skor detayı"** (tuş-tuş döküm)
  var; detay düğmesi tam genişlik tek buton oldu. Canlı maç izleme aynen duruyor.

### Eklendi (06.10 — turnuva canlı oynatma, Aşama 1)
- Canlı turnuvada oyuncunun **en yeni maçı artık otomatik CANLI akar** (`CanliMac` autoPlay): tuş-tuş
  anlatım, skor bandında lamba flash (kırmızı/yeşil/beyaz) + tuş efekti — sonuç anında patlamak yerine
  izlenir. Önceki maçlar durağan sonuç (past) gösterir. (Sunucu çözümü değişmedi; yalnız gösterim.)
  Sıradaki: eleme maçında periyot-periyot taktik penceresi (Aşama 2b — sunucu motoru değişikliği).

> ✅ **30.09.2026 — B Faz 0+1 canlıda.** Şema göçü Yusuf tarafından prod'a uygulandı, PR #41 merge edildi.
> Canlı turnuva artık sunucu-otoriteli. Ayrıntı: DEVIR.md Karar günlüğü.

### Eklendi (06.10 — Bugün ekranı cilası, GORSEL_ETKILESIM #4)
> Dal + PR #48 (#47'nin üstüne; şartname `docs/GORSEL_ETKILESIM.md` §8). **Şema eklemeli:**
> `GameState.skillQuarterBase` → squash'tan ÖNCE prod'a
> `npx prisma db execute --file prisma/migrations/20261006210000_skill_quarter_base/migration.sql`.
- **Büyük profil başlığı:** baş-harf rozeti, isim, silah · kategori · yaş, kulüp, sağda büyük reyting (reyting artık
  değer kutularında tekrar edilmez; kondisyon + form kaldı).
- **Yetenek radarı:** 10 alt yetenek ekseni; dolu alan = şimdi, kesikli = geçen çeyrek, büyüyen eksende yeşil "+N"
  (tam sayıya yuvarlı). Ölçek yetenek çubuklarıyla aynı yaş bandı. Geometri saf ve testli (`src/app/ui/radar.ts`).
- **Geçen çeyrek verisi:** her çeyreğin ilk işlenen gününde yetenekler antrenmandan önce dondurulur
  (`src/engine/skill/quarterBase.ts`, testli); mevcut oyuncularda ilk kayıt güncellemeden sonraki ilk gün ilerlemesinde.
- **Form/kondisyon ışıltısı:** değer ≥ %70 iken dolu çubuk parçaları yavaşça parlar; hareketi azalt açıkken yok.
- **Son başarılar şeridi** (sayfanın üstünde): en yeni 6 rozet, vitrinle aynı rozet dili (ortak
  `src/app/ui/achievementBadge.ts`); son 3 günde kazanılan "Yeni" etiketli, diski kısa bir halka parıltısıyla açılır.
- Testler 199/199 (radar geometrisi + çeyrek başı kaydı yeni). Yerelde uçtan uca: gün ilerleyince çeyrek başı
  değerleri kaydedildi; telefonda koyu/açık temada kontrol edildi.

### Eklendi (06.10 — Kupa vitrini + kariyer zaman çizgisi, GORSEL_ETKILESIM #3)
> Dal + PR #47 (#46'nın üstüne; Yusuf'un şartnamesi `docs/GORSEL_ETKILESIM.md` §7). **Şema eklemeli:**
> `Achievement.worldDay` → squash'tan ÖNCE prod'a
> `npx prisma db execute --file prisma/migrations/20261006190000_achievement_worldday/migration.sql`.
- **Kupa vitrini** (Kariyer Geçmişi'nin en üstü): şampiyonluk, altın/gümüş/bronz madalya, milli takım, klasman 1.liği
  rozetleri — her biri kaç kez (×N) + son kazanımın tam tarihi; kazanılmamışlar gri yuva; üst kademe hedefleri (Avrupa
  Şampiyonası, Dünya Kupası, Olimpiyat) kilitli. Metal renkleri şartnamedeki gibi (`--metal-*`, tema değiştirmez).
- **Kariyer zaman çizgisi:** başarılar eskiden yeniye; her düğüm GMT tam tarih + olay + ikon; ilk şampiyonluk, milli
  takım, klasman 1.liği "Dönüm noktası" etiketli; sonda "Sırada: …" (ulaşılmamış ilk kariyer basamağı). Önem yıldızlı
  eski "Başarılar" listesi kalktı.
- **Tarih:** yeni başarılar kazanıldığı dünya gününü yazar (canlı turnuva + eski yol); eski kayıtlarda çeyrek (Q).
  "Turnuvalarım" da oyun-içi takvim tarihi yerine turnuvanın dünya gününden GMT tarihini gösterir.
- İkon setine bayrak + taç; başarı adları çevriliyor (TR/EN/DE). Saf hesap `src/app/ui/showcase.ts` (6 test, toplam
  193/193). Yerelde uçtan uca: turnuva bitince yeni başarı `worldDay` ile yazıldı, sayfada GMT tarihiyle göründü.

### Eklendi (06.10 — Kutlama efektleri, GORSEL_ETKILESIM #2)
> Dal + PR #46 (Yusuf'un şartnamesi: `docs/GORSEL_ETKILESIM.md` §6; `master`'a push/deploy yok). **Şema yok, motor
> değişmedi, prod DB adımı yok** — hepsi istemci + saf CSS, kütüphane yok. B Faz 2-4'ün üstüne kurulu.
- **Tuş:** canlı anlatımda tuş düşünce o tarafın lambası büyüyüp hale saçar, skor rakamı sıçrar, rakamın omzundan
  **"+1"** yükselir (sol kırmızı / sağ yeşil; epede çift tuşta iki taraf), skor bandı hafif titrer (`ScoreBug` `hitFx`).
  Giriş ekranındaki duran örnek bant değişmedi.
- **Beyaz lamba:** `⚪` satırı açılınca hedef dışına dokunan sporcunun beyaz lambası bandın pist ortasına bakan ucunda
  yanar, **skor artmaz**; iki tarafta da olabilir. Taraf, motor satırındaki addan bulunur (`whiteLampSide`, testli:
  "Ali" / "Ali Kaya" gibi önek adlarda uzun ad kazanır, aynı adda lamba yanmaz).
- **Canlı izle:** `/turnuva/[id]`'de kendi maçlarında "Canlı izle" + "Skor detayı" yan yana — biten maç skor bandıyla
  satır satır yeniden oynar (tuş efektleri burada görünür), bitince "Tekrar izle / Kapat". SEN etiketi doğru tarafta.
- **Madalya (2.–3.):** sonuç kartından konfeti patlaması. **Şampiyonluk:** tam ekran katman — kupa kartı yaylanarak
  açılır, "Şampiyon" yazısı, bol konfeti (patlama + yağmur); ~3 sn sonra kendiliğinden kalkar, dokunmayı engellemez.
  Konfeti renkleri eskrim lambaları + altın (`Celebration` → `HeadlineCard`: yeni ve eski sonuç ekranı).
- **"+X" kazanım:** "Sen yokken" antrenman raporunda skill kazanım rakamları sırayla yerine süzülür.
- **Erişilebilirlik:** yeni hareketlerin hepsi `globals.css`'teki tek hareket bloğunda (`prefers-reduced-motion:
  no-preference`); şenlik öğelerinin taban hali görünmez → hareketi azalt açıkken "+1", konfeti, kupa katmanı hiç belirmez.
- Ses eklenmedi (şartnamede opsiyonel; GORSEL §5 "ses varsayılan açık mı?" kararı bekleniyor). Testler 187/187
  (`whiteLampSide` + madalya işareti yeni).

### Eklendi (06.10 — B Faz 2-4: canlı turnuva TUR TUR, taktik pencereleri, canlı panel, ölçek)
> ⚠️ **Dal + PR (Yusuf'un şartnamesi, teslim kuralı):** `master`'a push/deploy yok; Yusuf squash edip alır.
> **Şema eklemeli** — merge'den ÖNCE prod'a `npx prisma db push` (bkz. DEVIR.md).
- **Faz 2 — tur tur çözüm (kilitli çizelge, T = 18:00 GMT):** turnuva artık tek seferde hesaplanmıyor. T+0'da
  havuzlar çekilir (en çok **6 kişi/havuz**, havuz sayısı katılımcıya göre; havuz-içi round-robin en çok 5 tur),
  havuz turları **T+5/7/9/11/13**'te, havuz sonuçları + eleme tablosu **T+17**'de, eleme turları **T+20'den 10 dk'da
  bir** finale kadar sunucuda çözülür. Her maçın kendi tohumu var (turnuva anahtarı + aşama + tur + yer) → kim,
  ne zaman, kaç kez çözerse çözsün aynı sonuç; iki tarayıcı birebir aynısını görür. Oyuncu anlık görüntüsü
  (skill/kondisyon/form) çekimde DB'ye yazılır, turnuva boyunca ondan oynanır.
- **Taktik penceresi:** oyuncu, **sıradaki kendi maçı** için önceki turun çözümünden bu turun çözümüne kadar
  taktik gönderir (havuzda ~2 dk, elemede 10 dk; ilk eleme penceresi 3 dk). Göndermeyen yedek kaynakla oynar:
  **kayıtlı taktik → son kullanılan → Dengeli**. Taktik seti combat motorundaki üçlü (yeni taktik yok).
- **Başlangıç-öncesi taktik (06.10 kuralı):** kayıtlı oyuncu o günün turnuvası için taktiğini **18:00 GMT'ye kadar**
  değiştirebilir ("Yaklaşan turnuvalar"da bugün de listelenir; "Sıradaki turnuva" kartında "Taktiği değiştir").
  Yeni kayıt yine gün-00:00'da kapanır; 18:00'dan sonra değişiklik reddedilir (tur pencereleri devralır).
- **Faz 3 — canlı panel (`/turnuva/[id]`):** sıradaki adım + saniye saniye geri sayım (sunucu saatine göre),
  sıradaki maçın/rakibin, açıkken etkin kapalıyken kilitli taktik formu, "göndermezsen: …" bilgisi, bay/elendin
  durumları. Sayfa **4 sn'de bir** sunucudan tazelenir, geri sayım bitince hemen; manuel "geç/oyna" yok. Pul
  kağıtları ve eleme çatalı çözüldükçe dolar (eşleşmeler isimleriyle, skor maç çözülünce).
- **Faz 4 — ölçek + sağlamlık:** sert oyuncu tavanı yok (ölçek = kategori-bazlı paralel turnuvalar); tek turnuva
  saha hedefi `MAX_FIELD = 256` (büyütülebilir sabit). Tur çözümü **toplu DB yazımı** (tek `UPDATE … FROM VALUES`),
  turnuva başına **Postgres advisory lock + `step` koşullu güncelleme** → eşzamanlı istekler aynı turu iki kez
  çözmez. Taktik gönderimi **doğrulanır** (GDD 23.57: geçerli taktik + katılımcı + sürüyor + sıradaki adımda kendi
  maçı + pencere açık), **istek sınırı** (23.58: 60 sn'de 10) ve her deneme **olay kaydı**na yazılır (23.59:
  `TournamentEvent` — çekim, adım, taktik, red, final).
- **Saf motor:** `src/engine/tournament/live.ts` (çekim, round-robin, eleme tablosu, adım çözümü, başsız
  simülasyon) + `src/engine/schedule` `LIVE_SCHEDULE`. **Sunucu:** yeni `src/server/liveTournament.ts`
  (ROADMAP R5: careerService'ten ayrı modül). B Faz 1'in anında-çöz + görünürlük gecikmesi kaldırıldı
  (`resolveScopedTournament` + stagger); eski (Faz 1) turnuvalar okunmaya devam eder.
- **Gün akışı:** turnuva sürerken oyuncu turnuva gününde kalır (izler/taktik verir); bitince "Kariyere dön" ya da
  sonraki "Turnuvaya Gir" günü ilerletir. Kayıtsız girip sahada oynayan oyuncunun günü de kayıtlı gibi kapanır
  ("yokken" özeti dahil, ayrıca antrenman uygulanmaz).
- **Testler:** +14 (`live-tournament.test.ts`): kadans, max-6 havuz, round-robin, deterministik çekim, bay'lı
  tablo, taktik kaynağı, sabit tohumla "gönderilen taktikle çözülür", **256 kişilik** uçtan uca, iç içe
  koşan paralel turnuvalar, idempotent yeniden çözüm. 183/183 yeşil.
- **Yerel uçtan uca (gerçek tarayıcı + PGlite, çizelge 1/4 hızda):** başlangıç-öncesi taktik değişikliği; kayıtsız
  tetikleyen + kayıtlı oyuncu aynı sahada; arayüzden gönderilen taktik o turun maçında kullanıldı, göndermeyen
  kayıtlı/son taktikle oynadı; 3 eşzamanlı istek bir turu bir kez çözdü; geçersiz/katılımcı-dışı/maçsız taktik
  reddedildi, 10 denemeden sonra istek sınırı devreye girdi.
- **Not:** master'daki CI, `ViewSettings.tsx` lint hatası yüzünden kırmızıydı (effect içinde senkron `setState`);
  `NextTournament`'taki desenle düzeltildi (davranış aynı).

### Değiştirildi (05.10 — oyun zamanı TR saati → GMT dünya saati)
- **Karar (Yusuf):** Oyun zamanı artık **GMT (dünya saati)**. TR saati kullanılmaz; oyuncu bulunduğu
  bölgeye göre kendi yerel saatine çevirir. Gün başı **00:00 GMT**'de döner, günlük etkinlik (turnuva)
  **18:00 GMT**'de olur (önceki 19:00 TR).
- `worldclock.ts`: `EVENT_HOUR = 18`; `WORLD_EPOCH_MS = Date.UTC(2026,8,21,0,0,0)` = `1789948800000`
  (21 Eylül 2026 Pzt **00:00 UTC**). Eski epoch 20 Eylül 21:00 UTC'ydi (00:00 TR çapası); gün sınırı
  +3 saat kaydırılıp 00:00 GMT yapıldı — **dayIndex haftası korundu, canlı kariyerler bozulmadı.**
- Gösterim GMT'ye çevrildi: turnuva saatleri, "sıradaki turnuva" kartı, tarih etiketleri
  (`timeZone: "UTC"`). "TR saati" ibaresi kaldırıldı (`next.trTime` = "GMT"). Kullanıcıya görünen
  "19:00" uyarı metni 18:00 GMT oldu.
- Test: `worldclock.test.ts` artık "etkinlik **18:00 GMT**" + "epoch Pzt 00:00 GMT" pinliyor.
- **Prod aksiyonu:** Vercel env `WORLD_EPOCH_MS = 1789948800000` (kod ile aynı) olmalı — aksi halde
  canlıda saat kayar (bkz. CLAUDE.md §7).

### Eklendi (05.10 — Ayarlar → Görünüm: Klasik / Yatay düzen)
- Mobilde **yatay (landscape) düzen** seçeneği: üstte 4 ince sekme + sağ üstte canlı **GMT saat rozeti**
  (`WorldClockBadge`), altta 5 ince sekme, ortada tam içerik; alt gün çubuğu gizlenir. Tercih `localStorage`'da
  (kişiye/cihaza özel), `<html data-view>` + `vland:` Tailwind varyantıyla **anında** uygulanır (yanıp
  sönmesiz boot script). **Varsayılan Klasik (dikey)** → mevcut oyuncular için hiçbir değişiklik yok.

### Düzeltildi (03.10 — kayıtsız oyuncu "Turnuvaya Gir"e basınca sahaya alınmıyordu)
- **Bulgu (Yusuf, 02.10):** "Turnuvaya gir" görünüyor, tıklanıyor ama içeri girmiyor; "kaydol / canlı / devam
  ediyor" karışık görünüyor; turnuva başladıktan sonra gelen oyuncu giremiyor.
- **Kök sebep (B Faz 1'de benim eklediğim regresyon):** `resolveScopedTournament` alanı yalnız KAYIT
  satırlarından kuruyordu — "çözücü her zaman dahil" yorumuna rağmen çözücü kayıt satırından süzülünce
  kayıtsız oyuncu sahada yoktu. Başka kayıtlı gerçek oyuncu da yoksa alan boş kalıp `null` dönüyor ve
  `attendTournament` hiçbir tepki vermeden günü ilerletiyordu (butona basıyorsun, sayfa yenileniyor,
  turnuva yok, günün gitmiş). Eski canlı akışta (`startLiveTournament`) canlı katılan kayıt aramadan hep
  sahadaydı; ben offline yolun alan kurma mantığını paylaşırken bunu kaybettim. (Test hep önceden
  kaydettiğim oyuncularla yapıldığı için görünmedi.)
- **Düzeltme:** tetikleyen oyuncu artık kayıt şartı olmadan sahaya dahil (kayıtsızsa kendi varsayılan
  taktiği); sahada rakip olamıyorsa gün sessizce harcanmıyor — açık hata. Turnuva kurulduktan SONRA gelen
  kayıtsız oyuncu bracket'e eklenemez (tek gerçeklik): sayfayı **izleyici** olarak açar — "sahada değildin"
  notu, Senin Maçların bölümü ve sahte "sondan birinci" başlığı yok, şampiyon + klasman görünür
  (`TournamentResultDTO.youParticipated`, yeni `idp.spectator` TR/EN/DE).
- **Doğrulandı (yerel, gerçek tarayıcı, gerçek saat 19:15 TR'ye ayarlı):** kayıtsız 1. oyuncu "Turnuvaya
  Gir" → `/turnuva/1`, DB'de 24 katılımcıda insan olarak var (23 AI dolgu); kayıtsız 2. oyuncu sonradan
  gelince aynı `/turnuva/1`'i izleyici olarak görüyor (DB'de katılımcı değil). Şema/veri değişmedi.

### Düzeltildi (02.10 — dünya saati 3 saat kayıyordu, turnuva girişi 19:00 değil 22:00'de açılıyordu)
- **Bulgu (Yusuf, canlı test, 02.10):** 19:15'te turnuvaya girmeye çalışan oyuncu hata alıyordu
  ("Turnuva saati henüz gelmedi — bugün 19:00'da başlar."), kayıt/canlı ekranları da birbiriyle
  çelişen durum gösteriyordu ("kaydol" ile "turnuva canlı" aynı anda).
- **Kök sebep:** `src/engine/worldclock.ts`'teki `WORLD_EPOCH_MS` **UTC** gece yarısına sabitlenmişti;
  günlük etkinlik anı (`EVENT_HOUR=19`) bu epoch'tan oran olarak hesaplanınca gerçekte **19:00 UTC =
  22:00 TR saatinde** tetikleniyordu — kod kendi mantığına göre doğruydu, ama "19:00" hem hata
  mesajında hem herkesin kafasında TR saatiydi. 3 saatlik fark her gün tekrarlıyordu.
- **Düzeltme:** `WORLD_EPOCH_MS` 3 saat geriye çekildi (`Date.UTC(2026,0,4,21,0,0)` = 5 Ocak 2026
  Pazartesi 00:00 **TR saati**). Pazartesi-çapa özelliği (dayIndex%7 → gerçek haftanın günü) korundu,
  yalnız TR yerel saatine göre. Yeni test: günlük etkinlik anı artık gerçekten 19:00 TR'de tetikleniyor
  (`tests/engine/worldclock.test.ts`); eski "epoch UTC Pazartesi" testi "epoch TR Pazartesi 00:00"
  olarak güncellendi. 169/169 test yeşil.
- **Not:** Vercel'de `WORLD_EPOCH_MS` ortam değişkeni ayrıca ayarlıysa onun da güncellenmesi gerekir
  (kod içi varsayılan değer yalnız env var YOKSA devreye girer) — bkz. DEVIR.md.

### Eklendi (30.09 — Beyaz lamba UI)
- **Turnuva sonuç sayfasında (`/turnuva/[id]`) beyaz lamba görünür oldu:** Yusuf'un motora eklediği
  (#37) `⚪ Beyaz lamba — {ad} hedef dışına dokundu. Sayı yok.` log satırı artık tuş-tuş dökümünde
  (`Skor detayı`) düz metin olarak kaybolmuyor — aydınlık bir şerit + `lamp-white` ışıltılı nokta ile
  öne çıkıyor (gerçek eskrim cihazındaki beyaz lamba gibi). `CanliMac` (bitmiş maç dökümü, yeni turnuva
  akışının kullandığı yol) + `LogLines` (eski canlı-animasyonlu yol, geriye dönük uyumluluk için) ikisinde
  de eklendi. Gerçek bir maç logunda (mevcut turnuva verisi) tarayıcıda görsel olarak doğrulandı.
  **Bilinçli yapılmadı:** eski canlı-izleme ekranındaki (`ScoreBug`) kırmızı/yeşil skor lambalarına üçüncü
  bir "beyaz" flaş rengi eklenmedi — o ekran B Faz 1 ile emekliye ayrıldığı için orana uymuyordu.

### Eklendi (30.09 — B Faz 0: server-authoritative turnuva, kanonik şema)
- **`Match` tablosu artık PENDING (henüz çözülmemiş) maçları da tutabiliyor** (`docs/TURNUVA_MULTIPLAYER.md`
  §2.1, §4 Faz 0): yeni `status` (PENDING|RESOLVED, varsayılan RESOLVED — mevcut kayıtlar etkilenmez) ve
  `scheduledAt` alanları eklendi; `playerAId`/`playerBId`/`scoreA`/`scoreB`/`winnerId`/`log` artık nullable
  (bracket turnuva başında oyuncular/skor belli olmadan önceden yazılabilsin diye — `seed` YİNE de baştan
  bilinir, çünkü deterministik `f(scopeKey, tur, maçIndex)`'ten türetiliyor, oyunculardan bağımsız).
  `getTournament`/`getCareerHistory` artık açıkça `status: "RESOLVED"` filtreliyor (tamamlanmış turnuva
  kaydı sayfası hâlâ yalnız bitmiş maçları gösteriyor — davranış değişmedi, yalnız temel kondu). Bu faz
  tek başına HİÇBİR kullanıcı-görünür davranışı değiştirmiyor — sadece Faz 1'in (sunucu-tik çözümleme)
  üzerine kurulacağı zemin. Build+test(168)+lint yeşil.

### Değişti (30.09 — B Faz 1: canlı turnuva artık sunucu-otoriteli)
- **Canlı turnuva artık istemci-güdümlü DEĞİL** (`docs/TURNUVA_MULTIPLAYER.md` Faz 1) — bu, Osman'ın
  29.09'da bulduğu "paralel evren" hatasının KÖKTEN çözümü (önceki `tour:${scopeKey}` düzeltmesi yalnız
  ara tedbirdi). "Katıl"a basınca sunucu turnuvayı TEK SEFERDE, kayıtlı taktiklerle çözer
  (`resolveScopedTournament`, offline otomatik yolla — `autoResolveTournament` — AYNI fonksiyonu
  paylaşıyor) ve `finalizeTournament` sonucu hemen kesinleştirir (ödül/ranking/vs.). **Görünürlük**
  ise tur tur açılır (`Match.status`/`scheduledAt`, ~1 dk/tur + aralarda küçük kayma) — spoiler
  olmasın diye tüm turnuva açılana kadar şampiyon/klasman/pul kağıdı gizli kalır. Kapsam-içi HERKES
  (kim ilk bassa da) aynı `/turnuva/[id]` sayfasını izler; eski ayrı `/turnuva/canli` akışı yalnız
  daha önce başlamış (B öncesi) oturumlar bitene kadar yaşıyor, yeni turnuvalar hiç oraya girmiyor.
  `getTournament` artık hem bitmiş hem "hâlâ açılıyor" turnuvaları gösteriyor (`isFullyRevealed`
  bayrağı); sayfa periyodik kendini tazeliyor (`LiveAutoRefresh`, ilk sürüm — Faz 3'te gerçek
  polling/senkrona taşınacak). Doğrulama: gerçek tarayıcıda kariyer oluşturuldu, turnuvaya katılıp
  `/turnuva/[id]`'ye yönlendirildiği, kendi pul maçlarının birkaç dakika içinde gerçek isim/skorla
  açıldığı, eleme çatalının (kendi maçı dahil) hâlâ kilitli kaldığı doğrudan izlendi. Build+test
  (168)+lint yeşil. **Bilinçli yapılmadı (sonraki fazlar):** gerçek-zamanlı taktik gönderimi (Faz 2),
  gerçek canlı senkron/polling (Faz 3), 256 ölçek + cron liveness (Faz 4).

> ✅ **30.09.2026 — `20260930000000_m11_5_ai_dev_month` migration'ı production'a uygulandı (Yusuf).**
> 23 AI'nın `aiDevMonth`'u doğru başlangıç değerine ayarlandı, 8 insan kariyeri sağlam doğrulandı, site
> kesintisiz. PR #40 doğru sırayla (önce DB, sonra kod) merge edildi. Ayrıntı: DEVIR.md Karar günlüğü.

### Düzeltildi (30.09 — AI havuzu aylık gelişim çakışması)
- **Ortak AI rakip havuzunun aylık beceri gelişimi, her insanın kendi gün ilerletmesinde AYNI ayı
  geçtiğinde tekrar tekrar işlenebiliyordu** — `worldAdvanceTx`'te "bu ay zaten işlendi mi?" kontrolü
  yoktu; her geçiş TÜM AI'ların o ayki gelişimini yeniden zar atıp uyguluyordu. Birkaç test oyuncusu
  zamanla aynı ayı geçtiğinde bu, AI rakiplerin tasarlanandan hızlı/tutarsız gelişmesine yol açabiliyordu.
  Düzeltme: her AI artık kendi `aiDevMonth` (en son işlenen ay) alanını taşıyor; bir ay yalnız BİR KERE,
  atomik bir "hak ediş" (`updateMany` + koşullu `WHERE aiDevMonth < ay`) ile işleniyor — aynı anda iki
  insan aynı AI'yı aynı ay için işlemeye çalışırsa yalnız biri kazanır, kaybeden sessizce atlar (Postgres
  satır kilidi bunu güvenli yapar, doğrulandı). Tohum da artık çözen kişiye değil sabit `ai.id + ay`'a
  bağlı — kim kazanırsa kazansın sonuç aynı. Mevcut AI'lar migration'da "en ileri gitmiş insanın vardığı
  aya kadar zaten işlenmiş" olarak başlatılıyor (ani telafi sıçraması olmasın diye). Doğrulama: gerçek
  Prisma client'ıyla atomik hak ediş + veri-düzeltme senaryoları test edildi (beklenen sonuçlar), tam
  build+test+lint yeşil, gerçek kariyer oluşturma akışı tarayıcıda hatasız çalıştı. **Bilinçli
  yapılmadı:** aynı fonksiyondaki günlük AI yorgunluk toparlanması da benzer şekilde tekrarlanabiliyor
  ama "0'ın altına inmez" sınırı olduğu için kendi kendini sınırlıyor (daha az zararlı) — şimdilik
  dokunulmadı. Ayrıntı: `docs/DEVIR.md`.
- **Bağımsız bulgu:** `prisma/migrations/migration_lock.toml` hâlâ `sqlite` yazıyordu, `schema.prisma`
  ise çoktan `postgresql`e geçmişti — ikisi tutarsızdı. Ayrıca en eski migration dosyaları (`AUTOINCREMENT`
  gibi) hâlâ ham SQLite söz dizimi içeriyor; sıfırdan bir Postgres veritabanına migration geçmişini
  baştan uygulamak (`prisma migrate deploy`) bu yüzden başarısız oluyor — gerçek şema muhtemelen hep
  `db push` ile senkronize edilmiş. Lock dosyası düzeltildi (`postgresql`); eski migration'ları yeniden
  yazmak ayrı, büyük ve riskli bir iş — bugün yapılmadı, bilgi amaçlı not düşüldü.

> 🚀 **28.09.2026 — UI yenilemesi canlıya alındı.** Osman'ın tüm arayüz zinciri (`feat/ui-pul-kagidi`)
> tek merge ile `master`'a alınıp deploy edildi. Motor/şema/sunucu değişmediği için canlı test
> verisi korunur.

### Eklendi
- **Beyaz lamba (flöre hedef-dışı):** Motor artık flörede tek taraf tuş bulduğunda **%15** olasılıkla
  (`FOIL_OFF_TARGET_PROB`, tunable) hedef-dışı üretir → sayı yok, hamle durur, log'a `⚪ Beyaz lamba …`
  satırı düşer (UI beyaz lambayı buradan gösterir). **Yalnız flöre** (FIE: kılıç/epede beyaz lamba yok).
  Hem tam maç hem canlı periyot yolunda çalışır. Daha gerçekçi flöre temposu.
- **WhatsApp/sosyal medya önizleme görseli:** `src/app/opengraph-image.tsx` (`next/og` `ImageResponse`) —
  bağlantı paylaşılınca (WhatsApp, Instagram DM, vb.) artık düz metin yerine markalı bir kart görünüyor:
  koyu Pist Konsolu arka planı, altın üst çizgi, "LEGENDS OF THE PISTE" başlığı, "Eskrim kariyer
  simülasyonu" alt yazısı, kırmızı/yeşil/altın üç sinyal noktası (eskrim lambalarına gönderme). Paylaşılan
  bağlantı hep site kökü olduğu için (`HeadlineCard.tsx` `whatsAppHref`, sonuca özel URL yok) tek sabit
  görsel yeterli — build zamanında üretilip önbelleğe alınıyor, her istekte yeniden hesaplanmıyor. **Yol
  üstünde gerçek bir eksik bulundu ve düzeltildi:** `metadataBase` hiç ayarlanmamıştı — `next build` bunu
  açıkça uyarıyordu ("using http://localhost:3000"), düzeltilmeseydi canlıda `og:image` bağlantısı
  `localhost:3000`'e işaret edip önizleme tamamen kırık olurdu. Kök `layout.tsx`'e eklendi (proje tek alan
  adında, `https://lotp-one.vercel.app` sabit). Doğrulama: gerçek bir production build (`next start`,
  `next dev` değil) ile hem üretilen görsel bizzat indirilip incelendi (Türkçe "ü" karakteri dahil doğru
  render ediyor) hem de `<meta property="og:image">`'in doğru mutlak URL'e çözüldüğü (`next dev`'de bilerek
  `localhost` gösterip yalnız gerçek production modunda doğru domaine döndüğü) `curl` ile teyit edildi.
- **Sözlük sayfası:** "Daha fazla" menüsünde yeni bir sayfa (`/kariyer/sozluk`) — 24 terim, iki bölüm:
  Eskrim Terimleri (Flöre/Epe/Kılıç, hedef, öncelik, tuş, pul, eleme, bay, averaj, seri başı, altın tuş,
  parat/riposte/kontra, milli takım, **beyaz lamba** — henüz uygulanmamış olsa da gerçek bir eskrim kavramı
  olduğu için dahil edildi) ve Oyun Terimleri (sezon, kondisyon, form, yorgunluk, Quarter Ranking, lisans no,
  Denar). TR/EN/DE — Almanca'da doğru eskrim terminolojisi (Poule, Direktausscheidung, Vorrecht, Freilos,
  Setzung). İçerik ana i18n sözlüğünden ayrı bir dosyada (`sozluk/glossary.ts`) — uzun biçimli, yalnız bu
  sayfaya özel metin, kısa UI etiketleriyle karışmasın diye. Yeni ikon: `glossary` (açık kitap, iki sayfa +
  orta sırt) — kendi çizimimiz, üçüncü taraf ikon değil.
- **Instagram uygulama içi tarayıcı uyarısı:** Instagram'ın kendi tarayıcısında (WhatsApp'ta paylaşılan
  bağlantı Instagram DM/bio'suna yapıştırılıp açıldığında vb.) oturum/localStorage bazı durumlarda
  güvenilir kalıcı olmayabiliyor. Artık `User-Agent`'ta "Instagram" tespit edilirse (`ui/inAppBrowser.ts`,
  saf fonksiyon + testli) kök layout'ta (her sayfada) ince, kapatılabilir bir bant çıkıyor: "sağ üstteki
  ⋯'den Tarayıcıda Aç'ı seç". Tespit sunucuda yapılıyor (`next/headers`) — gösterilme kararında yanıp sönme
  yok; yalnız "daha önce kapatıldı mı" bilgisi istemci-only (localStorage), o da varsayılan olarak
  "gösterilir" kabul edilip gerekirse kısa bir an sonra gizleniyor (tam tersi — varsayılan gizli, gerekirse
  göster — ilk ziyaretçide bandın hiç görünmemesine yol açan gerçek bir hataydı, düzeltildi). Renk nötr
  (steel/ink, `sig-red` değil) — bu bir hata değil, bir öneri. Facebook/Messenger'ın uygulama içi tarayıcısı
  bilinçli olarak kapsam dışı — yalnız Instagram istenmişti, aynı mekanizma kolayca genişletilebilir.
- **`/turnuva/[id]` sayfasının kalan başlıkları Pist Konsolu'na taşındı:** bir önceki maddede bilinçli
  kapsam dışı bırakılan üç başlık ("Senin Maçların", "Pul Kağıtları", "Turnuva Sıralaması") + sayfa başlığı
  (turnuva adı) artık `text-lg font-semibold`/`text-2xl font-bold` yerine `display` token'ında. Turnuva
  Sıralaması listesi de Klasman tablosundaki "sen" deseniyle hizalandı: kırmızı sol çizgi (`bg-sig-red`)
  kendi satırında, altın çizgi (`bg-prio`) şampiyonda (sen değilsen) — önceden yalnız `bg-arena-2
  font-semibold` idi, ayrımı yalnız kalın yazı sağlıyordu. Osman'ın onayıyla: bağlayıcı çizgili gerçek
  "ağaç" görselleştirmesi bilinçli olarak hâlâ yapılmadı — BYE'lı asimetrik hizalama matematiği değer/risk
  oranı düşük ayrı bir efor.
- **Eleme çatalı (turnuva sonucu sayfası) — yatay kaydırma keşfedilebilir hale geldi:** `/turnuva/[id]`
  sayfasındaki "Eleme Çatalı" bölümünde yatay kaydırma zaten vardı (`overflow-x-auto`) ama görünürde hiçbir
  ipucu yoktu — geniş turnuvalarda (ör. 24 kişilik, 5 tur) yalnız ilk 2 tur ekrana tam sığıyor, sonraki
  turlar hiç göstergesi olmadan ekran dışında kalıyordu. Artık: başlığın yanında "Yana kaydır →" ipucu (yalnız
  1'den fazla tur varsa), kolon genişliği 170→150 px'e küçültülüp sonraki turdan bir dilim ekranda bırakılacak
  şekilde ayarlandı (peek), `scroll-snap` ile kaydırma turdan tura düzgün "yapışıyor". Kart stili tokenlara
  taşındı (`rounded-lg`/`text-xs` → `rounded-md`/`text-[13px]`), kendi maçların artık rest of app ile tutarlı
  kırmızı sol çizgiyle işaretli (`border-l-sig-red`, Klasman tablosundaki "sen" işaretiyle aynı desen).
  Başlık da `text-lg font-semibold`den `display` token'ına geçti. Bilinçli kapsam dışı: bu sayfadaki diğer
  başlıklar ("Senin Maçların", "Pul Kağıtları", "Turnuva Sıralaması") ve bağlayıcı çizgili gerçek "ağaç"
  görselleştirmesi — ayrı, daha büyük bir "sayfayı Pist Konsolu'na taşı" işi olurdu.
- **Bugün sayfasına kimlik kartı:** `KimlikKarti.tsx` — federasyon lisans kartı hissi veren, sayfanın
  kendi içeriği olan bir kimlik gösterimi (`CareerNav`'daki her sayfada görünen ince kabuk şeridinden
  ayrı — o kalıyor, bu yeni kart Bugün'ün ilk göreceğin şeyi olarak yanına ekleniyor). Büyük avatar, isim,
  milli takım rozeti, silah/kategori/yaş/şehir, alt satırda "Lisans No" (oyuncunun `code` alanı, GDD 7.4)
  ve sezon Roma rakamı. Bilinçli olarak reyting/kondisyon/form YOK — onlar hemen altındaki "Üç anahtar
  değer" bölümünde zaten var, kart yalnız kimliğe odaklanıyor. `toRoman` artık `parts.tsx`'te ortak (önceden
  yalnız bu sayfada tekildi). Yeni i18n anahtarı: `profil.licenseNo` (TR/EN/DE). Osman'a önce yön soruldu:
  "yeni ayrı kart" mı "mevcut şeridi kart gibi giydir" mi — cevap: yeni ayrı kart.
- **Almanca (Deutsch) arayüz çevirisi tamamlandı:** sözlük TR/EN paritesiyle (~500 anahtar, `src/i18n/index.ts`)
  tam Almancaya çevrildi — önceden yalnız "kabuk" (menü/alt çubuk/ayarlar/oyuncu oluşturma) planlanmıştı ama
  sözlük o aradan beri tüm sayfaları kapsayacak şekilde büyümüştü, bu yüzden tamamı çevrildi. Doğru Almanca
  eskrim terminolojisi kullanıldı: Poule (pul), Tableau (eleme çatalı), Planche (pist), Aktive (büyükler
  kategorisi — "Senioren" Almancada veteran kategorisi anlamına geldiği için kasıtlı olarak kullanılmadı),
  Freilos (bay geçme), Leitweste (elektrikli yelek). Cinsiyet-nötr ifade tercih edildi (ör. "Charakter
  erstellen", "Fechter/in" yerine). `de` artık kendi tam sözlüğüne sahip (önceden TR'ye düşüyordu); `es`/`fr`
  hâlâ TR'ye düşüyor. TR ve EN'deki `settings.languageNote` metinlerindeki artık geçersiz "İngilizce çevirisi
  ekleniyor" notu da güncellendi (ES/FR'ye işaret ediyor). Ayrıca fark edilen, bu PR'ın kapsamı dışında kalan
  bir hata ayrı bir işe kaydedildi: "Sen yokken" antrenman raporundaki yetenek etiketleri (`gains[].label`)
  motorun sabit Türkçe etiketinden geliyor, hiçbir dilde (İngilizce dahil) i18n'den geçmiyor.
- **Canlı eleme maçında periyot/altın tuş bandı:** skor bandı (`ScoreBug`) kaydırma sırasında sabit
  (sticky) kalıyor ama anlatım aşağı akınca hangi periyotta olunduğu bilgisi ekrandan kayboluyordu —
  artık bandın üstünde küçük bir durum etiketi var: "N. Periyot" (normal), berabere kalıp "altın tuş"a
  (la belle) girildiğinde ise `--prio` altın renginde "Altın Tuş" — periyot numarasının yerini alıyor.
  Etiket, log satırlarından (periyot başlığı `▸`, "öncelik kurası" satırı) saf fonksiyonlarla çıkarılıyor
  (`ui/liveBand.ts`, testli); motorun anlatım metnine dokunulmadı. "Ara" (devre arası) zaten ayrı, gözden
  kaçmayan bir başlıkla gösterildiğinden bilinçli olarak banda eklenmedi.
- **Tema ayarları (Ayarlar → Görünüm) yeniden tasarlandı:** hazır temalar uygulamanın kendi varsayılanlarıyla
  eşleşecek şekilde yeniden adlandırıldı ve gerçek değerlerine bağlandı — **Salon (açık)**, **Pist (koyu)**,
  Gece Salonu, Eskrim Yeşili (önceki "Koyu/Açık/Gece Mavisi/Sepya" isimleri kalktı, Sepya çıkarıldı — tasarım
  planındaki dörtlüyle aynı). Aktif tema artık işaretli (✓). **WCAG kontrast uyarısı:** serbest renk seçiminde
  oran 4.5:1'in altına düşerse görünür uyarı çıkar (`ui/contrast.ts`, saf fonksiyon + testli); seçim
  engellenmiyor, yalnız uyarılıyor. İlk açılışta artık sabit bir renk tahmin edilmiyor, sayfaya zaten
  uygulanmış sistem varsayılanı okunuyor (küçük bir tutarsızlık düzeltildi). Dokunma hedefleri 44 px'e çıktı.
- **Ekipman mağazası: marka paneli + 2 yeni ikon (hazırlık):** GLADIUS vitrini artık açılır/kapanır bir
  panel (`BrandPanel.tsx`) — Yusuf'un "her marka kendi panelinde" kararına göre, ileride başka markalar
  (Leon, PBT…) eklenince yanına yeni bir panel konur. Şimdilik tek marka, varsayılan açık. Kendi ikon
  setimize **eldiven** ve **göğüs koruyucu** eklendi (`Icon.tsx`: `glove`, `chest`) — Yusuf'un genişletilmiş
  katalog isteğinde bu iki ürün için ikon yoktu. Motor tarafındaki katalog (`itemsForWeapon`, yeni ürünler)
  henüz gelmedi; bu PR yalnız hazırlık, ürün listesi/fiyat değişmedi.
- **7 günlük hafta şeridi (Bugün + Turnuvalar):** bugünden itibaren 7 gün tek bakışta — turnuva günleri kısa
  seviye etiketiyle (İL / TR / OPEN …) ve kayıt işaretiyle (✓ kayıtlısın, ○ kayıt yok, kilit = katılım hakkın
  yok, örn. sakatken), antrenman günleri haftalık plandaki seansın ikonuyla. Bugün mürekkep çerçeve + kırmızı
  çizgi. Hücreye dokununca turnuva → kayıt listesi, antrenman → plan. Yalnız mevcut veriden (sabit program,
  yaklaşan turnuvalar, plan); motor/sunucu değişmedi. Birim testleri: `tests/ui/week.test.ts`.
- **Kenar çubuğu:** masaüstünde "Turnuvaya Git" butonu artık iki satıra kırılmıyor.
- **CI (GitHub Actions):** `.github/workflows/ci.yml` — her PR ve `master` push'unda lint + test + build
  (sahte `DATABASE_URL`, gerçek DB'ye bağlanmaz). Dış katkıcı merge'leri CI yeşilse Vercel Deploy Hook ile
  canlıya çıkar (secret `VERCEL_DEPLOY_HOOK`; yoksa CI bunu kırmızıyla bildirir). ROADMAP §H R4 ✅.
- **Manşet cümleleri + WhatsApp paylaşımı:** turnuva sonucu gazete manşeti olarak ("U10 İl Şampiyonası: Deniz Aksoy
  şampiyon!", "… son 16'da", "… bronz madalya"), altında son maç, pul özeti ve katılımcı sayısı. Turnuva bitiş
  ekranında ve geçmiş turnuva sayfasının en üstünde **"WhatsApp'ta paylaş"** — hazır metin + oyunun adresi; mesajı
  oyuncu kendisi gönderir. Bugün'deki "Sen yokken" turnuva satırları da manşet cümlesiyle. Şampiyonlukta altın blok.
  Cümleler motor metni değil, mevcut sonuç verisinden çeviri şablonlarıyla kuruluyor (Türkçe ek hatası olmasın diye
  isimlere ek getirilmiyor). Birim testleri eklendi (`tests/ui/headlineText.test.ts`).
- **Turnuva sekme rayı:** telefonda aktif sekme (örn. sondaki "Sonuç") artık ekran dışında kalmıyor.
- **Pul kağıdı yeniden çizildi:** gerçek FIE pul kağıdı düzeni, yeni tasarım dilinde — köşegen taralı, galibiyet
  hücreleri ("V5") kalın ve köşede küçük işaret, mağlubiyetler soluk. **Kendi satırın ve sütunun** koyu zeminle
  (artı gibi) işaretli: satır = senin rakiplere karşı sonuçların, sütun = rakiplerin sana karşı. Telefonda ad
  sütunu yatay kaydırmada sabit kalıyor; V/TS/TR/Ind/Sıra ayrı blok, sütun başlıkları açıklamalı. Masaüstünde
  tablo paneli dolduruyor. Canlı turnuvadaki "Pul kağıdı" sekmesinde ve geçmiş turnuva sayfasında aynı.
- **Canlı maç ekranı — skor bandı + eskrim cihazı renkleri:** maçlar artık üstte yapışkan bir skor bandıyla
  izlenir. **Renkler gerçek cihaz gibi: sol kırmızı (sen), sağ yeşil (rakip)** — önceden ters idi ve renk
  iyi/kötü anlamı taşımaz; "sen" SEN etiketiyle gösterilir. Son tuşu alan tarafın lambası yanıp söner (epede
  çift tuşta ikisi birden), en yeni anlatım satırı vurgulu. Sekmeler panelin üstünde, kilitliler kilit ikonlu
  (spoiler yok, aynı). Taktik kartları ikonlu, Hızlı/Atla büyük dokunma alanı. Pul kağıdı, sonuç ekranı ve geçmiş
  turnuva sayfası yeni stile geçti.
- **Klasman yenilendi:** üstte büyük sıra numarası + iki kapı (milli takım ilk 4 · uluslararası ilk 16)
  lamba ile. Filtreler açılır liste yerine çip/segment (federasyon sırası). Liste F1 sıralama kulesi gibi:
  1. altın kenar, 2–3 çelik, senin satırın kırmızı kenar + SEN etiketi — listede aşağıdaysan ekranın
  altına yapışır, kaydırmadan yerini görürsün.
- **Yeni giriş ekranı (davet linkiyle gelen oyuncu için):** önce oyunu gösterir — koyu vitrin, örnek skor
  bandı (kırmızı sol / yeşil sağ) ve örnek maç anlatımı, "Sporcunu oluştur" butonu, 3 adım. Form: büyük
  silah kartları (ikon + kısa kural), cinsiyet segmenti, profil çipleri; ülke seçimi yerine bilgi çipi.
  Oluşturma mantığı değişmedi. Marka adı Türkçe büyük harf kuralından korundu ("PİSTE" değil "PISTE").
- **Giriş ekranı masaüstünde iki sütun:** bilgisayarda (1024 px ve üstü) solda koyu vitrin + 3 adım sabit
  durur, sağda sporcu oluşturma formu görünür; "Sporcunu oluştur" atlama butonu yalnız telefonda. Telefon
  görünümü ve oluşturma mantığı değişmedi. 1024×768, 1280×720 ve 1440×900'de kontrol edildi.
- **Antrenman haftalık planı yenilendi:** her gün için açılır liste yerine **ikonlu 5'li segment** (Teknik ·
  Fiziksel · Mental · Taktik · Dinlenme), turnuva günleri ikonla işaretli. **Kaydedilmemiş değişiklik görünür**
  ("Kaydedilmedi" + kırmızı lamba; kaydedince "Kaydedildi"), kaydedecek bir şey yoksa buton pasif. Sayfanın geri
  kalanı yeni tasarıma geçti (başlıklar, sakatlık kutusu, "Hangi antrenman neyi geliştirir?" paneli, emoji'ler
  kalktı). "Bugün" kartındaki gün adı artık kartı taşırmıyor. Plan kaydetme mantığı ve sunucu aksiyonu aynı.
- **Kalan sayfalarda emoji temizliği + yeni tasarım:** Kariyer Geçmişi (istatistiklerde kendi ikonlarımız:
  kupa, kürsü, madalya; turnuva listesinde 1. altın / 2–3 çelik kenar, madalya emojisi yok; başarı yıldızları
  ikon), Kulüp (nötr arma, tesis kalitesi segmentli), Ayarlar (ses segmenti, "Kariyeri Sil" kırmızı, sabit
  Türkçe metinler çeviriye taşındı), hata sayfası, telefonla giriş onayı, geri bildirim panosu. Çeviri
  metinlerinden emoji'ler kalktı (canlı maç metinleri canlı maç PR'ında). Kullanılmayan `klasman.nt4/intl16/
  worldNote` silindi. Motorun ürettiği maç anlatımındaki semboller (🏁 ⏱ 🏅) motor tarafında, dokunulmadı.
- **Turnuvalar sayfası yenilendi:** taktik seçimi açılır liste yerine **3'lü segment** (Atak · Dengeli ·
  Defans, ikonlu), "Kaydol"a basınca açılır → liste kısa kalır. Kayıt durumu net ("Kayıtlı · Atak", sol
  çizgi), iptal aynı yerde. Sıradaki turnuva kartı büyük geri sayımla; CANLI kartı mürekkep buton + yanıp
  sönen lamba. Ödül etiketi (klasman puanı / tecrübe). Açıklamalar ve haftalık program "Nasıl işler?" altında.
  Sunucu aksiyonları değişmedi.
- **GLADIUS mağazası yenilendi + kendi ekipman ikonlarımız:** emoji yerine elle çizilmiş SVG ikonlar
  (maske, beden ve maske kordonu, ceket, plastron, lamé, ayakkabı, çorap, çanta; silah ikonu oyuncunun
  silahına göre) ve GLADIUS monogramı — hiçbir gerçek marka/ürün görselinden kopya değil. "Kit x/10"
  tamamlama şeridi, gruplu liste, Denar yetmiyorsa eksik tutar görünür yazıyla, epede gerekmeyen parçalar
  için bilgi notu. Satın alma mantığı değişmedi.
- **"Bugün" ekranı (eski Profil) + yeni değer gösterimi:** dönen oyuncu önce bugünün görevini, sıradaki
  turnuvayı (büyük geri sayım, kayıt durumu, Kaydol) ve "Sen yokken" özetini görür (antrenman raporu +
  yokken oynanan turnuvalar tek panelde; artık her sayfanın tepesinde değil). Yetenekler **pist rayıyla**
  gösterilir: ray yaş grubu ölçeğiyle dolar (8 yaşındaki sporcuda boş çubuk yok), gerçek 0–100 değer yazılı,
  kategori ortalaması + en güçlü yetenek işaretli. Kondisyon/form 10 parçalı gösterge + durum yazısı
  (Dinç/Yorgun…). Fizik ve psikoloji tıklayınca açılır. Menüde "Profil" → "Bugün". Ölçek değerleri taslak
  (`src/app/ui/bands.ts`, antrenör onayı bekleniyor).
- **Tasarım sistemi "Pist Konsolu" — temel + ikonlar + yeni navigasyon** (`docs/tasarim/pist-konsolu.md`):
  eskrim cihazından gelen görsel dil (tema-türevli yüzey token'ları, sinyal renkleri, Barlow Condensed
  başlık fontu, tabular rakamlar). **Kendi SVG ikon setimiz** (`src/app/ui/Icon.tsx`) — kabukta emoji kalmadı.
  **Navigasyon:** telefonda altta 5 sekme (Profil · Antrenman · Turnuvalar · Klasman · Daha fazla),
  masaüstünde sol sidebar; açılır menü kalktı. İnce kimlik şeridi (maske-oval avatar). Gün çubuğu tek
  dokunuşla Turnuvalar'a götürür; tıklanabilir satırlarda ok işareti. "Bildir" artık menüde (yüzen buton
  yok), gönderim hatası görünür.

### Düzeltildi (29.09 — canlı turnuva paralel-simülasyon çakışması)
- **Aynı gün/kategori/seviyede birden fazla gerçek oyuncu turnuvaya CANLI katılırsa, her biri kendi
  turnuvasını birbirinden habersiz, farklı sonuçlarla simüle ediyordu** — testçi gözlemi: turnuva sürerken
  herkes farklı rakip/skor görüyor, turnuva bitince herkes (ilk biten kişinin simülasyonuna göre) aynı
  sonucu görüyordu; ikinci biten oyuncunun kendi oynadığı maçlar sessizce yok sayılıyordu. Sebep:
  `startLiveTournament` (`careerService.ts`) ortak `scopeKey`'e kayıtlı diğer gerçek oyuncuları kendi
  simülasyonuna dahil ediyordu ama pul çekimini ve TÜM maç sonuçlarını ÇÖZEN OYUNCUNUN KENDİ `gs.seed`'iyle
  hesaplıyordu — aynı scopeKey'deki iki farklı oyuncunun seed'i farklı olduğu için iki paralel evren
  oluşuyordu. Ayrıca `take: aiNeeded` sırasız olduğu ve karıştırılacak liste "önce ben, sonra diğerleri"
  sırasında olduğu için (Fisher–Yates konum bazlı) seed aynı olsa bile çekim farklı çıkabilirdi. Düzeltme:
  tohum artık `scopeKey`'den türetiliyor (paylaşılan, kişiden bağımsız), AI seçimi `orderBy: id asc` ile
  sabitlendi, çekime giren liste karıştırmadan önce id'ye göre sıralanıyor. Offline/otomatik turnuva yolu
  (`autoResolveTournament`) zaten doğruydu (tek çözen + dedup) — dokunulmadı. Yeni regresyon testi:
  `tests/engine/probability/rng.test.ts` (shuffle'ın girdi sırasına duyarlı olduğunu ve sıralamanın bunu
  nasıl düzelttiğini kanıtlıyor). Ayrıntı: `docs/DEVIR.md` "Canlı turnuvada paralel-simülasyon çakışması".
  **Bilinçli yapılmadı (ayrı, daha büyük bulgu):** `worldAdvanceTx`'teki AI havuzu aylık gelişim/yorgunluk
  toparlanması da benzer bir sınıf sorun taşıyor (her insan kendi gün-ilerletmesinde AYNI ayı tekrar
  işleyebiliyor) — şema değişikliği + mevcut AI verisini bozmadan geçiş gerektiriyor, ayrı onay bekliyor.

### Düzeltildi
- **Antrenman raporu yetenek etiketleri hiç çevrilmiyordu:** "Sen yokken" panelindeki kazanım etiketleri
  ("+0.7 Atak" gibi) her dilde — İngilizce dahil — sabit Türkçe kalıyordu, çünkü `careerService.ts`
  (`gains[].label`) motorun (`engine/skill/skills.ts`) sabit TR etiketini doğrudan DB'ye yazıp öyle
  gösteriyordu, i18n'den hiç geçmiyordu. Artık `label` yerine `key` yazılıyor, sayfa (`kariyer/page.tsx`)
  `t(locale, "skill." + key)` ile dile göre çeviriyor — sayfanın altındaki YETENEKLER bölümüyle aynı yol.
  Geriye dönük uyumlu: bu değişiklikten önce yazılmış, henüz okunmamış eski raporlarda hâlâ yalnız sabit
  `label` olabilir — sayfa `key` yoksa `label`'a düşüyor, canlı veri kaybı yok (CONTRIBUTING §2).
- **Stil sınıfları utility'leri eziyordu:** `.panel`, `.btn-ink`, `.btn-ghost`, `.kicker` … `@layer utilities`
  yerine `@layer components`'ta. Önceden üstlerine yazılan renk/kenar/gizleme sınıfları sessizce etkisizdi
  (turnuvalarda kayıtlı kartın vurgusu, ekipmanda pasif buton rengi, seviye etiketlerinin rengi).
- **Gövde fontu Arial'dı** (Geist yükleniyor ama kullanılmıyordu) → Geist Sans; Türkçe karakterler için `latin-ext`.
- **Kişisel tema** (Ayarlar → Görünüm) başlık, alt çubuk ve geri bildirim panelinde çalışmıyordu (sabit
  beyaz yüzeyler) → tüm yüzeyler temadan türer; tema ilk boyamadan önce uygulanır (yanıp sönme yok).
- **Katkı kuralları + risk listesi (dış katkı başlangıcı):** `CONTRIBUTING.md` (branch → PR → squash
  merge akışı, **canlı veri koruma** — yalnız eklemeli şema, oyuncu ilerlemesi sıfırlanmaz, "bitti" tanımı,
  güvenlik/KVKK), `.github/pull_request_template.md` (kontrol listesi) ve `docs/ROADMAP.md` **§H Riskler &
  Zayıf Noktalar** (R1 doğrulamasız telefon girişi → Google OAuth, R2 Postgres/SQLite migration tutarsızlığı,
  R3 canlı yedek, R4 CI, R5 büyük `careerService`, R6 canlı turnuva blob'u, R7–R9). Kod değişikliği yok.
- **Devir notu (Yusuf ↔ Osman):** `docs/DEVIR.md` — bekleyen kararlar (Deploy Hook, canlı maç taraf renkleri,
  yaş grubu ölçeği, telefon girişi güvenliği), testçi duyurusu taslağı, çakışma notu ve karar günlüğü;
  `docs/tasarim/onizleme/` altında UI PR'larının telefon + masaüstü önizlemeleri. `CLAUDE.md`'ye işaret satırı.
  Kod değişikliği yok.

### Düzeltildi
- **Ekipman mağazası silaha göre filtrelendi + genişledi:** `itemsForWeapon` — oyuncu yalnız kendi silahının
  + ortak ürünlerini görür. **Epe'de** elektrikli yelek (eski "lamé") ve **maske kordonu** artık gizli
  (vücut kordonu durur); önceden "gerekmez" yazıp yine gösteriyordu. **Elektrikli yelek silaha özel**
  (flöreciye "flöre için", kılıççıya "kılıç için" — biri diğerini görmez). Yeni ürünler: **eldiven** +
  **göğüs koruyucu** (Osman'ın ikonlarıyla). Eski satın alınmış ekipman korunur (legacy).
- **Sakatlık süresi kısaltıldı (#36):** tüm sakatlıklar artık **1-2 gün** (eskiden nadiren 7-14 güne kadar
  çıkıyordu — test için çok uzundu). Ağır kademeler test sonrası geri gelebilir.
- **Klasman (mobil):** yaş kategorileri artık **5'li grid** — U10-U12-U14-U17-U21 üst satıra tam sığar,
  Büyükler alt satırda tam genişlik. Yatay kaydırma kalktı. Etiketler sade U-kodu: "U14 Yıldızlar"→"U14",
  "Gençler"→"U21".

### Değişti
- **Kondisyon: gece tam toparlanma (#35):** Artık her yeni gün **~%99 kondisyonla** başlanır; o günkü
  antrenman/maç akşam yorar, uyku ertesi sabah toparlar. Yorgunluk **günler arası birikmez** → antrenman
  aşırı-yük sakatlığı pratikte kalktı (maç-içi/turnuva-günü yorgunluğu + sakatlığı **kalır**). Dayanıklılık
  artık maç-içi yorgunlukta önemli. (Kullanıcı kararı: "sabahları %99".)
- **Antrenman gelişim hızı yumuşatıldı (#34):** seans başına birincil kazanım `PRIMARY_STIMULUS` 0.6→0.36
  (gösterim ~+0.5 → ~+0.3) → oyuncu yaş-tavanına birkaç haftada değil **sezon boyunca** yaklaşır
  ("sürekli gelişiyorum" hissi; tavan aynı). Yan (spill) etki `SPILL_FRACTION` 0.12→0.10 (~0.1 → ~0.05).
  Sim ile doğrulandı (combat/gelişim/sakatlık dengesi korundu).
- **Ekonomi dengesi (kazanç ↓↓ + gerçekçi fiyatlar):** Turnuva ödülleri çok düşürüldü — bir oyuncu
  sezonda girdiği tüm turnuvaları kazansa bile ~300 Đ (2. ~200 · 3. ~150); şampiyon bile 1 silah (400)
  alamaz → malzeme için Denar satın alma ihtiyacı (monetization). **Başlangıç bakiyesi 1000 → 0.**
  Malzeme fiyatları gerçek oranlara göre: **Elektrikli Yelek (eski "Lamé", en pahalı) > Ceket+Pantolon > Silah**.
  Ayrıntılı plan: [`docs/EKONOMI.md`](docs/EKONOMI.md). Şema/veri değişmedi (canlı güvenli).
- **Ayarlar → tek "Yeni Başla" butonu:** "Yeni Kariyer" ve "Kariyeri Sil" aynı işi yapıyordu (ikisi de
  kariyeri sıfırlıyordu) → tek **"Yeni Başla"** butonunda birleştirildi (silme zaten içinde; Denar bedeli aynı).
- **Dünya saati akşam 19:00'a hizalandı (deploy config):** `WORLD_EPOCH_MS` = 21 Eylül 2026 Pazartesi
  19:00 TR (16:00 UTC) → her oyun günü (ve o günün turnuvası) **her akşam TR 19:00**'da başlar; oyun
  günü/haftanın-günü gerçek güne oturur (oyun Salı = gerçek Salı, İl akşam açılır). Kod değil env değeri;
  DB'ye dokunmaz. (Yerel `.env` + Vercel env aynı değere ayarlanır.)
- **M11 çizelgesi FIE'ye göre düzeltildi:** Periyot arası **30 sn → 1 dk** (FIE-doğru; online oyuncuya
  daha rahat taktik değişim penceresi). Eleme süresi buna göre 15 tuş ≈ **11 dk**, 10 tuş ≈ **7 dk**.
  Beraberlik "altın tuş" basitleştirmesi ve pul maçlarının sıralı gösterimi FIE denetim notu olarak
  ROADMAP'e işlendi. Bundan sonra tasarım kararları FIE kurallarına karşı kontrol edilecek (kullanıcı kuralı).

### Değişti
- **Deploy D1 — PostgreSQL'e geçiş (Neon):** Veritabanı SQLite'tan **Neon PostgreSQL**'e taşındı. Şema
  `provider = postgresql`; `@prisma/adapter-pg` + `pg` eklendi; `client.ts` DATABASE_URL şemasına göre sürücü
  seçer (postgres→pg, file→better-sqlite3). Prisma işlem zaman aşımı **30 sn**'ye çıkarıldı (kariyer oluşturma
  ve turnuva sonu çok-sorgulu; uzak Postgres'te varsayılan 5 sn yetmiyordu). Şema `prisma db push` ile Neon'a
  yüklendi; kariyer/gün-ilerleme/turnuva-çözümü uçtan uca doğrulandı. (`.env` commit'lenmez.)

### Değişti
- **Faz 2 — takvim modeli (NOTLAR #22/#23), Slice 1–3:**
  - **Gün 00:00'da döner, etkinlik akşam 19:00'da** — `worldclock`'a `EVENT_HOUR`/`worldEventStartMs`/
    `eventDayIndex` + `world.ts` `serverEventDay`/`serverEventStartMs` eklendi (gün sınırı ile etkinlik saati ayrıldı).
  - **Gerçek takvim tarihi gösterimi** — "Q1·H1" kalktı; alt çubuk + profil "📅 28 Eylül 2026 Pazartesi"
    (TR, cihaz konumundan bağımsız); profil kartı "Sezon N". "Sıradaki turnuva" saati 19:00 etkinlik anına bağlandı.
  - **Open turnuvalar dönüşümlü (#23):** bir hafta var, bir hafta yok (İl + Türkiye her hafta kalır).
  - **19:00 etkinlik kapısı (Slice 4):** `advanceDay` + `getCareerHeader` + `attendTournament` artık günün
    etkinliğini ancak **o günün 19:00'ı geçince** işler (`serverEventDay`). Gün 00:00'da döner ama turnuva/
    antrenman akşam olur → sabah "bugün 19:00'da İl · ⌛ …" görünür, otomatik ileri gitmez. Doğrulandı.
  - **Sezon göstergesi roma rakamı** (Sezon kartı "I, II, III…").
- **Faz 3 — canlı turnuva otomatik akış (NOTLAR #25):** Manuel "geç/devam/finallere geç" butonları **kaldırıldı**;
  aşama geçişleri (pul başlangıcı, klasman, eleme kurası) artık **otomatik** ilerler (kısa "…" bekleme, `Countdown`).
  Kullanıcı yalnız **maç aralarında taktik** seçer. Turnuva-içi saat **19:00**'a çekildi (14:00 yerine) ve Schedule
  Engine anları akşama alındı (pul 19:05'ten, elemeler ~19:45'ten). Yerelde uçtan uca doğrulandı (pul→klasman→bracket
  hepsi otomatik, butonsuz). 139 test yeşil.
- **Faz 1 — playtest ayarları (NOTLAR #27/#17/#18):**
  - **Taktik isimleri sadeleşti:** "Baskı kur / Dengeli / Bekle & karşıla" → **Atak / Dengeli / Defans**
    (iç mantık aynı; yalnız görünen etiketler + açıklama).
  - **Başlangıç profili artık gerçekten yön veriyor (#17) — sıfır-toplam uzmanlaşma:** seçilen grup
    (Teknik/Fiziksel/Mental/Taktik) belirgin şekilde ağır basar, diğer gruplar o kadar düşer, **genel ortalama
    korunur** (profil seni güçlendirmez, uzmanlaştırır). Doğrulandı: seçilen kategori ~%86–94 en yüksek,
    genel ortalama dengeli profille aynı. 8 yaşta görünür olması için başlangıç çarpanı daraltıldı.
  - **U10 başlangıç değerleri gerçekçi düşürüldü:** 8 yaş çocuk artık ~8–13 reyting ile başlıyor (eskiden
    ~20–25 fazla yüksekti). Olgunlaşma eğrisi 8 yaşta %30→%15, taban (floor) 8–16→3–9. Yetişkinde tavan
    (26 yaş, potansiyele kadar ~90) korunur → 90'lara giden uzun bir gelişim yolculuğu. Denge sim korundu.
  - **Antrenman çapraz katkı (#18):** çalışılan grup tam gelişir, diğer gruplara küçük yan kazanım
    (birincil stimulusun %12'si) → teknik çalışınca mentale/taktiğe/fiziğe de az miktarda katkı gelir.
    Denge simülasyonu korundu (kazanma eğrisi + gelişim sağlıklı).
- **Oyun adı: "Project Engarde" → "Legends of the Piste"** (tarayıcı sekmesi başlığı, ana ekran başlığı,
  alt bilgi). Sadece görünen isim; kod/DB etkilenmez.

### Değişti (playtest turu 2 — NOTLAR #1-#9)
- **Ülke bayrağı (gerçek görsel):** kimlik rozetinde (şehir + milli takım) ülke bayrağı **görsel** olarak gösterilir (`Flag` bileşeni, flagcdn). Emoji bayrağı Windows'ta "TR" harfleri olarak göründüğü için görsel kullanıldı; tüm platform/ülkelerde çalışır.
- **Kondisyon en fazla %99:** hiç kimse asla tam %100 taze değil — günlük toparlanma/dinlenme/sakatlık kondisyonu 99'a getirir (yorgunluk tabanı 1). Antrenman etkisi zaten akşam 19:00'da işlenir.
- **Antrenman sayfası iconları:** Bugün 📅 · Kondisyon 🔋 · Form 🎯 (profil ile aynı).
- **Koç → Antrenör:** kulüp antrenörleri artık gerçek **ad-soyad** + **"🎓 Antrenör"** unvanı ("… Hoca" kalktı).
- **Turnuvalar yaklaşan liste gerçek tarih:** "Q1·H1·Salı" → **"📅 29 Eylül Salı 19:00"** (her turnuvanın gerçek tarihi + saati); takvim modeli tutarlılığı tamamlandı.
- **Turnuva girişi Turnuvalar sekmesinden (#5a):** alt çubukta **"Katıl" butonu KALKTI**; turnuva zamanı geldiğinde Turnuvalar sayfasında **🔴 CANLI** kartı + "Turnuvaya Gir"; biten turnuva zaten Geçmiş'te. Alt çubukta yalnız "Turnuvaya Git" yönlendirmesi + "Geç".

### Değişti
- **Şehir listesi eskrim şehirlerine indirildi:** 81 il yerine 12 şehir (İstanbul, Ankara, İzmir, Bursa,
  Kocaeli, Antalya, Konya, Trabzon, Erzurum, Mersin, Balıkesir, Adıyaman) — başlangıç seti, sonra editlenir.
  Kulüp/İl Şampiyonası kapsamı bu şehirlerden.

### Eklendi
- **Denar özel işareti (Đ + kılıç):** "D" harfinin ortasından eskrim kılıcı geçen özel para simgesi (`DenarMark`
  SVG, currentColor). Bakiye + fiyatlar + silme ücretinde kullanılır.
- **Kariyer silme Denar ücreti (NOTLAR #30):** "Yeni Kariyer" / "Kariyeri Sil" artık **Denar gerektirir**
  (`CAREER_RESET_COST` = 250, tunable) — sık reroll'u caydırır. Ayarlar ücreti gösterir; yetersizse net uyarı
  ("Turnuvalardan kazan"). Sunucuda da kapılı.
- **Turnuvalar "Sezon programı" kartı:** eski "H1–H12" aylık grid kalktı (gerçek tarih modeliyle uyumsuzdu) →
  tek sade haftalık program kartı (etkinlik 19:00, Open iki haftada bir).
- **Gladius ekipman mağazası (Denar ekonomisi):** Ekipman sayfası gerçek mağaza — marka **GLADIUS**, **Denar (Đ)**
  ile alışveriş. Katalog: silah/maske/kordon/maske kordonu/kıyafet/plastron/lamé/ayakkabı/çorap/çanta.
  Her ürün maça **çok çok az** katkı verir (~+0.003, tek yerde **tunable** — `GLADIUS_ITEMS`). Satın al → sahiplik
  (✓ Sahipsin), Denar düşer; combat'a `equipmentCombatBonus` (ihmal edilebilir). `Player.ownedEquipment` (Neon'a
  push). Denar bakiyesi = oyuncu balance'ı (turnuva ödülü). Ürün görselleri şimdilik emoji (gerçek görsel → V2).
- **#28 — Tecrübe (XP) + turnuva puan ayrımı:** **Open turnuvalar klasman puanı VERMEZ** (yalnız tecrübe);
  **İl/Türkiye/uluslararası** şampiyonalar klasman puanı + tecrübe verir. Her turnuva tecrübe (XP) kazandırır
  (havuzda elense bile katılım tecrübesi); **antrenman** da tecrübe verir (~seans başı 4, turnuvanın ~1/10'u).
  Tecrübe combat'a **küçük, tavanlı (+3)** katkı verir (deneyimli sporcu). Turnuva sonucunda ve Turnuvalar
  kartlarında **ne kazandırdığı** yazılı (🏅 klasman puanı vs ✨ tecrübe); profilde birikmiş tecrübe. `Player.experience`
  alanı eklendi (Neon'a push'landı). 141 test yeşil.
- **Faz 4 — Trait sistemi yeniden tasarımı (GDD 10, NOTLAR #21):**
  - **Genişletilmiş set:** 15 trait, 3 kategori (Karakter/Psikolojik/Rekabetçi) — GDD 10.5'ten (Disiplinli, Çalışkan,
    Tembel, Sabırlı, Sabırsız, Soğukkanlı, Baskıya Dayanıklı, Özgüvenli, Hassas, Kaygılı, Agresif, Mücadeleci,
    Risk Alan, Kontrollü, Hırslı).
  - **Kademeli açılım** (kullanıcı kararı): 8–10 yaş **1 trait** → 11'de **2** → 12+ **3** (max 3). Plan doğuşta
    üretilir, yaşla açılır; önceki "doğuşta 2 rastgele trait" kalktı.
  - **Zıt-çift kuralı** (GDD 10.28): zıt trait'ler birlikte verilmez (Çalışkan+Tembel, Agresif+Kontrollü…) — 500
    planda 0 ihlal doğrulandı. Eski "Tembel+Çalışkan aynı anda" hatası giderildi.
  - **Davranışsal etkiler** (GDD 10.22/10.24): trait'ler antrenman verimi ve combat gücüne küçük modifier verir
    (güç bonusu değil); pozitif/negatif karışık (Hassas/Kaygılı/Tembel −). **AI oyuncular da** trait alır (10.41).
  - **Yaş-havuzlu üretim (gelişim psikolojisi):** her trait yaşına-uygun havuzdan gelir — Çocukluk (mizaç/çalışma),
    Ergenlik öncesi (rekabet/öz-denetim), Ergenlik (psikoloji + ahlak). 10 yaşındaki çocuk "Hilekâr" olmaz.
  - **Ahlak/Sportmenlik ekseni (yeni):** **Dürüst / Hilekâr / Çirkef** (gamesmanship). "Küçük ama riskli":
    çirkef/hilekâr rakibin sükûnetini bozar (özellikle Hassas/Kaygılı'ya) ama kendine risk bindirir —
    Soğukkanlı/Baskıya Dayanıklı/Dürüst rakibe **zarar** eder. Combat'a rakip-etkileşimli "Sportmenlik" modifier'ı
    (`incomingGamesmanshipPenalty`). Doğrulandı: hassas rakip NET +0.62, nötr ~0, soğukkanlı −0.58. Bilimsel
    temel: itibar/dolaylı karşılıklılık + ostrasizm (kısa vade kazanç, uzun vade dışlanma → itibar sistemi V2).
  - Yoğunluk 0–4 (GDD 10.6) ve trait evrimi/olayla değişim (10.31–37) → V2 olarak not edildi.
- **Sıradaki turnuva göstergesi + gerçek saat (test haftası):** Turnuvalar sayfasının üstünde vurgulu
  kart — **sıradaki turnuva adı + gün + TR saati + canlı geri sayım** ("⌛ 4 saat 36 dakika kaldı" /
  "🟢 Şu an açık"); antrenman günlerinde alt çubukta tek satırlık ipucu ("⏰ Sıradaki: … Salı 19:00").
  Saat, dünya saatinden hesaplanır (`worldDayStartMs`), istemcide 30 sn'de bir tazelenir. Yalnız görüntü —
  DB'ye dokunmaz. `NextTournament` bileşeni + `getNextTournament`/`getCareerHeader.nextTournament`.
- **Geri bildirim / hata bildirme sistemi (test haftası):** Her kariyer sayfasında sağ altta yüzen
  **"💬 Bildir"** butonu — arkadaşların bir hata, gariplik veya fikir yazıp gönderebilir (kim + hangi
  sayfa otomatik kaydolur). Bir sayfa çökerse **dostça hata ekranı** (`error.tsx`) çıkar: "Tekrar dene" +
  tek tıkla **otomatik hata bildir**. Bildirimler **Neon**'da `Feedback` tablosunda toplanır; yalnız senin
  görebildiğin gizli-anahtarlı pano: **`/geribildirim?key=…`** (anahtar Vercel env `FEEDBACK_ADMIN_KEY`).
- **Skor renkleri (eskrim cihazı gibi):** Maç skorlarında sol taraf **yeşil** 🟢, sağ taraf **kırmızı** 🔴
  (canlı maç, replay ve pul özeti). Gerçek cihaz hissi; ilk izlenim için hoş dokunuş.
- **#5 — Öncelik / Hak-yolu (silahları gerçekten ayıran motor):** Her mübadele artık **niyet + öncelik** ile
  çözülür (`combat/priority.ts`): **Hücum / Bekle-parat-riposte / Kontra**. **Ana etmenler: mesafe** (footwork
  + kulaç) **ve zamanlama** (timing). Silaha göre: **Epe** öncelik yok → kontra + **çift tuş** (imzası);
  **Flöre** orta öncelik (iyi parat inisiyatifi çalar), eşzamanlı hücum → iptal; **Kılıç** hücum baskın,
  eşzamanlı → iptal. Katı üçgen değil — **yetenek belirler** (iyi savunan aceleci atağı yener). Taktikler
  netleştirildi: **Baskı kur / Dengeli / Bekle & karşıla**. 5 yeni test; denge simülasyonu korundu
  (yakın maçlar biraz daha çekişmeli, yetenek hâlâ baskın).

### Değişti
- **Maç gerçekçiliği (combat etkenleri):**
  - **Rakiplerin (AI) formu artık maça giriyor** — eskiden yalnız insan forma göre iyi/kötü oynardı, AI nötrdü.
    Artık herkese "Form" uygulanır (psikoloji + trait + ekipman).
  - **Tüm psikoloji maça yansıyor** — eskiden yalnız özgüven+stres etkiliyordu; artık **moral + motivasyon** da
    katkı verir (`psychologyCombatModifier`).
  - **Günün hâli (daily mood)** — o güne özel küçük form dalgalanması (herkeste; kalıcı moralden ayrı):
    bazı günler formda, bazı günler değil. `dailyMood` (üçgen dağılım, ±2.5), oyuncu+gün tohumlu.
  - **Veteran gerilemesi** — ~30 yaş sonrası kademeli düşüş (`ageCombatModifier`; combat'ta "Yaş" modifier'ı,
    kalıcı skill'i değiştirmez). Eskiden yetenek 26'da tavana oturup hiç düşmüyordu.
  - **Sakatlık süreleri gerçekçi** — artık çoğu **hafif (1–2 gün)**, bazen orta (3–5), nadiren ağır (7–14).
    Eskiden hep 3–9 gündü. (`rollInjury` gün-bazlı + şiddet dağılımı.)
  - 5 yeni test. Denge simülasyonu + tarayıcı ile doğrulandı.

### Eklendi
- **Büyük eskrim ülkeleri eklendi:** 4 kıtaya yayılmış 17 ülke (Fransa, İtalya, Almanya, Macaristan, Rusya,
  Polonya, İspanya, İngiltere, Ukrayna · ABD, Brezilya · Japonya, G. Kore, Çin, Avustralya · Mısır, Tunus + TR),
  ülke kodu + şehir listeleriyle. Klasman kıta/ülke filtresi artık gerçek ülkelerle. (Dev'de karakter yine
  IP-kilidiyle TR; bu ülkeler multiplayer'da IP ile dolar. Telefon kodları benzersiz.)
- **Sezon göstergesine yıl:** Profil "Sezon" kutusu ve alt çubuk artık **oyun-içi takvim yılını** gösterir
  (ör. `2026 · Q1·H3`); yıl `currentDate`'ten gelir, kariyer ilerledikçe değişir. Header DTO'ya `year`.
- **Kıta katmanı + 3-katmanlı klasman kapsamı:** Coğrafyaya **kıtalar** eklendi (FIE'nin 4 konfederasyonu:
  Avrupa / Asya-Okyanusya / Amerika / Afrika; `Country.continent`, `continentOfCountry`). Klasman filtresi
  artık **Dünya / Kıta / Ülke** 3 ana mod (kıta/ülke seçilince kapsam-içi 1..N sıralaması), sonra kategori
  (yaş/cinsiyet/silah). `buildRankingView` kıta/ülke kapsamı; `getCategoryRanking(categoryId, {continent?, country?})`.
  (Şu an tek ülke TR/Avrupa; yeni ülkeler eklendikçe kıtalar dolacak.)

### Değişti
- **Görsel cila (2. tur):** **Klasman** — kapsam seçici eklendi: 🌍 Dünya / ülke (İl-içi 1..N sıralaması);
  klasman aslında dünya geneli (kategori = yaş-cinsiyet-silah). **Kariyer Geçmişi** — turnuvalar için
  **Dönem (Q) filtresi** + satırlarda Q/H etiketleri. **Turnuvalar** — "oynadığın turnuvalar → Kariyer
  Geçmişi" bağlantısı. **Kulüp** — isim yanına ⚔️ logo. (`buildRankingView` ülke filtresi;
  `getCategoryRanking(categoryId, countryCode?)`.)
- **Görsel cila — profil başlığı birleştirildi:** Kariyer üst başlığı (`CareerNav`) artık zengin kimlik
  kartı (avatar + isim + silah/cinsiyet/yaş kategorisi/şehir/milli takım rozetleri) + menü; profil sayfası
  aynı kartı **tekrar etmiyor** (doğrudan durum/fizik/psikoloji/yeteneklerle başlar). Header DTO'ya
  `ageCategory`, `city`, `nationalTeam` eklendi.

### Eklendi
- **M11.4 — "Yokken neler oldu" özeti:** Offline'ken (dünya saati ilerlerken) otomatik oynanan turnuvalar
  artık kariyer sayfasında bir **özet kartı** olarak görünür (Hattrick-tarzı yakalama): turnuva adı, derecen /
  katılımcı, kazanılan puan, klasman sıran; her satır turnuva detayına (maç-içi event'ler) tıklanır. Kart ✕ ile
  kapanır. `GameState.awayReport` (JSON, son 30 turnuva; migration). Çözücü ve sonradan senkronlayan katılımcı
  için de yazılır.
- **M11.3b-2 — Canlı insan ortak örneğe katılır + iki kural:** Bugünkü turnuvayı **canlı** oynayan oyuncunun
  sahasına artık **kapsam-içi diğer kayıtlı gerçek oyuncular** da girer (bot gibi, önceden-taktikle); turnuva
  ortak örnektir (`scopeKey` + dedup), sonuç + klasman + kişisel etkiler herkese yazılır. Zaten çözülmüş bir
  ortak turnuva canlı başlatılmaz (mevcut sonuç okunur). İki kural: **uluslararası turnuvalar yalnız U17+**;
  **kayıt turnuva gününün 00:00'ında kapanır** (yalnız gelecek günler kaydedilebilir). (Tarayıcı+DB ile
  doğrulandı: canlı oynayan Ali + offline Veli **aynı** turnuvada — tek satır/24 katılımcı, ikisine ortak klasman.)
- **M11.3b-1 — Ortak turnuva örneği (asıl çok-oyunculu çekirdek):** Bir turnuva günü artık **paylaşılan
  örnek**tir. Gruplama: **İl = ülke+şehir**, Türkiye/Open = ülke, uluslararası = dünya (her il kendi İl'ini
  oynar). Aynı kapsama kayıtlı **tüm gerçek oyuncular tek turnuvada** oynar (saha 24'e AI ile tamamlanır);
  sonuç + ortak Quarter Ranking + kişisel etkiler herkes için yazılır. `Tournament.scopeKey` ile **dedup**
  (bir kez oluşturulur, sonrakiler okur/gününü ilerletir). `finalizeTournament` çoklu-oyuncuya genişledi;
  yeni gruplama yardımcıları (`geoScopeForLevel`, `tournamentScopeKey`). Şema: `Tournament.scopeKey` (migration).
  (Tarayıcı + DB ile doğrulandı: İstanbul'lu iki gerçek oyuncu **aynı** turnuvada — tek satır, 24 katılımcı,
  ikisine de ortak klasman.)
- **M11.3a — Birleşik periyot motoru + taktik kaynağı:** `simulateBoutByPeriods` (saf, combat) — bir maçı
  **periyot periyot** çözer; her periyot öncesi her tarafın taktiği kaynağından gelir (AI=stil, offline=
  önceden/default, online=canlı). Süre bitince yüksek skor, son periyotta eşitse altın tuş. Offline otomatik
  oynatma (`autoResolveTournament`) artık eleme maçlarını periyot-bazlı çözer → maç logu **periyot kırılımlı**
  (offline oyuncu maç-içi event'leri görür). `simulateTournament`'a `byPeriods` opsiyonu. 5 yeni test.
  (Tarayıcıda doğrulandı: offline turnuvanın eleme maçında "1./2./3. Periyot — sen: Defansif, rakip: …".)
- **M11.2 — Çizelgeli offline otomatik oynatma + ortak klasman:** Kayıtlı bir turnuvanın günü, sen
  offline'ken (dünya saati o günü geçtiyse) sunucu turnuvayı **otomatik oynatır**: sen **önceden verdiğin
  taktikle** (bot gibi), AI'lar kendi stilleriyle; saha = sen + kategorindeki AI havuzu. Combat sunucuda,
  sonuç + ödül + ortak **Quarter Ranking** + başarılar canlı yolla aynı `finalizeTournament`'a yazılır.
  `advanceDay` artık geçmiş+kayıtlı turnuvaları otomatik çözer; canlı **"Katıl" yalnız BUGÜN'ün** turnuvasında.
  (Tarayıcıda doğrulandı: kayıt → dünya saati ilerletildi → turnuva Ofansif taktiğiyle otomatik oynandı.)
- **M11.1 — Zaman çizelgesi motoru (saf):** `src/engine/schedule/` — turnuvanın gün-içi dakika-bazlı
  çizelgesini deterministik üretir (DB/combat yok). Sabitler FIE-uyumlu (periyot 3 dk, periyot arası 1 dk).
  `poolPlan` (11:05'ten sıralı, 4 dk tempo), `dePlan` (14:00 elemeler + 17:00 yarı/final), periyot ve
  **taktik değişim pencereleri** (online oyuncunun periyot arası taktik verdiği anlar). 12 test.
- **M10.2 — Turnuvaya kayıt + önceden taktik:** Turnuvalar sayfasına **"Yaklaşan Turnuvalar"** — önümüzdeki
  turnuvalara **kaydol / güncelle / iptal** + **taktiğini önceden seç** (ortak dünyada turnuva sunucuca
  otomatik oynanacak; offline'ken varsayılan/verilen taktikle). Uluslararası turnuvalar uygunluk (ilk16/ilk4)
  kilidiyle. `Registration` modeli (playerId + worldDay + level + taktik). Otomatik oynatma → M11.
- **Dil menüsü açılır kapanır + 5 dil (TR/EN/DE/ES/FR):** İlk ekran ve Ayarlar'daki dil seçimi butonlar
  yerine **açılır menü** (`LangSelect`). Almanca/İspanyolca/Fransızca eklendi (çevirileri sonra; şimdilik
  Türkçe'ye düşer). Yeni metinler artık yalnız Türkçe yazılıyor, tüm dillere sonra çevrilecek (kullanıcı kararı).
- **M10.1a — Ortak dünya saati (temel):** `src/engine/worldclock.ts` — oyun zamanı **gerçek zamandan**
  türetilir (Hattrick): `worldDayIndex = floor((now − epoch) / gün)`, cron gerekmez. 1 oyun-günü = 1
  gerçek gün; epoch bir Pazartesi (gerçek Salı = İl turnuvası); `season.ts` ile hizalı; dev'de config ile
  hızlandırılır. Saf + 6 test. **Zaman modeli kilitlendi** (ROADMAP §B2/M10): 1 gerçek yıl = +4 yaş,
  kariyer ~5+ gerçek yıla yayılır; "Haftayı İlerle" kalkacak (M10.1b). Offline+kayıtlı → varsayılan/son taktik.
  Sunucu tarafı ayar `src/server/world.ts` (`serverWorldDay`, `WORLD_MS_PER_DAY` env ile dev'de hızlandırma).
- **M9.2b — Telefonla giriş + anonim kariyeri bağlama:** `/giris` sayfası — ülke koduyla telefon
  numarası → giriş. Kayıtlıysa o hesaba giriş (başka cihazdan aynı numara = aynı kariyer); boştaysa
  bu cihazdaki **anonim kariyeri telefona bağlar** (kaybolmaz). `User.phone` (E.164, benzersiz),
  `signInWithPhone`/`signOut`. **NOT: OTP/SMS doğrulaması yok** (dev adımı; gerçek SMS yayına alırken,
  M9.3). Desteklenmeyen ülke → "henüz eklenmedi". Oluşturma ekranına "Telefonla giriş" bağlantısı.
- **M9.2a — Coğrafya modeli (telefon → ülke → şehir):** `src/engine/geo.ts` — ülke-kodu→ülke eşlemesi
  (`+90 → TR`), ülkeye ait sınırlı şehir listesi, telefon normalize + doğrulama (`parsePhone`). Ülkeler
  **adım adım** eklenecek (önce TR; desteklenmeyen kod → "henüz eklenmedi"). Saf/test edilebilir (+6 test).
  Sonraki: telefon tabanlı giriş (M9.2b) + oluşturma ekranında ülke otomatik (M9.2c). Gerçek SMS/OTP →
  yayına alırken (SMS servisi kullanıcı hesabı gerektirir); geliştirmede dev kodu.
- **M9.1 — Kimlik + veri sahipliği (çok oyunculu temeli):** `User` modeli + **çerez tabanlı anonim
  hesap**; `Player.userId` / `GameState.userId` (insan oyuncu kullanıcıya bağlı, **AI ortak/`null`**).
  `loadState` / `hasCareer` / `createCareer` / `resetCareer` artık **mevcut kullanıcıya** göre çalışır
  (eski tek-global `findFirst()` gitti; `resetCareer` yalnız kendi kariyerini siler, ortak dünyayı korur).
  **AI havuzu ORTAK** — yalnız ilk kariyer oluşturmada üretilir, sonraki oyuncular aynı AI'lara karşı
  oynar (ortak dünya hedefi). Migration `m9_user_ownership` (SQLite). Gerçek giriş (e-posta/şifre) +
  Postgres → M9.2/M9.3.
- **Kondisyon = Dayanıklılık'a bağlandı (gerçekçi model):** "Dayanıklılık" yeteneği artık ölü değil —
  **günlük toparlanmayı** ve **maç yorgunluğu direncini** yönetiyor (`conditioning.dailyRecovery`,
  `matchFatigueMultiplier`). Fit sporcu turnuvalar arası daha hızlı toparlar ve maçta daha az yorulur.
- **7 günlük antrenman planı:** Plan artık haftanın **her günü** için (Pzt..Paz); her güne antrenman
  **veya Dinlenme** koyabilirsin. Turnuva günü seçtiğin seans yalnız o turnuvaya **katılmazsan** uygulanır
  (skip-day artık plana bağlı — "hangi antrenman" belirsizliği bitti). Her gün ağır antrenman → yorgunluk
  + sakatlık riski birikir → araya dinlenme koymaya zorlar (risk/ödül).
- **V2 yol haritası — Çok Oyunculu / Ortak Dünya (asıl hedef):** `docs/ROADMAP.md` §B2. **Model kararı
  (2026-09-20): ASENKRON ortak dünya (Hattrick)** — Ali/Mehmet/Jack tek dünyada, aynı turnuva/klasmanda;
  turnuvaya önceden kaydol + taktiği önceden ver → sunucu oynatır (offline olsan bile) → kendi maçlarını
  replay izlersin; AI/turnuva/klasman ORTAK. "Haftayı İlerle" kalkar, taktik önceden verilir. Revize
  aşamalar: **M9** kimlik + kalıcı DB (User + `Player.userId`, AI ortak; Postgres) → **M10** `World`
  singleton + sunucu saati + kayıt/önceden-taktik → **M11** ortak turnuva simülasyonu + klasman (replay)
  → **M12** ölçek & servis.
- **Alt sekme çubuklu turnuva ekranı (yazı, ikonsuz):** Turnuva tek sayfada, altta **sekme çubuğuyla**
  gezilir: **Pul kağıdı · Pul maçları · Klasman · Elemeler · Sonuç**. Sekmeler **turnuva ilerledikçe
  açılır** (kilitli başlar; kilitliye tıklanınca "Bu bölüm henüz açılmadı"). Aktif/oynanacak bölüm
  otomatik seçilir; geçmiş bölümler serbest gezilir; gelecek bölümler kilitli olduğu için **spoiler yok**.
  (`TournamentTabs`, `LiveState.stage`, tek `advanceLiveStage` aksiyonu.)
- **Aşama akışı:** Pul kuraları → pul maçları → pul kağıdı → klasman → eleme kurası (o turun eşleşmeleri,
  skor yok) → eleme maçı (yalnız senin maçın) → kazanınca sonraki turun kurası → … → sonuç.
- **Maç bitince "Sonuçlar işleniyor…" beklemesi:** Maç biter bitmez pul sonucu / klasman / sonraki
  tur / turnuva sonucu **hemen fırlamaz** — kısa bir bekleme sonrası ilgili sekme otomatik açılır.
  Geri sayım sayısı gösterilmez; yalnız "…işleniyor" yazısı akar (`Countdown`).
- **Pul kağıdı canlı dolar:** İlk pul maçından sonra "Pul kağıdı" sekmesi açılır ve her maç bittikçe
  ızgara **canlı dolar** (yalnız senin pulun; diğer puller pul bitince "Diğer puller" katlanırında).
- **Pul klasmanı gerçekçi:** Turnuva klasmanı artık **G-M** (galibiyet-mağlubiyet), **averaj** (Ind) ve
  **atılan tuş** (TV) sütunlarıyla — gerçek pul klasmanı gibi.
- **Elemede spoiler yok (gerçekçi):** Canlı turnuvada eleme aşamasında **çatal/tüm eşleşmeler hiç
  gösterilmez** — yalnız o an oynanacak turun **kurası** (isimler, skor yok) ve **senin maçın** görünür.
  Motor sonraki turu önden hesaplasa bile "henüz olmamış" sonuçlar ekrana sızmaz. Tam çatal yalnız
  turnuva bitince **Kariyer Geçmişi**'ndeki turnuva detay sayfasında görülür.
- **Pul kağıdı (poule sheet):** Turnuvada pul sonuçları artık klasik **FIE pul kağıdı** olarak —
  NxN sonuç ızgarası (V5 = galibiyet/attığın tuş, sayı = mağlubiyette attığın tuş) + V/TS/TR/Ind/Sıra
  sütunları; hem canlı ekranda hem sonuç/geçmiş ekranında. (`PoolSheetDTO`, `buildPoolSheets`, `PulKagidi`.)
- **Eleme çatalı (bracket):** Eleme tablosu tur tur **sütunlu çatal** görünümüne çevrildi (Son 32 → …
  → Final, yatay kaydırmalı, senin maçın vurgulu).
- **Canlı turnuva üst bilgi çubuğu:** Ekranın üstünde **🔋 Kondisyon · 🎯 Keskinlik · ⭐ Güç** (turnuva
  boyunca güncel — kondisyon maçlarla düşer).

### Değiştirdi
- **"Haftayı İlerle" kalktı → dünya saati gerçek zamanla akar (M10.1b):** Zaman artık oyuncu-güdümlü
  değil; sayfa açılınca kariyer şimdiki dünya gününe **otomatik yetişir** (antrenman/iyileşme uygulanır),
  uygun turnuva gününde **Katıl / Geç** için durur. Alt çubukta 🌍 dünya günü göstergesi; "İlerle" butonu yok.
  Yaş **kariyer açılış çıpasına** göre (dünyaya sonradan katılan doğru yaşta başlar; `GameState.careerStartDay`).
  Kariyer oluşturma dünya anına sabitlenir. (Geçici: turnuvaya girilmezse o günde bekler → offline oto-oynatma M10.2.)
- **Pul maçları sabit liste:** "Pul maçları" sekmesi artık tüm maçları **sabit** gösterir (oynanan =
  skor+açılır detay, sıradaki = işaretli, kalanlar = kilitli). Böylece maçlar "kendiliğinden ekrana
  düşmez" — hepsi baştan görünür (kullanıcı geri bildirimi).
- **Pul kağıdında yalnız senin pulun:** Öne çıkan senin havuzun; diğer puller pul bitince katlanır kutuda.
- **İlerleme butonu üstte:** "Devam / Elemeye Geç / Maça geç / Pul maçlarına başla" artık **durum
  çubuğunun (reyting) hemen altında** — aşağı kaydırmadan basılır.
- **Turnuva sonucu ekranı sadeleşti:** "Tüm tabloyu gör" butonu kaldırıldı — sonuç açıklanınca pul
  kağıdı / pul maçları / klasman sekmelerden gezilebildiği için gereksiz; yalnız **Eve Dön** kaldı.
- **"(sen)" etiketi kaldırıldı:** Klasman, pul kağıdı ve pul kurasında insanın satırı zaten vurgulu
  olduğu için "(sen)" yazısı kaldırıldı; elemede periyot kartı da artık **karakterin adını** yazıyor.
- **Canlı maç skoru event geçtikçe güncellenir:** Üstteki skor, açıklanan son tuşa göre canlı ilerler
  (önceden bitene kadar "• • •" idi).
- **Biten pul maçları katlanır:** Canlı ekranda oynanmış pul maçları artık **skor + açılır detay**
  (yalnız o an oynanan maç canlı akar).
- **Pul maçı numaralandırma:** "Pul 4 · 1. maç, 2. maç…" olarak gösteriliyor (karışıklık giderildi).

### Düzeltildi
- **Kondisyon dengesi (kademeli toparlanma):** Toparlanma artık düz −10/gün değil, **Dayanıklılık'a
  göre** (~%80–96 ile maça girilir, her sabah %100'e ışınlanmak yok); maç yorgunluğu tabanı hafif
  düşürüldü (`tuş×0,45`, taban 2). Makul plan (arada dinlenme, 2 turnuva) → maça ~%80+; her gün ağır
  antrenman + 3 turnuva → kondisyon çöker (dinlenme şart). Trace ile doğrulandı.
- **Sıradaki maç paneli önceki maçın çerçevesinin içinde görünüyordu:** Panel artık maç kartının
  **dışında**, ayrı kutu olarak (algı karışıklığı giderildi; `CanliMac`/`CanliPeriyot` afterDone kart dışına alındı).
- **Biten eleme maçı tüm logu baştan (1. periyot) oynatıyordu:** Artık önceki periyotlar **anında**
  görünür, yalnız **son periyot** animasyonla akar (`CanliMac instantThrough` = son periyot başlangıcı).
  Böylece "2. periyot taktiği verince maç 1. periyottan başlıyor" algısı giderildi (skor zaten devam ediyordu).
- **Kondisyon çok hızlı tükeniyordu:** İnsan oyuncuya **doğal günlük toparlanma** eklendi
  (`DAY_BASE_RECOVERY`); antrenman yükü bunun üzerine biner. Önceden yalnız REST günü (−12) topluyordu
  ve doğal toparlanma yoktu → varsayılan planla haftada ~+53 yorgunluk birikiyor, kondisyon 2 ayda
  tükeniyordu. Artık normal program kondisyonu hafif toparlar (~−13/hafta), ağır turnuvalar düşürür.
- **Pul son maçı bitmeden sonuç çıkması:** Son pul maçı canlı akarken "Pul sonuçlarını gör" paneli
  hemen görünüyordu (spoiler). Artık panel **maç animasyonu bitince** görünür (`CanliMac afterDone`).
- **Eleme çatalı skoru maç sürerken görünüyordu (spoiler):** Senin animasyonu süren eleme maçının
  skoru, üstteki çatalda maç kartında akmadan önce görünüyordu. Artık o turdaki maçın skoru
  animasyon bitene kadar **gizli** (`•`), maç bitince açılır. (`LiveTournamentDTO.currentRound`.)
- **Devre arası paneli 1. periyot bitmeden görünmesi:** Periyot canlı akarken alttaki devre arası
  paneli ve skoru hemen çıkıyordu (spoiler). Artık **periyot animasyonu bitince** görünür ve periyot
  skoru animasyon bitene kadar gizli (`CanliPeriyot afterDone` + gizli skor).

### Eklendi
- **Ayarlar sayfası (⚙️) + dil / ses / kariyer yönetimi:** Menüye **Ayarlar** eklendi; "Yeni Kariyer"
  menüden buraya taşındı. **Ses aç/kapa** (tercih saklanır; müzik/efektler yakında). **Kariyeri Sil**
  (onaylı) + **Yeni Kariyer**.
- **Tam İngilizce dil desteği (TR/EN):** Cookie tabanlı i18n (`src/i18n`, sözlük + `t()`; server/client
  ayrımı). Dil oyuncu oluşturma ekranından da seçilebilir. **Tüm arayüz çevrildi** — menü, alt çubuk,
  oluşturma ekranı, Profil, Antrenman, Turnuvalar, Klasman, Kulüp, Ekipman, Kariyer Geçmişi, Ayarlar,
  canlı turnuva + sonuç/replay ekranları, ve **maç anlatımları** (tuş-tuş/periyot/la belle) dahil.
  Motor etiketleri (silah/cinsiyet/turnuva/antrenman/taktik/yetenek/tur/gün) careerService DTO'larında
  dile göre üretilir; kalıcı loglar üretildikleri dilde kalır.
- **Antrenman türü açıklamaları:** Antrenman sayfasına "Hangi antrenman neyi geliştirir?" bölümü —
  her tür (Teknik/Fiziksel/Taktik/Mental) hangi skill'leri geliştirir + yorgunluk yükü; Dinlenme notu.
- **Antrenman sonrası haber kartı:** "İlerle" sonrası üstte özet — kazanılan skill'ler ("+0.6 Dayanıklılık,
  +0.5 Hız…"), **🔋 kondisyon** ve **🎯 keskinlik** değişimi, sakatlık uyarısı; ✕ ile kapanır.
  (`GameState.lastReport` + migration `training_report`, `CareerHeaderDTO.report`, layout haber çubuğu.)
- **Zamanlı atak eventleri — yaşa göre (GDD 18.9–18.26):** Tuş anlatımı artık "kaç zamanlı"
  (tempo) aksiyona göre katmanlı. **U10 sadece tek zamanlı**; **U12 ~%35 çift zamanlı** (feint/beat/
  parat-riposta); **U14+ 3–4 zamanlı** karmaşık diziler (degaje, prise-de-fer, çift feint…). Her
  silaha özel cümle havuzu → event çeşitliliği çok arttı. Tempo, anlatım RNG'sinden seçilir → skoru
  bozmaz. (`TOUCH_LINES_BY_TEMPO`, `TEMPO_MIX`, `pickTempo`.)
- **Periyot sistemi + devre arası taktik (GDD 18.7–18.8):** Eleme maçları **3 periyot × 3 dk**
  (havuz tek 3 dk periyot — değişmedi). İnsanın eleme maçı **periyot periyot** oynanır; her periyot
  bitince maç bitmediyse **devre arası** ekranında **taktik değiştirilebilir**. Tuş-başı saat silaha
  ve yaşa göre ilerler (kılıç hızlı, **epe yavaş → 3. periyoda sarkar**; küçük kategoriler erken bitirir).
  Süre dolabildiği için tuşsuz turlar (tempo kaybı, GDD 18.24) modellendi. 3. periyot sonu berabere →
  **altın tuş / öncelik dakikası (la belle, FIE t.40–41)** — alt kategorilerde nadir, üst kategoride
  (özellikle epe) daha olası. (`simulatePeriod`, `simulateLaBelle`, `LiveState.liveMatch`, `CanliPeriyot`.)
- **Antrenman menü ikonu** 🏋️ → 🎯 (eskrim antrenmanına daha uygun).
- **Tuş-tuş maç anlatımı (GDD 18.54):** Maç logu artık her tuşu ayrı satırda anlatır —
  özellikle 15 tuşluk elemede detay görünür. Silaha uygun eskrim terimleriyle: flöre'de
  parat-riposta/flèche/hücum hakkı, epe'de bilek/point-in-line/açı (angulation)/çift tuş,
  kılıçta baş-yanak kesme/flèche. Her satırda güncel skor (A–B) + durum notu ("üst üste 3!",
  "eşitlik", "maç sayısı!") ve 🏁 kapanış. Anlatım **ayrı bir RNG akışından** seçilir
  (`createRng(seed + ":narr")`) → maçın skoru/determinizmi değişmez, testler korunur.
  (`TOUCH_LINES` in `src/engine/combat/index.ts`; canlı izleme akış hızı 800/250 ms'ye çekildi.)
- **Görsel cila (başlangıç):** Sayıların ağır bastığı arayüze çocuklar için çekicilik — **Profil**
  sayfasına degrade **kimlik afişi** (avatar + isim + silah/kategori/yaş rozetleri), durum kartlarına
  ikon; **Kariyer Geçmişi** kartlaştırıldı. Emoji/SVG tabanlı, tema-uyumlu (ekstra görsel dosyası yok).
  Diğer sayfalara (Antrenman/Turnuvalar/Klasman/Kulüp/Ekipman) aynı dil yayılacak.
- **Geçmiş turnuvalar yeniden izlenebilir:** Kariyer Geçmişi'ne **🏟 Turnuvalarım** listesi eklendi;
  her turnuvaya dokununca pul + eleme maçları (kaydedilmiş combat log'uyla) tekrar izlenir. Daha önce
  turnuva sonuç/replay ekranına (`/turnuva/[id]`) menüden ulaşılamıyordu. (`getCareerHistory` +
  `CareerHistoryDTO.tournaments`, `src/app/kariyer/gecmis/page.tsx`.)

### Değiştirdi
- **İsimlendirme:** "Genel Güç" → **Reyting** (⭐; İngilizce karşılığı "Overall"), "Keskinlik" → **Form**
  (🎯; maça hazır olma — antrenman/maçla artar, atıl kalınca düşer). Motor alanı (`sharpness`/`overall`) aynı.
- **Profil yetenekleri sadeleşti:** Tavan sayısı ("/51 tavan") ve açıklama metni kaldırıldı — yalnız
  mevcut değer + çubuk.
- **Antrenman sayfası:** "Hangi antrenman neyi geliştirir?" artık **tıkla-aç hint** (kapalı gelir);
  sayfaya **mevcut yeteneklerin** listesi eklendi (neyin eksik, profile dönmeden görülür).
- **Turnuvayı geçince (evde kalınca) hafif GENEL antrenman:** Tüm becerilere az katkı + düşük yorgunluk;
  turnuvaya girenlerle gelişim farkı açmaz (önceden planın 1. seansı tam uygulanıyordu).
- **Yaş-orantılı yetenek gelişimi + gerçekçi tavan (GDD 9.11/9.19–9.35 + oyun sahibi kararı):**
  Her oyuncunun gizli **yetişkin potansiyeli** artık düşüğe eğimli dağılıyor (çoğu <65, elit ~80-86,
  olağanüstü ~86-90 nadir) ve **mutlak tavan 90** — 95/100 imkânsız. Gelişim **yaşa orantılı**: 8
  yaşında düşük başlar, tavana ancak ~26 yaşında (olgunlaşma eğrisi) açılır → 10 yaşındaki çocuk
  yetişkin tavanına ulaşamaz. Gelişim tüm kariyere yayılır (eskiden ~14'te platoya oturuyordu); en
  yetenekli oyuncu bile 30'larda ancak ~80'e gelir, **90'lar pratikte görülmez**. (`maturity`,
  `skillAgeCeiling`, `HARD_CEILING`, yeni `generateStartingSkills` + `growSkill maxNow`; AI gelişimi de yaş-tavanlı.)
- **Yetenek tavanı ekranda:** Profil'de "32.6 / 51 tavan" + çubukta tavan işareti + açıklama (herkes 100 olamaz).
- **U10 eleme formatı (FIE/USA Fencing gençler):** U10 eleme maçları artık **10 tuş / 2 periyot**
  (1. periyot 5 tuşta veya 3 dk'da biter); **U12 ve üstü 15 tuş / 3 periyot**. Havuz her kategoride
  5 tuş / tek periyot (değişmedi). (`deFormat`, `simulatePeriod` `periodCap`.)
- **Bitmiş turnuva tablosunda "Canlı İzle" → "📋 Skor detayı":** Turnuva bitince açılan tam tabloda
  ("Tüm tabloyu gör" / Geçmiş) "Senin Maçların" artık geçmiş maçları **canlı izleme** yerine skoru
  doğrudan gösterir; **Skor detayı** ile tuş-tuş döküm açılıp kapanır. Canlı izleme yalnızca maçın
  gerçekten o an oynandığı canlı turnuva ekranında kalır. (`CanliMac` `past` kipi.)
- **Yaş-kategori ilerlemesi (GDD 7.9 / 19.8):** Oyuncu yaşlandıkça kategori otomatik ilerler —
  **U10 → U12 → U14 → U17 → U21 → Senior** (her oyun yılı/Q yaş +1). Kategori değişince o kategorinin
  klasmanı sıfırdan başlar (GDD 19.8). Rakip kadrosu oyuncuyla **aynı yaşta** üretildiği için kategoriyi
  birlikte atlar → saha hep dolu kalır. (`currentIdentity`, `generateAiOpponents` `age` seçeneği.)
- **Gün-bazlı zaman modeli (GDD 17.7 + kullanıcı takvimi):** Zaman birimi hafta yerine **GÜN**.
  **Q = 1 oyun yılı**, içinde **12 ay (h1–h12)**, her ay **7 günlük sabit program** (Pzt→Pazar):
  Salı **İl**, Perşembe **Türkiye**, Cumartesi **Open** (her ay); Pzt/Çrş/Cuma/Pazar **antrenman**;
  uluslararası **yılda 1 kez** — h4 Satellite · h6 Avrupa · h8 Grand Prix · h10 Dünya Kupası. Aynı güne
  iki turnuva gelmez. Gösterim **"Q1 · h1 · Salı"**. Kayıt (register) akışı kaldırıldı; yerine
  **İlerle / Katıl / Geç**: sabit çubuk sonraki turnuva gününe kadar ilerler (antrenmanları uygular),
  turnuva gününde durur → Katıl (canlı oyna) / Geç (atla). Sakatlık artık **gün** cinsinden.
  `season.ts` gün-bazlı (`activityForDay`, `monthOfQuarter`, `dayOfWeek`); `GameState.dayIndex`
  (migration `day_model`, `weekIndex`/pending kaldırıldı); careerService `advanceDay`/`attendTournament`.
- **Klasman sekmesi:** Ana menüye **📊 Klasman** eklendi — kategori sıralaması (U10-M-EPE…), milli takım
  (ilk 4) ve uluslararası davet (ilk 16) durumu. GDD 19'a göre V1'de tek klasman kategori sıralamasıdır;
  dünya/ülke/uluslararası ranking sistemleri "Gelecek Sürümler" (V2) notuyla belirtildi.
- **Sabit "İlerle" çubuğu:** Zaman ilerletme düğmesi sayfa içinden çıkarılıp **alt sabit
  çubuğa** taşındı (sayfalar arası değişmez). Haftalık antrenman planı Antrenman sayfasından
  **kaydedilir** (`GameState.trainingPlan`, migration `training_plan`); çubuk bu planı uygular.
  Sakatken "🩹 Dinlen", turnuva haftası "🏆 Turnuvaya Git" olur. (Online'da zaman otomatik akacağı
  için bu çubuk yalnız tek-oyuncu zaman sürücüsü — bu yüzden sayfadan bağımsız konumlandı.)
- **Turnuva bitiş ekranı — sonuç + klasman:** Turnuva bitince kaçıncı olduğun (büyük), **kazanılan
  ranking puanı** ve **Quarter Ranking klasman sıran** gösterilir; ardından **🏠 Eve Dön**.
- **Mobil öncelikli arayüz — gizli/açılır menü + sayfalara bölme:** Tek uzun kaydırma yerine
  uygulama benzeri yapı. Üstte oyuncu adı + avatar; altında **"☰" açılır menü**: Profil / Antrenman /
  Turnuvalar / Kulüp / Ekipman / Kariyer Geçmişi (`src/app/kariyer/layout.tsx` + `CareerNav`,
  `getCareerHeader`). **Profil** = oyuncu özellikleri (özet + fizik + psikoloji + yetenekler);
  **Kulüp** ve **Ekipman** ayrı sayfalar (Ekipman'da seviye göstergesi + "🛒 Mağaza yakında"
  yer tutucu — ileride markete bağlanır); **Antrenman** = haftalık plan + "Haftayı İlerle";
  **Turnuvalar** = kayıt + Quarter Ranking. Mobil boşluk/başlık cilası (dar ekran için `px-4`,
  sticky başlık, tam-genişlik butonlar).
- **Canlı turnuva — gerçek zamanlı, maç-maç akış (GDD 18.54):** Turnuvaya girince ekranda
  **sıralı** oynanır: pul maçları **teker teker açılır** (1. bitmeden 2. aktif olmaz; ilerideki
  maçlar kilitli), **her maçın kendi taktiği** vardır (maç öncesi Ofansif/Dengeli/Defansif seçilir),
  maç **canlı** akar. Pul bitince sıralaman + pul tabloları açılır; **eleme pul bitince, tur tur**
  görünür (çeyrek bitmeden yarı açılmaz). Turnuva-içi **gerçekçi saat** (14:00 başlar; pul 2'şer dk,
  eleme 5'er dk) immersion için; **kariyer/hafta saati turnuva boyunca durur**, yalnız turnuva bitince
  ilerler (multiplayer'da sunucu saati sürer — çekirdek aynı). İlerleme `GameState.liveTournament`
  JSON blob'unda tutulur (sayfa yenilense de devam); AI maçları arka planda toplu simüle edilir.
  `src/server/careerService.ts` (startLiveTournament/playLiveMatch/enterBracket/finalize),
  `src/app/turnuva/canli`, migration `live_tournament`.
- **Maç taktiği (GDD 18.22–18.25):** Taktik sonucu tek bir bonusla belirlemez; **iki yoldan** etkiler
  ve oyuncunun **skill + trait**'leriyle ve **rakibin** özellikleriyle etkileşir: (1) effective
  strength'e küçük, matchup-farkındalıklı **"Taktik" modifier'ı** (±3.5 puan; Agresif/Soğukkanlı
  trait sinerjisi), (2) tuş-başı **kaos** (ofansif = sürpriz/risk ↑, defansif = salınım ↓, favoriyi
  korur). Rastgelelik beceriyi ezmez (GDD 18.32). AI rakipler karakterlerine göre stil seçer
  (`src/engine/combat/tactics.ts`). Taktik artık **her maça özel** seçilir (canlı turnuvada), kariyer
  geneli değil. +10 test.
- **Turnuva kayıt → bekle → oyna akışı (#8, GDD 17.20):** Turnuvaya "Katıl" artık anında
  sonuç düşürmez; **kaydolursun** ve turnuvanın **tarihi/haftası** gösterilir. Panelde
  **"Yaklaşan Turnuvalar"** bu quarter'ın tüm takvimini listeler (uygunluk/kayıt durumu ile).
  Tek "**Haftayı İlerle**" düğmesi (CM "Next" mantığı) zamanı sürer: kayıtlı turnuvanın
  haftası gelince seni doğrudan **turnuva ekranına** götürür, aksi halde haftalık antrenmanı
  uygular. Kayıt iptal edilebilir. *(Online'da bu akış sunucu saatiyle otomatik oynanır —
  kayıt çekirdek, "İlerle" yalnız tek-oyuncu zaman sürücüsü.)* Şema: `GameState.pendingLevel`
  + `pendingWeekIndex` (migration `registration`).
- **Şehir seçimi (#1):** Oluşturmada Ülke (Türkiye) + **Şehir** (12 il); seçilen şehir kulübü belirler.
- **Fiziksel yapı (#3):** Boy/kulaç/bacak/kilo + el tercihi; yaşa göre gelişir; combat'ta kulaç
  erişimi (Epe>Flöre>Kılıç) + yapı/bacak + solak (yalnız U10–U12) etkisi; kilo hız gelişimini etkiler.
- **Canlı maç izleme (#7):** Turnuva ekranında maçlar CM/Hattrick tarzı satır satır, spoiler'sız akar.
- Panelde baş harfli **avatar** (#5); oluşturmada varsayılan **8 yaş** (#2).

### Değişti
- **Şehir listesi Türkiye'nin 81 ilini kapsıyor** (oluşturma ekranı + kulüp havuzu).
- **Arayüz cilası (playtest):** Profil'de sezon **"Q1 / H4"** (büyük H), **"Genel Güç"** etiketi,
  fizik notu kaldırıldı, el **Sağ/Sol** (Sağlak/Solak yerine). Ekipman'da market/tahsis açıklaması.
  Tüm ay göstergeleri büyük **H**.
- **Turnuvalar → aylık takvim:** H1–H12 kartları (bu ay vurgulu, geçmiş aylar soluk); her ayın
  turnuva günleri (İl Salı · Türkiye Perşembe · Open Cmt) + o ayın uluslararası organizasyonu.
- **Klasman sekmesi zenginleşti:** "Türkiye Erkek Epe U10 klasmanında X. sıradasın" cümlesi;
  sıralama tablosunda **kulüp** adları; **yaş/cinsiyet/silah filtresiyle** başka kategorilerin
  klasmanına bakma (çok oyunculuda dolu, `getCategoryRanking`). AI oyunculara da kulüp atanıyor.
- **Kulüpte 2 antrenör, her biri 2 uzmanlık:** her kulüpte eşit yetenekli 2 antrenör; her hocaya
  4 antrenman türünden 2'si düşer → ikisi birlikte **4 türü de kapsar** (dengeli kulüp portresi, her
  şehir için). Uzmanlık CSV (`Club.coach2Name/coach2Specialty`, migration `two_coaches`). Birden çok
  kulüp havuzu (şehirler) → AI'lar dağıtılıyor.
- **Ekipman sayfasından "Yükselt" kaldırıldı:** şimdilik kulübün tahsis ettiği standart ekipman;
  seçim/market ileride (sayfada açıklama notu).
- **Sakatlık gün-bazlı ölçek:** süre 3–9 **oyun günü** (turnuvadan da gelebilir); İlerle ile
  dinlenerek geçilir.
- **Turnuvaya girmediğin gün artık antrenman yapılır:** "Geç" (bir turnuvayı atlamak) o günü boşa
  harcamıyor — planın 1. seansıyla antrenman uygulanır (skill gelişimi + yorgunluk/sakatlık riski).
  Böylece denge: Katıl = ranking + keskinlik + tecrübe (ama yorgunluk); Geç = antrenman (ranking yok).
- **Terim: "Havuz" → "Pul"** (poule) — kullanıcı-görünür tüm metinlerde ve maç turu etiketinde.
- **Turnuva ekranı akışı:** "Senin Maçların" artık **1) Pul → 2) Pul sonucu (kaçıncı oldun) →
  3) Eleme** sırasıyla; üst sıradan gelen oyuncuya **bay (bye)** açıklaması eklendi
  ("Son 32'yi oynamadan geçtin çünkü sıralaman yüksekti").
- Maç anlatımındaki **"Güç" → "Maç gücü"** (overall değil; silaha göre ağırlıklı, o maça özel
  effective strength olduğunu netleştirmek için).

### Düzeltildi
- Seçim kutularında beyaz-üstüne-beyaz okunmaz metin (#4); sakatlıkta "sahalardan" → **"pistlerden"** (#6).
- **Antrenman planı kaydedince eski haline dönüyordu:** plan formu artık **kontrollü** bir client
  bileşeni (`TrainingPlanForm`) — server action sonrası seçim korunuyor + "Kaydedildi ✓" göstergesi.
- **Pul son maçı bitmeden pul sonucu ekrana düşüyordu:** son pul maçı oynanınca sonuç HEMEN
  hesaplanmıyor; maçı izleyip **"Pul sonuçlarını gör"** dendiğinde açıklanıyor (`revealPool`).
- **Turnuva "Tüm tabloyu gör" sayfasında çıkış zorluğu:** sayfanın altına **🏠 Kariyere Dön** eklendi.

## [1.0.0] — 2026-09-13 — V1 (uçtan uca kariyer döngüsü)

M0–M8 tamamlandı: oyuncu oluşturma → haftalık antrenman planı (kondisyon) → gerçek FIE
turnuvaları (havuz+eleme) → Quarter Ranking + milli takım → gelişim çevresi (trait/psikoloji/
kulüp/koç/ekipman/ekonomi) → canlı AI dünyası + başarılar/kariyer geçmişi. 70 test.

### Eklendi
- **M8 — Cila & denge:**
  - **Başsız denge simülasyonu** (`npm run sim`, `scripts/sim.ts`): saf engine'lerle combat
    kazanma oranları, gelişim eğrisi, turnuva rekabeti ve sakatlık sıklığı raporu (GDD 4.33).
    Rapor katsayıların makul olduğunu doğruladı (küçük farklar rekabetçi, aşırı antrenman cezalı).
  - **Veritabanı yedeği** (`npm run db:backup`, GDD 22.58): zaman damgalı SQLite kopyası.
  - Tüm sayfalara ince sürüm alt bilgisi (V1).
- **M7 — Canlı dünya + Memory:**
  - **Canlı dünya (GDD 2.17):** AI oyuncular her hafta özerk gelişir (`advanceWeekTx` içinde
    seeded skill artışı) — rekabet zamanla sertleşir; oyuncu antren/dinlenirken de dünya ilerler.
  - **Memory/Achievements** (`src/engine/memory.ts`): turnuva sonucundan başarı tespiti
    (İlk Turnuva/Madalya/Şampiyonluk, Şampiyonluk, Uluslararası Madalya, Milli Takım, Ranking
    İlk 3 / 1 Numara). `Achievement` tablosu (migration `m7_memory`) + `Player.careerBestRank`.
  - **Kariyer Geçmişi** sayfası (`/kariyer/gecmis`): başarılar, kariyer istatistikleri (turnuva/
    şampiyonluk/madalya/maç/galibiyet/en iyi ranking) ve rakiplikler (maç geçmişinden).
  - 70 test. Uçtan uca tarayıcıda doğrulandı.
- **M6 — Gelişim çevresi engine'leri:**
  - **Trait** (`src/engine/trait.ts`): karakter özellikleri (Çalışkan/Tembel/Agresif…) → antrenman
    verimi + combat katkısı. **Psychology** (`src/engine/psychology.ts`): moral/motivasyon/özgüven/
    stres; olaylardan değişir (antrenman, turnuva); antrenman ve combat'a etki.
  - **Coach/Club** (`src/engine/environment.ts`): kulüp tesisi + koç uzmanlığı antrenman verimini
    artırır. **Equipment**: seviye 1–5, küçük antrenman/combat bonusu. **Economy**
    (`src/engine/economy.ts`): turnuva ödülleri (seviye×derece), para, ekipman yükseltme maliyeti.
  - Entegrasyon: `applyTraining` çevre çarpanı (trait×psikoloji×kulüp×koç×ekipman);
    Combat effective strength'e "Form" modifier'ı (psikoloji+trait+ekipman). Turnuva sonrası
    ödül + psikoloji güncellemesi.
  - Şema: Player'a trait/psikoloji/ekipman/para; `Club` modeli (migration `m6_environment`).
    Kariyer başında kulüp/koç/trait atanır, başlangıç parası verilir.
  - UI: "Psikoloji" barları + trait rozetleri + "Kulüp & Ekipman" kartı (para, ekipman yükselt).
  - 66 test. Uçtan uca tarayıcıda doğrulandı. (AI çevresi nötr — M7'de derinleşir.)
- **M5 — Haftalık döngü + kondisyon:**
  - Haftalık plan: her hafta **3 seans** (Teknik/Fiziksel/Mental/Taktik/Dinlenme); seanslar
    sırayla işlenir, yorgunluk biriktikçe verim düşer (GDD 14.33). `playWeek`/`restWeek`.
  - **Keskinlik (sharpness)** (`src/engine/conditioning.ts`): antrenman/maç artırır, dinlenme
    düşürür; Combat effective strength'e modifier (GDD 14.81) — Probability Engine'e eklendi.
  - **Sakatlık**: hafta sonu yorgunluk+yaş riskiyle (GDD 14.38); INJURED oyuncu antrenman/turnuva
    yapamaz (GDD 8.19), dinlenerek iyileşir. `Player.sharpness`, `Player.injuryWeeksRemaining`
    (migration `m5_conditioning`).
  - UI: keskinlik stat'ı, "Haftalık Plan" (3 seans seçici), sakatlık bandı + dinlenme akışı.
  - 53 test (conditioning + sharpness). Uçtan uca tarayıcıda doğrulandı.
- **M4 — Quarter Ranking + uluslararası + milli takım:**
  - Hafta/quarter zaman modeli (`src/engine/season.ts`): 12 hafta = 1 Quarter = 1 oyun yılı;
    haftalık takvim (İl/Open her hafta, Türkiye çift haftalarda, Satellite/GP/Avrupa/Dünya özel
    haftalarda); uygunluk kuralları (ilk 16 / milli takım ilk 4).
  - **Quarter Ranking**: kategori × quarter bazlı; quarter sonunda sıfırlanır (yeni quarter =
    yeni sıralama). Yaş her quarter +1 ilerler (GDD 17.5).
  - Uluslararası turnuvalar Quarter Ranking'e göre **davet/uygunluk kapısıyla** açılır; milli
    takım = ilk 4. Kalıcılık: `GameState.weekIndex`, `Ranking.quarter`, `Tournament.quarter/week`
    (migration `m4_quarter`).
  - UI: Sezon (Q/hafta) + milli takım rozeti; "Bu Hafta — Turnuvalar" (uygun=Katıl, kilitli=
    gerekçe); Quarter Ranking görünümü. Antrenman ve turnuva artık **hafta** ilerletir.
  - 48 test (season modeli + mevcutlar). Uçtan uca tarayıcıda doğrulandı.
  - Basitleştirme (ROADMAP §G): rekabet kategorisi M4'te sabit; U17→U21 ilerlemesi M7'ye.
- **M3 — Tam turnuva sistemi (gerçek FIE yapısı):**
  - Turnuva motoru yeniden yazıldı (`simulateTournament`): **Havuz** (6 kişi round-robin, 5 tuş)
    → **Turnuva Ranking** (FIE tie-break: galibiyet oranı → indicator → toplam tuş → kura)
    → **Eleme** (seed'li, standart tablo 16/32/…, üst seed'lere **bye**) → dereceler.
  - Seviye bazlı **puan tabloları** (İl/Open/Türkiye/Satellite/GP/Avrupa/Dünya — GDD 17.82–88);
    prestij katsayıları. Ranking puanı seviyeye göre hesaplanır.
  - Kalıcılık: `TournamentParticipant`'a havuz istatistikleri (poolNumber/wins/losses/tuşlar/
    indicator/seedRank), `Match`'e `phase` (POOL/DE) eklendi (migration `m3_tournament`).
    Alan 24 kişi (insan + 23 AI).
  - UI: turnuva seviyesi seçimi (İl/Open/Türkiye); sonuç sayfasında havuzlar, eleme turları
    (dinamik), FIE sıralaması ve dereceler. Uçtan uca tarayıcıda doğrulandı.
  - Tasarım kararı (GDD 2.25): GDD 17.54↔17.62 çelişkisi — bye tabanlı (kesmesiz) yaklaşım seçildi.
  - 45 test (turnuva yardımcıları + havuz/tie-break/bye + seviye puanları).
- **M2 — Combat + Probability derinleştirme:**
  - Güç/olasılık modeli Probability Engine'e taşındı (`src/engine/probability/strength.ts`):
    silaha göre belirgin ağırlıklar (Flöre/Epe/Kılıç), effective strength = yetenek + modifier
    (yorgunluk), olasılık eğrisi + soft-cap.
  - Combat aksiyon-bazlı yeniden yazıldı: küçük **momentum** (üst üste sayılar), silaha özgü
    metin anlatım, ve **açıklanabilir analiz** satırı ("Güç — A: X · B: Y, kazanma ihtimali %Z").
  - Maç formatı (havuz 5 / eleme 15 tuş) parametreleştirildi (`MATCH_FORMATS`).
  - 42 test (yeni: probability-strength; combat davranışları güncellendi).
- **M1 — Dikey dilim tamamlandı (ilk oynanabilir kariyer):**
  - Saf simülasyon engine'leri: `domain`, `skill` (10 alt-skill, azalan verimli gelişim),
    `training`, `combat` (silaha göre olasılık, tuş-tuş, metin log), `tournament`
    (8 kişilik tek eleme), `ranking` (Open puanları), `player` (Zod doğrulama + AI üretimi).
    38 birim testi (tümü sabit seed → tekrarlanabilir).
  - Kalıcılık: şema `PlayerSkill`, `GameState`, `Tournament`, `TournamentParticipant`,
    `Match`, `Ranking` ile genişletildi (migration `m1_core`).
  - Orkestrasyon: `careerService` (Engine→DataService→DB) — kariyer oluştur, gün/antrenman,
    turnuva çalıştır, ranking, kaydet/yükle.
  - Ekranlar (Next 16 + Server Actions): oyuncu oluşturma, kariyer paneli (durum, yetenekler,
    antrenman, ranking), turnuva sonuç sayfası (dereceler + maç anlatımları). Türkçe UI.
  - Uçtan uca tarayıcıda doğrulandı: oluştur → antren → turnuva → sonuç → ranking → kalıcılık.
- **M0 — Altyapı tamamlandı:**
  - Prisma 7 + SQLite kurulumu; ilk şema (`Country`, `Season`, `Player`) + `init` migration.
    Prisma 7 driver-adapter mimarisi: `@prisma/adapter-better-sqlite3` + `better-sqlite3`.
    Üretilen client `src/generated/` (gitignore'da; `postinstall` ile üretilir).
  - Tohumlanabilir deterministik RNG (`src/engine/probability`, cyrb128+sfc32) —
    aynı seed → aynı sonuç (GDD 20.30). Vitest ile 9 test.
  - Engine olay tipleri (`src/engine/events.ts`).
  - Veritabanı katmanı (`src/db`, singleton client) + Data Service iskeleti (`src/server`).
  - Vitest kurulumu (`vitest.config.mts`) ve `tests/`; başsız çalıştırıcı (`scripts/sim.ts`).
  - npm script'leri: `test`, `test:watch`, `sim`, `db:migrate`, `db:generate`, `db:studio`,
    `postinstall`.
- **`docs/ROADMAP.md`**: projenin teknik uygulama planı — mimari kararlar (saf engine'ler,
  seeded RNG, tek kaynaklı veri, Data Service katmanı), M0–M8 aşamaları, veri sahipliği
  tablosu, test stratejisi ve süreç kuralları. GDD'nin "NASIL/hangi sırayla" karşılığı.
  `CLAUDE.md` ve `README.md` buna referans verecek şekilde güncellendi.
- Proje temeli: 26 bölümlük GDD `docs/gdd/` altına çıkarıldı.
- `CLAUDE.md`: teknoloji kararı, engine=modül mimarisi, güvenlik ve çalışma kuralları.
- Git deposu başlatıldı; `.gitignore` (sırlar, node_modules, DB dosyaları hariç tutuldu).
- Node.js LTS kuruldu (winget, v24.19.0 / npm 11.17.0).
- Next.js 16 + TypeScript + Tailwind CSS + ESLint iskeleti (App Router, `src/` dizini).
- `CHANGELOG.md` oluşturuldu; README + CHANGELOG'u her işte güncel tutma kuralı benimsendi.

### Değişti
- Ranking puanı artık **turnuva seviyesine** göre hesaplanır (`rankingPointsForPosition(pos, level)`).
- Combat artık güç/olasılığı Probability Engine'den alır (`effectiveStrength`/olasılık matematiği
  `src/engine/probability`'ye taşındı).
- Paket adı `project-engarde` olarak ayarlandı.
- Next.js anonim telemetrisi kapatıldı (gizlilik).

[Unreleased]: https://example.com/project-engarde
