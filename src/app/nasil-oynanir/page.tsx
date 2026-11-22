import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Nasıl Oynanır? Başlangıç Rehberi · Legends of the Piste",
  description:
    "Legends of the Piste nasıl oynanır: sporcu oluşturma, antrenman planı, turnuvalar, taktik, klasman, milli takım, kariyer ve Denar. Yeni başlayanlar için adım adım rehber.",
};

// Public oyun rehberi (AdSense değerli içerik, kullanıcı 22.11). Girişsiz, crawl edilebilir.
export default function NasilOynanirPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[15px] leading-relaxed sm:px-6">
      <h1 className="font-display text-[30px] font-bold">Nasıl Oynanır?</h1>
      <p className="mt-1 text-[13px] text-steel">Yeni başlayanlar için adım adım başlangıç rehberi</p>

      <p className="mt-6">
        <strong>Legends of the Piste</strong>, metin-tabanlı bir <strong>eskrim kariyer
        simülasyonudur</strong>. 8 yaşında bir sporcu yaratır, yıllar süren kariyerini yönetirsin:
        antrenman, turnuva, gelişim, klasman ve milli takım. Maçlar 3B dövüşle değil, <strong>metinle
        anlatılır</strong> (“A mesafeyi kapattı, B savundu ve karşı tuşu buldu”). Aşağıda temel döngü var.
      </p>

      <Section title="1. Sporcunu oluştur">
        <p>
          Google ile giriş yaptıktan sonra sporcunu kurarsın: <strong>isim</strong>,{" "}
          <strong>silah</strong> (flöre, epe ya da kılıç — farkları için{" "}
          <a href="/eskrim" className="underline">Eskrim Nedir?</a>), <strong>ülke/şehir</strong> (kulübünü
          belirler) ve bir <strong>başlangıç profili</strong> (dengeli, teknik, fiziksel, mental, taktik).
          Herkes <strong>U10</strong> kategorisinde, 8 yaşında başlar.
        </p>
      </Section>

      <Section title="2. “Bugün” ekranı — sporcunu tanı">
        <p>
          Ana ekranda sporcunun kartı bulunur: genel reyting, <strong>kondisyon</strong> (ne kadar dinç),{" "}
          <strong>form/keskinlik</strong> (maç ritmi), 10 eksenli <strong>yetenek radarı</strong> (atak,
          savunma, ayak işi, hız, dayanıklılık, reaksiyon, konsantrasyon, soğukkanlılık, okuma, zamanlama) ve{" "}
          <strong>Denar</strong> bakiyen. Önümüzdeki 7 gün ve yaklaşan turnuvalar da burada görünür.
        </p>
      </Section>

      <Section title="3. Antrenman planı yap">
        <p>
          Haftalık planını kurarsın: her seans <strong>teknik</strong>, <strong>fiziksel</strong>,{" "}
          <strong>mental</strong>, <strong>taktik</strong> ya da <strong>dinlenme</strong> olabilir. Doğru
          antrenman yeteneklerini geliştirir; ama aşırı yüklenmek <strong>yorgunluk</strong> ve{" "}
          <strong>sakatlık</strong> riski getirir — sert seanslar arasında dinlenmek önemlidir. Kulübünün
          tesisi ve antrenörlerin, gelişim hızını etkiler.
        </p>
      </Section>

      <Section title="4. Turnuvalara katıl">
        <p>
          Turnuvalar seviyelere ayrılır: <strong>İl</strong>, <strong>Ulusal (Türkiye)</strong>,{" "}
          <strong>Open</strong> ve uluslararası (Satellite, Grand Prix, Avrupa, Dünya Kupası). Kaydolurken{" "}
          <strong>taktiğini</strong> seçersin (hücum / dengeli / savunma). Turnuva, gerçek eskrimdeki gibi{" "}
          <strong>havuz + eleme</strong> formatında oynanır ve sonuçlar <strong>klasman puanı + tecrübe</strong>{" "}
          getirir. Dereceye girersen <strong>Denar ödülü</strong> de kazanırsın.
        </p>
      </Section>

      <Section title="5. Klasmanda yüksel, milli takıma gir">
        <p>
          Sonuçların seni sıralamada yükseltir: <strong>şehir → ülke → kıta → dünya</strong>. Kategoriler yaşla
          ilerler (U10 → U12 → U14 → U17 → Genç → Büyükler). Ülke klasmanında <strong>ilk 4’e</strong> girersen{" "}
          <strong>milli takıma</strong> çağrılır ve uluslararası turnuvalara katılma hakkı kazanırsın.
        </p>
      </Section>

      <Section title="6. Kariyer kur">
        <p>
          Zamanla bir <strong>kupa vitrini</strong> biriktirirsin: şampiyonluklar, altın/gümüş/bronz madalyalar,
          milli takım rozetleri. <strong>Avrupa Şampiyonluğu, Dünya Kupası ve Olimpiyatlar</strong> kilitli üst
          hedefler olarak seni bekler. Kariyer sayfasında tüm istatistiklerin, zaman çizelgen ve rakipliklerin
          kayıtlıdır.
        </p>
      </Section>

      <Section title="Denar nedir?">
        <p>
          <strong>Denar</strong>, oyunun <strong>oyun-içi parasıdır</strong>. Ekipman yükseltmek gibi şeyler
          için harcanır. Turnuva ödülleriyle kazanılır; dilersen Market’ten <strong>reklam izleyerek</strong>{" "}
          ya da gerçek parayla (güvenli ödeme sağlayıcımız Paddle üzerinden) satın alabilirsin — zorunlu
          değildir, oyun ücretsiz oynanır. Ayrıntı: <a href="/fiyatlandirma" className="underline">Fiyatlandırma</a>.
        </p>
      </Section>

      <Section title="Zaman nasıl işler?">
        <p>
          Oyun, <strong>GMT dünya saatine</strong> göre akar; gün döngüsü ve günlük turnuvalar gerçek zamanda
          ilerler. Böylece sen çevrimdışıyken bile dünya devam eder — çevrimiçi olmadan da kariyerin ilerler.
        </p>
      </Section>

      <p className="mt-7 text-steel [&_a]:text-ink">
        İlgili: <a href="/eskrim" className="underline">Eskrim Nedir?</a> ·{" "}
        <a href="/hakkinda" className="underline">Hakkında</a> ·{" "}
        <a href="/sss" className="underline">Sıkça Sorulan Sorular</a>
      </p>

      <p className="mt-8">
        <a href="/" className="underline">← Ana sayfaya dön ve başla</a>
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-[20px] font-bold">{title}</h2>
      <div className="mt-2 text-steel [&_strong]:text-ink">{children}</div>
    </section>
  );
}
