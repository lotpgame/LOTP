# Katkı Kuralları (CONTRIBUTING)

Bu dosya, projeye **dışarıdan katkı veren** geliştiriciler ve onların AI asistanları (Claude Code,
Codex) içindir. Proje sahibinin kendi çalışma kuralları `CLAUDE.md`'dedir; burası onlara **ek**tir,
onları değiştirmez. Çelişki olursa `CLAUDE.md` + proje sahibinin kararı geçerlidir.

---

## 1. Akış: branch → PR → merge → canlı

Proje sahibi kendi oturumlarında doğrudan `master`'a push eder. Dış katkılar **branch + Pull Request**
ile gelir; böylece her değişiklik tek parça, geri alınabilir ve CI'dan geçmiş olur.

1. **Başlamadan:** `git checkout master && git pull` — proje hızlı ilerliyor, eski master'dan başlama.
2. **Branch:** kısa ve konuya göre: `feat/…`, `fix/…`, `docs/…`, `chore/…` (örn. `fix/telefon-girisi`).
3. **Küçük PR:** bir PR = bir konu. `careerService.ts`, `CHANGELOG.md`, `docs/NOTLAR.md` sık değişir;
   PR ne kadar küçükse çakışma o kadar az.
4. **PR açmadan önce:** `git fetch && git rebase origin/master` (veya merge) → çakışma varsa çöz.
5. **Merge:** kontrol listesi (PR şablonu) tamamsa katkıcı merge edebilir (proje sahibinin onayı var).
   Tercih: **squash merge** — `master` geçmişi okunur kalır.
6. **Merge sonrası:** branch hem yerelde hem GitHub'da silinir. Uzun yaşayan branch yok —
   `master` = canlı sürüm, her zaman.

> `master`'a merge = **canlıya çıkış**. CI (`.github/workflows/ci.yml`) lint + test + build'i geçince
> dış katkıcı merge'ünü Vercel Deploy Hook ile yayınlar (secret `VERCEL_DEPLOY_HOOK`); CI kırmızıysa
> yayın olmaz. Merge sonrası GitHub → Actions'ta "deploy" adımının yeşil olduğuna bakılır.
> Önizleme ortamı kullanılmıyor; bu yüzden aşağıdaki "Canlı veri koruma" kuralları zorunludur.

---

## 2. ⭐ Canlı veri koruma — oyuncuların ilerlemesi asla kaybolmaz

Test oyuncuları şu anda gerçek kariyer oynuyor. Yaptığımız her değişiklik **mevcut kariyerlerin
üstüne eklenir**; kimse baştan başlamak zorunda kalmaz.

**Kod değişikliği** (yalnız TS/React) veriye dokunmaz — deploy güvenlidir. Ama yeni kod **eski
kayıtlarla da çalışmalı:**
- Eski satırlarda yeni alan boş/varsayılan olabilir → kod bunu tolere eder.
- JSON/CSV alanlar (`liveTournament`, `lastReport`, `awayReport`, `traits`, `ownedEquipment`,
  `trainingPlan`) eski biçimde de okunabilmeli. Biçim değişirse okuma tarafında **geriye uyumlu
  dönüştürme** yapılır; "sıfırla, yeniden oluştur" değil.
- Bir mekanik değişince mevcut oyuncular için geçiş kodu (backfill) yazılır; dünya sıfırlanmaz.

**Şema değişikliği** (`prisma/schema.prisma`) — canlı DB'ye dokunduğu için ekstra dikkat:
- **Yalnız eklemeli değişiklik:** yeni tablo, yeni alan (`?` opsiyonel veya `@default(...)` ile).
- **Yasak (proje sahibiyle ayrıca konuşulmadan):** alan/tablo silmek, yeniden adlandırmak, tipini
  değiştirmek, opsiyoneli zorunluya çevirmek. Gerekirse iki adımda yapılır: önce yeni alan eklenir
  + kod ikisini de okur, veri taşınır, eski alan çok sonra kaldırılır.
