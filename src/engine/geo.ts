/**
 * Coğrafya (M9.2) — ülke + telefon ülke kodu + ülkeye ait sınırlı şehir listesi.
 *
 * Ortak dünyada oyuncunun ülkesi **telefon numarasının ülke kodundan** belirlenir; şehir o ülkenin
 * listesinden seçilir. Ülkeler **adım adım** eklenir (önce TR; sonra büyük ülkeler). Saf veri + saf
 * fonksiyon: I/O yok. Desteklenmeyen ülke kodu → oyun o ülkeyi henüz açmamış demektir.
 */
import { TR_CITIES } from "./domain";

export interface Country {
  code: string; // ISO benzeri kısa kod (Country.code ile aynı), örn. "TR"
  name: string;
  dialCode: string; // telefon ülke kodu, örn. "+90"
  cities: readonly string[]; // seçilebilir şehirler (sınırlı liste)
}

/**
 * Desteklenen ülkeler. Önce TR. Yeni ülke eklemek = buraya bir satır (kod + isim + dial + şehirler).
 * Büyük/eskrim ülkeleri öncelikli olarak sırayla açılacak.
 */
export const COUNTRIES: readonly Country[] = [{ code: "TR", name: "Türkiye", dialCode: "+90", cities: TR_CITIES }];

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function citiesForCountry(code: string): readonly string[] {
  return countryByCode(code)?.cities ?? [];
}

/**
 * Ham telefon girdisini E.164'e yakın normalize eder: boşluk/tire/parantez temizlenir; baştaki
 * "00" → "+"; "+" yoksa (ve makul uzunluktaysa) olduğu gibi bırakılır (çağıran ülke kodu ister).
 * Yalnız "+" ve rakam döner.
 */
export function normalizePhone(raw: string): string {
  let s = (raw ?? "").trim().replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  // yalnız baştaki + ve rakamlar
  const plus = s.startsWith("+");
  s = s.replace(/[^\d]/g, "");
  return plus ? "+" + s : s;
}

/** Normalize edilmiş telefondan (ülke koduyla) ülkeyi bulur — en uzun eşleşen dial code. */
export function countryByPhone(phone: string): Country | undefined {
  const p = normalizePhone(phone);
  if (!p.startsWith("+")) return undefined;
  return [...COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((c) => p.startsWith(c.dialCode));
}

export interface ParsedPhone {
  ok: boolean;
  phone: string; // normalize edilmiş (E.164'e yakın)
  country?: Country; // desteklenen ülke (yoksa undefined)
  reason?: "format" | "unsupported"; // ok=false ise sebep
}

/**
 * Telefonu doğrular + ülkeyi çözer. ok=false: "format" (geçersiz numara) veya "unsupported"
 * (ülke kodu henüz eklenmedi). Doğrulama (OTP) ayrı; bu yalnız biçim + ülke eşlemesi.
 */
export function parsePhone(raw: string): ParsedPhone {
  const phone = normalizePhone(raw);
  const digits = phone.replace(/\D/g, "");
  if (!phone.startsWith("+") || digits.length < 8 || digits.length > 15) {
    return { ok: false, phone, reason: "format" };
  }
  const country = countryByPhone(phone);
  if (!country) return { ok: false, phone, reason: "unsupported" };
  return { ok: true, phone, country };
}
