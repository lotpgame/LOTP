/**
 * Çevre modifier'ları — Coach, Club, Equipment'ın antrenman ve combat'a etkisi
 * (GDD 12, 13, 15). Bu engine'ler kendi verilerini tutar; etkileri burada modifier'a çevrilir.
 * Etkiler küçük tutulur: iyi ortam avantaj sağlar ama tek başına elit yapmaz (GDD 14.45).
 *
 * M6: kulüp tesis seviyesi + koç (uzmanlık) + ekipman seviyesi antrenman verimini; ekipman
 * combat'ı hafifçe etkiler. Tam kulüp/koç transferi ve ekipman dükkânı derinliği M7+.
 */
import type { SkillCategory } from "./domain";
import type { TrainingType } from "./training";

/**
 * Kulüp tesisi (0–100) → antrenman SEANS TABANI (kullanıcı kararı 10.11): doğrudan kademeli taban.
 * 0–20 → 0.05 · 20–40 → 0.06 · 40–60 → 0.07 · 60–80 → 0.08 · 80–100 → 0.09 Đ-değil-skill/seans.
 * Taban budur; yaş + tavan-yakınlığı + ufak antrenör/profil ekleri modüle eder (careerService advanceDay).
 * (Eski 0.36 sabit taban + çarpan modeli kaldırıldı — gelişim artık çok daha kademeli/uzun.)
 */
export function clubTrainingBase(facility: number): number {
  const tier = Math.min(4, Math.floor(Math.max(0, facility) / 20)); // 0..4 (80–100 dahil en üst)
  return 0.05 + tier * 0.01; // 0.05,0.06,0.07,0.08,0.09
}

/** Antrenör uzmanlık uyumu → küçük ek (kullanıcı 10.11): o kategoride uzman koç varsa +%20, yoksa yok. */
export function coachSpecialtyBonus(coachSpecialty: SkillCategory | null, type: TrainingType): number {
  return coachSpecialty && type === coachSpecialty ? 1.2 : 1;
}

/** Ekipman seviyesi (1–5) → küçük antrenman çarpanı (GDD 14.46). */
export function equipmentTrainingMultiplier(level: number): number {
  return 1 + (level - 1) * 0.01; // seviye 5 → +%4
}

/** Ekipman seviyesi (1–5) → küçük combat katkısı (GDD 18.39, sınırlı). */
export function equipmentCombatModifier(level: number): number {
  return (level - 1) * 0.5; // seviye 5 → +2
}
