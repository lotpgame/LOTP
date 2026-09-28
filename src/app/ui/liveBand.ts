/**
 * Canlı eleme maçında ScoreBug'ın sabit (sticky) bandında gösterilecek durum etiketi — anlatım
 * aşağı kaydıkça ekrandan kaybolan periyot başlığının ("▸ N. Periyot") yerini tutar, gerçek eskrim
 * cihazlarındaki periyot/öncelik göstergesi gibi. Saf (I/O yok) → testli.
 */
import { t, type Locale } from "@/i18n";

const PERIOD_HEADER_RE = /^▸\s*(?:(\d+)\.\s*Periyot|Period\s*(\d+))\b/;
const PRIORITY_RE = /öncelik kurası|priority draw/i;

/** Açılmış satırlar arasında en son periyot başlığının numarası (TR/EN) — yoksa null. */
export function currentPeriodNo(log: string[], shown: number): number | null {
  for (let i = Math.min(shown, log.length) - 1; i >= 0; i--) {
    const m = PERIOD_HEADER_RE.exec(log[i]);
    if (m) return Number(m[1] ?? m[2]);
  }
  return null;
}

/** Açılmış satırlarda "öncelik kurası" (altın tuş / la belle) satırı görüldü mü? */
export function isPriorityPhase(log: string[], shown: number): boolean {
  return log.slice(0, shown).some((l) => PRIORITY_RE.test(l));
}

/** Altın tuş (la belle) periyot numarasını geçersiz kılar; yoksa güncel periyot etiketi. */
export function periodBand(locale: Locale, log: string[], shown: number): { label: string; prio?: boolean } | undefined {
  if (isPriorityPhase(log, shown)) return { label: t(locale, "live.goldenPoint"), prio: true };
  const n = currentPeriodNo(log, shown);
  return n == null ? undefined : { label: t(locale, "live.periodBand", { n }) };
}
