# Değişiklik Notları (Playtest Geri Bildirimi)

Oyun sahibinin (eskrim uzmanı) oynarken bulduğu **değişmesi gereken** şeyler burada tutulur.
Sohbette bir not verildiğinde bu dosyaya eklenir; hallolunca **✅ Yapıldı** bölümüne taşınır.

- Büyük derinlik/özellik maddeleri `docs/ROADMAP.md` §G backlog'da; bu dosya ayar/denge/UX/kural
  düzeltmeleri içindir.
- Kategoriler: `denge`, `kural` (eskrim doğruluğu), `ux`, `hata`, `içerik`, `özellik`.

## Durum: Açık

| # | Tarih | Kategori | Not | Nasıl uygulanır / durum |
|---|-------|----------|-----|-------------------------|
| 3 | 2026-09-13 | özellik | **Fiziksel yapı: boy, (kilo), kol erişimi, bacak uzunluğu** — V1'de YOK; oyunu +/− etkilemeli | **SIRADAKİ.** Oluşturmada üret (yaş+rastgele), profilde göster; combat'a bağla — kol erişimi (Epe'de mesafe/isabet avantajı), boy/bacak (hamle mesafesi/hız), ağırlık (patlayıcılık↑ dayanıklılık/çeviklik↓ dengesi). Boy gençlerde yaşla artar. |
| 1b | 2026-09-13 | özellik | Şehrin **IP'den otomatik** atanması + gerçek **şehir-kapsamlı İl Şampiyonası** (AI'lara şehir) | V2 (geo-IP dış servis/gizlilik + çok bölgeli dünya). Manuel şehir seçimi V1'de yapıldı (#1). |
| 7 | 2026-09-13 | özellik | **Canlı maç izleme** — CM 00/01 / Hattrick tarzı satır satır akan metin anlatım | **Yapılacak:** turnuva/maç sonucu sayfasında maçı "canlı" modda oynat — combat log satırları gecikmeyle tek tek belirir, skor güncellenir (client bileşen; log zaten kayıtlı). Hız seçeneği (Normal/Hızlı). GDD 18.53–18.54, 18.70. |
| 8 | 2026-09-13 | ? | "…birde zaman" — mesaj yarım kaldı | Kullanıcıdan netleştirme bekleniyor. |

## Durum: ✅ Yapıldı

| # | Tarih | Kategori | Not | Çözüm |
|---|-------|----------|-----|-------|
| 2 | 2026-09-13 | denge | Kariyer varsayılan **8 yaş** başlasın (oyun 2026'da) | Oluşturma formunda doğum tarihi varsayılanı 2018-01-01 (→ 8 yaş); GAME_START zaten 2026. Farklı yaş hâlâ seçilebilir. |
| 4 | 2026-09-13 | hata | Seçim kutularında **beyaz-üstüne-beyaz** okunmaz metin | `globals.css`'e `color-scheme: light dark` + `select option` tema renkleri eklendi. |
| 5 | 2026-09-13 | ux | Profile **görsel** (resim) | Panele baş harfli avatar (yeşil daire) eklendi — asset gerektirmeyen hızlı görsel. Gerçek resim/portre sonra. |
| 6 | 2026-09-13 | kural | "sahalardan" → **"pistlerden"** uzak | Sakatlık metni düzeltildi (eskrim terimi: pist). |
| 1 | 2026-09-13 | özellik | Oluşturmada **şehir seçimi** → kulüp o şehirde | Ülke (Türkiye) + **Şehir** açılır listesi (12 şehir) eklendi; seçilen şehir kulübü belirliyor. IP-otomatik + şehir-kapsamlı İl → #1b (V2). |
