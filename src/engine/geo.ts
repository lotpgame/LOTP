/**
 * Coğrafya (M9.2) — ülke + telefon ülke kodu + ülkeye ait sınırlı şehir listesi.
 *
 * Ortak dünyada oyuncunun ülkesi **telefon numarasının ülke kodundan** belirlenir; şehir o ülkenin
 * listesinden seçilir. Ülkeler **adım adım** eklenir (önce TR; sonra büyük ülkeler). Saf veri + saf
 * fonksiyon: I/O yok. Desteklenmeyen ülke kodu → oyun o ülkeyi henüz açmamış demektir.
 */
import { TR_CITIES } from "./domain";

/**
 * Kıtalar = FIE'nin 4 kıtasal konfederasyonu (Avrupa, Asya-Okyanusya, Amerika, Afrika).
 * Klasman kapsamı: Dünya → Kıta → Ülke. Ülke turnuva/kıtasal hiyerarşisiyle uyumlu.
 */
export type ContinentCode = "EU" | "AS" | "AM" | "AF";

export interface Continent {
  code: ContinentCode;
  name: string;
}

export const CONTINENTS: readonly Continent[] = [
  { code: "EU", name: "Avrupa" },
  { code: "AS", name: "Asya-Okyanusya" },
  { code: "AM", name: "Amerika" },
  { code: "AF", name: "Afrika" },
];

export interface Country {
  code: string; // ISO benzeri kısa kod (Country.code ile aynı), örn. "TR"
  name: string;
  continent: ContinentCode; // bağlı olduğu kıta (FIE konfederasyonu)
  dialCode: string; // telefon ülke kodu, örn. "+90"
  cities: readonly string[]; // seçilebilir şehirler (sınırlı liste)
}

/**
 * Desteklenen ülkeler — büyük eskrim ulusları, 4 kıtaya yayılmış. Yeni ülke = buraya bir satır.
 * (Şehir listeleri kısa/temsilîdir; asıl multiplayer'da IP ile ülke atanır, dev'de TR sabit.)
 * NOT: telefon ülke kodu (dialCode) benzersiz tutulur — ABD/Kanada +1 çakışmasını önlemek için
 * bu listede aynı dial code'dan iki ülke yok (Kanada sonraya).
 */
export const COUNTRIES: readonly Country[] = [
  // Avrupa (EU)
  { code: "TR", name: "Türkiye", continent: "EU", dialCode: "+90", cities: TR_CITIES },
  { code: "FR", name: "Fransa", continent: "EU", dialCode: "+33", cities: ["Paris", "Lyon", "Marsilya", "Bordeaux", "Lille", "Strasbourg"] },
  { code: "IT", name: "İtalya", continent: "EU", dialCode: "+39", cities: ["Roma", "Milano", "Napoli", "Torino", "Bologna", "Padova"] },
  { code: "DE", name: "Almanya", continent: "EU", dialCode: "+49", cities: ["Berlin", "Münih", "Hamburg", "Köln", "Frankfurt", "Leipzig"] },
  { code: "HU", name: "Macaristan", continent: "EU", dialCode: "+36", cities: ["Budapeşte", "Debrecen", "Szeged", "Miskolc"] },
  { code: "RU", name: "Rusya", continent: "EU", dialCode: "+7", cities: ["Moskova", "St. Petersburg", "Kazan", "Novosibirsk", "Soçi"] },
  { code: "PL", name: "Polonya", continent: "EU", dialCode: "+48", cities: ["Varşova", "Krakov", "Poznań", "Wrocław", "Gdańsk"] },
  { code: "ES", name: "İspanya", continent: "EU", dialCode: "+34", cities: ["Madrid", "Barselona", "Valensiya", "Sevilla"] },
  { code: "GB", name: "İngiltere", continent: "EU", dialCode: "+44", cities: ["Londra", "Manchester", "Birmingham", "Leeds"] },
  { code: "UA", name: "Ukrayna", continent: "EU", dialCode: "+380", cities: ["Kiev", "Harkiv", "Lviv", "Odessa"] },
  // Amerika (AM)
  { code: "US", name: "ABD", continent: "AM", dialCode: "+1", cities: ["New York", "Los Angeles", "Chicago", "Boston", "San Francisco", "Houston"] },
  { code: "BR", name: "Brezilya", continent: "AM", dialCode: "+55", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Curitiba"] },
  // Asya-Okyanusya (AS)
  { code: "JP", name: "Japonya", continent: "AS", dialCode: "+81", cities: ["Tokyo", "Osaka", "Nagoya", "Fukuoka", "Sapporo"] },
  { code: "KR", name: "Güney Kore", continent: "AS", dialCode: "+82", cities: ["Seul", "Busan", "Incheon", "Daegu"] },
  { code: "CN", name: "Çin", continent: "AS", dialCode: "+86", cities: ["Pekin", "Şanghay", "Guangzhou", "Nanjing", "Tianjin"] },
  { code: "AU", name: "Avustralya", continent: "AS", dialCode: "+61", cities: ["Sydney", "Melbourne", "Brisbane", "Perth"] },
  // Afrika (AF)
  { code: "EG", name: "Mısır", continent: "AF", dialCode: "+20", cities: ["Kahire", "İskenderiye", "Giza"] },
  { code: "TN", name: "Tunus", continent: "AF", dialCode: "+216", cities: ["Tunus", "Sfax", "Sousse"] },
];

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

/** Bir ülkenin kıtası (kod). Bilinmeyen ülke → undefined. */
export function continentOfCountry(code: string): ContinentCode | undefined {
  return countryByCode(code)?.continent;
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
