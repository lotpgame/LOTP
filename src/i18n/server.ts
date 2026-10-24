/** Sunucu tarafı dil okuma (next/headers). İstemci bileşenleri bunu import ETMEZ. */
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, LOCALES, localeForCountry, type Locale } from "./index";

/**
 * UI dili önceliği: (1) kullanıcı seçtiyse cookie'deki dil; (2) cookie yoksa, bağlanılan ÜLKENİN dili
 * (Vercel `x-vercel-ip-country` — Alman'a Almanca, Çinli'ye Çince); (3) IP yok/yerel → Türkçe.
 * Bilinen ama dili desteklenmeyen ülke → İngilizce (localeForCountry eşlemesi).
 */
export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (v && LOCALES.includes(v)) return v; // kullanıcı seçimi önce
  const country = (await headers()).get("x-vercel-ip-country");
  if (!country) return "tr"; // IP yok (yerel) → mevcut varsayılan
  return localeForCountry(country) ?? "en"; // bilinmeyen ülke → İngilizce (uluslararası)
}
