/**
 * Kondisyon — keskinlik (sharpness) ve sakatlık (GDD 14.37–14.38, 14.81, 8.18).
 *
 * Saf ve deterministik. Sharpness: antrenman/maç artırır, aşırı dinlenme düşürür; Combat
 * performansını etkiler (Probability Engine'de modifier). Sakatlık: yorgunluk + yaş riski;
 * gerçekleşirse oyuncu birkaç hafta INJURED kalır (turnuvaya giremez, GDD 8.19).
 */
import { clamp } from "./domain";
import type { SeededRng } from "./probability";
import type { TrainingType } from "./training";

export const SHARPNESS_MIN = 0;
export const SHARPNESS_MAX = 100;

/** Bir antrenman seansının keskinliğe etkisi: çalışma keskinliği artırır, dinlenme düşürür. */
export function sessionSharpnessDelta(type: TrainingType): number {
  return type === "REST" ? -3 : 4;
}

/** Turnuvaya katılmak keskinliği belirgin artırır (yarışma temposu). */
export const COMPETITION_SHARPNESS_GAIN = 6;

export function applySharpness(current: number, delta: number): number {
  return clamp(current + delta, SHARPNESS_MIN, SHARPNESS_MAX);
}

/**
 * Bir haftalık aktivite sonrası sakatlık olasılığı (GDD 14.38 yorgunluk eşikleri + yaş).
 * Yorgunluk yükseldikçe risk hızla artar; ileri yaş küçük ek risk.
 */
export function injuryChance(fatigue: number, age: number): number {
  let base: number;
  if (fatigue <= 30) base = 0.01;
  else if (fatigue <= 60) base = 0.03;
  else if (fatigue <= 80) base = 0.08;
  else if (fatigue <= 90) base = 0.15;
  else base = 0.25;
  const ageExtra = age >= 30 ? 0.03 : age >= 24 ? 0.01 : 0;
  return clamp(base + ageExtra, 0, 0.4);
}

export interface InjuryResult {
  injured: boolean;
  weeks: number; // sakatlık süresi (hafta); injured=false ise 0
}

/** Sakatlık kontrolü. Tohumlu RNG ile deterministik. Süre 1–3 hafta (basit). */
export function rollInjury(rng: SeededRng, fatigue: number, age: number): InjuryResult {
  if (rng.bool(injuryChance(fatigue, age))) {
    return { injured: true, weeks: rng.int(1, 3) };
  }
  return { injured: false, weeks: 0 };
}
