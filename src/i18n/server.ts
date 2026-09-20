/** Sunucu tarafı dil okuma (next/headers). İstemci bileşenleri bunu import ETMEZ. */
import { cookies } from "next/headers";
import { LOCALE_COOKIE, LOCALES, type Locale } from "./index";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value as Locale | undefined;
  return v && LOCALES.includes(v) ? v : "tr";
}
