# Devir notu — Yusuf ↔ Osman

> Son güncelleme: **2026-10-06** (Osman tarafı). Açık kararlar ve işler yalnız bu dosyada tutulur.
> **Yusuf'un Claude'u:** oturum başında bu dosyayı oku. Açık madde varsa Yusuf'la sırayla geç, kararlarını
> **Cevap:** satırlarına yaz, sonra commit + push et.
>
> ✅ **06.10 — B Faz 2-4 CANLIDA.** PR #45 squash (`e5581d3`) + prod migration + deploy; canlıda 18:00 GMT
> tur-tur turnuva doğrulandı. (PR #45 kapatıldı.)
> ✅ **06.10 — GÖRSELLER (#2/#3/#4) CANLIDA.** PR #46/#47/#48 (stack) squash (`d6b808a`) + 2 prod migration + deploy. (PR #46/#47/#48 GitHub'dan elle kapatılacak.)
> 🆕 **08.10 — Yeni görev: AVATAR** (karakter yüz portreleri, AI üretimi özgün set) → aşağıda "Yusuf → Osman: Avatar" (şartname tam burada; başka dosyaya bakma gerekmez).

## 🆕 Yusuf → Osman: Avatar — karakter yüz portreleri (AÇIK İŞ, 08.10)

**Görev:** Oyuncu profil avatarı = **karakter YÜZ portreleri** ("setten seç" — katmanlı oluşturucu DEĞİL). Şartnamenin tamamı burada; başka dosyaya bakmana gerek yok.

**Sanat (SENİN AI'ınla ÜRETİLİR, ÖZGÜN/telifsiz):**
- Yusuf'un gönderdiği lisanslı çizgi-film çocuk-sporcu seti **yalnız STİL referansı — KOPYALANMAZ.** Hedef: o çekicilik/kalite ama **bizim özgün** setimiz (AI üretimi). Referans sitenin görseli hiçbir biçimde kullanılmaz.
- **Baş-omuz portresi**, dairesel kadraj, küçük boyutta (40–60 px) net okunur.
- **Tek tutarlı stil + çeşitlilik**: farklı ten tonu, saç, cinsiyet → herkes kendini bulur. Çocuk-dostu, canlı.
- **Maske YOK — yüz görünür** (eskrim dokunuşu opsiyonel: kıyafet yakası/aksesuar).
- **Şeffaf arka plan PNG** (daire kadrajı uygulama çizer). İlk set ~10–14 varyant.

**Sistem (kod):**
- Şema **eklemeli**: `Player.avatar` (TEXT, nullable; seçilen avatar id). Boşsa **varsayılan silüet** → mevcut oyuncular bozulmaz, sonra seçerler.
- **Seçici**: Sporcu Oluşturma ekranı + Ayarlar → Görünüm (ızgara, seçili halka).
- **Gösterim**: Kimlik kartı (baş-harf rozetinin yerine) + klasman / turnuva / milli takım / pul kağıdı listelerinde küçük yuvarlak.
- Hepsi istemci + statik görsel varlık; motor (`src/engine`) değişmez.

**Yaşlandırma** (ileride / V2): karakterin çocuk/genç/yetişkin varyantı → avatar yaş kategorisiyle büyür (U10→U17→Büyükler). **İlk sette STATİK** (tek yaş).

**İLK ADIM:** önce **3–4 örnek portre** üret + seçici/kimlik kartına bağla (silüet varsayılan) → Yusuf+Claude onaylasın, sonra tam set + tüm ekranlar. ("Bir denesin bakalım ne çıkar.")

**Teslim:** branch + PR, **push/deploy YOK** (canlıya Yusuf alır). Şema eklemeli → merge öncesi prod DB adımı.

## ⭐ Çalışma kuralı — Osman'ın AI (Yusuf kararı, 06.10)

1. **Osman'ın AI YALNIZ bu DEVIR'de açıkça verilen görevleri uygular.** Serbest dolaşma / kendi kafasından
   özellik-çekirdek ekleme YOK. Tasarım Yusuf+Claude'da; Osman şartnameyi koda döker (GORSEL/TURNUVA docs).
2. **Teslim:** branch + PR; `master`'a push/deploy YOK — canlıya Yusuf alır (Vercel Hobby).
3. **Temizlik:** bir görevin kodu Yusuf/Claude tarafından alınıp canlıya uygulanınca, o madde bu dosyadan
   **Karar günlüğü**ne taşınır / kapatılır → açık liste hep güncel kalır, kafa karışmaz.

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

**Cevap (Yusuf/Claude, 02.10):** Doğru değer hesaplandı → **`WORLD_EPOCH_MS = 1789938000000`**
(= 20 Eylül Pazar 21:00 UTC = **21 Eylül Pazartesi 00:00 TR**). Bu değerle etkinlik tam **19:00 TR**'de
başlar (event = epoch + 19s = 21 Eylül 16:00 UTC = 19:00 TR). Yusuf gördüyse 22:00 → Vercel'deki değer
3 saat ileride (00:00 UTC). **Yusuf aksiyonu:** Vercel env `WORLD_EPOCH_MS`'i `1789938000000` yap + redeploy.
(Yerel `.env` zaten bu değerde.) Bir de #43 kod düzeltmesi merge/deploy edilmeli (edildi).
**Doğrulama (Osman/Claude, 03.10):** `1789938000000` hesapla kontrol edildi → 20 Eylül 21:00 UTC = 21 Eylül
Pazartesi 00:00 TR, 19:00 etkinlik anı = 21 Eylül 19:00 TR ✔ ve bugünün dünya günü 12 = Cumartesi ✔ (Pazartesi
çapası tutuyor). **Açık:** Vercel'deki değerin güncellenip redeploy edildiğini kimse yazmadı — Yusuf, bu
yapıldıysa buraya "✅ yapıldı" yaz (bir sonraki turnuva Salı 06.10, İl, 19:00 TR; bu Cumartesi Open yok —
hafta 12/7=1, tek hafta → antrenman).

## 🔴 Osman → Yusuf: Benim merge'lerim canlıya inmiyor — SENİN push'un lazım (açık iş, Salı 06.10 19:00 TR'den önce)

**Bulgu (03.10):** `gencosman10` yazarlı commit'ler Vercel Hobby'de **"Deployment was blocked"** alıyor
(GitHub → `GET /repos/alkanyus/LOTP/deployments` ve `/commits/<sha>/status`: `Vercel | failure | Deployment was
blocked`). CI'daki "deploy" işi (Deploy Hook) de **aynı saniyede engelleniyor**: `afe2e4d`'de hook çağrısı 00:43:09'da
bitti, ikinci "blocked" durumu da 00:43:09'da düştü. Yani hook bu engeli aşmıyor — CI'da "deploy ✅" yalnız hook'un
*kabul edildiğini* gösteriyor, canlıya indiğini değil (28.09'da "doğrulandı" denmişti; bugünkü kanıt tersini
gösteriyor). Senin (yusuf) commit'lerin ise `success`. **Sonuç:** benim merge'lerim canlıya ancak SENİN bir sonraki
push'unla iniyor (Vercel o commit'in tüm ağacını derlediği için hepsi birlikte). #43 (epoch) 02.10 20:15 UTC'deki
push'unla indi; **#44 (kayıtsız oyuncu turnuvaya giremiyordu) henüz canlıda DEĞİL.**

**Yusuf aksiyonu:** (1) Vercel env `WORLD_EPOCH_MS=1789938000000` doğru mu bak/ayarla (env değişikliği yalnız YENİ
dağıtımda etkili); (2) `git pull` → bu dosyada ilgili **Cevap** satırlarına yaz → **push et** (senin push'un yeni
bir Production dağıtımı üretir: env + #44 birlikte iner); (3) Vercel → Deployments: en üstteki Production
dağıtımının commit'i `afe2e4d` ya da sonrası ve "Ready" olsun. Eski bir dağıtımı "Redeploy" etme — eski kodu
(#44'süz) yeniden derler.

**Kalıcı çözüm önerisi (karar senin):** CI deploy işini Vercel CLI'a taşımak (`vercel deploy --prebuilt --prod`,
GitHub secret'ları `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID`; token'ı sen Vercel → Settings → Tokens'tan
oluşturursun). Hobby'de sahibin token'ıyla yapılan CLI dağıtımları genelde commit yazarına bakılmadan geçer
(denemeden garanti edemem). İstersen workflow'u ben yazarım; yoksa her Osman merge'ünden sonra senin bir push'un
gerekiyor.

**Cevap (Yusuf):**

## ✅ Yusuf → Osman: Geç giren oyuncu CANLI turnuvaya giremiyor (bug, B/canlı-turnuva)

**Gözlem (Yusuf, 02.10 — Perşembe turnuvası):** Turnuva başladıktan sonra (19:15'te) girildi. "Turnuvaya gir"
görünüyor, tıklanıyor ama **içeri girmiyor, hata veriyor.** Karışık durum: "devam ediyor" / "kaydol" diyor
ama aynı anda "turnuva CANLI" diyor; tıklayınca giremiyor. **Beklenen:** turnuva başladıktan SONRA giren
oyuncu da turnuvaya **girebilmeli** (sunucu-otoriteli akışta: ya devam eden turnuvayı izler/katılır, ya da
bittiyse sonucu görür). Bitiş saatinden sonra sonuç gösterilmeli — ve o sonuç **tüm oyuncularda AYNI** olmalı
(Faz 1 bunu garanti ediyor; Yusuf arkadaşıyla karşılaştırıp doğrulayacak). Bu senin alanın (B canlı yol).

**Cevap (Osman/Claude, 03.10): ✅ iki ayrı sebep bulundu, ikisi de kodda düzeltildi (#43 + #44 master'da; canlıya
iniş için yukarıdaki Vercel notuna bak — #44 senin push'unla iner).**
1. **Saat (02.10, #43):** o günkü ilk hata ("Turnuva saati henüz gelmedi — bugün 19:00'da başlar") buydu —
   kapı 22:00 TR'de açılıyordu. Düzeltme + Vercel env adımı yukarıda.
2. **Benim B Faz 1 regresyonum (yeni):** kayıtsız oyuncu "Turnuvaya Gir"e basınca sahaya alınmıyordu —
   alan yalnız KAYIT satırlarından kuruluyordu, tetikleyen kayıtlı değilse süzülüp dışarıda kalıyordu; başka
   kayıtlı gerçek oyuncu da yoksa alan boşalıp günü SESSİZCE ilerletiyordu ("tıklıyorsun, girmiyor"). Kayıt
   gün-00:00'da kapandığı için turnuva günü gelen herkes kayıtsız = tam senin tarif ettiğin durum. Eski canlı
   akışta canlı katılan hep sahadaydı; ben offline yolun alan kurmasını paylaşırken bunu kaybettim.
   **Şimdi:** tetikleyen kayıt aramadan sahada; **turnuva kurulduktan SONRA gelen kayıtsız oyuncu** bracket'e
   eklenemez (tek gerçeklik) → **izleyici** olarak aynı turnuvayı açar (sonuç herkeste aynı), "sahada değildin"
   notuyla; "Kaydol" ile "CANLI" yan yana görünmesi ise çelişki değil (CANLI = bugünkü turnuva, Kaydol =
   gelecek turnuvalar). Yerelde gerçek tarayıcıyla doğrulandı: kayıtsız 1. oyuncu sahada (24 kişide insan), 2.
   oyuncu aynı turnuvayı izleyici görüyor. Ayrıntı: CHANGELOG 03.10.
   **Kural (Yusuf'a not):** turnuvada OYNAMAK için ya önceden kaydol (taktik seçersin) ya da turnuva günü
   ilk giren sen ol; kurulduktan sonra gelen izler. İstersen "kayıt gün-00:00'da kapanır" kuralını gevşetmeyi
   (ör. turnuva kurulana kadar kayıt/katılım açık) ayrıca konuşuruz — şimdilik tasarımdaki kural duruyor.
   **İsteğe bağlı kontrol (Neon SQL, yalnız okuma):** bu bug'ın "devam ediyor" yanını da dışlamak için takılı
   eski canlı oturum var mı: `SELECT id, "dayIndex" FROM "GameState" WHERE "liveTournament" IS NOT NULL;` —
   satır dönerse o oyuncunun TÜM `/kariyer` sayfaları `/turnuva/canli`ya yönleniyor; haber ver, temizlerim.

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

**✅ ÇÖZÜLDÜ (06.10) — eski 3 madde:**

1. ~~Vercel env `WORLD_EPOCH_MS`~~ → **Saat modeli TR'den GMT'ye geçti** (Yusuf kararı, 05.10). Env artık
   **`WORLD_EPOCH_MS = 1789948800000`** (21 Eylül 2026 Pzt 00:00 UTC; kod ile aynı). Yusuf ayarladı. Oyun
   zamanı GMT: gün başı 00:00 GMT, etkinlik **18:00 GMT**. Ayrıntı: CLAUDE.md §7.
2. ~~Push + canlıya indir~~ → **İndi.** Yusuf adına commit `59ccd11` push edildi → Vercel bloğu açıldı
   (HEAD artık sahibin commit'i) → deploy "Ready" → **canlıda 18:00 GMT doğrulandı.** #44 de artık canlıda.
3. ~~CI deploy kararı~~ → **Çözüm netleşti (Pro'ya gerek yok):** Vercel Hobby yalnız sahibin (Yusuf) commit'ini
   deploy eder. Bundan sonra Osman'ın işi gelince Claude onun branch'ini **Yusuf adına squash** edip push eder
   → HEAD hep Yusuf'un → hep deploy olur. Token/CLI kurmaya gerek kalmadı.

**Kısa karar / bilgi (acil değil):**

4. **Kayıt kuralı:** kayıt turnuva günü 00:00'da kapanıyor. Turnuva günü gelen kayıtsız oyuncu ilk girense
   sahaya alınır (oynar); turnuva kurulduktan sonra gelen kayıtsız oyuncu izler. Bu sana uyuyor mu, yoksa
   gevşetelim mi (ör. turnuva kurulana kadar herkes katılabilsin)? Ayrıntı: "Geç giren oyuncu CANLI
   turnuvaya giremiyor" cevabı.
5. **İsteğe bağlı kontrol (Neon SQL, yalnız okuma):** takılı eski canlı oturum var mı —
   `SELECT id, "dayIndex" FROM "GameState" WHERE "liveTournament" IS NOT NULL;` — satır dönerse bana haber ver.

**Küçük not (eski, acil değil):** motorun maç anlatımı (`src/engine/combat/index.ts`,
`src/server/careerService.ts`) hâlâ "🏁 … kazandı", "⏱ Süre doldu", "🏅 Altın tuş!" gibi emoji'li satırlar
üretiyor — arayüzün geri kalanında emoji kalmadı. İstersen kaldırabilirsin, arayüz kazananı ve altın tuşu zaten
ayrıca gösteriyor. Motor tarafı olduğu için Osman dokunmuyor.

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

## ✅ (CANLIDA 06.10) GÖRSELLER (#2/#3/#4) — TAMAMLANDI

> **Durum:** PR #46/#47/#48 (stack) → squash `d6b808a` + 2 migration (`achievement_worldday`, `skill_quarter_base`) + deploy. 199/199 test yeşil. Aşağısı referans.

**Görev:** Oyunu çocuk/genç için cilalama. Şartnameler **[`GORSEL_ETKILESIM.md`](GORSEL_ETKILESIM.md)** §6-7-8'de hazır:
- **#2 Kutlama juice'u** (maç/sonuç/madalya): tuş→lamba flash + "+1" uçan + titreme; **beyaz lamba İKİ taraflı**;
  madalya→konfeti; şampiyonluk→kupa+konfeti. `prefers-reduced-motion` zorunlu.
- **#3 Kupa/madalya vitrini + kariyer zaman çizgisi** (Geçmiş sayfası): rozetler (kupa/altın-gümüş-bronz/milli
  takım/klasman), kilitli üst hedefler, **tam tarih** (worldDay→GMT).
- **#4 Bugün ekranı cila** (`/kariyer`): büyük profil, **skill radar** (geçen çeyrek "+N"), form/kondisyon
  ışıltısı, başarı şeridi.
- **Kural:** yalnız bu şartnameyi uygula (çekirdeğe fikir ekleme). Saf CSS/SVG, hafif, dış sanat yok.
  **Avatar (#1) PARK** (illüstratör, lansman öncesi) — yapma.
- **Teslim:** branch + PR, deploy etme → canlıya Yusuf alır.

**Cevap (Osman/Claude, 06.10):**
- **#2 → PR [#46](https://github.com/alkanyus/LOTP/pull/46)** kutlama efektleri — **DB adımı yok**, doğrudan squash.
- **#3 → PR [#47](https://github.com/alkanyus/LOTP/pull/47)** kupa vitrini + kariyer zaman çizgisi — **#46'nın üstüne
  kurulu**; squash'tan ÖNCE prod'a `npx prisma db execute --file prisma/migrations/20261006190000_achievement_worldday/migration.sql`
  (yalnız `Achievement.worldDay` ekler).
- **#4 → PR [#48](https://github.com/alkanyus/LOTP/pull/48)** Bugün ekranı cila — **#47'nin üstüne kurulu**; squash'tan ÖNCE prod'a 2. SQL:
  `npx prisma db execute --file prisma/migrations/20261006210000_skill_quarter_base/migration.sql` (yalnız
  `GameState.skillQuarterBase` ekler).
- Şartnamenin açık bıraktığı yerlerdeki yorumlar: `GORSEL_ETKILESIM.md` §6 / §7 / §8 altındaki **Cevap**.

---

## ✅ (CANLIDA 06.10) B Faz 2-4 ŞARTNAMESİ — TAMAMLANDI

> **Durum:** Uygulandı (PR #45), squash `e5581d3` + prod migration + deploy; canlıda 18:00 GMT tur-tur doğrulandı.
> Aşağısı referans için duruyor (tam tasarım: `TURNUVA_MULTIPLAYER.md`).

**İşbölümü (değişmez):** Tasarım/çekirdek kararlar **Yusuf+Claude'da**. Osman **yalnız bu şartnameyi uygular**;
oyunun temeline (kural/mekanik/çizelge) kendi fikrini eklemez. Takılırsan **Cevap** satırına yaz, Yusuf netleştirir.
Önce oku: GDD 23 (`..._23_Multiplayer_Mimarisi.docx`) + [`docs/TURNUVA_MULTIPLAYER.md`](TURNUVA_MULTIPLAYER.md).
Faz 0-1 bitti; bu şartname **Faz 2-3-4**.

### Kilitli zaman çizelgesi (oyun zamanı = GMT; T = turnuva başlangıcı = **18:00 GMT**)
| An | Olay |
|---|---|
| **T+0** (18:00 GMT) | Bracket çekilir, **havuzlar kurulur** (max **6 kişi/havuz**; havuz sayısı katılımcıya göre) |
| **T+5** | Havuz turu 1 çözülür |
| **T+7** | Havuz turu 2 |
| **T+9** | Havuz turu 3 |
| **T+11** | Havuz turu 4 |
| **T+13** | Havuz turu 5 → **havuzlar biter (T+15)** |
| **T+17** | **Havuz sonuçları + eleme tablosu** paylaşılır |
| **T+20** | **Eleme turu 1** |
| **T+30** | Eleme turu 2 |
| **T+40** | Eleme turu 3 |
| **…** | **+10 dk**'da bir, **finale kadar** (tur sayısı katılımcıya göre) |

**Taktik penceresi = önceki tur çözümünden bu tur çözümüne kadar.** Havuzlarda ~2 dk; elemede **10 dk**
(ilk eleme penceresi T+17→T+20 = 3 dk, sonrası hep 10 dk). Bu değerler Yusuf kararıdır — değiştirme.

### Faz 2 — Taktik pencereleri (çekirdek değişiklik)
- Turnuva artık tek seferde değil **TUR TUR** çözülür; her tur yukarıdaki çizelgedeki anında çözülür.
- Oyuncu, kendi **sıradaki maçı** için pencere açıkken taktik gönderir → DB'ye yazılır (`pendingTactic`).
- **🔧 Başlangıç-öncesi taktik (Yusuf, 06.10 — kural değişikliği):** Kayıtlı oyuncu, o günün turnuvası için
  taktiğini **turnuva BAŞLAYANA kadar (18:00 GMT)** değiştirebilmeli. **00:00 kilidi KALKIYOR** (eski kural:
  kayıt+taktik turnuva günü 00:00'da kilitleniyordu — artık yalnız YENİ kayıt 00:00'da kapanır; mevcut kayıtlı
  oyuncu taktiğini 18:00'a kadar düzenler). Yani bugünkü turnuva, saha kurulana (18:00) kadar arayüzde
  **"Taktiği değiştir"** ile görünür (şu an "Sıradaki Turnuva" kartında salt-okunur). 18:00'dan sonra per-tur
  canlı pencereler devralır. (İlgili: `getUpcomingTournaments` bugünü de kapsamalı, `now < 18:00 GMT` iken.)
- Çözümde sunucu o taktiği okur; yoksa **fallback: kayıtlı taktik → son kullanılan → BALANCED.**
- **Taktik seti = mevcut combat motorundaki set** (yeni taktik türü İCAT ETME).
- **Kabul:** (a) gönderilen taktikle çözülen maç, sabit seed testiyle kanıtlanır; (b) taktik göndermeyen
  fallback ile oynar; (c) iki farklı tarayıcı aynı turnuvada **birebir aynı** sonucu görür (paralel evren yok);
  (d) turnuva günü 18:00 GMT'den ÖNCE kayıtlı oyuncu taktiğini değiştirebilir, 18:00'dan sonra değiştiremez.

### Faz 3 — Canlı senkron (istemci yalnız gösterir + taktik yollar)
- İstemci ~3-5 sn polling: skor bandı, o anki tur, **sıradaki kendi maçın + taktik formu**, geri sayım.
- Manuel "geç/oyna" yok (otomatik akış, NOTLAR #25). Pencere kapalıyken form kilitli, açıkken aktif.
- **Kabul:** pencere açılınca form belirir/kapanınca kilitlenir; offline oyuncu hiç dokunmadan turnuvayı
  tamamlar (fallback) ve döndüğünde doğru sonucu görür.

### Faz 4 — Ölçek + cila
- **Sert oyuncu tavanı YOK (Yusuf, 06.10).** Toplam oyuncu **sınırsız**: turnuvalar **kategori bazlı**
  (U10 Erkek Flöre İl…), binlerce oyuncu 36 kategori × seviyeye dağılır → aynı anda **onlarca paralel turnuva**
  döner, her biri kendi içinde küçük kalır. **256 = tek turnuva saha HEDEFİ** (FIE eleme tablosu max 256;
  gerçekçi üst sınır) ve **büyütülebilir bir sabit** olmalı — ileride bir kategori aşarsa değeri artırırız,
  mimari değişmez. Yani ölçek = "çok paralel turnuva", tek turnuvada şişme değil.
- Tur çözümü **toplu DB yazımı** + **kilit/koşullu güncelleme** (aynı maç iki kez çözülmez, idempotent).
  Taktik gönderimi **doğrulanır** (geçerli + oyuncunun kendi maçı + pencere açık; GDD 23.57); sahte/başkasının
  maçına istek **reddedilir**. **Rate limit** (23.58) + olay **log'u** (23.59).
- **Kabul:** tek turnuvada saha-hedefi (256) kadar katılımcıyla simülasyon tutarlı tamamlanır (başsız test);
  **birden çok turnuva aynı anda** sorunsuz döner; eşzamanlı iki tik aynı turu iki kez çözmez; geçersiz taktik
  isteği reddedilir.

**🚦 Teslim kuralı (ÖNEMLİ — Yusuf, 06.10):** Osman **`master`'a PUSH ETMEZ, deploy ETMEZ.** Kendi
**dalında (branch)** çalışır, iş bitince GitHub'dan bize iletir (**branch + PR**). Yusuf/Claude dalı
**Yusuf adına squash** edip `master`'a alır → canlıya iner. (Vercel Hobby: canlıya inen commit sahibin
olmalı; Osman'ın commit'i doğrudan deploy OLMAZ.) Yani Osman yalnız **kodu yazıp gönderir**, yayına Yusuf alır.

**Çakışma kuralı:** bu iş sürerken Yusuf/Claude canlı-turnuva sunucu koduna dokunmaz
(`resolveScopedTournament`, `finalizeTournament`, `revealDueMatches`, staggering). Not: `src/engine/schedule`
şu an kullanılmıyor (18:00 tabanına hizalandı) — bu çizelgeyi orada ya da kendi yerinde kurabilirsin.

**Cevap (Osman/Claude, 06.10): ✅ Faz 2-3-4 yazıldı — dal `feat/b-faz2-4-canli-turnuva`, PR [#45](https://github.com/alkanyus/LOTP/pull/45). Merge
ETMEDİM (teslim kuralı): squash + yayın sizde.**

🚨 **Merge'den ÖNCE prod DB (aynı desen):** şema yalnız EKLEMELİ — `Tournament` (`startsAt`, `worldDay`, `step`
varsayılan 0), `TournamentParticipant` (`snapshot`, `fatigue`, `registeredTactic`, `pendingTactic`, `lastTactic`),
`Match` (`roundNo`, `slot`, `tacticA`, `tacticB`) + yeni tablo `TournamentEvent`. Sıra: (1) Neon yedeği / restore
noktası, (2) `npx prisma db push` (veri silme uyarısı ÇIKMAMALI; çıkarsa DUR), (3) squash + push. Kayıt:
`prisma/migrations/20261006120000_b_faz2_live_rounds/`. Kod bu sütunları okuyup yazdığı için önce DB, sonra kod.

**Kabul kriterleri → kanıt:**
- **Faz 2** (a) sabit tohum testi (`live-tournament.test.ts` "gönderilen taktikle çözülür") + yerelde arayüzden
  "Defans" gönderen oyuncunun maçı `DEFENSIVE` ile çözüldü; (b) göndermeyen kayıtlıysa kayıtlı taktiğiyle,
  kayıtsızsa son kullandığıyla oynadı; (c) tek DB durumu + test: girdi sırası ters çevrilince sonuç birebir aynı;
  (d) 18:00 GMT öncesi arayüzden taktik değişti ("Kayıtlı · Atak"), sonrasında sunucu reddediyor.
- **Faz 3:** panel pencere açıkken etkin, kapalıyken kilitli; geri sayım sunucu saatine göre; sayfa 4 sn'de bir
  tazelenir. Offline oyuncu hiç dokunmadan yedek taktikle tamamlar, dönünce aynı DB sonucunu görür.
- **Faz 4:** 256 kişilik başsız test geçti; iç içe koşan iki turnuva tek başına koşanlarla birebir aynı; yerelde
  3 eşzamanlı istek 5. turu bir kez çözdü (olay kaydında adım başına tek STEP); geçersiz taktik / katılımcı
  olmayan / maçı olmayan istek reddedildi; 10 denemeden sonra istek sınırı devreye girdi.

**Şartnamenin açık bıraktığı yerlerde uyguladığım yorumlar (değiştirmek istersen tek satır):**
1. Gönderilen taktik yalnız O maça uygulanır, sonra tüketilir; sonraki maçta yine göndermezse yedek sırası:
   kayıtlı → son kullanılan → Dengeli. (Kayıtlı oyuncuda "son kullanılan" hiç devreye girmez — şartnamedeki sıra.)
2. Turnuva T+0'dan sonra ona dokunan ilk istekte çekilir (cron yok, §5.1). Kimse dokunmazsa ilk dokunan geldiğinde
   zamanı geçmiş turlar sırayla, yedek taktiklerle çözülür — çizelge kilitli, sonuç değişmez.
3. Havuz turları hep 5 adım (küçük havuzda son turlar boş geçer) — çizelge kilitli.
4. Dev'de dünya günü kısaltılınca (`WORLD_MS_PER_DAY`) çizelge dakikaları da aynı oranda kısalır; üretimde birebir.
5. Taktik istek sınırı: oyuncu başına, turnuva başına 60 sn'de 10. Sayfa yenileme 4 sn.

**Bilinen sınırlar:** (1) Vercel Hobby fonksiyon kotası — her izleyici 4 sn'de bir istek atar; test ölçeğinde
sorun değil, büyük ölçekte SSE/cron (M12) gerekir. (2) Maç anlatım dili, adımı çözen isteğin dilinde yazılır
(Faz 1'de de böyleydi). (3) `ViewSettings.tsx` lint hatası master CI'ını kırmızı yapıyordu → aynı PR'da
`NextTournament` deseniyle düzeltildi (davranış aynı). (4) Yerel eşzamanlılık testi PGlite'ta; mantık Postgres
advisory lock + koşullu güncellemeye dayanıyor (Neon'da standart).

## Karar günlüğü

| Tarih | Karar | Kim |
|---|---|---|
| 2026-10-06 | **GÖRSELLER (#2/#3/#4) CANLIYA ALINDI.** Osman stack halinde yaptı (PR #46 kutlama juice, #47 kupa vitrini, #48 Bugün cila — `feat/bugun-cila` üçünü içerir). Yusuf adına squash `d6b808a` → 2 prod migration (`Achievement.worldDay`, `GameState.skillQuarterBase`; eklemeli) `db execute` ile uygulandı + doğrulandı → deploy. 199/199 test yeşil. Osman çalışma kuralı A uyguladı (DEVIR görevi + branch/PR). PR #46/#47/#48 elle kapatılacak. | Yusuf + Claude |
| 2026-10-06 | **B Faz 2-4 CANLIYA ALINDI.** Osman'ın PR #45 dalı Yusuf adına squash → `e5581d3` → push → Vercel deploy. **Prod Neon migration** (eklemeli: Tournament/Participant/Match yeni kolonlar + `TournamentEvent`) `prisma db execute` ile uygulandı + doğrulandı. ⚠️ Prod migration geçmişi `_prisma_migrations`'da kayıtlı DEĞİL (ham SQL ile yönetiliyor, drift) → yeni migration'larda `migrate deploy` DEĞİL, yalnız yeni SQL `db execute` ile uygulanır. 183/183 test yeşil. PR #45 elle kapatılacak (gh login yok). | Yusuf + Claude |
| 2026-10-06 | **B Faz 2-4 dal + PR olarak teslim edildi** (`feat/b-faz2-4-canli-turnuva`, PR [#45](https://github.com/alkanyus/LOTP/pull/45)): kilitli 18:00 GMT çizelgesiyle tur-tur çözüm (max 6 kişi/havuz), tur aralarında taktik penceresi (yedek: kayıtlı → son → Dengeli), 18:00'a kadar başlangıç-öncesi taktik, 4 sn'de bir tazelenen canlı panel, advisory lock + koşullu güncelleme, toplu DB yazımı, taktik doğrulama + istek sınırı + olay kaydı (`TournamentEvent`), 256 kişilik başsız test. Şema eklemeli → merge öncesi prod `db push`. Merge/yayın Yusuf'ta | Osman + Claude |
| 2026-10-06 | **Saat modeli TR → GMT.** Oyun zamanı artık GMT (dünya saati); oyuncu kendi yerel saatine çevirir (UI'da sağ üst GMT saat rozeti). Gün başı 00:00 GMT, etkinlik **18:00 GMT** (`EVENT_HOUR=18`, epoch 21 Eylül 2026 00:00 UTC=`1789948800000`; eski epoch'tan +3 saat, dayIndex haftası korundu → canlı kariyerler bozulmadı). Gösterimler GMT'ye çevrildi, "TR saati"→"GMT". Ayrıca Ayarlar'a **Klasik/Yatay görünüm** seçeneği (varsayılan Klasik). Testler 169/169. Yusuf adına `59ccd11` push → Vercel bloğu açıldı → canlıda 18:00 GMT doğrulandı. Vercel env `WORLD_EPOCH_MS=1789948800000`. Turnuva başlangıcı: Avrupa prime-time için 18:00 GMT seçildi (CET 19:00/20:00, TR 21:00). | Yusuf + Claude |
| 2026-10-06 | **Vercel deploy bloğu çözüldü (Pro'suz).** Hobby yalnız sahibin (Yusuf, y.alkan1984) commit'ini deploy eder; Osman'ın commit'leri atlanıyordu. Çözüm: canlıya inen commit hep Yusuf adına olacak — Osman'ın işi gelince Claude branch'ini Yusuf adına **squash** edip push eder. | Yusuf + Claude |
| 2026-10-06 | **B Faz 2-4 şartnamesi** DEVIR'e yazıldı (kilitli çizelge: başlangıç 18:00 GMT, havuz turları 2 dk arayla T+5..T+13, sonuç T+17, eleme +10 dk; max 6 kişi/havuz; taktik penceresi = tur arası). Osman "başlat" komutuyla uygulayacak; tasarım Yusuf+Claude'da. | Yusuf + Claude |
| 2026-10-06 | **B şartnamesi netleştirildi (2 ekleme):** (1) sert oyuncu tavanı yok — toplam sınırsız, kategori-bazlı paralel turnuvalarla ölçeklenir; 256 = tek turnuva saha hedefi, büyütülebilir sabit. (2) **Taktik 00:00 kilidi kalktı:** kayıtlı oyuncu o günün turnuvası için taktiğini **18:00 GMT'ye (turnuva başlangıcı) kadar** değiştirebilir; `getUpcomingTournaments` bugünü de kapsamalı. Yusuf'un bulgusu: bugün kayıtlıyım ama taktik değiştiremiyorum + liste 2 gün sonrasını gösteriyor. Faz 2'ye madde eklendi. | Yusuf + Claude |
| 2026-10-03 | Kayıtsız oyuncu turnuvaya giremiyordu (B Faz 1 regresyonu, benim): `resolveScopedTournament` alanı yalnız kayıt satırlarından kuruyordu, tetikleyen kayıtlı değilse sahadan düşüyor/alan boşalınca gün sessizce ilerliyordu. Düzeltildi: tetikleyen her zaman sahada (kayıt şartı yok), rakip yoksa açık hata, turnuva kurulduktan sonra gelen kayıtsız oyuncu izleyici (`youParticipated=false`, "sahada değildin" notu, sahte "son sıra" başlığı yok). Yerelde 2 oyuncuyla tarayıcıda doğrulandı. `src/server` canlı-turnuva yolu (benim alanım), şema yok. PR #44 master'da; **canlıda DEĞİL** — Vercel Hobby benim commit'lerimi (hook dahil) engelliyor, Yusuf'un bir sonraki push'u gerekiyor (bkz. açık iş) | Osman + Claude |
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
