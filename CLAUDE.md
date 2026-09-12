# CLAUDE.md — Project Engarde

Bu dosya, bu proje üzerinde çalışan Claude Code (ben) için kalıcı kılavuzdur.
Her yeni oturumda önce bunu okurum. Kurallar buraya yazılır, sohbete değil.

---

## 1. Proje Nedir?

**Project Engarde**, eskrim sporunu temel alan, **metin-tabanlı bir kariyer & yönetim
simülasyonudur** (Hattrick / Championship Manager tarzı).

- Oyuncu bir eskrimci yaratır ve **yıllar süren kariyerini** yönetir: antrenman →
  kulüp → turnuva → maç → gelişim → ranking → milli takım → uluslararası kariyer.
- Maçlar **3D dövüş değil**, metinle anlatılır ("A mesafeyi kapattı, B savundu, A tuşu
  buldu"). Ağır oyun motoru (Unity/Unreal) **gerekmez**.
- Tüm hesaplama **sunucu tarafında, olasılık tabanlı** yapılır (oyuncu online olmasa
  bile ilerleyebilir — Hattrick modeli).
- Tam tasarım `docs/gdd/` içinde 26 dokümanda tanımlı. **Kod yazmadan önce ilgili
  Engine'in GDD bölümü okunur.**

**V1 hedefi:** Uçtan uca çalışan bir kariyer döngüsü. Tüm 25 sistem değil.

---

## 2. İşbirliği Kuralları (ÖNEMLİ)

Proje sahibi (kullanıcı) **yazılıma yeni başlıyor** ve deneyimli bir eskrimci/antrenör.
Buna göre davranırım:

- **Türkçe konuşurum.** Teknik terimleri İngilizce bırakırım (commit, migration, prop…)
  ama ilk geçtiğinde bir cümleyle açıklarım.
- **Her adımda ne yaptığımı ve NEDEN yaptığımı** kısaca anlatırım. Sessizce büyük
  değişiklik yapmam.
- Büyük bir işe girmeden önce **planı sade bir dille özetler, onay alırım.**
- Kullanıcının eskrim/oyun tasarımı bilgisi derin, yazılım bilgisi yeni — açıklamaları
  oyun mantığına bağlarım ("bu fonksiyon, GDD'deki pool sıralamasını hesaplıyor").
- Jargon yığmam. Bir kavramı ilk kez kullanırken 1 cümlelik analoji veririm.
- Kullanıcı "wipe/vibe coding" yapmak istiyor: **ben yazarım, o yönlendirir.** Kod
  kalitesi, güvenlik ve güncel pratiklerden ben sorumluyum.

---

## 3. Teknoloji Seçimi ve Gerekçesi

Tek dil (TypeScript) her yerde → yeni başlayan için en düşük zihinsel yük, hataları
erken yakalayan tip güvenliği, GDD'nin kendi önerisiyle uyumlu.

| Katman | Seçim | Neden |
|---|---|---|
| Dil | **TypeScript** | Frontend + backend tek dil; tip güvenliği karmaşık engine'lerde hata önler |
| Framework | **Next.js (App Router)** | UI + sunucu API'si tek projede; web + ileride mobil tarayıcı |
| UI | **React + Tailwind CSS** | Metin-ağırlıklı arayüz için hızlı, sade |
| Veritabanı (geliştirme) | **SQLite** | Ayrı sunucu kurmak gerekmez — yeni başlayan için en kolay |
| Veritabanı (multiplayer fazı) | **PostgreSQL** | GDD'nin hedefi; Prisma sayesinde geçiş neredeyse kodsuz |
| ORM | **Prisma** | Tip-güvenli DB erişimi, kolay migration, şema = kod |
| Test | **Vitest** | Hızlı, TS-yerel, sade |
| Rastgelelik | **Tohumlanabilir (seeded) RNG** | Simülasyonlar tekrar edilebilir olmalı (dengeleme testleri için şart) |

**Karar:** Başlangıçta SQLite ile ilerleriz (sunucu kurmadan). Şema PostgreSQL uyumlu
tasarlanır; multiplayer fazında `.env`'de tek satır değiştirip PostgreSQL'e geçeriz.

> ⚠️ **Önkoşul:** Node.js kurulu değil. Geliştirmeye başlamadan **Node.js LTS**
> kurulmalı (bkz. `README.md`). SQLite Prisma ile geldiği için ayrı DB sunucusu gerekmez.

---

## 4. Mimari — Engine = Modül

GDD'nin **Engine Map** bölümü (`docs/gdd/..._05_Engine_Map.docx`) doğrudan yazılım
mimarimizdir. Temel kurallar (GDD'den, tartışmasız):

1. **Her engine'in TEK bir ana sorumluluğu vardır.** Player kimliği tutar, Skill
   yetenekleri, Combat maçı simüle eder, Ranking sıralamayı hesaplar.
2. **Bir verinin sahibi tek bir engine'dir.** Tournament, Skill değerini *okur* ama asla
   *değiştiremez*. Para → sadece Economy. Ranking puanı → sadece Ranking.
3. **Engine'ler birbirinin iç koduna girmez.** İletişim: istek/olay (event) → sonuç.
   `Tournament → MatchRequest → Combat → MatchResult → Tournament`.
4. **Yasak görevler** (GDD 5.36): Tournament ranking puanı hesaplamaz; Combat bracket
   oluşturmaz; Training para vermez; Economy skill geliştirmez.
5. **Database sadece saklar, hesaplamaz.**

### Klasör yapısı (kurulunca)

```
src/
  engine/           # SAF simülasyon mantığı — I/O yok, DB yok, HTTP yok
    player/         #   her engine kendi klasöründe; sadece veri alır, sonuç döner
    skill/
    training/
    tournament/
    combat/
    ranking/
    probability/    #   tohumlanabilir RNG burada
    ...
    events.ts       #   engine'ler arası olay tipleri (TrainingCompleted, MatchCompleted…)
  db/               # Prisma şeması + kalıcılık ("Database Engine")
  server/           # engine'leri DB'ye bağlayan orkestrasyon (API, günlük döngü)
  app/              # Next.js arayüzü (React ekranları)
scripts/            # başsız (headless) simülasyon koşucuları — dengeleme testleri
tests/              # Vitest testleri
docs/gdd/           # tasarım dokümanları (kaynak-of-truth)
prisma/             # schema.prisma + migration'lar
```

**Neden `src/engine` saf tutulur:** Aynı mantık hem web API'sinde hem de "100 oyuncu ×
20 yıl" başsız dengeleme simülasyonlarında (GDD 4.33) çalışabilsin diye. Bu ayrım ileride
multiplayer sunucusu için de tam olarak gereken şeydir.

### V1 engine öncelik sırası (GDD 5.37 — mimari öncelik, mutlak kodlama sırası değil)

Player → Skill → Trait → Psychology → Coach → Club → Training → Equipment →
Tournament → Combat → Probability → Ranking → Economy → Memory → Database → AI

Bir engine'e başlamadan önce kendisinden önce gelen bağımlılıkları çalışır olmalı.

---

## 5. Çalışma Akışı

1. **Tasarım önce:** İlgili GDD bölümünü oku → ne yapacağını 1 paragrafla özetle → onay al.
2. **Küçük dilimler:** Bir engine'i tek seferde bitirmeye çalışma. Önce veri yapısı →
   temel fonksiyon → test → arayüz.
3. **Her engine "tamamlandı" sayılmadan** (GDD 5.38): tasarım + girdi/çıktı + bağımlılık
   + kod + tekil test + entegrasyon testi geçmeli.
4. **Test yaz:** Engine mantığı saf olduğu için kolay test edilir. Olasılık içeren
   fonksiyonlar sabit tohumla (seed) test edilir → tekrar edilebilir sonuç.
5. **Milestone yedeği (GDD 4.46):** Her ana bölüm bitince git commit + etiket.

### Komutlar (kurulum sonrası eklenecek)
```bash
npm run dev        # geliştirme sunucusu
npm run test       # Vitest testleri
npm run sim        # başsız dengeleme simülasyonu (scripts/)
npx prisma studio  # veritabanını görsel incele
npx prisma migrate dev  # şema değişikliğini uygula
```

---

## 6. Güvenlik Kuralları (her zaman uygulanır)

- **Sırlar asla kodda/commit'te olmaz.** API anahtarları, DB şifreleri → `.env`
  (`.gitignore`'da). `.env` asla commit'lenmez.
- **Tüm kullanıcı girdisi doğrulanır** (sunucu tarafında, sadece arayüzde değil) —
  isim, sayı aralıkları, kategori seçimleri. Zod ile şema doğrulaması kullanılır.
- **SQL injection yok:** Sadece Prisma (parametreli sorgular) kullanılır, ham SQL
  string birleştirme yapılmaz.
- **XSS yok:** React zaten kaçış yapar; `dangerouslySetInnerHTML` kullanılmaz.
- **Simülasyon sunucuda:** Kritik hesaplama (maç sonucu, ranking) asla tarayıcıda
  yapılmaz — multiplayer'da hile önlemenin temeli budur.
- **Bağımlılıklar:** Yeni paket eklemeden önce gerekli mi diye düşünülür; `npm audit`
  düzenli kontrol edilir.
- Commit öncesi `git status` ile ne eklendiğine bakılır; şüpheli/sır içeren dosya
  varsa commit edilmez.

---

## 7. Kod Kalitesi

- Anlamlı isimler; kısa, tek sorumluluklu fonksiyonlar.
- Yorum sadece **NEDEN** için (bir sınır, bir GDD kuralı, şaşırtıcı bir davranış).
  Kodun *ne* yaptığını iyi isimler zaten anlatır.
- Erken soyutlama yok; gereğinden fazla mimari kurulmaz. GDD'nin dediği gibi:
  **önce çalışan temel döngü, sonra derinlik.**
- V1 kapsamı korunur (GDD 4.49): özellik temel kariyer deneyimine katkı sağlıyorsa →
  V1; sağlıyor ama zorunlu değilse → V2; sadece gelecekte → Future.

---

## 8. Referanslar

- Tasarım dokümanları: `docs/gdd/` (26 dosya, `.docx`)
- Okuma: `.docx` dosyaları pandoc/python yoksa unzip edilip `word/document.xml`'den
  metin çıkarılarak okunur.
- MVP özeti: `docs/gdd/Project_Engarde_MVP_Ozet.docx` — en hızlı genel bakış.
- Engine ilişkileri: `Project_Engarde_05_Engine_Map.docx`
- Geliştirme sırası: `Project_Engarde_04_Roadmap.docx`

---

## 9. Durum

- [x] GDD alındı, okundu, `docs/gdd/`'ye çıkarıldı
- [x] Teknoloji seçildi, `CLAUDE.md` hazırlandı
- [x] Git deposu başlatıldı
- [ ] **Node.js LTS kurulumu (kullanıcı yapacak — sıradaki adım)**
- [ ] Next.js + TypeScript + Prisma iskeleti
- [ ] Aşama 3: Player Engine temeli
- [ ] Aşama 4: Oyuncu oluşturma

> Bir adım tamamlandığında bu listeyi güncelle.
