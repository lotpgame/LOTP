# Devir notu — Yusuf ↔ Osman

> Son güncelleme: **2026-10-02** (Osman tarafı). Açık kararlar ve işler yalnız bu dosyada tutulur.
> **Yusuf'un Claude'u:** oturum başında bu dosyayı oku. Açık madde varsa Yusuf'la sırayla geç, kararlarını
> **Cevap:** satırlarına yaz, sonra commit + push et.

## Nasıl kullanılır

1. Yusuf, Claude'una şunu yazar:
   *"docs/DEVIR.md'yi oku. Benden beklenenleri sırayla anlat, her birinde neye karar vermem gerektiğini
   söyle. Kararlarımı Cevap satırlarına yaz, sonra commit + push et."*
2. Cevaplar bu dosyadaki **Cevap:** satırlarına yazılır ve `master`'a push edilir. Yalnız doküman
   değişikliği olduğu için oyunu etkilemez.
3. Yusuf, Osman'a "DEVIR'i güncelledim" der. Osman tarafı dosyayı okur ve devam eder.
4. Cevaplanan/biten maddeler **Karar günlüğü**ne taşınır, buradan silinir — dosya küçük kalır.

🔒 **Gizli değerler buraya yazılmaz.** Deploy Hook URL'si, şifre veya token dosyaya, commit mesajına ya da PR
yorumuna girmez. Yapıldıysa yalnız "✅ yapıldı" yazılır.

## Durum (30.09) — Yusuf tarafından Osman'a

Bugün Yusuf tarafı `master`'a çok iş aldı (hepsi canlı + testte):
- **Motor/denge:** ekonomi dengesi (şampiyon ~300 Đ/sezon, başlangıç 0, gerçekçi fiyatlar), antrenman
  hızı yumuşatıldı (#34), sakatlık 1-2 gün (#36), **kondisyon gece tam toparlanma** (#35 — her sabah ~%99,
  `careerService.ts`), **beyaz lamba** flöre (#37 — `combat/index.ts`).
- **Ekipman:** silaha göre katalog (`itemsForWeapon`) + eldiven/göğüs (`equipment.ts` + `ekipman/page.tsx`);
  epe'de yelek/maske kordonu yok, silaha özel yelek.
- **UI:** klasman mobil 5'li grid, tek "Yeni Başla" butonu.
- **Docs:** `docs/TURNUVA_MULTIPLAYER.md` (B tasarımı), EKONOMI/NOTLAR/CHANGELOG güncel.

**🔴 Osman, senden bekleyen (aksiyon):**
1. ~~AI-dev PR merge~~ ✅ **yapıldı (30.09)** — dal güncel master'a çekildi (çakışmasız auto-merge),
   `vitest` 168/168 yeşil, PR #40 merge edildi. Ayrıntı: Karar günlüğü 2026-09-30.
2. **B (256+ gerçek-zamanlı turnuva)** — onaylandı, "hemen değiştir" ile başladım. **Faz 0 (kanonik şema)
   + Faz 1 (sunucu-tik çözümleme) bitti** — canlı turnuva artık sunucu-otoriteli, paralel evren hatası
   kökten çözüldü, gerçek tarayıcıda uçtan uca doğrulandı. Aynı PR (aşağıdaki açık maddeye bak — yine
   ÖNCE prod DB adımı gerekiyor, şema büyüdü).
3. ~~Beyaz lamba UI~~ ✅ **yapıldı (30.09)** — `/turnuva/[id]` tuş-tuş dökümünde `⚪ Beyaz lamba …`
   satırı artık `lamp-white` ışıltılı nokta + aydınlık şeritle öne çıkıyor. Ayrıntı: Karar günlüğü.

**Not:** Yusuf tarafı `src/server` canlı-turnuva koduna (B senin olduğu için) dokunmayacak; motorun geri kalanına devam eder.

## Durum (28.09, akşam)

- **Canlıda.** CI + Deploy Hook çalışıyor (her iki taraf da doğruladı: Yusuf'un kendi push'ları ve
  Osman'ın merge'leri otomatik yayınlanıyor). Pist Konsolu UI'ı (menü, Bugün, ekipman, turnuvalar, giriş,
  klasman, antrenman, canlı maç, pul kağıdı, manşet cümleleri, 7 günlük hafta şeridi, emoji temizliği)
  ve Yusuf'un ekonomi dengesi + "Yeni Başla" butonu tek tarafta çakışma olmadan `master`'da.
