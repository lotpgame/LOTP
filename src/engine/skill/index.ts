/**
 * Skill Engine — oyuncunun yeteneklerini ve gelişimini yönetir (GDD 9).
 *
 * Sorumluluk (tek kaynak): skill değerleri, potansiyel, gelişim hesabı. Maç sonucunu
 * HESAPLAMAZ (Combat) — yalnız Combat'a mevcut yetenek durumunu sağlar (GDD 9.29).
 * M1: başlangıç skill üretimi + azalan verimli gelişim. Effective skill (yorgunluk etkisi)
 * Combat tarafında hesaplanır (GDD 9.31–9.32).
 */
import { clamp, type PlayerProfile, type SkillCategory } from "../domain";
import type { SeededRng } from "../probability";
import { SKILLS, type SkillKey } from "./skills";

export { SKILL_KEYS, SKILLS, SKILLS_BY_KEY, skillKeysOf } from "./skills";
export type { SkillKey, SkillDef } from "./skills";

/** Tek bir skill'in durumu (GDD 9.19–9.22, 9.48). Değerler ondalık saklanır. */
export interface SkillValue {
  current: number;
  potential: number; // gizli tavan (GDD 9.20)
  floor: number; // doğal başlangıç minimumu (GDD 9.22)
  ceiling: number; // mutlak gelişim sınırı (GDD 9.21)
}

export type PlayerSkills = Record<SkillKey, SkillValue>;

/** Overall ağırlıkları (GDD 9.12 örnek). Yalnız özet/UI ve kaba güç için; Combat alt-skill kullanır. */
const CATEGORY_WEIGHT: Record<SkillCategory, number> = {
  TECHNICAL: 0.35,
  TACTICAL: 0.25,
  PHYSICAL: 0.2,
  MENTAL: 0.2,
};

const PROFILE_CATEGORY: Record<PlayerProfile, SkillCategory | null> = {
  BALANCED: null,
  TECHNICAL: "TECHNICAL",
  PHYSICAL: "PHYSICAL",
  MENTAL: "MENTAL",
  TACTICAL: "TACTICAL",
};

/**
 * Mutlak yetenek tavanı (GDD 9.11 + oyun sahibi kararı): hiçbir oyuncu bunu geçemez → 95/100 imkânsız,
 * 90'lar yalnız nesilde bir görülen olağanüstü yeteneklerde. Yetişkin potansiyel dağılımı buna sıkışır.
 */
export const HARD_CEILING = 90;

/**
 * Olgunlaşma eğrisi (GDD 9.35): 8 yaşında düşük, ~26 yaşında tam kapasite. Yetenek "yetişkin tavanı"dır;
 * bir oyuncu yaşına uygun ORANDA gelişebilir → 10 yaşındaki çocuk yetişkin tavanına ulaşamaz.
 */
export function maturity(age: number): number {
  if (age >= 26) return 1;
  return clamp(0.3 + (age - 8) * (0.7 / 18), 0.3, 1);
}

/** Bir yaştaki gelişim tavanı: taban + olgunlaşma × (yetişkin potansiyeli − taban). */
export function skillAgeCeiling(potential: number, floor: number, age: number): number {
  return floor + maturity(age) * (potential - floor);
}

/**
 * Başlangıç skill profilini üretir (GDD 7.17–7.20, 7.50).
 * - Genç oyuncu: daha düşük başlangıç, daha yüksek potansiyel boşluğu.
 * - Profil arketipi ilgili grubu yukarı çeker (doğrudan güç vermez, yönelim verir).
 * - RNG ile oyuncular farklılaşır (GDD 2.7, 9.23). Sabit seed → tekrarlanabilir.
 */
export function generateStartingSkills(
  rng: SeededRng,
  opts: { age: number; profile: PlayerProfile },
): PlayerSkills {
  const { age, profile } = opts;
  const profileCategory = PROFILE_CATEGORY[profile];
  // Oyuncunun genel yeteneği (0–1), düşüğe eğimli → çoğu orta, elit nadir (GDD 2.7, 9.11).
  const playerTalent = Math.pow(rng.next(), 2.3);

  const result = {} as PlayerSkills;
  for (const def of SKILLS) {
    const skillVar = rng.float(-0.12, 0.12);
    const profBonus = profileCategory ? (def.category === profileCategory ? 0.12 : -0.03) : 0;
    const t = clamp(playerTalent + skillVar + profBonus, 0, 1);
    // Yetişkin (gizli) potansiyel: 42..90 — çoğu 45-65, elit ~80-86, olağanüstü ~86-90 (nadir).
    const potential = clamp(42 + t * (HARD_CEILING - 42), 42, HARD_CEILING);
    const floor = round2(clamp(8 + rng.float(0, 8), 5, 25));
    // Başlangıç yaşa uygun: o yaştaki tavanın bir kısmı → 8'de düşük başlar, yaşla açılır.
    const ageCap = skillAgeCeiling(potential, floor, age);
    const current = clamp(floor + rng.float(0.4, 0.75) * (ageCap - floor), floor, ageCap);
    result[def.key] = {
      current: round2(current),
      potential: round2(potential),
      floor,
      ceiling: HARD_CEILING,
    };
  }
  return result;
}

/** Bir kategorinin mevcut ortalaması. */
export function categoryAverage(skills: PlayerSkills, category: SkillCategory): number {
  const keys = SKILLS.filter((s) => s.category === category).map((s) => s.key);
  const sum = keys.reduce((acc, k) => acc + skills[k].current, 0);
  return keys.length ? sum / keys.length : 0;
}

/** Ağırlıklı genel güç (özet/UI). Combat gerçek hesapta alt-skill kullanır (GDD 9.4). */
export function overall(skills: PlayerSkills): number {
  let total = 0;
  for (const cat of Object.keys(CATEGORY_WEIGHT) as SkillCategory[]) {
    total += categoryAverage(skills, cat) * CATEGORY_WEIGHT[cat];
  }
  return total;
}

/**
 * Tek bir skill'e gelişim uyarısı (stimulus) uygular — azalan verimle (GDD 9.37, 14.51).
 * Potansiyele yaklaştıkça gelişim yavaşlar; potansiyel/ceiling aşılmaz.
 * `ageFactor`: gençlerde >1, yaşlılarda <1 (Training tarafından verilir).
 */
export function growSkill(value: SkillValue, stimulus: number, ageFactor = 1, maxNow?: number): SkillValue {
  // Gelişim tavanı: mutlak ceiling + yetişkin potansiyeli + (verilirse) yaşa uygun tavan (maxNow).
  const cap = Math.min(value.ceiling, value.potential, maxNow ?? value.potential);
  const span = Math.max(1, cap - value.floor);
  const headroom = clamp((cap - value.current) / span, 0, 1);
  // Tavana yakınken küçük, uzaktayken tam gelişim (0.15 taban → tam durmaz ama çok yavaşlar)
  const gain = stimulus * ageFactor * (0.15 + 0.85 * headroom);
  // Yaş tavanı düşük olsa bile mevcut skill DÜŞMEZ; yalnız gelişim durur.
  const upper = Math.max(cap, value.current);
  const current = clamp(value.current + gain, value.floor, upper);
  return { ...value, current: round2(current) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
