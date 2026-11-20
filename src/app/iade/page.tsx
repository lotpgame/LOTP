import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "İade Politikası · Legends of the Piste",
  description: "Legends of the Piste iade politikası — Denar (oyun-içi para) satın alımlarında iade koşulları.",
};

// Paddle doğrulaması + tüketici koruması için iade politikası (kullanıcı 20.11). Denar anında teslim edilen
// dijital içerik → kural: anında teslim onayıyla cayma hakkı sona erer; ama hatalı durumda adil çözüm.
export default function IadePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[15px] leading-relaxed sm:px-6">
      <h1 className="font-display text-[30px] font-bold">İade Politikası</h1>
      <p className="mt-1 text-[13px] text-steel">Son güncelleme: 20 Kasım 2026</p>

      <p className="mt-6">
        <strong>Legends of the Piste</strong> oyununda satın aldığın tek ürün <strong>Denar</strong>’dır —
        anında hesabına tanımlanan, oyun içinde kullanılan sanal bir birim (dijital içerik). Bu politika,
        Denar satın alımlarının iade koşullarını açıklar. Ödemeler, kayıtlı satıcımız (Merchant of Record){" "}
        <strong>Paddle</strong> üzerinden işlenir ve iadeler de Paddle aracılığıyla yapılır.
      </p>

      <Section title="Dijital içerik ve cayma hakkı">
        <p>
          Denar, satın alma onayından hemen sonra <strong>anında teslim edilen dijital içeriktir</strong>.
          Satın alırken teslimatın anında başlamasını onaylarsın; bu nedenle, yürürlükteki tüketici
          mevzuatı uyarınca, <strong>teslimat tamamlandıktan sonra 14 günlük cayma (geri dönüş) hakkı sona
          erer</strong>. Yani kural olarak, hesabına tanımlanmış ve/veya kullanılmaya başlanmış Denar için
          iade yapılmaz.
        </p>
      </Section>

      <Section title="Yine de iade yapabileceğimiz durumlar">
        <p>Adil olmak adına, şu durumlarda bize ulaş — inceleyip uygun olanı iade ederiz:</p>
        <ul className="ml-5 mt-2 list-disc space-y-1.5">
          <li><strong>Teknik hata:</strong> Ödeme alındı ama Denar hesabına <strong>eklenmedi</strong>.</li>
          <li><strong>Yinelenen/yanlış tahsilat:</strong> Aynı satın alma için birden fazla kez ücretlendirildin.</li>
          <li><strong>Yetkisiz işlem:</strong> Senin onayın olmadan (örn. bir çocuğun yetişkin onayı olmadan) yapılmış satın alma.</li>
        </ul>
        <p className="mt-2">
          Bu durumlarda, <strong>satın alma tarihinden itibaren 14 gün</strong> içinde aşağıdaki e-postadan
          yaz; <strong>Paddle makbuzundaki sipariş/işlem numarasını</strong> ekle. Mümkün olan en kısa sürede
          dönüş yaparız.
        </p>
      </Section>

      <Section title="İade nasıl işler">
        <p>
          Onaylanan iadeler, ödemenin yapıldığı <strong>aynı yönteme</strong> Paddle tarafından yapılır.
          Bankaya/karta yansıması genelde birkaç iş günü sürer. İade edilen Denar, oyun hesabından geri alınır.
        </p>
      </Section>

      <Section title="İletişim">
        <p>
          İade talebi ve her soru için:{" "}
          <a href="mailto:lotpgame@gmail.com" className="underline">lotpgame@gmail.com</a>
          <br />
          İlgili: <a href="/kosullar" className="underline">Kullanım Koşulları</a> ·{" "}
          <a href="/fiyatlandirma" className="underline">Fiyatlandırma</a>
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
