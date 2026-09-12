/**
 * Ranking Engine — turnuva derecesini sıralama puanına çevirir (GDD 19). Maç sonucu ÜRETMEZ
 * (GDD 5.36); yalnız Tournament'tan gelen final dereceyi puana çevirir (GDD 19.4).
 *
 * M3: seviyeye göre puan tabloları (GDD 17.82–17.88). Küçük puanlar değerlidir (GDD 2.23).
 * Quarter Ranking sıfırlama, rakip gücü ve rolling ranking M4+ 'ta gelir.
 */
import type { TournamentLevel } from "../domain";

/**
 * Seviye × derece(position) → Quarter Ranking puanı (GDD 17.82–17.88).
 * Derece anahtarları eleme tablosu kademeleridir: 1=şampiyon, 2=finalist, 3=yarı final,
 * 5=çeyrek (5–8), 9=son 16, 17=son 32, 33=son 64. Tanımsız derece → 0 (GDD 17.82: pool'da
 * elenen puan almaz).
 */
export const POINT_TABLES: Record<TournamentLevel, Record<number, number>> = {
  IL: { 1: 5, 2: 3.5, 3: 2.5, 5: 1.5, 9: 1.0, 17: 0.5 },
  OPEN: { 1: 6, 2: 4.5, 3: 3.5, 5: 2.5, 9: 1.5, 17: 1.0 },
  TURKIYE: { 1: 12, 2: 9, 3: 7, 5: 5, 9: 3, 17: 2, 33: 1 },
  SATELLITE: { 1: 16, 2: 13, 3: 10, 5: 7, 9: 5, 17: 3, 33: 2 },
  GRAND_PRIX: { 1: 24, 2: 20, 3: 16, 5: 12, 9: 8, 17: 5, 33: 3 },
  EUROPEAN: { 1: 32, 2: 27, 3: 22, 5: 16, 9: 10 },
  WORLD_CUP: { 1: 40, 2: 34, 3: 28, 5: 20, 9: 14 },
};

/** Bir dereceye (position) karşılık gelen ranking puanı. Tanımsız derece → 0. */
export function rankingPointsForPosition(
  position: number,
  level: TournamentLevel = "OPEN",
): number {
  return POINT_TABLES[level][position] ?? 0;
}

export interface RankingEntry {
  playerId: number;
  points: number;
}

export interface RankedEntry extends RankingEntry {
  position: number;
}

/**
 * Puanlara göre sıralı liste üretir (yüksek puan üstte, GDD 19.26). Deterministik olması için
 * eşit puanlar playerId ile ikincil sıralanır (kesin tie-break M4'te). Pozisyonlar 1'den başlar.
 */
export function rankEntries(entries: readonly RankingEntry[]): RankedEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b.points - a.points || a.playerId - b.playerId,
  );
  return sorted.map((e, i) => ({ ...e, position: i + 1 }));
}
