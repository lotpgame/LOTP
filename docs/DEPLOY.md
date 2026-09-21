# DEPLOY — Project Engarde'ı yayına alma yol haritası

> Amaç: ortak dünyayı **gerçek eskrimcilerle** çevrimiçi oynanabilir hale getirmek.
> Strateji: **minimal ilk yayın** — az engelle çalışan bir sürümü arkadaşlarınla test et,
> sonra sağlamlaştır. (Google OAuth + IP-ülke kilidi ilk yayın için ŞART DEĞİL; sonraya.)

Bu belge sade tutulur: **[SENDE]** = senin yapman gereken (hesap/karar), **[BENDE]** = kodu ben yaparım.

---

## Seçilen yığın (yeni başlayan için en kolay, ücretsiz başlangıç)

| Katman | Seçim | Neden |
|---|---|---|
| Hosting | **Vercel** | Next.js'in yapımcısı; `git push` → otomatik yayın; ücretsiz kademe yeter |
| Veritabanı | **Neon** (PostgreSQL) | Ücretsiz, sunucusuz Postgres; Vercel + Prisma ile sorunsuz |
| Giriş (ilk sürüm) | **mevcut telefon/çerez** | Zaten çalışıyor; Google OAuth sonraki adım |
| Dünya saati | **mevcut (gerçek-zaman)** | Cron gerekmez; turnuvalar "ilk giren çözer" ile ilerler |

> Not: Vercel "sunucusuz" (serverless). Bizim dünya saatimiz zamanın saf fonksiyonu olduğu için
> bu sorun değil. 7/24 otomatik "dünya tiki" (turnuvaları kimse girmese de robotun çözmesi)
> ileride Vercel Cron ile eklenir (M12) — ilk yayın için gerekli değil.

---

## Aşama D1 — PostgreSQL'e geçiş (kod) 🎯 önce bu

- **[SENDE]** Neon hesabı aç (neon.tech, ücretsiz), bir proje + veritabanı oluştur,
  **connection string**'i (postgres://... şeklinde) kopyala ve bana ver.
- **[BENDE]** Prisma'yı Postgres'e ayarla: driver adapter (`@prisma/adapter-pg`),
  datasource sağlayıcı, şemayı Postgres için migrate et (şema zaten Postgres-uyumlu tasarlandı).
  Yerelde SQLite ile geliştirmeye devam edebiliriz; `.env`'deki tek satır Postgres'e geçirir.
- **[BENDE]** Doğrulama: Neon'a bağlanıp şema + birkaç kayıtla test.
- **Bitti:** uygulama Postgres ile çalışıyor.

## Aşama D2 — Vercel'e ilk yayın

- **[SENDE]** Projeyi GitHub'a it (özel repo yeter) + Vercel hesabı aç, repoyu bağla.
- **[SENDE]** Vercel proje ayarlarına **ortam değişkenlerini** gir (ben tam listeyi vereceğim):
  `DATABASE_URL` (Neon), `WORLD_MS_PER_DAY` (üretimde 86400000 = 1 gerçek gün), `WORLD_EPOCH_MS`.
- **[BENDE]** Build ayarları + Prisma generate'in Vercel'de çalışması + prod smoke testleri.
- **Bitti:** `https://...vercel.app` adresinden oyun açılıyor; arkadaşların karakter yaratabiliyor.

## Aşama D3 — İlk gerçek test (arkadaşlar)

- **[SENDE]** 3–5 eskrimci arkadaşını davet et; herkes karakter yaratsın (aynı şehir/kategori →
  aynı İl turnuvasında buluşurlar), telefonla giriş yapıp kariyerlerini kalıcılaştırsın.
- **[BENDE]** Geri bildirime göre düzeltmeler; ortak turnuvaların gerçek kullanıcılarla çalıştığını doğrula.
- **Bitti:** iki gerçek insan gerçekten aynı turnuvada karşılaşıp ortak klasmanda görünüyor. 🎯

---

## Sonraki sağlamlaştırma (ilk testten sonra)

- **Google OAuth girişi** + **ülkeyi IP'den kilitleme** (Almanya IP → Türkiye karakteri açılamaz).
  Gerektirir: **[SENDE]** Google Cloud'da OAuth client (ücretsiz) + **[BENDE]** kod entegrasyonu.
- **Daha çok ülke/şehir** → dünya gerçekten global olsun.
- **M12 — otomatik dünya tiki** (Vercel Cron): turnuvalar kimse girmese de zamanında çözülür;
  yedek/izleme; eşzamanlı iki-online canlı senkron.

---

## Güvenlik hatırlatmaları (deploy)

- **Sırlar `.env`'de, asla commit'te değil.** `DATABASE_URL` yalnız Vercel/Neon panosunda.
- Kritik hesap (maç/ranking) zaten **sunucuda** — hile önlemenin temeli korunur.
- İlk yayın "arkadaş testi" ölçeğinde; herkese açık duyuru öncesi moderasyon/oran-sınırlama (M12).

---

## Şu anki durum

- [x] **D1 — Postgres'e geçiş** ✅ (2026-09-21): Neon DB açıldı; şema `provider=postgresql` + `@prisma/adapter-pg`;
      `client.ts` URL şemasına göre sürücü seçer (postgres→pg, file→sqlite) + işlem zaman aşımı 30 sn (çok-sorgulu
      kariyer/turnuva işlemleri uzak Postgres'te 5 sn'yi aşıyordu). `prisma db push` ile şema Neon'a yüklendi.
      Yerelde uçtan uca doğrulandı: kariyer oluştur + gün ilerleme + turnuva çözümü, sıfır hata.
      NOT: yerel `.env`'de DOĞRUDAN (pooler'sız) URL var; Vercel'de POOLED URL kullanılacak.
- [ ] D2 — Vercel'e yayın  ← **sıradaki** ([SENDE] GitHub repo + Vercel hesabı; env: DATABASE_URL(pooled) + WORLD_*)
- [ ] D3 — Arkadaşlarla ilk test
