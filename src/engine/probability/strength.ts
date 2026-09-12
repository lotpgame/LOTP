/**
 * Probability Engine — güç ve olasılık modeli (GDD 20).
 *
 * "Kim daha güçlü?" değil, "bu durumda hangi sonucun ihtimali ne?" (GDD 20.2). Skill farkı
 * avantaj verir, kesinlik vermez (GDD 20.5, 20.22). Effective strength = temel yetenek +
 * modifier'lar (M2: yorgunluk; psychology/trait/equipment M6'da eklenir). Modifier'lar ayrı
 * izlenir → "neden kazandı/kaybetti" açıklanabilir (GDD 20.34–20.36).
 */
import { clamp, type SkillCategory, type Weapon } from "../domain";
import { categoryAverage, type PlayerSkills } from "../skill";

/** Silaha göre kategori ağırlıkları (GDD 9.13, 20.8). Silahlar belirgin şekilde farklı. */
export const WEAPON_WEIGHTS: Record<Weapon, Record<SkillCategory, number>> = {
  // Flöre: tempo/teknik/hız öne çıkar
  FOIL: { TECHNICAL: 0.38, PHYSICAL: 0.24, TACTICAL: 0.22, MENTAL: 0.16 },
  // Epe: sabır/mesafe/zamanlama → taktik ve mental ağırlıklı
  EPEE: { TACTICAL: 0.34, TECHNICAL: 0.26, MENTAL: 0.24, PHYSICAL: 0.16 },
  // Kılıç: hız/reaksiyon/patlayıcılık → fiziksel baskın
  SABRE: { PHYSICAL: 0.4, TECHNICAL: 0.28, TACTICAL: 0.18, MENTAL: 0.14 },
};

export interface StrengthModifier {
  label: string;
  value: number; // + avantaj, − dezavantaj
}

export interface EffectiveStrength {
  base: number; // silaha göre ağırlıklı yetenek
  modifiers: StrengthModifier[];
  total: number; // base + modifier toplamı (o anki performans)
}

/**
 * Effective strength: permanent skill'lerden (silah ağırlıklı) türetilen o anki performans
 * (GDD 9.31–9.32). Permanent skill DEĞİŞMEZ; bu yalnız hesap için türetilir.
 */
export function computeEffectiveStrength(
  skills: PlayerSkills,
  weapon: Weapon,
  opts: { fatigue: number; sharpness?: number },
): EffectiveStrength {
  const w = WEAPON_WEIGHTS[weapon];
  let base = 0;
  for (const cat of Object.keys(w) as SkillCategory[]) {
    base += categoryAverage(skills, cat) * w[cat];
  }
  const modifiers: StrengthModifier[] = [];
  const fatiguePenalty = opts.fatigue * 0.08; // yorgunluk 100 → ~8 puan düşüş
  if (fatiguePenalty > 0.05) {
    modifiers.push({ label: "Yorgunluk", value: -round1(fatiguePenalty) });
  }
  // Keskinlik (sharpness): 50 nötr; yüksek keskinlik küçük artı, düşük keskinlik eksi (GDD 14.81).
  if (opts.sharpness != null) {
    const s = (opts.sharpness - 50) * 0.06; // 100 → +3, 0 → −3
    if (Math.abs(s) > 0.05) modifiers.push({ label: "Keskinlik", value: round1(s) });
  }
  const total = base + modifiers.reduce((acc, m) => acc + m.value, 0);
  return { base: round1(base), modifiers, total: round1(total) };
}

/**
 * Güç farkını tek tuş kazanma olasılığına çevirir. Eğrisel: +5 anlamlı, +15 büyük,
 * +30 çok büyük avantaj (GDD 20.21). Soft-cap ile %0/%100'den kaçınılır (GDD 20.22).
 */
export function winProbability(diff: number): number {
  const p = 1 / (1 + Math.pow(10, -diff / 18));
  return clamp(p, 0.06, 0.94);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
