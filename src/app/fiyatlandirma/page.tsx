import type { Metadata } from "next";
import { DENAR_PACKAGES } from "@/engine/ads";

export const metadata: Metadata = {
  title: "Fiyatlandırma · Legends of the Piste",
  description: "Legends of the Piste fiyatlandırma — Denar (oyun-içi para) paketleri ve fiyatları.",
};

// Paddle doğrulaması için public fiyat sayfası (kullanıcı 20.11). Fiyat koddaki DENAR_PACKAGES'tan gelir →
// oyun-içi market ile ve Paddle kataloğu ile aynı kalır. Girişsiz erişilir.
export default function FiyatlandirmaPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[15px] leading-relaxed sm:px-6">
      <h1 className="font-display text-[30px] font-bold">Fiyatlandırma</h1>
      <p className="mt-1 text-[13px] text-steel">Son güncelleme: 20 Kasım 2026</p>

      <p className="mt-6">
        <strong>Legends of the Piste</strong> oynaması <strong>ücretsizdir</strong>. İstersen oyunu
        hızlandırmak için <strong>Denar</strong> (oyun-içi para) satın alabilirsin — zorunlu değildir.
        Denar’ı oyun içinde ekipman yükseltmek gibi şeyler için harcarsın.
      </p>

      <section className="mt-7 rounded-xl border border-line p-5">
        <h2 className="font-display text-[20px] font-bold">Denar paketleri</h2>
        <ul className="mt-3 space-y-2">
          {DENAR_PACKAGES.map((p) => (
            <li
              key={p.denar}
              className="flex items-center justify-between rounded-lg border border-line px-4 py-3"
            >
              <span className="num text-[18px] font-bold">{p.denar} Denar</span>
              <span className="num text-[18px] font-semibold">{p.gbp}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-steel">
          Tek seferlik satın alma (abonelik değil). Fiyatlar <strong>GBP (£)</strong> cinsindendir; Paddle,
          bulunduğun ülkeye göre yerel para biriminde gösterebilir. Geçerli vergiler checkout ekranında
          eklenir ve gösterilir.
        </p>
      </section>

      <section className="mt-7">
        <h2 className="font-display text-[20px] font-bold">Satın alma nasıl çalışır</h2>
        <ul className="ml-5 mt-2 list-disc space-y-1.5 text-steel [&_strong]:text-ink">
          <li>Oyunda <strong>Market → Denar</strong> köşesinden satın alırsın.</li>
          <li>Ödeme, kayıtlı satıcımız <strong>Paddle</strong> üzerinden güvenle işlenir (kart bilgini biz görmeyiz).</li>
          <li>Denar, ödeme onaylanınca <strong>anında</strong> hesabına eklenir.</li>
          <li>Küçük yaştaki oyuncular için satın alma akışında bir <strong>yetişkin onayı</strong> adımı vardır.</li>
        </ul>
      </section>

      <p className="mt-7 text-steel [&_a]:text-ink">
        İlgili: <a href="/kosullar" className="underline">Kullanım Koşulları</a> ·{" "}
        <a href="/iade" className="underline">İade Politikası</a> ·{" "}
        <a href="/gizlilik" className="underline">Gizlilik Politikası</a>
      </p>

      <p className="mt-10">
        <a href="/" className="underline">← Ana sayfaya dön</a>
      </p>
    </main>
  );
}
