/**
 * Trait Engine — oyuncunun karakteristik özellikleri (GDD 10). Trait'in kendisi burada; etkisi
 * diğer engine'lerde modifier olarak okunur (GDD 5.8). Trait ≠ skill (GDD 9.40).
 *
 * M6: küçük bir trait seti; antrenman verimi ve combat performansına küçük etkiler.
 */
import type { SeededRng } from "./probability";

export type TraitKey =
  | "HARDWORKING"
  | "LAZY"
  | "DISCIPLINED"
  | "AGGRESSIVE"
  | "CALM"
  | "AMBITIOUS";

export interface TraitDef {
  key: TraitKey;
  label: string;
  description: string;
  /** Antrenman verimi çarpanı (1 = etkisiz). */
  trainingMult: number;
  /** Combat effective strength'e katkı (puan). */
  combatMod: number;
}

export const TRAITS: Record<TraitKey, TraitDef> = {
  HARDWORKING: { key: "HARDWORKING", label: "Çalışkan", description: "Antrenmandan daha çok verim alır.", trainingMult: 1.1, combatMod: 0 },
  LAZY: { key: "LAZY", label: "Tembel", description: "Antrenman verimi düşüktür.", trainingMult: 0.9, combatMod: 0 },
  DISCIPLINED: { key: "DISCIPLINED", label: "Disiplinli", description: "İstikrarlı gelişir.", trainingMult: 1.05, combatMod: 0 },
  AGGRESSIVE: { key: "AGGRESSIVE", label: "Agresif", description: "Maçta baskı kurar.", trainingMult: 1.0, combatMod: 1.5 },
  CALM: { key: "CALM", label: "Soğukkanlı", description: "Baskı altında sakin kalır.", trainingMult: 1.0, combatMod: 1.0 },
  AMBITIOUS: { key: "AMBITIOUS", label: "Hırslı", description: "Gelişime aç.", trainingMult: 1.05, combatMod: 0.5 },
};

export const TRAIT_KEYS = Object.keys(TRAITS) as TraitKey[];

/** Verilen trait'lerin antrenman verimi çarpanları çarpımı. */
export function traitTrainingMultiplier(traits: readonly TraitKey[]): number {
  return traits.reduce((acc, t) => acc * (TRAITS[t]?.trainingMult ?? 1), 1);
}

/** Verilen trait'lerin combat katkıları toplamı. */
export function traitCombatModifier(traits: readonly TraitKey[]): number {
  return traits.reduce((acc, t) => acc + (TRAITS[t]?.combatMod ?? 0), 0);
}

/** Başlangıçta rastgele (tekrarsız) trait seçer. Deterministik (rng). */
export function generateTraits(rng: SeededRng, count = 2): TraitKey[] {
  return rng.shuffle(TRAIT_KEYS).slice(0, count);
}

export function traitLabels(traits: readonly TraitKey[]): string[] {
  return traits.map((t) => TRAITS[t]?.label ?? t);
}
