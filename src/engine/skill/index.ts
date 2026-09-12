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
  const baseCurrent = clamp(28 + (age - 10) * 2.2, 28, 62);
  const youthFactor = clamp((22 - age) / 12, 0.4, 1.3);
  const profileCategory = PROFILE_CATEGORY[profile];

  const result = {} as PlayerSkills;
  for (const def of SKILLS) {
    const jitter = rng.float(-6, 6);
    let profileBonus = 0;
    if (profileCategory) {
      profileBonus = def.category === profileCategory ? 7 : -2;
    }
    const current = clamp(baseCurrent + jitter + profileBonus, 15, 80);
    const potential = clamp(current + rng.float(8, 32) * youthFactor, current + 3, 100);
    const floor = clamp(current - 12, 5, current);
    result[def.key] = {
      current: round2(current),
      potential: round2(potential),
      floor: round2(floor),
      ceiling: round2(potential),
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
export function growSkill(value: SkillValue, stimulus: number, ageFactor = 1): SkillValue {
  const span = Math.max(1, value.potential - value.floor);
  const headroom = clamp((value.potential - value.current) / span, 0, 1);
  // Potansiyele yakınken küçük, uzaktayken tam gelişim (0.15 taban → tam durmaz ama çok yavaşlar)
  const gain = stimulus * ageFactor * (0.15 + 0.85 * headroom);
  const cap = Math.min(value.ceiling, value.potential);
  const current = clamp(value.current + gain, value.floor, cap);
  return { ...value, current: round2(current) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
