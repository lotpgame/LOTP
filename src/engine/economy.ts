/**
 * Economy Engine — para, ödül ve gider (GDD 16). Sportif performansı hesaplamaz; turnuva
 * derecesini paraya çevirir (GDD 5.14). Skill geliştirmez (GDD 5.36).
 *
 * M6: seviye × derece ödül tablosu + ekipman yükseltme maliyeti. Sponsorluk/kulüp bütçesi sonra.
 */
import type { TournamentLevel } from "./domain";

export const STARTING_BALANCE = 1000;

/**
 * Seviye × derece → para ödülü (GDD 17.75). Prestij arttıkça ödül artar.
 * DENGE (28.09, docs/EKONOMI.md): kazanç kasıtlı DÜŞÜK — şampiyonun 1 sezonu ≈ ~1 tam takım.
 * Yurt içi (İl/Türkiye/Open) küçük; uluslararası (yılda 1, kotayla) belirgin ama abartısız.
 * Böylece para satın alma (monetization) anlamlı olur; iyi oyuncu yine de kendi bakımını karşılar.
 */
const PRIZE_TABLES: Record<TournamentLevel, Record<number, number>> = {
  IL: { 1: 50, 2: 22, 3: 12 },
  OPEN: { 1: 90, 2: 45, 3: 25 },
  TURKIYE: { 1: 100, 2: 60, 3: 40 },
  SATELLITE: { 1: 300, 2: 180, 3: 120, 5: 60 },
  GRAND_PRIX: { 1: 500, 2: 320, 3: 220, 5: 120 },
  EUROPEAN: { 1: 800, 2: 520, 3: 360, 5: 200 },
  WORLD_CUP: { 1: 1200, 2: 800, 3: 560, 5: 320 },
};

export function prizeFor(level: TournamentLevel, position: number): number {
  return PRIZE_TABLES[level][position] ?? 0;
}

export const MAX_EQUIPMENT_LEVEL = 5;

/** `level` → `level+1` yükseltme maliyeti. Üst seviyeler pahalıdır. */
export function equipmentUpgradeCost(level: number): number {
  return level * 500;
}
