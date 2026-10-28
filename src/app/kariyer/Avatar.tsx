/**
 * Yuvarlak avatar (saf; hook yok → hem server hem client component'lerde kullanılır).
 * `src` verilirse portre fotoğrafını DAİREYE DOLDURUR (object-cover, hafif aşağı hizalı → tam yüz + çene
 * görünür, sadece saç tepesi hafif kırpılır — avatarlarda normal, yanlarda boşluk yok); yoksa harf rozeti.
 */
import { initials } from "./parts";

export function Avatar({ name, src, size }: { name: string; src?: string | null; size: number }) {
  if (src) {
    return (
      <span
        className="block shrink-0 overflow-hidden rounded-[22%] bg-arena-2 ring-1 ring-line"
        style={{ width: size, height: Math.round((size * 4) / 3) }}
        aria-hidden="true"
      >
        {/* Kutu portreyle aynı 3:4 oranda → object-cover tam doldurur: yüz+çene+omuz eksiksiz, kırpma/boşluk/bulanıklık YOK. */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  // Fotoğraf yoksa: tel dokulu maske-oval baş-harf rozeti (eski görünüm korunur).
  return (
    <span
      className="mesh flex shrink-0 items-center justify-center bg-ink font-display font-bold text-arena-0"
      style={{ width: size, height: Math.round(size * 1.15), borderRadius: "46% 46% 50% 50%", fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
