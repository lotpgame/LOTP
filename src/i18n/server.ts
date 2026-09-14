/** Sunucu tarafı dil okuma (next/headers). İstemci bileşenleri bunu import ETMEZ. */
import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./index";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get(LOCALE_COOKIE)?.value === "en" ? "en" : "tr";
}
