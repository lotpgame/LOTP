/**
 * WCAG kontrast oranı — ThemeSettings'te kişisel renk seçiminin okunaklı kalıp kalmadığını göstermek için.
 * Saf fonksiyon (I/O yok) → testli. Formül: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return NaN;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => srgbToLinear(parseInt(h, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** İki renk arasındaki kontrast oranı (1–21). Geçersiz hex → 1 (en düşük, uyarı tetikler). */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  if (Number.isNaN(la) || Number.isNaN(lb)) return 1;
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA (normal metin) eşiği. */
export const MIN_CONTRAST = 4.5;
