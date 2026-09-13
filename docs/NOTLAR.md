# Değişiklik Notları (Playtest Geri Bildirimi)

Oyun sahibinin (eskrim uzmanı) oynarken bulduğu **değişmesi gereken** şeyler burada tutulur.
Sohbette bir not verildiğinde bu dosyaya eklenir; hallolunca **✅ Yapıldı** bölümüne taşınır.

- Büyük derinlik/özellik maddeleri `docs/ROADMAP.md` §G backlog'da; bu dosya ayar/denge/UX/kural
  düzeltmeleri içindir.
- Kategoriler: `denge`, `kural` (eskrim doğruluğu), `ux`, `hata`, `içerik`, `özellik`.

## Durum: Açık

| # | Tarih | Kategori | Not | Nasıl uygulanır / durum |
|---|-------|----------|-----|-------------------------|
| 1b | 2026-09-13 | özellik | Şehrin **IP'den otomatik** atanması + gerçek **şehir-kapsamlı İl Şampiyonası** (AI'lara şehir) | V2 (geo-IP dış servis/gizlilik + çok bölgeli dünya). Manuel şehir seçimi V1'de yapıldı (#1). |
| 3b | 2026-09-13 | denge | Pro yıllarda **standart kiloya yakınsama** (milli/olimpik standart) | V2/Future — yaşla vücut standarda çeker. |
| 9 | 2026-09-13 | özellik | **Fotoğraf → karikatür/çizgi karakter avatar + "7 yaşındaki hali"** | **AĞIR — V2/Future.** AI görüntü üretimi (yüz stilizasyonu + yaş dönüştürme) + dış servis + **gizlilik** (yüz fotoğrafı, çocuk yaşa dönüşüm). V1 hafif alternatif: prosedürel SVG avatar veya hazır çizim seti (yerel, AI yok). |
## Durum: ✅ Yapıldı

