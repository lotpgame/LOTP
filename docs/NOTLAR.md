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
| 8 | 2026-09-13 | ux/özellik | **Zaman akışı "Next" düğmesi** (CM tarzı): zamanı ilerlet, **önemli olayda dur** (turnuva haftası → "Katılıyor musun?"). Şu an akış kafa karıştırıcı: "Haftayı Tamamla" antrenman haftası, turnuvaya girip girmediği belirsiz. | **SIRADAKİ (akış tasarımı).** Birleşik ilerlet: antrenman planı seç → ilerlet; turnuva haftası gelince Katıl/Geç sor. GDD 6 (Daily/Weekly Loop) + 17.20 (Katıl butonu). Öneri hazırlanacak. |
| 9 | 2026-09-13 | özellik | **Fotoğraf → karikatür/çizgi karakter avatar + "7 yaşındaki hali"** | **AĞIR — V2/Future.** AI görüntü üretimi (yüz stilizasyonu + yaş dönüştürme) + dış servis + **gizlilik** (yüz fotoğrafı, çocuk yaşa dönüşüm). V1 hafif alternatif: prosedürel SVG avatar veya hazır çizim seti (yerel, AI yok). |
| 10 | 2026-09-13 | kural/denge | **Haftalık takvim/program**: her hafta İl çıkıyor; kullanıcının tasarladığı **haftalık program** uygulanmalı (hangi gün/hafta hangi turnuva) | GDD 17.7: Salı Open, Perşembe İl, Pazar Türkiye (2 haftada bir), uluslararası özel haftalar. Mevcut: İl+Open her hafta, Türkiye çift hafta (season.ts). Kullanıcının GDD'deki gün-bazlı programına yaklaştırılacak; #8 akışıyla birlikte ele alınacak. |

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
