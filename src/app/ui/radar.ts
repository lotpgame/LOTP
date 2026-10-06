/**
 * Yetenek radarı geometrisi (Bugün ekranı, docs/GORSEL_ETKILESIM.md §8) — saf, testli. Merkez (0, 0); eksen i
 * tepeden başlar, saat yönünde eşit aralıkla dizilir. Değer 0..max → yarıçap 0..r (max'ı aşan değer kenarda kalır).
 */

export function radarPoint(i: number, n: number, r: number): { x: number; y: number } {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return { x: Math.round(r * Math.cos(a) * 10) / 10, y: Math.round(r * Math.sin(a) * 10) / 10 };
}

/** SVG `points` dizesi: her değer kendi ekseninde, max'a oranla. */
export function radarPolygon(values: readonly number[], max: number, r: number): string {
  return values
    .map((v, i) => {
      const p = radarPoint(i, values.length, r * Math.max(0, Math.min(1, max > 0 ? v / max : 0)));
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

/** Eksen başına büyüme: şimdiki − çeyrek başı, tam sayıya yuvarlı ("+N"); çeyrek başı yoksa 0. */
export function radarGrowth(current: number, base: number | undefined): number {
  return base == null ? 0 : Math.round(current - base);
}
