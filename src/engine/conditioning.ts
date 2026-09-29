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

/**
 * Günlük doğal toparlanma (yorgunluk azalması) — Dayanıklılık (endurance) yükseldikçe daha hızlı.
 * Kondisyonun "gizli" yöneticisi budur: fit sporcu turnuvalar arası daha çabuk toparlanır.
 * end 20 → ~8/gün, 40 → ~11, 60 → ~14, 80 → ~17.
 */
export function dailyRecovery(endurance: number): number {
  return 6 + endurance * 0.18;
}

/**
 * Maç yorgunluğu çarpanı — Dayanıklılık yükseldikçe maçta daha az yorulur.
 * end 20 → ×0.92, 60 → ×0.76, 100 → ×0.60 (0.55 tabana kadar).
 */
export function matchFatigueMultiplier(endurance: number): number {
  return clamp(1 - endurance * 0.004, 0.55, 1);
}

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
  days: number; // sakatlık süresi (OYUN günü); injured=false ise 0
}

/**
 * Sakatlık kontrolü. Tohumlu RNG ile deterministik.
 * #35 (kullanıcı 09-29): ŞİMDİLİK tüm sakatlıklar HAFİF (1–2 gün) — test sırasında uzun sakatlık istenmiyor.
 * (Eskiden bazen 3–5, nadiren 7–14 gündü; ağır kademeler test sonrası geri gelebilir.)
 */
export function rollInjury(rng: SeededRng, fatigue: number, age: number): InjuryResult {
  if (!rng.bool(injuryChance(fatigue, age))) return { injured: false, days: 0 };
  return { injured: true, days: rng.int(1, 2) };
}

/** Günün hâli — o güne özel küçük form dalgalanması (herkeste). Üçgen dağılım: çoğu gün ~nötr,
 * bazı günler belirgin iyi/kötü. Kalıcı moralden AYRIDIR (bugün formda mısın?). ±DAILY_MOOD_MAX. */
export const DAILY_MOOD_MAX = 2.5;
export function dailyMood(rng: SeededRng): number {
  const u = (rng.float(-1, 1) + rng.float(-1, 1)) / 2; // üçgen ≈ bell
  return Math.round(u * DAILY_MOOD_MAX * 10) / 10;
}
