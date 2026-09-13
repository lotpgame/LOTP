# Değişiklik Notları (Playtest Geri Bildirimi)

Oyun sahibinin (eskrim uzmanı) oynarken bulduğu **değişmesi gereken** şeyler burada tutulur.
Sohbette bir not verildiğinde bu dosyaya eklenir; hallolunca **✅ Yapıldı** bölümüne taşınır.

- Büyük derinlik/özellik maddeleri `docs/ROADMAP.md` §G backlog'da; bu dosya ayar/denge/UX/kural
  düzeltmeleri içindir.
- Kategoriler: `denge`, `kural` (eskrim doğruluğu), `ux`, `hata`, `içerik`, `özellik`.

## Durum: Açık

| # | Tarih | Kategori | Not | Nasıl uygulanır / durum |
|---|-------|----------|-----|-------------------------|
| 1 | 2026-09-13 | özellik | Oyuncu oluşturmada **ülke ve il IP'ye göre otomatik** atansın | Geo-IP dış servis + gizlilik ister; ayrıca çok-ülkeli dünya V2. Şimdilik TR sabit. **V2/Future** (ROADMAP §B). |
| 3 | 2026-09-13 | özellik | Profilde **boy/kilo/kol-ayak uzunluğu** yok | ROADMAP §G backlog'da (fiziksel yapı → combat mesafe/erişim). Yaş/büyüme (M5) + combat derinliğiyle bağlanacak. **Backlog.** |
| 7 | 2026-09-13 | özellik | **Canlı maç** izleme (şu an sadece yazılı özet) | Combat log zaten kayıtlı; canlı = satırların adım adım/animasyonlu gösterimi (client bileşen). Orta iş — ayrı görev. GDD 18.54/18.70. **Planlanacak.** |
| 8 | 2026-09-13 | ? | "…birde zaman" — mesaj yarım kaldı | Kullanıcıdan netleştirme bekleniyor. |

## Durum: ✅ Yapıldı

| # | Tarih | Kategori | Not | Çözüm |
|---|-------|----------|-----|-------|
| 2 | 2026-09-13 | denge | Kariyer varsayılan **8 yaş** başlasın (oyun 2026'da) | Oluşturma formunda doğum tarihi varsayılanı 2018-01-01 (→ 8 yaş); GAME_START zaten 2026. Farklı yaş hâlâ seçilebilir. |
| 4 | 2026-09-13 | hata | Seçim kutularında **beyaz-üstüne-beyaz** okunmaz metin | `globals.css`'e `color-scheme: light dark` + `select option` tema renkleri eklendi. |
| 5 | 2026-09-13 | ux | Profile **görsel** (resim) | Panele baş harfli avatar (yeşil daire) eklendi — asset gerektirmeyen hızlı görsel. Gerçek resim/portre sonra. |
| 6 | 2026-09-13 | kural | "sahalardan" → **"pistlerden"** uzak | Sakatlık metni düzeltildi (eskrim terimi: pist). |
