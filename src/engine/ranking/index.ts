/**
 * Ranking Engine — turnuva derecesini sıralama puanına çevirir (GDD 19). Maç sonucu ÜRETMEZ
 * (GDD 5.36); yalnız Tournament'tan gelen final dereceyi puana çevirir (GDD 19.4).
 *
 * M1: tek turnuva seviyesi (Open) puan tablosu (GDD 17.83). Küçük puanlar değerlidir (GDD 2.23).
 * Quarter Ranking, seviye çarpanları ve rakip gücü M3–M4'te gelir.
 */

/** Dereceye (position) göre Open turnuvası puanı (GDD 17.83). Diğer dereceler puansız. */
export const OPEN_POINTS: Record<number, number> = {
  1: 6, // Şampiyon
  2: 4.5, // Finalist
  3: 3.5, // Yarı final (ortak)
  5: 2.5, // Çeyrek final (5–8)
};

/** Bir dereceye karşılık gelen ranking puanı. Tanımsız derece → 0. */
export function rankingPointsForPosition(
  position: number,
  table: Record<number, number> = OPEN_POINTS,
): number {
  return table[position] ?? 0;
}

export interface RankingEntry {
  playerId: number;
  points: number;
}

export interface RankedEntry extends RankingEntry {
  position: number;
}

/**
 * Puanlara göre sıralı liste üretir (yüksek puan üstte, GDD 19.26). Eşit puanlar aynı
 * sırayı paylaşmaz; deterministik olması için playerId ile ikincil sıralanır (kesin
 * tie-break M3'te). Pozisyonlar 1'den başlar.
 */
export function rankEntries(entries: readonly RankingEntry[]): RankedEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b.points - a.points || a.playerId - b.playerId,
  );
  return sorted.map((e, i) => ({ ...e, position: i + 1 }));
}
