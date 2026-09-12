/**
 * Çevre modifier'ları — Coach, Club, Equipment'ın antrenman ve combat'a etkisi
 * (GDD 12, 13, 15). Bu engine'ler kendi verilerini tutar; etkileri burada modifier'a çevrilir.
 * Etkiler küçük tutulur: iyi ortam avantaj sağlar ama tek başına elit yapmaz (GDD 14.45).
 *
 * M6: kulüp tesis seviyesi + koç (uzmanlık) + ekipman seviyesi antrenman verimini; ekipman
 * combat'ı hafifçe etkiler. Tam kulüp/koç transferi ve ekipman dükkânı derinliği M7+.
 */
import { clamp, type SkillCategory } from "./domain";
import type { TrainingType } from "./training";

/** Kulüp tesisi (0–100) → antrenman çarpanı ~0.9–1.1 (GDD 14.45). */
export function clubTrainingMultiplier(facility: number): number {
  return clamp(0.9 + (facility / 100) * 0.2, 0.9, 1.1);
}

/** Koç: yeteneği + uzmanlığı ilgili antrenmanı güçlendirir (GDD 14.43–14.44). */
export function coachTrainingMultiplier(
  coachSkill: number,
  coachSpecialty: SkillCategory | null,
  type: TrainingType,
): number {
  let m = 0.95 + (coachSkill / 100) * 0.15; // 0.95–1.10
  if (coachSpecialty && type === coachSpecialty) m += 0.05; // uzmanlık uyumu
  return clamp(m, 0.9, 1.2);
}

/** Ekipman seviyesi (1–5) → küçük antrenman çarpanı (GDD 14.46). */
export function equipmentTrainingMultiplier(level: number): number {
  return 1 + (level - 1) * 0.01; // seviye 5 → +%4
}

/** Ekipman seviyesi (1–5) → küçük combat katkısı (GDD 18.39, sınırlı). */
export function equipmentCombatModifier(level: number): number {
  return (level - 1) * 0.5; // seviye 5 → +2
}
