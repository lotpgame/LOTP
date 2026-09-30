# Gerçek-Zamanlı Çok-Oyunculu Turnuva — Tasarım (B)

> **⭐ GDD kaynağı: `docs/gdd/Project_Engarde_23_Multiplayer_Mimarisi.docx`** — bu iş GDD'de ZATEN var.
> Server-authoritative (23.7–23.9), **Online Turnuva** (23.4.3, 23.27: Registration→Category→Seeding→Pool→
> Pool Results→Elimination→Final→Prize→Ranking), hile önleme (23.25–23.26), Account↔Character ayrımı
> (23.13–23.14), Online Ranking ayrı (23.16), Matchmaking (23.18–23.20), Match State (23.22).
> **Bu doküman = GDD 23'ün BU kod tabanındaki "NASIL"ı** (fazlar, Next/Vercel/Prisma detayları). Uygularken
> önce GDD 23 okunur; bu iki doküman birbiriyle uyumlu.


> **Hedef (Yusuf, 29.09):** Tek bir turnuvaya **256+ gerçek oyuncu** girer, hepsi kendi maçlarına
> **taktik verir**, ve **herkes AYNI tek gerçekliği yaşar** — kimse farklı sonuç görmez. İş sonunda
> herkesin sonucu aynı ve tutarlıdır. Bu, oyunun multiplayer çekirdeğidir (release öncesi kilometre taşı).
>
> Bu doküman NASIL yapılacağının kalıcı kaynağıdır. Kod yazmadan önce ilgili faz buradan okunur.
> Son güncelleme: 2026-09-30.
>
> **⭐ Uygulama sahibi: OSMAN tarafı (kendi AI'ı) — Yusuf kararı (30.09).** Tasarımı Yusuf/Claude verdi;
> Osman onaylayınca fazları (0→4) kendi tarafında kodlar (aynı GitHub'dan okur). **Çakışma önleme:** bu iş
> sürerken **Yusuf/Claude canlı-turnuva sunucu koduna (`careerService` live yol, `startLiveTournament`,
> `finalizeTournament` vb.) dokunmaz.** Motorun geri kalanı (skill/economy/combat kuralları vb.) Yusuf tarafında
> devam eder. Osman UI + bu turnuva mimarisini üstlenir.

---

## 0. Neden yeni mimari? (mevcut sorun)

Şu an canlı turnuva **istemci-güdümlü**: turnuvayı **oyuncunun kendi tarayıcısı/oturumu** simüle ediyor
(`startLiveTournament` → `gameState.liveTournament` JSON, seed = `gs.seed` = oyuncuya özel).

Sonuç: aynı turnuvadaki iki gerçek oyuncu **farklı seed + farklı simülasyon** çalıştırıyor → **iki paralel
evren** (herkes farklı rakip/skor görüyor); ilk bitiren ortak sonuca yazıyor, diğeri **başkasının
simülasyonundan** miras sonuç alıyor. (Osman'ın bulgusu, DEVIR 29.09.)

256 gerçek oyuncu hedefiyle bu kabul edilemez. Çözüm: **sunucu tek otorite.**

---

## 1. Temel ilkeler (değişmez)

1. **Sunucu tek gerçek kaynağıdır (server-authoritative).** Turnuvayı hiçbir tarayıcı simüle etmez;
   **sunucuda tek bir kanonik durum** yürür. İstemci yalnız **gösterir** ve **taktik gönderir**.
2. **Tek paylaşılan seed.** Seed turnuva örneğinden türetilir (`scopeKey`), oyuncudan DEĞİL. Her maçın
   seed'i `f(scopeKey, tur, maçIndex)` — sabit → yeniden hesaplama **idempotent** (aynı sonucu verir).
3. **Bracket bir kez çekilir, DB'ye yazılır.** Havuzlar + eleme maçları turnuva başında oluşturulur,
   her maça **zamanlanmış saat** + **durum** (PENDING/RESOLVED). Tek bir oyuncunun JSON'unda DEĞİL —
   paylaşılan DB varlığı (`Tournament` + `Match`).
4. **Zamanlanmış ilerleme (Hattrick modeli).** Maçlar takvimdeki saatte sunucuda çözülür; oyuncu offline
   olsa bile döner. Schedule Engine (`src/engine/schedule`) zaten bu çizelgeyi üretiyor.
5. **Taktik penceresi.** Her tur öncesi oyuncu kendi maçı için taktik gönderir (belirli süre içinde).
   Göndermeyen → **kayıtlı/son/varsayılan** taktikle oynar (offline auto-play zaten var).
6. **Herkes aynıyı yaşar.** Çözüm sunucuda + gönderilen taktiklerden deterministik olduğu için tüm
   izleyiciler **birebir aynı** sonucu görür. Canlı izleyen de, sonradan bakan da, offline olan da.

---

## 2. Mimari bileşenler

### 2.1 Kanonik turnuva durumu (DB)
- `Tournament` satırı `scopeKey` ile **tekil** (zaten var). Durum: SCHEDULED → RUNNING → FINISHED.
- `Match` satırları **başta** oluşturulur: `scheduledAtMs`, `status` (PENDING/RESOLVED), `round`, `phase`,
  `playerAId`/`playerBId` (bracket ilerledikçe DE maçlarının oyuncuları belirlenir), sonuç alanları boş.
- Katılımcı taktiği: `TournamentParticipant`e (veya ayrı `pendingTactic`) alan — o oyuncunun **sıradaki maçı**
  için gönderdiği taktik.
- **Artık `gameState.liveTournament` JSON'una gerek yok** (kişisel simülasyon kalkar). İstemci durumu
  DB'den okur.

### 2.2 Sunucu-tik (scheduler) — turnuvayı ilerleten motor
- Görevi: `scheduledAtMs <= now` olan PENDING maçları **çöz** (deterministik, gönderilen taktiklerle),
  RESOLVED işaretle, bir sonraki turu/eşleşmeleri kur; hepsi bitince **finalize** (standings + ödül +
  ranking — bir kez).
- **İdempotent + kilitli:** iki tik aynı maçı iki kez çözmesin. Postgres advisory lock veya
  koşullu güncelleme (`UPDATE ... WHERE status='PENDING'`) + seed'li çözüm (tekrar çözüm aynı sonuç).
- **İki tetikleme (birlikte):**
  - **(a) Lazy catch-up:** turnuvaya dokunan HER istek (izleyici polling, "gir" vb.) durumu "now"a kadar
    ilerletir. Vercel Hobby'de bedava çalışır; canlı turnuvada hep biri online olduğu için pratikte yeterli.
  - **(b) Cron fallback (liveness):** kimse online değilken bile ilerlesin diye periyodik tetik. Seçenekler:
    Vercel Cron (Hobby'de sınırlı — Pro gerekebilir), veya **GitHub Actions cron** bir endpoint'i dürtür,
    veya harici cron. **Karar noktası (§5).**

### 2.3 Taktik gönderimi
- Tur başında **pencere açılır** (örn. maç saatinden N sn önce). Oyuncu taktiğini gönderir → DB'ye yazılır.
- Çözüm anında sunucu o taktiği okur; yoksa fallback (kayıtlı → son → BALANCED).
- Aynı oyuncu birden çok maçta (havuz round-robin) → her maç öncesi güncelleyebilir.

### 2.4 İstemci senkron (canlı görünüm)
- **Polling (başlangıç):** istemci her ~3-5 sn turnuva durumunu çeker (skor bandı, o anki maç, sıradaki
  kendi maçın + taktik formu). Serverless (Vercel) ile en basit yol.
- **İleride SSE/websocket:** gerçek anlık akış (opsiyonel iyileştirme).
- Görünüm tamamen DB'den → herkes aynı.

---

## 3. Turnuva yaşam döngüsü

1. **KAYIT (başlamadan):** oyuncular kayıt olur + başlangıç taktiği verir (mevcut kayıt akışı).
2. **ÇEKİM (başlangıç saatinde, 19:00):** sunucu bracket'i **bir kez** çeker (paylaşılan seed), havuzları +
   maç çizelgesini DB'ye yazar. Durum RUNNING.
3. **YÜRÜME:** sunucu-tik zamanı gelen maçları çözer; turlar arası taktik pencereleri açılır; online
   oyunculara polling ile yansır.
4. **BİTİŞ:** son maç çözülünce standings + ödül + ranking + kişisel etkiler **bir kez** uygulanır
   (mevcut `finalizeTournament` mantığı buraya taşınır).

---

## 4. Fazlar (aşamalı inşa)

- **✅ Faz 0 — Kanonik şema (30.09, tamamlandı).** `Match`e `scheduledAt` + `status` (+ nullable
  oyuncu/skor/log alanları); `scopeKey` zaten tekildi. Eklemeli — canlı veri korundu.
- **✅ Faz 1 — Sunucu-tik çözümleme (30.09, tamamlandı, tarayıcıda uçtan uca doğrulandı).**
  **Gerçek uygulama, tasarımdan bir noktada saptı (bilinçli, basitlik için):** tasarım "zamanı gelen
  maçları o an deterministik çöz" diyordu (tam incremental); gerçekte turnuvanın TAMAMI
  `simulateTournament` ile TEK SEFERDE, anında hesaplanıyor (`resolveScopedTournament` — offline
  otomatik yolla, `autoResolveTournament`, AYNI fonksiyon) ve `finalizeTournament` ödül/ranking'i hemen
  uyguluyor. Yalnız GÖRÜNÜRLÜK (`Match.status`/`scheduledAt`, tur-bazlı dalgalar) zamana yayılıyor —
  "sunucu-tik" (`revealDueMatches`) bu yüzden hesaplama değil, saf bir PENDING→RESOLVED reveal bulk
  update'i. Sonuç aynı garanti (paralel evren imkânsız, tek hesaplama, herkes aynı DB'den okur) çok daha
  az kod ve karmaşıklıkla. Taktik penceresi (Faz 2) geldiğinde bu, gerçek incremental çözümlemeye
  evrilebilir. `startLiveTournament`/`/turnuva/canli` emekliye ayrıldı (kod duruyor, yeni turnuva hiç
  girmiyor — yalnız B-öncesi başlamış oturumlar için).
- **Faz 2 — Taktik pencereleri.** Tur başı taktik gönderimi + fallback + çözümde uygulama.
- **Faz 3 — Canlı senkron (istemci).** Polling tabanlı canlı ekran (ilerleme, o anki maç, sıradaki maçın +
  taktik formu). Manuel "geç" yok (NOTLAR #25 ile uyumlu — otomatik akış). Faz 1'in ilk sürümü
  (`LiveAutoRefresh`, 15 sn'de bir tam sayfa yenileme) bunun yerini tutuyor, geçici.
- **Faz 4 — Ölçek + cila.** 256 oyuncu (toplu DB yazımı, kilitler, yarış koşulları), yeniden bağlanma,
  offline oyuncu (fallback taktik), cron liveness, gözlemleme.

Her faz kendi başına test edilir (saf motor + orkestrasyon testleri; sabit seed → tekrarlanabilir).

---

## 5. Açık kararlar

1. **✅ Tik tetikleme (Osman, 30.09):** Lazy catch-up yeterli — cron'a şimdilik gerek yok (test
   ölçeğinde hep biri online). Faz 4'te gerekirse eklenir.
2. **Taktik penceresi süresi:** Faz 2'de netleşecek — henüz uygulanmadı (Faz 1 kayıtlı taktikle çalışıyor).
3. **Ölçek/eşleşme:** Faz 1 mevcut `POOL_SIZE`/`FIELD_TARGET` sabitlerini aynen kullanıyor (test
   ölçeği); 256 için Faz 4'te gözden geçirilecek.
4. **✅ Canlı yenileme sıklığı (Osman, 30.09):** İlk sürüm 15 sn (`LiveAutoRefresh`, tam sayfa
   yenileme). Faz 3'te gerçek polling/SSE'ye taşınacak.
5. **✅ Zamanlama (Osman, 30.09): "Hemen değiştir".** Mevcut canlı yol doğrudan B ile değiştirildi,
   paralel sürüm yok. Test aşamasında olduğumuz ve mimari düzeltmenin acil olduğu için (paralel evren
   hatası) bu tercih edildi.

---

## 6. Bu tasarıma kadar (ara durum)

- **✅ Ara düzeltme yapıldı (Osman, `9b335ce`, 29.09):** canlı turnuva seed'i PAYLAŞILAN `tour:${scopeKey}`
  oldu → aynı kapsamdaki herkes AYNI deterministik bracket/sonucu üretir. Acil "paralel evren" tutarsızlığı
  giderildi; **test için yeterli.**
- **Ara düzeltmenin kapsamadığı** (B'nin getireceği): gerçek-zamanlı **taktik senkronu** (herkes kendi
  maçına canlı taktik verir, sunucu tek otorite), 256 ölçeği, offline oyuncu için sunucu-tik, canlı yayın.
- Not: offline/otomatik yol (`autoResolveTournament`) zaten "ilk çözen otorite, diğerleri okur" ile
  tutarlı — B, canlı yola da aynı garantiyi (üstelik gerçek-zamanlı) getirir.
