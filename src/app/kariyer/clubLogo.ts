/**
 * Kulüp logosu (saf): her kulübe GLOBAL havuzdan sabit-rastgele bir logo atanır (ülke-bağımsız).
 *
 * Plan (kullanıcı 08.11): 300 abstract/renkli crest (şehir/ülke figürü YOK) → kulüplere rastgele dağıtılır.
 * Böylece "Birmingham kulübünde Londra figürü" gibi landmark-mismatch olmaz. Atama ŞEHİR adının hash'inden
 * türetilir → aynı kulüp HER ZAMAN aynı logoyu gösterir (stabil).
 *
 * Görseller: public/img/clubs/club-1..300.webp (+ default.webp fallback). Üretim: scripts/slice-clublogos.mjs.
 * Şehre ÖZEL logo (İzmit/Kocaeli gibi) → CITY_OVERRIDE'a eklenir (public/img/clubs/<dosya>.webp konur).
 */

const CLUB_LOGO_COUNT = 283; // global havuz (320 kesildi − 37 birebir kopya ayıklandı)

/** Şehre özel logo override (slug → dosya adı). İzmit/Kocaeli sonra eklenecek. */
const CITY_OVERRIDE: Record<string, string> = {};

/** Türkçe şehir adı → dosya-güvenli slug (İstanbul → istanbul, Kocaeli → kocaeli). */
export function citySlug(city: string): string {
  return (city || "")
    .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
    .replace(/Ş/g, "s").replace(/ş/g, "s")
    .replace(/Ğ/g, "g").replace(/ğ/g, "g")
    .replace(/Ü/g, "u").replace(/ü/g, "u")
    .replace(/Ö/g, "o").replace(/ö/g, "o")
    .replace(/Ç/g, "c").replace(/ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Basit deterministik string hash (sabit-rastgele atama için). */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Bir kulübün (şehrine göre) logo yolu — şehre özel > global havuzdan sabit-rastgele > varsayılan. */
export function clubLogoSrc(city: string): string {
  const slug = citySlug(city);
  if (!slug) return "/img/clubs/default.webp";
  if (CITY_OVERRIDE[slug]) return `/img/clubs/${CITY_OVERRIDE[slug]}.webp`;
  const idx = (hashStr(slug) % CLUB_LOGO_COUNT) + 1; // 1..283
  return `/img/clubs/club-${idx}.webp`;
}