- **Açık PR yok.** Zincirdeki tüm PR'lar merge edildi veya (içeriği zaten `master`'da olduğu için)
  kapatıldı. Yeni bir iş için doğrudan `master`'dan dal aç.
- **Canlı veri korunuyor.** Değişiklikler şemaya, oyun motoruna (`src/engine`) ve sunucuya (`src/server`)
  dokunmadı. Testçilerin kariyerleri olduğu gibi.
- **Önizleme görselleri:** [`docs/tasarim/onizleme/`](tasarim/onizleme/). `telefon-*` 390 px,
  `masaustu-*` 1440 px; yerel test sürümünden.
- **Tasarım kuralları** (renkler, ikonlar, emoji yok, 44 px dokunma alanı):
  [`docs/tasarim/pist-konsolu.md`](tasarim/pist-konsolu.md). UI'a dokunmadan önce Claude bunu okumalı.
- **Ekonomi planı** (fiyatlar, ödüller, yıpranma/büyüme, iş bölümü):
  [`docs/EKONOMI.md`](EKONOMI.md).

## Çakışma olmasın diye

- **Ortak dosyalar** (ikimiz de dokunabiliriz — büyük değişiklik öncesi haber ver): `src/i18n/index.ts`,
  `CHANGELOG.md`, `src/app/kariyer/**`, `src/app/turnuva/**`, `src/app/ui/**`.
- **Serbest (Osman dokunmaz):** oyun motoru (`src/engine`), sunucu (`src/server`), şema. **İstisna
  (29.09):** `careerService.ts` içinde canlı turnuva seed hatası — bkz. Karar günlüğü 2026-09-29 — Osman
  tarafı tarafından düzeltildi (Yusuf'un önceliği yetişmediği için, Osman'ın açık onayıyla). Şema/motora
  (`src/engine`) dokunulmadı, yalnız `src/server/careerService.ts`'te tohum kaynağı değişti. Senkronize
  olurken bu commit'i normal bir merge olarak al; çakışma beklenmiyor (kimse aynı satırlara dokunmadı).
  **İkinci istisna (30.09, ŞEMA DAHİL):** AI aylık gelişim düzeltmesi (`Player.aiDevMonth`) — Yusuf'un
  onayı + prod DB adımıyla tamamlandı, PR #40 merge edildi. Ayrıntı: Karar günlüğü 2026-09-30.
