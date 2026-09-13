/**
 * Training Engine — antrenmanı ve gelişim uyarısını hesaplar (GDD 14).
 *
 * Sorumluluk: antrenman türü/verim/yorgunluk. Skill'in NİHAİ değerini Skill Engine belirler
 * (GDD 14.97–14.98). Burada gelişim "stimulus"u üretilir ve Skill Engine'in growSkill'i ile
 * uygulanır. M1: günde tek aktivite; verim yaş + yorgunluğa bağlı (GDD 14.32–14.39).
 */
import { clamp, type SkillCategory } from "../domain";
import { SKILLS, growSkill, type PlayerSkills, type SkillKey } from "../skill";

export type TrainingType = SkillCategory | "REST";

export const TRAINING_TYPES: readonly TrainingType[] = [
  "TECHNICAL",
  "PHYSICAL",
  "MENTAL",
  "TACTICAL",
  "REST",
] as const;

export const TRAINING_LABEL_TR: Record<TrainingType, string> = {
  TECHNICAL: "Teknik Antrenman",
  PHYSICAL: "Fiziksel Antrenman",
  MENTAL: "Mental Çalışma",
  TACTICAL: "Taktik Çalışma",
  REST: "Dinlenme",
};

/** Antrenman türüne göre temel yorgunluk üretimi (GDD 14.35). REST negatif (toparlanma). */
const BASE_FATIGUE: Record<TrainingType, number> = {
  PHYSICAL: 16,
  TECHNICAL: 10,
  TACTICAL: 9,
  MENTAL: 6,
  REST: -28,
};

const PRIMARY_STIMULUS = 0.6;

export interface TrainingResult {
  skills: PlayerSkills;
  /** Yorgunluk değişimi (+ artar, − toparlanır). Çağıran 0–100 aralığında tutar. */
  fatigueDelta: number;
  /** Bu antrenmanda gelişen skill'ler ve miktarları (UI'da "Atak +0.3" göstermek için). */
  gains: Partial<Record<SkillKey, number>>;
}

/** Yaşa bağlı öğrenme çarpanı (GDD 14.39): gençler hızlı, yaş ilerledikçe yavaşlar. */
function ageFactor(age: number): number {
  return clamp(1.3 - (age - 12) * 0.03, 0.6, 1.4);
}

/** Yorgunluğa bağlı verim (GDD 14.33): yorgun oyuncu tam verim alamaz. */
function fatigueEfficiency(currentFatigue: number): number {
  return clamp(1 - currentFatigue / 150, 0.4, 1);
}

/**
 * Bir günlük antrenmanı uygular. Saf: girdi skill'leri bozmaz, yeni skill seti döndürür.
 */
export function applyTraining(
  skills: PlayerSkills,
  opts: {
    type: TrainingType;
    age: number;
    currentFatigue: number;
    /** Çevre çarpanı (trait × psikoloji × kulüp × koç × ekipman). Varsayılan 1. */
    efficiencyMultiplier?: number;
    /** Skill'e özel çarpan (ör. ağırlık → hız gelişimi). Varsayılan 1. */
    skillMultipliers?: Partial<Record<SkillKey, number>>;
  },
): TrainingResult {
  const { type, age, currentFatigue } = opts;
  const fatigueDelta = BASE_FATIGUE[type];

  if (type === "REST") {
    return { skills, fatigueDelta, gains: {} };
  }

  const factor = ageFactor(age);
  const efficiency = fatigueEfficiency(currentFatigue);
  const stimulus = PRIMARY_STIMULUS * efficiency * (opts.efficiencyMultiplier ?? 1);

  const next: PlayerSkills = { ...skills };
  const gains: Partial<Record<SkillKey, number>> = {};
  for (const def of SKILLS) {
    if (def.category !== type) continue;
    const before = next[def.key].current;
    const skillMult = opts.skillMultipliers?.[def.key] ?? 1;
    next[def.key] = growSkill(next[def.key], stimulus * skillMult, factor);
    const delta = next[def.key].current - before;
    if (delta > 0) gains[def.key] = Math.round(delta * 100) / 100;
  }

  return { skills: next, fatigueDelta, gains };
}
