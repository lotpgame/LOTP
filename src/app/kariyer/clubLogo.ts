/**
 * Kulüp logosu (saf): şehir → logo yolu. Şehre özel logo varsa onu, yoksa varsayılanı döndürür.
 * Görseller: public/img/clubs/<slug>.webp (+ default.webp). Yeni şehre-özel logo geldikçe:
 *   1) public/img/clubs/<slug>.webp koy, 2) CLUB_LOGO_CITIES'e <slug> ekle.
 * (İzmit özel logosu geldiğinde slug "izmit" eklenecek.)
 */

// Şu an yalnız varsayılan var; şehre-özel logolar eklendikçe buraya slug eklenir.
const CLUB_LOGO_CITIES = new Set<string>([]);

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

/** Bir kulübün (şehrine göre) logo yolu — özel yoksa varsayılan. */
export function clubLogoSrc(city: string): string {
  const s = citySlug(city);
  return `/img/clubs/${s && CLUB_LOGO_CITIES.has(s) ? s : "default"}.webp`;
}
