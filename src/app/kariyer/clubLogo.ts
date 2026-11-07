/**
 * Kulüp logosu (saf): her kulübe ÜLKESİNİN logo havuzundan sabit-rastgele bir logo atanır.
 *
 * Plan (kullanıcı 07.11): her ülke için ~10 ülkeye-özgü logo üretilir → kulüplere rastgele dağıtılır.
 * Atama ŞEHİR adının hash'inden türetilir → aynı kulüp HER ZAMAN aynı logoyu gösterir (stabil).
 * Ülkenin logosu yoksa veya şehir bilinmiyorsa → `default.webp`.
 *
 * Görseller: public/img/clubs/<cc>-<1..n>.webp (ör. tr-1.webp … tr-10.webp) + default.webp.
 * Yeni ülke logoları geldikçe: dosyaları koy + COUNTRY_LOGO_COUNT'a ülke sayısını yaz.
 * Şehre ÖZEL logo (İzmit/Kocaeli gibi) → CITY_OVERRIDE'a eklenir (kulüpler bitince kodlanacak).
 */
import { countryCodeOfCity } from "@/engine/geo";

/** Ülke başına mevcut logo sayısı. Logo gelince buraya eklenir (yoksa o ülke default'a düşer). */
const COUNTRY_LOGO_COUNT: Record<string, number> = {};

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

/** Bir kulübün (şehrine göre) logo yolu — şehre özel > ülke havuzundan sabit-rastgele > varsayılan. */
export function clubLogoSrc(city: string): string {
  const slug = citySlug(city);
  if (slug && CITY_OVERRIDE[slug]) return `/img/clubs/${CITY_OVERRIDE[slug]}.webp`;
  const cc = countryCodeOfCity(city);
  const n = cc ? COUNTRY_LOGO_COUNT[cc] ?? 0 : 0;
  if (cc && n > 0) {
    const idx = (hashStr(slug) % n) + 1; // 1..n
    return `/img/clubs/${cc.toLowerCase()}-${idx}.webp`;
  }
  return `/img/clubs/default.webp`;
}
