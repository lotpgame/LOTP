/**
 * Ortak domain tipleri ve saf yardımcılar — tüm engine'lerin paylaştığı dil.
 *
 * NEDEN: silah, cinsiyet, yaş kategorisi ve kimlik (ID) biçimleri birçok engine tarafından
 * kullanılır; tek yerde tanımlanır (tek kaynak). Değerler İngilizce (kod), UI'da Türkçe
 * gösterilir. SQLite'ta enum olmadığı için DB'de string tutulur; burada birlik (union) tip.
 */

export type Weapon = "FOIL" | "EPEE" | "SABRE";
export type Gender = "MALE" | "FEMALE";
export type AgeCategory = "U10" | "U12" | "U14" | "U17" | "U21" | "SENIOR";

/** Başlangıç profili arketipi (GDD 7.20) — başlangıç skill dağılımını yönlendirir. */
export type PlayerProfile =
  | "BALANCED"
  | "TECHNICAL"
  | "PHYSICAL"
  | "MENTAL"
  | "TACTICAL";

/** Dört ana yetenek grubu (GDD 9.5). */
export type SkillCategory = "TECHNICAL" | "PHYSICAL" | "MENTAL" | "TACTICAL";

/** Turnuva seviyeleri (GDD 17.7–17.8, 17.93). Prestij arttıkça puan/XP artar. */
export type TournamentLevel =
  | "IL" // İl Şampiyonası
  | "OPEN" // Open Turnuvası
  | "TURKIYE" // Türkiye Şampiyonası
  | "SATELLITE"
  | "GRAND_PRIX"
  | "EUROPEAN" // Avrupa Şampiyonası (milli takım)
  | "WORLD_CUP"; // Dünya Kupası

export const TOURNAMENT_LABEL_TR: Record<TournamentLevel, string> = {
  IL: "İl Şampiyonası",
  OPEN: "Open Turnuva",
  TURKIYE: "Türkiye Şampiyonası",
  SATELLITE: "Satellite",
  GRAND_PRIX: "Grand Prix",
  EUROPEAN: "Avrupa Şampiyonası",
  WORLD_CUP: "Dünya Kupası",
};

/**
 * Eskrimin yapıldığı büyük iller (başlangıç seti — sonra editlenir). Tüm 81 il gerekmez;
 * kulüp/aktivite olan şehirler. Seçilen şehir oyuncunun kulübünü ve İl Şampiyonası kapsamını belirler.
 */
export const TR_CITIES: readonly string[] = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Kocaeli", "Antalya",
  "Konya", "Trabzon", "Erzurum", "Mersin", "Balıkesir", "Adıyaman",
] as const;

export const WEAPONS: readonly Weapon[] = ["FOIL", "EPEE", "SABRE"] as const;
export const GENDERS: readonly Gender[] = ["MALE", "FEMALE"] as const;
export const PROFILES: readonly PlayerProfile[] = [
  "BALANCED",
  "TECHNICAL",
  "PHYSICAL",
  "MENTAL",
  "TACTICAL",
] as const;


/** Kategori ID'sinde kullanılan kısa silah kodları (GDD 22.10: FL/EPE/KIL). */
const WEAPON_CODE: Record<Weapon, string> = { FOIL: "FL", EPEE: "EPE", SABRE: "KIL" };
const GENDER_CODE: Record<Gender, string> = { MALE: "M", FEMALE: "F" };

/**
 * Yaştan yaş kategorisi üretir (GDD 7.9). Kategori manuel seçilmez; yaştan türetilir.
 * NOT (M1 basitleştirmesi): kesin FIE sınırları Tournament Engine'de netleşecek (GDD 7.11).
 */
export function ageToCategory(age: number): AgeCategory {
  if (age <= 9) return "U10";
  if (age <= 11) return "U12";
  if (age <= 13) return "U14";
  if (age <= 16) return "U17";
  if (age <= 20) return "U21";
  return "SENIOR";
}

/** Doğum tarihinden, verilen oyun tarihindeki yaşı hesaplar (GDD 8.7). */
export function computeAge(birthDate: Date, onDate: Date): number {
  let age = onDate.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    onDate.getMonth() < birthDate.getMonth() ||
    (onDate.getMonth() === birthDate.getMonth() && onDate.getDate() < birthDate.getDate());
  if (beforeBirthday) age--;
  return age;
}

/**
 * Ranking/Tournament ortak kategori kimliği (GDD 5.20, 22.10). Örn. "U17-M-FL".
 * Yaş kategorisi + cinsiyet + silah birlikte tek bir yarışma havuzunu tanımlar.
 */
export function makeCategoryId(
  ageCategory: AgeCategory,
  gender: Gender,
  weapon: Weapon,
): string {
  return `${ageCategory}-${GENDER_CODE[gender]}-${WEAPON_CODE[weapon]}`;
}

/** Görünen kalıcı oyuncu kodu (GDD 7.4). Örn. 1 → "P-000001". */
export function formatPlayerCode(numericId: number): string {
  return `P-${String(numericId).padStart(6, "0")}`;
}

/** Bir sayıyı [min, max] aralığına sıkıştırır. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Ondalık skill değerini UI için yuvarlar (GDD 9.34: sakla hassas, göster yuvarlı). */
export function roundSkill(value: number): number {
  return Math.round(value * 10) / 10;
}
