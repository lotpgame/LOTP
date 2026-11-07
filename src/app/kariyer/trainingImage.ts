/**
 * Antrenman türü görseli (saf): TrainingType / SkillCategory → kullanıcının özel görseli.
 * Görseller: public/img/training/<slug>.webp (technical/physical/mental/tactical/rest).
 */
export function trainingImg(type: string): string {
  const m: Record<string, string> = {
    TECHNICAL: "technical",
    PHYSICAL: "physical",
    MENTAL: "mental",
    TACTICAL: "tactical",
    REST: "rest",
  };
  return `/img/training/${m[type] ?? "rest"}.webp`;
}
