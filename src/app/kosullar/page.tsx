import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kullanım Koşulları · Legends of the Piste",
  description: "Legends of the Piste kullanım koşulları — hizmet, hesap, Denar (oyun-içi para) ve satın alma şartları.",
};

// Paddle doğrulaması + tüketici koruması için gereken genel kullanım koşulları (kullanıcı 20.11).
// Girişsiz erişilir. Denar = oyun-içi, paraya çevrilemeyen sanal para (tek yönlü lisans).
export default function KosullarPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[15px] leading-relaxed sm:px-6">
      <h1 className="font-display text-[30px] font-bold">Kullanım Koşulları</h1>
      <p className="mt-1 text-[13px] text-steel">Son güncelleme: 20 Kasım 2026</p>

      <p className="mt-6">
        <strong>Legends of the Piste</strong> (“oyun”, “biz”, “hizmet”), eskrim temalı metin-tabanlı bir kariyer
        simülasyonudur ve <strong>https://www.lotpgame.com</strong> adresinden sunulur. Oyunu kullanarak bu
        koşulları kabul etmiş olursun. Kabul etmiyorsan hizmeti kullanma.
      </p>

      <Section title="Hesap">
        <p>
          Oyuna Google ile giriş yaparak bir hesap oluşturursun. Hesabının güvenliğinden sen sorumlusun.
          Hesabını başkasına devredemez, başkası adına kullanamazsın. Kuralları ihlal eden hesapları
          kısıtlayabilir veya kapatabiliriz.
        </p>
      </Section>

      <Section title="Denar — oyun-içi para">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Denar</strong>, yalnızca oyun içinde kullanılan <strong>sanal bir birimdir</strong> (örn.
            ekipman yükseltme). Gerçek bir para birimi veya ödeme aracı değildir.
          </li>
          <li>
            Denar <strong>paraya çevrilemez, nakde dönüştürülemez, başka oyunculara veya üçüncü kişilere
            devredilemez/satılamaz</strong> ve oyun dışında hiçbir değeri yoktur.
          </li>
          <li>
            Satın alınan Denar, hesabını kullanman için verilen <strong>sınırlı, kişisel, devredilemez bir
            kullanım hakkıdır</strong> (lisans) — sahiplik/mülkiyet değildir.
          </li>
          <li>
            Hesabın kapanır veya oyun sona ererse, kullanılmamış Denar’ın parasal bir karşılığı oluşmaz.
          </li>
        </ul>
      </Section>

      <Section title="Satın alma ve ödeme">
        <p>
          Denar satın alımları, ödeme sağlayıcımız ve <strong>kayıtlı satıcı (Merchant of Record)</strong> olan{" "}
          <strong>Paddle.com Market Limited</strong> üzerinden yapılır. Ödeme, Paddle tarafından işlenir; kart
          bilgini biz görmeyiz. Satın alma anında geçerli fiyat ve vergiler sana checkout ekranında gösterilir.
          Denar, ödeme onaylanınca <strong>hesabına anında</strong> tanımlanır.
        </p>
        <p className="mt-2">
          İade koşulları için <a href="/iade" className="underline">İade Politikası</a>, fiyatlar için{" "}
          <a href="/fiyatlandirma" className="underline">Fiyatlandırma</a> sayfasına bak.
        </p>
      </Section>

      <Section title="Kabul edilebilir kullanım">
        <p>
          Oyunu yasalara aykırı biçimde, hile/otomasyon araçlarıyla, sistemi istismar ederek veya başkalarının
          deneyimini bozacak şekilde kullanamazsın. Oyunun kaynak koduna, sunucularına veya başka oyuncuların
          verilerine yetkisiz erişim denemesi yasaktır.
        </p>
      </Section>

      <Section title="Çocuklar">
        <p>
          Oyun genç kitleye de hitap eder. Küçük yaştaki oyuncuların oyunu ve özellikle <strong>satın
          almaları ebeveyn gözetiminde</strong> yapmasını öneririz; satın alma akışında bir yetişkin onayı
          adımı vardır.
        </p>
      </Section>

      <Section title="Sorumluluğun sınırı">
        <p>
          Hizmet “olduğu gibi” sunulur. Yasal olarak izin verilen azami ölçüde, oyunun kesintisiz veya hatasız
          olacağını garanti etmeyiz. Zorunlu tüketici hakların saklıdır.
        </p>
      </Section>

      <Section title="Değişiklikler">
        <p>
          Bu koşulları zaman zaman güncelleyebiliriz; güncel sürüm bu sayfada yayımlanır. Önemli değişiklikleri
          mümkün olduğunca bildiririz.
        </p>
      </Section>

      <Section title="İletişim">
        <p>
          Sorular için:{" "}
          <a href="mailto:lotpgame@gmail.com" className="underline">lotpgame@gmail.com</a>
        </p>
      </Section>

      <p className="mt-10">
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
