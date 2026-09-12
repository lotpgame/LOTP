/**
 * Skill kayıt defteri (registry) — 4 ana grup altındaki alt-skill'ler (GDD 9.6–9.9).
 *
 * M1 dilimi için sade bir set (10 skill). GDD daha fazlasını listeler; ileride genişler.
 * Kod anahtarları İngilizce; UI etiketleri Türkçe.
 */
import type { SkillCategory } from "../domain";

export const SKILL_KEYS = [
  // TECHNICAL
  "attack",
  "defense",
  "footwork",
  // PHYSICAL
  "speed",
  "endurance",
  "reaction",
  // MENTAL
  "concentration",
  "composure",
  // TACTICAL
  "reading",
  "timing",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export interface SkillDef {
  readonly key: SkillKey;
  readonly label: string; // Türkçe UI etiketi
  readonly category: SkillCategory;
}

export const SKILLS: readonly SkillDef[] = [
  { key: "attack", label: "Atak", category: "TECHNICAL" },
  { key: "defense", label: "Savunma", category: "TECHNICAL" },
  { key: "footwork", label: "Ayak Tekniği", category: "TECHNICAL" },
  { key: "speed", label: "Hız", category: "PHYSICAL" },
  { key: "endurance", label: "Dayanıklılık", category: "PHYSICAL" },
  { key: "reaction", label: "Reaksiyon", category: "PHYSICAL" },
  { key: "concentration", label: "Konsantrasyon", category: "MENTAL" },
  { key: "composure", label: "Soğukkanlılık", category: "MENTAL" },
  { key: "reading", label: "Rakip Okuma", category: "TACTICAL" },
  { key: "timing", label: "Zamanlama", category: "TACTICAL" },
] as const;

export const SKILLS_BY_KEY: Record<SkillKey, SkillDef> = Object.fromEntries(
  SKILLS.map((s) => [s.key, s]),
) as Record<SkillKey, SkillDef>;

/** Bir kategoriye ait skill anahtarları. */
export function skillKeysOf(category: SkillCategory): SkillKey[] {
  return SKILLS.filter((s) => s.category === category).map((s) => s.key);
}