| # | Tarih | Kategori | Not | Çözüm |
|---|-------|----------|-----|-------|
| 2 | 2026-09-13 | denge | Kariyer varsayılan **8 yaş** başlasın (oyun 2026'da) | Oluşturma formunda doğum tarihi varsayılanı 2018-01-01 (→ 8 yaş); GAME_START zaten 2026. Farklı yaş hâlâ seçilebilir. |
| 4 | 2026-09-13 | hata | Seçim kutularında **beyaz-üstüne-beyaz** okunmaz metin | `globals.css`'e `color-scheme: light dark` + `select option` tema renkleri eklendi. |
| 5 | 2026-09-13 | ux | Profile **görsel** (resim) | Panele baş harfli avatar (yeşil daire) eklendi — asset gerektirmeyen hızlı görsel. Gerçek resim/portre sonra. |
| 6 | 2026-09-13 | kural | "sahalardan" → **"pistlerden"** uzak | Sakatlık metni düzeltildi (eskrim terimi: pist). |
| 7 | 2026-09-13 | özellik | **Canlı maç** (CM/Hattrick tarzı) + turnuva günü: havuz sonra eleme maçlarını izle | `CanliMac` client bileşeni: satırlar gecikmeyle akar, spoiler'sız (Canlı İzle/Sonucu Gör/Hızlı/Atla/Tekrar). Sonuç sayfasında "Senin Maçların" = havuz + eleme maçların sırayla, canlı. |
| 1 | 2026-09-13 | özellik | Oluşturmada **şehir seçimi** → kulüp o şehirde | Ülke (Türkiye) + **Şehir** açılır listesi (12 şehir) eklendi; seçilen şehir kulübü belirliyor. IP-otomatik + şehir-kapsamlı İl → #1b (V2). |
| 3 | 2026-09-13 | özellik | **Fiziksel yapı** (boy/kulaç/bacak/kilo/el) | `physique.ts`: yaşa göre büyüyen ölçüler; combat'ta **kulaç erişimi** (Epe>Flöre>Kılıç) + bacak/yapı + **solak** (yalnız U10–U12, çok küçük); ağırlık **hız gelişimini** etkiler, güç combat'a. Profilde "Fizik" kartı. Pro standart kilo → #3b (V2). |
| 8 | 2026-09-13 | ux/özellik | **Kayıt → bekle → oyna akışı** + "Haftayı İlerle" (CM "Next") | "Katıl" artık kaydeder (anında sonuç düşürmez) ve **tarih/hafta** gösterir; panelde **"Yaklaşan Turnuvalar"** (quarter takvimi). Tek **"Haftayı İlerle"** düğmesi: kayıtlı turnuvanın haftası gelince turnuva ekranına götürür, yoksa antrenmanı uygular. Kayıt iptal edilebilir. `GameState.pendingLevel/pendingWeekIndex` (migration `registration`). Online: sunucu saati oynatır — kayıt çekirdek. |
| — | 2026-09-13 | ux/kural | **"Havuz" → "Pul"** terimi; **"Güç" → "Maç gücü"**; pul→sıralama→eleme sırası + **bay (bye)** açıklaması | Kullanıcı-görünür metinler ve maç turu etiketi "Pul"; maç anlatımı "Maç gücü" (overall değil, o maça özel). Turnuva ekranı: 1) Pul → 2) Pul sonucu (kaçıncı) → 3) Eleme; üst seed bay geçince açıklama. |
| 11 | 2026-09-13 | özellik | **Maç taktiği** (ofansif/dengeli/defansif) — **her maça özel** | `combat/tactics.ts` (GDD 18.22–25): taktik **iki yoldan** etkiler — (1) effective strength'e küçük "Taktik" modifier'ı (kendi + rakip skill'leri + Agresif/Soğukkanlı trait sinerjisi; ±3.5 sınırlı), (2) tuş-başı **kaos** (ofansif sürpriz↑, defansif salınım↓). Taktik canlı turnuvada **her maç öncesi** seçilir (kariyer geneli değil); AI kendi trait'ine göre stil seçer. BALANCED nötr (RNG bozulmaz). +10 test. |
| 14 | 2026-09-13 | ux | **Sabit "Haftayı İlerle" çubuğu** (sayfalar arası değişmez) | Buton alt sabit çubuğa taşındı; antrenman planı Antrenman sayfasından **kaydedilir** (`GameState.trainingPlan`), çubuk bu planla ilerletir. Sakatken "Dinlen", turnuva haftası "Turnuvaya Git" olur. (Online'da zaman otomatik akacak; çubuk yalnız tek-oyuncu — o yüzden sayfadan bağımsız.) |
| 15 | 2026-09-13 | ux | **Turnuva bitiş: 🏠 + klasman** | Bitişte sonuç ekranı: kaçıncı oldun + **kazanılan ranking puanı** + **klasman (Quarter Ranking) sıran**, sonra **🏠 Eve Dön**. |
| 10 | 2026-09-13 | kural/denge | **Gün-bazlı zaman + takvim** (kullanıcı q1-gunluk.xlsx) | Zaman birimi hafta→**gün**. Q=1 yıl, 12 ay (h1–h12), her ay 7 günlük sabit program: Salı İl, Perşembe Türkiye, Cmt Open (her ay); Pzt/Çrş/Cuma/Pazar antrenman; uluslararası yılda 1 (h4/6/8/10). Aynı güne 2 turnuva yok. Kayıt→**İlerle/Katıl/Geç**. `season.ts` gün-bazlı + `GameState.dayIndex` (migration `day_model`). |
| 16 | 2026-09-13 | özellik | **Klasman sekmesi** (kategori sıralaması) | Ana menüye 📊 Klasman: kategori sıralaması + milli takım (ilk 4) + uluslararası (ilk 16) durumu. GDD 19: V1'de tek klasman kategori; dünya/ülke ranking'i V2 (notu eklendi). |
| 13 | 2026-09-13 | ux | **Mobil öncelikli arayüz**: gizli/açılır menü + sayfalara bölme | Üstte oyuncu adı + avatar; altında "☰" açılır menü: **Profil / Antrenman / Turnuvalar / Kulüp / Ekipman / Geçmiş** (`app/kariyer/layout.tsx` + `CareerNav`). Profil = oyuncu özellikleri (özet + fizik + psikoloji + yetenekler); Kulüp ve Ekipman ayrı sayfalar (Ekipman'da seviye göstergesi + "🛒 Mağaza yakında"); Antrenman = plan + Haftayı İlerle; Turnuvalar = kayıt + Quarter Ranking. Mobil boşluk/başlık cilası (px-4, sticky başlık, tam-genişlik butonlar). |
| 12 | 2026-09-13 | özellik | **Canlı turnuva** — gerçek zamanlı, maç-maç, sıralı akış | `careerService` canlı orkestrasyon + `app/turnuva/canli`: pul maçları **sırayla** açılır (1 aktif, gerisi kilitli), her maçın **kendi taktiği**, maç **canlı** akar; pul bitince sıralama + tablolar; **eleme tur tur** (çeyrek→yarı→final), bay açıklaması. Turnuva-içi **gerçekçi saat** (14:00; pul 2 dk, eleme 5 dk); **kariyer saati durur**, turnuva bitince ilerler. `GameState.liveTournament` blob (migration `live_tournament`). Multiplayer'a hazır. Fark edilen "tüm maçlar aynı anda izlenebiliyor" hatası bu sistemle çözüldü. |
