/**
 * Player Engine — oyuncu kimliğini ve türetilmiş bilgileri sağlar (GDD 7, 8).
 *
 * Sorumluluk: kimlik + türetim (yaş→kategori). Skill'i Skill Engine üretir; Player Engine
 * yalnız başlangıç verisini bir araya getirir (GDD 7.53). AI ve insan oyuncu aynı yapıyı
 * kullanır (GDD 8.53). M1: oluşturma doğrulaması (Zod) + kategoriyi dolduran AI üretimi.
 */
import { z } from "zod";
import {
  ageToCategory,
  computeAge,
  makeCategoryId,
  type AgeCategory,
  type Gender,
  type PlayerProfile,
  type Weapon,
} from "../domain";
import { PROFILES } from "../domain";
import { generateStartingSkills, type PlayerSkills } from "../skill";
import type { SeededRng } from "../probability";
import { LAST_NAMES, firstNamesFor } from "./names";

/** Oyuncu oluşturma girdisi — sunucu tarafında doğrulanır (GDD 7.27, güvenlik: Zod). */
export const createPlayerSchema = z.object({
  firstName: z.string().trim().min(1, "Ad zorunlu").max(30),
  lastName: z.string().trim().min(1, "Soyad zorunlu").max(30),
  gender: z.enum(["MALE", "FEMALE"]),
  weapon: z.enum(["FOIL", "EPEE", "SABRE"]),
  profile: z.enum(["BALANCED", "TECHNICAL", "PHYSICAL", "MENTAL", "TACTICAL"]),
  birthDate: z.coerce.date(),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;

/** Oyuncunun oyun tarihindeki türetilmiş yaş/kategori bilgisi. */
export interface DerivedIdentity {
  age: number;
  ageCategory: AgeCategory;
  categoryId: string;
}

export function deriveIdentity(
  input: Pick<CreatePlayerInput, "gender" | "weapon" | "birthDate">,
  gameDate: Date,
): DerivedIdentity {
  const age = computeAge(input.birthDate, gameDate);
  const ageCategory = ageToCategory(age);
  return { age, ageCategory, categoryId: makeCategoryId(ageCategory, input.gender, input.weapon) };
}

/** Yaş kategorisinin AI üretimi için makul yaş aralığı. */
const CATEGORY_AGE_RANGE: Record<AgeCategory, [number, number]> = {
  U10: [8, 9],
  U12: [10, 11],
  U14: [12, 13],
  U17: [14, 16],
  U21: [17, 20],
  SENIOR: [21, 30],
};

export interface AiPlayerSpec {
  firstName: string;
  lastName: string;
  gender: Gender;
  weapon: Weapon;
  profile: PlayerProfile;
  birthDate: Date;
  skills: PlayerSkills;
}

/** Verilen kategoride yaşa uygun bir doğum tarihi üretir. */
function randomBirthDate(rng: SeededRng, ageCategory: AgeCategory, gameDate: Date): Date {
  const [minAge, maxAge] = CATEGORY_AGE_RANGE[ageCategory];
  const age = rng.int(minAge, maxAge);
  const d = new Date(gameDate);
  d.setFullYear(d.getFullYear() - age);
  d.setDate(d.getDate() - rng.int(0, 300)); // gün içi çeşitlilik
  return d;
}

/**
 * Bir kategoriyi doldurmak için AI rakipler üretir (GDD 7.31–7.32). İnsan oyuncuyla aynı
 * cinsiyet/silah/yaş-kategorisinde; skill'ler Skill Engine ile üretilir. Deterministik (rng).
 */
export function generateAiOpponents(
  rng: SeededRng,
  opts: { count: number; gender: Gender; weapon: Weapon; ageCategory: AgeCategory; gameDate: Date },
): AiPlayerSpec[] {
  const { count, gender, weapon, ageCategory, gameDate } = opts;
  const firsts = firstNamesFor(gender);
  const specs: AiPlayerSpec[] = [];
  for (let i = 0; i < count; i++) {
    const birthDate = randomBirthDate(rng, ageCategory, gameDate);
    const age = computeAge(birthDate, gameDate);
    const profile = rng.pick(PROFILES);
    specs.push({
      firstName: rng.pick(firsts),
      lastName: rng.pick(LAST_NAMES),
      gender,
      weapon,
      profile,
      birthDate,
      skills: generateStartingSkills(rng, { age, profile }),
    });
  }
  return specs;
}
