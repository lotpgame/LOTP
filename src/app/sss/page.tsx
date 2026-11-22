import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular (SSS) · Legends of the Piste",
  description:
    "Legends of the Piste hakkında sık sorulan sorular: oyun ücretsiz mi, nasıl giriş yapılır, Denar nedir, hangi diller desteklenir, telefonda oynanır mı, eskrim bilmek gerekir mi?",
};

// Public SSS (AdSense değerli içerik, kullanıcı 22.11). Girişsiz, crawl edilebilir.
export default function SssPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[15px] leading-relaxed sm:px-6">
      <h1 className="font-display text-[30px] font-bold">Sıkça Sorulan Sorular</h1>
      <p className="mt-1 text-[13px] text-steel">Legends of the Piste hakkında merak edilenler</p>

      <QA q="Oyun ücretsiz mi?">
        Evet. <strong>Legends of the Piste ücretsiz oynanır.</strong> İstersen oyunu hızlandırmak için
        oyun-içi para (<strong>Denar</strong>) satın alabilirsin, ama bu zorunlu değildir.
      </QA>

      <QA q="Nasıl giriş yapılır?">
        <strong>Google ile tek dokunuşta.</strong> Şifre oluşturman gerekmez; giriş Google üzerinden güvenle
        yapılır. Biz yalnızca hesabını tanımak için e-posta adresini alırız (bkz.{" "}
        <a href="/gizlilik" className="underline">Gizlilik Politikası</a>).
      </QA>

      <QA q="Eskrim bilmem gerekir mi?">
        Hayır. Oyun temel kavramları (silahlar, avantaj kuralı, turnuva formatı) yol boyunca öğretir. Yine de
        merak edersen <a href="/eskrim" className="underline">Eskrim Nedir?</a> sayfası sporu kısaca anlatır.
      </QA>

      <QA q="Denar nedir, neye yarar?">
        <strong>Denar</strong>, oyunun oyun-içi parasıdır; ekipman yükseltmek gibi şeyler için harcanır.
        Turnuva ödülleriyle kazanılır, reklam izleyerek toplanabilir ya da gerçek parayla satın alınabilir.
        Oyun dışında bir değeri yoktur, paraya çevrilemez. Ayrıntı:{" "}
        <a href="/fiyatlandirma" className="underline">Fiyatlandırma</a>.
      </QA>

      <QA q="Satın alma güvenli mi? Kart bilgim nereye gidiyor?">
        Ödemeler, kayıtlı satıcımız <strong>Paddle</strong> üzerinden işlenir; kart bilgini biz görmeyiz ve
        saklamayız. Satın alma akışında küçük yaştaki oyuncular için bir <strong>yetişkin onayı</strong> adımı
        vardır. İade koşulları: <a href="/iade" className="underline">İade Politikası</a>.
      </QA>

      <QA q="Telefonda oynanır mı?">
        Evet. Oyun bir <strong>PWA</strong>’dır; telefon tarayıcısında açılır ve “ana ekrana ekle” ile uygulama
        gibi çalışır. Ayrı bir mağaza indirmesi gerekmez. Oyun-içi ekranlar yatay (landscape) tasarlanmıştır.
      </QA>

      <QA q="Hangi diller destekleniyor?">
        Şu an <strong>9 dil</strong>: Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Rusça,
        Portekizce ve Çince. Dili Ayarlar’dan değiştirebilirsin.
      </QA>

      <QA q="Çevrimdışıyken ne olur?">
        Dünya <strong>GMT gerçek zamanında</strong> akmaya devam eder; turnuvalar otomatik oynanır. Döndüğünde
        “sen yokken neler oldu” özetini görürsün. Yani kariyerin, sen çevrimiçi olmasan da ilerler.
      </QA>

      <QA q="Verilerim ve kariyerim güvende mi?">
        Oyun verisi korunur ve <strong>silinmez</strong> (yalnız eklemeli gelişim). Hesabının silinmesini
        istersen aşağıdaki e-postadan ulaşman yeterli. Gizlilik:{" "}
        <a href="/gizlilik" className="underline">Gizlilik Politikası</a>.
      </QA>

      <QA q="Bir hata buldum / öneride bulunmak istiyorum">
        Çok seviniriz! Oyun içindeki <strong>“Bildir”</strong> butonunu kullanabilir ya da{" "}
        <a href="mailto:lotpgame@gmail.com" className="underline">lotpgame@gmail.com</a> adresine yazabilirsin.
      </QA>

      <p className="mt-9">
        <a href="/" className="underline">← Ana sayfaya dön</a>
      </p>
    </main>
  );
}

function QA({ q, children }: { q: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-[18px] font-bold">{q}</h2>
      <p className="mt-1.5 text-steel [&_strong]:text-ink [&_a]:text-ink">{children}</p>
    </section>
  );
}