- **Sıra:** önce canlı DB yedeği (Neon panosu → Branches/Restore veya `pg_dump`) → şema değişikliği
  canlı DB'ye uygulanır → sonra kod merge edilir. (Kod önce giderse yeni alanı bulamayıp hata verir.)
- Canlı DB'ye şema şu an `prisma db push` ile uygulanıyor (bkz. `docs/ROADMAP.md` §H, R2).
  `db push` bir değişikliğin **veri sileceğini** söylerse (`--accept-data-loss` isterse) → **DUR**,
  bu bayrak kullanılmaz; değişiklik eklemeli hale getirilir.
- Dünyayı/DB'yi sıfırlama kararı **yalnız proje sahibinindir.**

---

## 3. "Bitti" tanımı (her PR için)

Özellik çalışıyor olması yetmez; **üretime hazır** olmalı:

1. `npm run lint` ve `npm test` yeşil; `npm run build` hatasız.
2. Yeni oyun mantığına test (engine saf olduğu için kolay; olasılıklı fonksiyonlar sabit seed ile).
3. **Sessiz hata yok:** bir işlem başarısız olursa bu görünür olmalı (log/hata mesajı). `catch {}`
   ile hatayı yutmak yok — özellikle toplam/klasman/turnuva sonucu hesaplayan yerlerde.
4. Mevcut kayıtlarla uyum düşünüldü (bkz. §2).
5. `README.md` + `CHANGELOG.md` (`[Unreleased]` altında) güncel — proje kuralı (`CLAUDE.md` §2).
6. **Kalan riskler PR açıklamasında yazılı** — sadece "ne çalışıyor" değil, "ne henüz eksik /
   neye dikkat" de.

---

## 4. Çalışma prensipleri

- **Önce oku, sonra yaz:** ilgili GDD bölümü + `docs/ROADMAP.md` + `docs/NOTLAR.md`. Bir şey zaten
  kısmen varsa sıfırdan yazılmaz, var olan genişletilir.
- **Cerrahi değişiklik:** yalnız görevin gerektirdiği satırlar değişir. Komşu kodu "güzelleştirme",
  format değiştirme yok. Büyük refactor ayrı PR'dır ve önce konuşulur.
- **Sade:** sorunu çözen en az kod. Spekülatif özellik/soyutlama yok.
- **Belirsizlikte sor:** oyun kuralı / eskrim doğruluğu kararları proje sahibinindir (FIE kuralları esas).
- **Dil:** kod tanımlayıcıları İngilizce; kullanıcıya görünen metin, commit mesajları ve dokümanlar
  Türkçe (tam Türkçe karakterlerle: ç ğ ı ö ş ü).

---

## 5. Güvenlik ve kişisel veri

- **Sırlar asla commit'lenmez:** `.env`, bağlantı adresleri, API anahtarları yalnız `.env` ve Vercel/
  Neon panosunda. Commit öncesi `git status` + `git diff --staged` kontrolü.
- **Kişisel veri (KVKK/GDPR):** telefon numarası, e-posta, IP kişisel veridir. Yalnız gerektiği kadar
  saklanır; log'a, geri bildirim kaydına, test çıktısına yazılmaz.
- **Gerçek kişilere test yok:** SMS/e-posta gibi dış gönderimler geliştirmede gerçek numara/adrese
  gönderilmez (dry-run/sahte sağlayıcı). Canlı DB'de "deneme için" veri elle değiştirilmez.
- Tüm kullanıcı girdisi sunucuda Zod ile doğrulanır; ham SQL yok (yalnız Prisma).

---

## 6. Arka plan işleri ve izleme

Zamanlanmış işler (ör. M12 otomatik dünya tiki / Vercel Cron) **baştan izlemeli** kurulur: iş çalıştı
mı, sonuç üretti mi? Sessizce durursa kimse fark etmez — başarısızlık proje sahibine ulaşmalı
(en az: görünür hata + son başarılı çalışma zamanı kontrolü).
