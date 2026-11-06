/**
 * Kumbaram — işlem kaydı (ledger). Çocuğun Denar gelir/giderini kalem kalem tutar: "o hafta neye ne
 * harcadı ne aldı" (kullanıcı kararı 06.11). Her bakiye hareketi (turnuva ödülü, harçlık, aidat, katılım,
 * malzeme, reklam) bir kayıt ekler. SAF modül: I/O yok. Kalıcılık GameState.ledger (JSON).
 */
import { DAYS_PER_MONTH } from "./season";

export interface LedgerEntry {
  day: number; // olayın global oyun-günü (hafta filtresi için)
  key: string; // i18n: ledger.<key> (allowance | dues | entry | refund | equipment | ad | prize)
  amount: number; // işaretli Denar: + gelir, − gider
  arg?: string; // ek bilgi (turnuva seviyesi, ekipman id'si) — UI {arg} ile gösterir
}

/** Saklanan en çok işlem (eskiler budanır — alan şişmesin). Bir hafta ~birkaç işlem; 60 bolca yeter. */
export const LEDGER_MAX = 60;

export function parseLedger(json: string | null | undefined): LedgerEntry[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((e): e is LedgerEntry => !!e && typeof (e as LedgerEntry).amount === "number" && typeof (e as LedgerEntry).day === "number");
  } catch {
    return [];
  }
}

export function encodeLedger(entries: readonly LedgerEntry[]): string {
  return JSON.stringify(entries);
}

/** Yeni kaydı ekler; en fazla LEDGER_MAX tutar (baştan budar). */
export function appendLedger(prev: readonly LedgerEntry[], entry: LedgerEntry): LedgerEntry[] {
  const next = [...prev, entry];
  return next.length > LEDGER_MAX ? next.slice(next.length - LEDGER_MAX) : next;
}

/** Bir günün ait olduğu oyun-haftası indeksi (7 gün = 1 hafta). */
export function weekOf(day: number): number {
  return Math.floor(day / DAYS_PER_MONTH);
}

/** Verilen güne ait oyun-haftasının kayıtları (yeniden eskiye değil, eklenme sırası korunur). */
export function entriesForWeek(entries: readonly LedgerEntry[], currentDay: number): LedgerEntry[] {
  const w = weekOf(currentDay);
  return entries.filter((e) => weekOf(e.day) === w);
}

/** Bir kayıt kümesinin gelir/gider/net toplamı. */
export function totals(entries: readonly LedgerEntry[]): { income: number; expense: number; net: number } {
  let income = 0;
  let expense = 0;
  for (const e of entries) {
    if (e.amount >= 0) income += e.amount;
    else expense += e.amount;
  }
  return { income, expense, net: income + expense };
}