- **Ekipman ikonları:** kendi GLADIUS setimiz (PR #5). Marka sitelerinden vektör çıkarılmıyor — telif riski.
  **Üçüncü istisna (30.09, ŞEMA DAHİL, B Faz 0):** `Match` tablosuna PENDING maç desteği — aşağıdaki açık
  madde, MERGE ÖNCESİ senin bir adımını gerektiriyor (aynı desen: önce prod DB, sonra merge).
  **Dördüncü istisna (02.10, `src/engine`, ŞEMA YOK):** `worldclock.ts`'teki `WORLD_EPOCH_MS` — aşağıya bak.
  Oyun motoru/dengesi değil, saf tarih-saat hatası; B'nin (benim) turnuva girişini tıkıyordu.

## Osman → Yusuf: Dünya saati 3 saat kayıyordu — turnuva girişi düzeltildi (açık iş: Vercel env var kontrolü)

**Bulgu (Yusuf, canlı test, 02.10, Osman üzerinden iletildi):** "19:15'te turnuvaya gir dedim, tıklıyorum
girmiyor, hata veriyor, kaydol diyor ama turnuva canlı diyor." Gerçek bir test oyuncusu B Faz 0+1'i ilk kez
gerçek koşullarda kullandı ve tıkandı.

**Kök sebep:** `src/engine/worldclock.ts`'teki `WORLD_EPOCH_MS` **UTC** gece yarısına sabitliydi. Günlük
etkinlik anı (`EVENT_HOUR=19`) bu epoch'tan oran olarak hesaplanınca gerçekte **19:00 UTC = 22:00 TR
saatinde** tetikleniyordu — `attendTournament`'taki hata mesajı ("bugün 19:00'da başlar") ve herkesin
beklentisi TR saatiydi, ama kod UTC'ye göre doğru davranıp 22:00'a kadar kapıyı açmıyordu. 3 saatlik fark
her gün tekrarlıyordu; "kaydol/canlı" çelişkisi de muhtemelen aynı kökten (tarih bazlı "bugün" göstergesi
UTC gece yarısı = TR 03:00'te dönüyor, ama gerçek giriş kapısı 22:00 TR'ye kadar açılmıyordu).

**Düzeltme (bu PR):** `WORLD_EPOCH_MS` 3 saat geriye çekildi → epoch artık 5 Ocak 2026 Pazartesi 00:00
**TR saati**. Pazartesi-çapa (dayIndex%7 → gerçek haftanın günü) korundu. Yeni test eklendi (günlük
etkinlik anı gerçekten TR 19:00'da), eski "epoch UTC Pazartesi" testi TR'ye güncellendi. Şema değişmedi,
veri taşıması yok — yalnız bir sabit. `lint`+`test` (169/169)+`build` yeşil.

**🚨 Senden tek bir kontrol lazım:** Vercel proje ayarlarında `WORLD_EPOCH_MS` diye bir ortam değişkeni
AYRICA tanımlıysa (`docs/DEPLOY.md` D2'de env listesinde geçiyor), o değeri de güncellemen/silmen lazım
— yoksa env var kod içindeki yeni varsayılanı ezer ve düzeltme canlıda etkisiz kalır. Osman tarafının
Vercel'e erişimi yok. Tanımlı değilse zaten bir şey yapmana gerek yok, kod merge olunca otomatik düzelir.

**Tek seferlik geçiş notu:** Deploy anında (hangi saatte olursa olsun) o günün `dayIndex`'i herkes için ya
aynı kalır ya da bir ileri atlar (zararsız, veri kaybı yok), ve o günün kalan etkinlik anı 3 saat erkene
kayar. İdeali: günün turnuvaları zaten çözülmüşken (gece) merge/deploy etmek.

**Cevap (Yusuf): _bekleniyor_**

## Osman → Yusuf: B Faz 0+1 — ÖNCE PROD DB, SONRA MERGE (açık iş)

**Ne değişti:** `docs/TURNUVA_MULTIPLAYER.md`'deki server-authoritative turnuva mimarisine (B) başladım,
"hemen değiştir" onayınla. **Faz 0 (kanonik şema) + Faz 1 (sunucu-tik çözümleme) bitti**, dal
`feat/b-faz0-match-schema` (PR açık — link için Karar günlüğü'ne bak).

- **Şema (Faz 0):** `Match` tablosuna `status` (PENDING|RESOLVED, varsayılan RESOLVED) + `scheduledAt`
  eklendi; `playerAId`/`playerBId`/`scoreA`/`scoreB`/`winnerId`/`log` nullable oldu. **Eklemeli, veri
  silmiyor** — mevcut satırlar aynen kalıyor.
- **Davranış (Faz 1):** Canlı turnuva artık istemci-güdümlü DEĞİL — "katıl"a basınca sunucu turnuvayı
  TEK SEFERDE çözer (`resolveScopedTournament`, offline otomatik yolla — `autoResolveTournament` — AYNI
  fonksiyonu paylaşıyor, senin bulduğun paralel-evren hatası artık mimari olarak imkânsız), sonuç hemen
  kesinleşir, ama GÖRÜNÜRLÜK tur tur açılır (spoiler olmasın diye). Kapsam-içi herkes aynı `/turnuva/[id]`
  sayfasını izler. Eski `startLiveTournament`/`/turnuva/canli` akışına artık HİÇ girilmiyor (yalnız B
  öncesi başlamış, hâlâ bitmemiş oturumlar için canlı kalıyor — kod duruyor, dokunmadım).
  Gerçek tarayıcıda uçtan uca doğrulandı (kariyer → katıl → `/turnuva/[id]` → pul maçları birkaç dakikada
  gerçek isim/skorla açıldı → eleme çatalı hâlâ kilitli).

**🚨 Aynı sıra kuralı:** Bu PR merge edilip `status`/`scheduledAt` sütunları prod DB'de yokken canlıya
çıkarsa, turnuva geçmişi (`/turnuva/[id]`), kariyer geçmişi VE artık turnuvaya katılmanın kendisi hata
verir (kod bu sütunları hem okurken hem yazarken kullanıyor). Yani: (1) önce `npx prisma db push` ile
prod'a uygula (veri-düzeltmesi GEREKMİYOR — yeni sütunlar nullable/varsayılanlı, mevcut veri zaten
uyumlu), (2) buraya **✅ yapıldı** yaz, (3) merge ederim.

**Not:** Bu PR'dan itibaren `src/server`'daki canlı-turnuva yoluna (`attendTournament`,
`resolveScopedTournament`, `finalizeTournament`, `getTournament`) ben dokunuyorum — TURNUVA_MULTIPLAYER.md'de
üzerinde anlaştığımız çakışma-önleme kuralı gereği senin dokunmadığın alan. Motorun geri kalanı
(skill/economy/combat/conditioning) hâlâ senin.

**Cevap (Yusuf, Osman üzerinden iletildi, 30.09): ✅ yapıldı.** Osman prod DB adımının tamamlandığını
doğrudan bildirdi (bu dosyaya kendi yazmadı — ileride kontrol etmek istersen buraya bakabilirsin). PR
bu onayla merge edildi.

## Senden beklenenler (Yusuf)

Şu an karar gerektiren açık madde yok. Küçük bir not, acil değil: motorun maç anlatımı
(`src/engine/combat/index.ts`, `src/server/careerService.ts`) hâlâ "🏁 … kazandı", "⏱ Süre doldu",
"🏅 Altın tuş!" gibi emoji'li satırlar üretiyor — arayüzün geri kalanında emoji kalmadı. İstersen
kaldırabilirsin, arayüz kazananı ve altın tuşu zaten ayrıca gösteriyor. Motor tarafı olduğu için Osman
dokunmuyor.

## Osman → Yusuf: Beyaz lamba için veri lazım (açık iş)

**İstek:** Gerçek eskrim cihazlarında flöre ve kılıçta hedef dışı vuruşta **beyaz lamba** yanar (epede yok
— tüm vücut hedef). Arayüz tarafında (`ScoreBug`, canlı anlatım) bunu göstermek istiyoruz ama motor şu an
hiçbir tuşun hedef içi/dışı olduğunu bilmiyor — her tuş geçerli sayılıyor (`combat/index.ts` içinde "hedef"
kelimesi yalnız maç puanı anlamında geçiyor, isabet bölgesi kavramı hiç yok).

**İhtiyaç:** Flöre/kılıç için her tuşa (muhtemelen `resolveExchange`/tuş üretilen noktada) olasılıksal bir
"hedef dışı mı" bayrağı — gerçekçi bir oran (FIE istatistiklerine yakın, örn. flörede ~%10-20 hedef dışı)
yeterli, hassas bir model şart değil. Epede bu kavram hiç uygulanmasın (her zaman geçerli/hedef içi). Bu
bilginin maç log'una veya `MatchResult`/DTO'ya eklenmesi lazım ki arayüz lambayı doğru renkte gösterebilsin.

Aciliyeti yok. Nasıl bir veri şekli/alan adı seçtiğini **Cevap** satırına yazarsan üstüne UI'ı bağlarım.

**Cevap (Yusuf/Claude, 29.09): ✅ Motora eklendi.** FIE doğrulandı → **yalnız FLÖRE** (kılıç/epede beyaz lamba
YOK — kılıçta hedef-dışı zaten hiç yanmaz, epede tüm vücut geçerli). `combat/index.ts`: flörede tek taraf tuş
bulduğunda **%15** (`FOIL_OFF_TARGET_PROB`, tunable) olasılıkla hedef-dışı → sayı yok, hamle durur.
**UI sözleşmesi:** maç log'una şu satır düşer → `⚪ Beyaz lamba — {ad} hedef dışına dokundu. Sayı yok.`
(EN: `⚪ White light — …`). Canlı oynatmada/pul kağıdında bu satırı yakalayıp **beyaz lambayı** flash'layabilirsin
(satır `⚪` ile başlıyor / "Beyaz lamba"/"White light" içeriyor). Hem tam maç hem canlı periyot yolunda çalışır.

## Osman → Yusuf: Vercel deploy'u kontrol eder misin? (açık iş)

**Durum:** PR #39 (`ed0adf9`, WhatsApp/sosyal medya önizleme görseli — `next/og`) 29.09 saat 15:42'de
`master`'a merge edildi. GitHub Actions'daki "deploy" adımı (Vercel Deploy Hook'a webhook tetikleme)
15:44'te yeşil bitti — ama bu yalnız Vercel'e "başla" isteğinin gittiğini gösteriyor, gerçek build'in
bittiğini değil.

**Sorun:** Aradan ~3 saat geçmesine rağmen canlı site (`lotp-one.vercel.app`) hâlâ bu commit'in kodunu
göstermiyor: `/opengraph-image` rotası 404, `<head>`'de hiç `og:*`/`twitter:*` etiketi yok. Önbellek sorunu
değil (`Cache-Control: no-store`, `X-Vercel-Cache: MISS`, `Age: 0` — sayfa her istekte taze render
ediliyor). Kod yerelde `next build && next start` (production modu) ile doğrulandı, görsel doğru
üretiliyor — yani kodda bariz bir hata görünmüyor.

**İhtiyaç:** Vercel dashboard'a bakabilir misin — `ed0adf9` commit'ine ait deployment'ın durumu ne
(Building / Failed / Queued)? Failed ise hata logunu paylaşırsan bakarım (tahminim: `next/og`/Satori
render adımı Vercel'in build ortamında bir şeye takılıyor olabilir, yerelden farklı olarak). Osman
tarafının Vercel'e erişimi yok.

**Cevap (Yusuf/Claude, 30.09): ✅ ÇÖZÜLDÜ (kendiliğinden).** Canlıda `lotp-one.vercel.app/opengraph-image`
artık **1200×630 görseli servis ediyor** (og rotası çalışıyor). Yani #39 deploy'u inmiş — muhtemelen ilk
gecikmeydi ya da sonraki bir push tetikledi. Deploy pipeline çalışıyor; sonraki push'lar canlıya iniyor.

## Canlı turnuva paralel-simülasyon çakışması — ✅ ara düzeltme + B kararı

**Bulgu (Osman, 29.09):** Aynı scopeKey'deki 2+ gerçek oyuncu turnuvayı kendi `gs.seed`'iyle AYRI
simüle ediyordu → herkes farklı sonuç görüyordu ("paralel evren").

**✅ Ara düzeltme (Osman, `9b335ce`):** Canlı turnuva seed'i artık PAYLAŞILAN `tour:${scopeKey}` →
aynı kapsamdaki herkes AYNI deterministik bracket/sonucu üretir. Acil tutarsızlık giderildi (testte yeterli).

**Karar (Yusuf, 29.09): B — gerçek-zamanlı çok-oyunculu turnuva (release öncesi mimari kilometre taşı).**
256+ gerçek oyuncu, hepsi taktik verir, herkes TEK gerçekliği yaşar; istemci-güdümlü akış sunucu-otoriteliye
taşınır. Ara düzeltme tutarlılığı sağladı; B tam gerçek-zamanlı taktik senkronu + ölçeği getirecek.
Tam tasarım: [`docs/TURNUVA_MULTIPLAYER.md`](TURNUVA_MULTIPLAYER.md).

## Yusuf → Osman: B'yi SEN üstlen — Gerçek-zamanlı çok-oyunculu turnuva (açık iş)

**Devir (Yusuf, 30.09):** 256+ gerçek oyuncu, hepsi taktik verir, herkes TEK gerçekliği yaşar. Bu mimari
kilometre taşını **Osman tarafı üstlenecek** (kendi AI'ı kodlar). Yusuf/Claude **tam tasarımı** hazırladı;
sen **onaylayınca** fazları (0→4) uygularsın. Aynı GitHub → tasarım sende zaten.

- **GDD kaynağı (asıl NE):** `docs/gdd/Project_Engarde_23_Multiplayer_Mimarisi.docx` — bu iş GDD'de ZATEN
  tanımlı (server-authoritative, Online Turnuva 23.27, hile önleme, Account↔Character, Online Ranking ayrı,
  Matchmaking, Match State). **Önce bunu oku.**
- **Tasarım (bu kod tabanındaki NASIL):** [`docs/TURNUVA_MULTIPLAYER.md`](TURNUVA_MULTIPLAYER.md) — ilkeler,
  bileşenler, yaşam döngüsü, **Faz 0–4**, açık kararlar (tik tetikleme, taktik penceresi, ölçek…). GDD 23 ile uyumlu.
- **Çakışma önleme:** bu iş sürerken **Claude canlı-turnuva SUNUCU koduna dokunmaz**
  (`careerService` canlı yol, `startLiveTournament`, `finalizeTournament`). Sen serbestçe yeniden yazarsın.
  Yusuf tarafı yalnız motor kurallarına (skill/economy/combat/conditioning) devam eder.
- **Açık kararları** (`docs/TURNUVA_MULTIPLAYER.md` §5) uygularken takıldığın olursa **Cevap** satırına yaz,
  Yusuf netleştirir.

**Cevap (Osman/Claude, 30.09): Hemen değiştir — üstleniyorum.** Zamanlama sorusuna ("test sırasında mı,
release öncesi ayrı sürümde mi") cevap: mevcut canlı yolu doğrudan değiştirdim, paralel sürüm yok. Faz 0
(şema) + Faz 1 (sunucu-tik çözümleme, paralel evren hatasının kökten çözümü) bitti ve tarayıcıda uçtan
uca doğrulandı — ayrıntı: yukarıdaki "B Faz 0+1" açık maddesi. Faz 2 (taktik pencereleri) ve sonrası
sırada; §5'teki diğer açık kararlar (tik tetikleme=lazy catch-up yeterli görünüyor, canlı yenileme=15 sn
ilk sürüm) kendi takdirimle uyguladım, sorun çıkarsa buraya yazarım.

## Karar günlüğü

| Tarih | Karar | Kim |
|---|---|---|
| 2026-10-02 | Dünya saati 3 saat kayması düzeltildi: `WORLD_EPOCH_MS` UTC yerine TR saatine (Europe/Istanbul) hizalandı — `EVENT_HOUR=19` artık gerçekten 19:00 TR'de tetikleniyor (önceden fiilen 22:00'ydi). Yusuf'un canlı test bulgusu (19:15'te turnuvaya giremiyordu) üzerine bulundu. `src/engine` istisnası (oyun motoru değil, saf tarih-saat hatası). Testler güncellendi (169/169 yeşil). Açık: Vercel'de ayrı bir `WORLD_EPOCH_MS` env var'ı varsa Yusuf'un güncellemesi gerekiyor | Osman + Claude |
| 2026-09-30 | B Faz 0+1 canlıya alındı (PR #41): canlı turnuva sunucu-otoriteli oldu, "paralel evren" hatası kökten çözüldü, `/turnuva/[id]` tarayıcıda uçtan uca doğrulandı. Yusuf prod DB'ye şemayı uyguladı (veri-düzeltmesi gerekmedi), onayı Osman iletti, merge edildi. Ardından beyaz lamba UI eklendi (`⚪ Beyaz lamba` log satırı artık `lamp-white` ışıltılı noktayla öne çıkıyor, tarayıcıda gerçek maç loguyla doğrulandı) — P1 listesindeki son "beyaz lamba" maddesi kapandı | Osman + Yusuf + Claude |
| 2026-09-30 | AI havuzu aylık gelişim çakışması düzeltildi (PR #40, `fix/ai-dev-month-dedup`): `Player.aiDevMonth` (eklemeli şema) + `worldAdvanceTx`'te atomik "hak ediş" — bir ay bir AI için yalnız bir kere işlenir. Yusuf prod DB'ye migration'ı uyguladı (23 AI → doğru değer, 8 insan kariyeri sağlam, site kırılmadı) ve onay verdi; dal güncel master'a çekildi (Yusuf'un kondisyon #35 + beyaz lamba #37 ile çakışmasız auto-merge), `vitest` 168/168 yeşil, PR merge edildi. Bağımsız bulgu: `migration_lock.toml` sqlite/postgresql tutarsızlığı düzeltildi; en eski migration dosyalarının hâlâ SQLite söz dizimi taşıması (sıfırdan replay edilemiyor) ayrı, düzeltilmemiş bir bulgu olarak not düşüldü | Osman + Yusuf + Claude |
| 2026-09-29 | Canlı turnuva paralel-simülasyon hatası düzeltildi: `startLiveTournament`'ta tohum artık çözen oyuncunun `gs.seed`'i değil PAYLAŞILAN `scopeKey`; AI seçimi `orderBy: id asc`; çekim listesi karıştırmadan önce id'ye sıralanıyor. Yusuf'un önceliği yetişmediği için Osman'ın açık onayıyla `src/server` istisnası kullanıldı. Testler yeşil (168/168) + yeni regresyon testi (`rng.test.ts`). Ayrı, DAHA BÜYÜK bir bulgu henüz düzeltilmedi: `worldAdvanceTx`'teki AI aylık gelişim/yorgunluk toparlanması da her insanın kendi gün-ilerletmesinde tekrar tetiklenebiliyor (şema değişikliği + mevcut veriyi bozmadan geçiş gerektiriyor) — Osman'a ayrı raporlandı, onay bekliyor | Osman + Claude |
| 2026-09-28 | Vercel Deploy Hook + GitHub secret kuruldu ve doğrulandı; CI (`chore/ci`) merge edildi, otomasyon çalışıyor | Yusuf + Osman |
| 2026-09-28 | Canlı maçta taraf renkleri onaylandı: sen sol+kırmızı (gerçek cihaz gibi) | Yusuf |
| 2026-09-28 | Yaş grubu ölçeği (`ui/bands.ts`) taslak değerleriyle (U10=30·U12=45·U14=60·U17=80·Büyükler=100) kalıcı | Yusuf |
| 2026-09-28 | Telefonla giriş güvenliği (OTP/Google OAuth) release'e ertelendi | Yusuf |
| 2026-09-28 | Testçilere ayrı duyuru yapılmayacak | Yusuf |
| 2026-09-28 | Ayarlar'daki çift reset butonu tek "Yeni Başla"ya indirildi | Yusuf + Claude |
| 2026-09-28 | Kullanılmayan çeviri anahtarı `ekipman.marketNote` kaldırıldı | Osman |
| 2026-09-28 | Osman tarafı PR'ları kendisi merge edebilir; önizleme ortamı yok, merge = canlı | Yusuf |
| 2026-09-28 | Canlı test verisi asla silinmez: yalnız eklemeli şema, sıfırlama yok (CONTRIBUTING §2) | Yusuf + Osman |
| 2026-09-28 | Ekipman görselleri: kendi ikonlarımız (GLADIUS), marka ürünü kopyalanmaz | Osman |
| 2026-09-28 | Ekipman kataloğu genişletme: iş bölümü Yusuf tarafı=motor/katalog, Osman=mağaza UI+ikon; önce mağaza sonra yıpranma motoru | Yusuf |
| 2026-09-29 | Ekipman kataloğu teslim edildi: `itemsForWeapon` + GLOVE/CHEST slotları + mağaza UI birlikte (Yusuf tarafı ikisini de bağladı). Kalan küçük not: yeni ürünlerin EN/DE i18n adları yok, TR'ye düşüyor — acil değil, ayrı iş olarak eklenebilir | Yusuf |
| 2026-09-30 | B (256+ gerçek-zamanlı çok-oyunculu turnuva) uygulaması **Osman tarafına devredildi**; tasarım Yusuf/Claude'dan (`docs/TURNUVA_MULTIPLAYER.md`), kod Osman AI'ı. Claude canlı-turnuva sunucu koduna dokunmaz (çakışma önleme) | Yusuf |
| 2026-09-20 | Kalıcı giriş: Google OAuth + IP'den ülke | Yusuf |
