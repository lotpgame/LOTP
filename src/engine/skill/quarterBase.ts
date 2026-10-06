/**
 * Çeyrek başı yetenek değerleri — Bugün ekranındaki radar (docs/GORSEL_ETKILESIM.md §8) "geçen çeyreği" kesikli
 * çizer ve büyüyen eksende "+N" gösterir. Değerler her çeyreğin İLK işlenen gününde, o günün antrenmanından önce
 * dondurulur (çeyrek başı = geçen çeyreğin sonu). Saf (I/O yok) → testli.
 */

export interface SkillQuarterBase {
  q: number; // dondurulduğu çeyrek (quarterOf)
  v: Record<string, number>; // yetenek anahtarı → değer
}

/** Kayıtlı JSON'u okur; yoksa ya da bozuksa null (radar o zaman kesikli çizgiyi çizmez). */
export function parseSkillQuarterBase(json: string | null | undefined): SkillQuarterBase | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json) as Partial<SkillQuarterBase>;
    return typeof o.q === "number" && o.v != null && typeof o.v === "object" ? { q: o.q, v: o.v } : null;
  } catch {
    return null;
  }
}

/** Yeni çeyreğe girildiyse (ya da hiç kayıt yoksa) şimdiki değerleri dondurur; aynı çeyrekte kaydı korur. */
export function rollSkillQuarterBase(
  prev: SkillQuarterBase | null,
  quarter: number,
  values: Record<string, number>,
): SkillQuarterBase {
  if (prev && prev.q === quarter) return prev;
  return { q: quarter, v: Object.fromEntries(Object.entries(values).map(([k, x]) => [k, Math.round(x * 100) / 100])) };
}
