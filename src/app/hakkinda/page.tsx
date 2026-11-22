import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hakkında · Legends of the Piste",
  description:
    "Legends of the Piste nedir: eskrim sporunu temel alan, tarayıcıda oynanan bir metin-tabanlı kariyer simülasyonu. Vizyonu, kimler için olduğu ve nasıl çalıştığı.",
};

// Public tanıtım sayfası (AdSense değerli içerik, kullanıcı 22.11). Girişsiz, crawl edilebilir.
export default function HakkindaPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[15px] leading-relaxed sm:px-6">
      <h1 className="font-display text-[30px] font-bold">Hakkında</h1>
      <p className="mt-1 text-[13px] text-steel">Legends of the Piste nedir ve neyi amaçlar</p>

      <p className="mt-6">
        <strong>Legends of the Piste</strong>, <strong>eskrim</strong> sporunu temel alan, tarayıcıda oynanan
        bir <strong>metin-tabanlı kariyer ve yönetim simülasyonudur</strong>. Oyuncu kendi eskrimcisini yaratır
        ve yıllar süren kariyerini yönetir: antrenmandan turnuvalara, kulüpten milli takıma, ilk dersten
        olimpiyat hayaline kadar.
      </p>

      <Section title="Fikir">
        <p>
          Futbol ve diğer sporların derin yönetim oyunları var; <strong>eskrimin yoktu</strong>. Bu oyun o
          boşluğu doldurmak için, bu sporu yakından bilen biri tarafından tasarlandı. Maçlar ağır bir 3B motorla
          değil, <strong>metinle</strong> anlatılır — tıpkı bir yorumcunun anlatması gibi: mesafe, hamle,
          savunma, karşı tuş. Hesaplamalar <strong>sunucu tarafında, olasılık temelli</strong> yapılır; bu da
          sen çevrimdışıyken bile dünyanın ilerlemesini sağlar.
        </p>
      </Section>

      <Section title="Kimler için?">
        <ul className="ml-5 mt-2 list-disc space-y-1.5">
          <li><strong>Eskrimciler ve antrenörler</strong> — sporun gerçek mantığını (silahlar, avantaj kuralı, havuz/eleme) tanıyanlar için tatmin edici bir derinlik.</li>
          <li><strong>Gençler ve yeni başlayanlar</strong> — eskrim bilmeyen biri de oynayabilir; oyun temel kavramları yol boyunca öğretir.</li>
          <li><strong>Yönetim/simülasyon oyunu sevenler</strong> — uzun soluklu kariyer, gelişim ve sıralama tırmanışı arayanlar.</li>
        </ul>
      </Section>

      <Section title="Nasıl çalışır?">
        <p>
          Oyun bir <strong>PWA</strong>’dır (Progressive Web App): tarayıcıda açılır, istersen “ana ekrana
          ekle” ile uygulama gibi çalışır — ayrı bir mağaza indirmesi gerekmez. Telefon ve bilgisayarda
          oynanır, <strong>9 dili</strong> destekler. Giriş <strong>Google</strong> ile tek dokunuşta yapılır.
          Oynamak <strong>ücretsizdir</strong>; isteğe bağlı oyun-içi para (Denar) vardır.
        </p>
      </Section>

      <Section title="Sorumlu tasarım">
        <p>
          Oyun genç kitleye de hitap eder. Bu yüzden satın alma akışında <strong>yetişkin onayı</strong> adımı
          vardır ve verilerinizi reklam hedefleme için kendimiz kullanmayız (ayrıntı{" "}
          <a href="/gizlilik" className="underline">Gizlilik Politikası</a>’nda). Oyun verisi korunur, silinmez
          (yalnız eklemeli gelişim).
        </p>
      </Section>

      <Section title="Daha fazlası">
        <p>
          <a href="/eskrim" className="underline">Eskrim Nedir?</a> ·{" "}
          <a href="/nasil-oynanir" className="underline">Nasıl Oynanır?</a> ·{" "}
          <a href="/sss" className="underline">Sıkça Sorulan Sorular</a> ·{" "}
          <a href="/fiyatlandirma" className="underline">Fiyatlandırma</a>
          <br />
          İletişim: <a href="mailto:lotpgame@gmail.com" className="underline">lotpgame@gmail.com</a>
        </p>
      </Section>

      <p className="mt-9">
        <a href="/" className="underline">← Ana sayfaya dön</a>
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
