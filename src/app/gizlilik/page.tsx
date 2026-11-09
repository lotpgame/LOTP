import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Gizlilik Politikası · Legends of the Piste",
  description: "Legends of the Piste gizlilik politikası — hangi verileri topluyoruz, nasıl kullanıyoruz.",
};

// Google OAuth "Publish" için gereken gizlilik politikası sayfası (kullanıcı 09.11).
// Girişsiz erişilir; oyunun topladığı az veriyi dürüstçe açıklar.
export default function GizlilikPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[15px] leading-relaxed sm:px-6">
      <h1 className="font-display text-[30px] font-bold">Gizlilik Politikası</h1>
      <p className="mt-1 text-[13px] text-steel">Son güncelleme: 9 Kasım 2026</p>

      <p className="mt-6">
        <strong>Legends of the Piste</strong> (“oyun”, “biz”), eskrim temalı bir metin-tabanlı kariyer
        simülasyonudur. Gizliliğine önem veriyoruz ve mümkün olan en az veriyi topluyoruz. Bu sayfa, hangi
        verileri neden topladığımızı ve nasıl kullandığımızı açıklar.
      </p>

      <Section title="Topladığımız veriler">
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>E-posta adresi:</strong> Google ile giriş yaptığında, hesabını tanımak için yalnızca
            e-posta adresin alınır. Şifreni görmeyiz (giriş Google üzerinden yapılır).
          </li>
          <li>
            <strong>Oyun verileri:</strong> Oluşturduğun sporcu, kariyer ilerlemesi, maç/turnuva sonuçları ve
            istatistikler gibi oyun içi veriler kaydedilir.
          </li>
        </ul>
        <p className="mt-3">
          Ad, telefon, adres, ödeme bilgisi veya konum gibi başka kişisel veriler toplamıyoruz.
        </p>
      </Section>

      <Section title="Verileri neden kullanıyoruz">
        <p>
          Verileri yalnızca <strong>oyunun çalışması</strong> için kullanırız: hesabına giriş yapabilmen,
          kariyerinin kaydedilip kaldığın yerden devam edebilmen ve klasman/istatistiklerin gösterilebilmesi.
          Reklam veya profilleme amacıyla kullanmayız.
        </p>
      </Section>

      <Section title="Paylaşım ve altyapı">
        <p>
          Verilerini <strong>satmayız</strong> ve pazarlama amacıyla üçüncü taraflarla paylaşmayız. Oyun
          aşağıdaki hizmetler üzerinde çalışır; verilerin yalnızca oyunun çalışması için bu altyapıda işlenir:
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1">
          <li><strong>Vercel</strong> — barındırma (hosting)</li>
          <li><strong>Neon</strong> — veritabanı (oyun verilerinin saklanması)</li>
          <li><strong>Google</strong> — güvenli giriş (OAuth)</li>
        </ul>
      </Section>

      <Section title="Çerezler">
        <p>
          Yalnızca giriş durumunu hatırlamak için zorunlu bir <strong>oturum çerezi</strong> kullanırız.
          Takip/reklam çerezi kullanmayız.
        </p>
      </Section>

      <Section title="Çocuklar">
        <p>
          Oyun genç kitleye de hitap eder. Küçük yaştaki oyuncuların ebeveyn gözetiminde oynamasını öneririz.
          Bir çocuğun verisini onayınız olmadan işlediğimizi düşünüyorsanız bize yazın, sileriz.
        </p>
      </Section>

      <Section title="Haklarının ve veri silme">
        <p>
          Hesabının ve verilerinin silinmesini istersen aşağıdaki e-postadan bize ulaş; talebini yerine
          getiririz.
        </p>
      </Section>

      <Section title="İletişim">
        <p>
          Gizlilikle ilgili her soru için:{" "}
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
