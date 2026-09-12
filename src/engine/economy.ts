/**
 * Economy Engine — para, ödül ve gider (GDD 16). Sportif performansı hesaplamaz; turnuva
 * derecesini paraya çevirir (GDD 5.14). Skill geliştirmez (GDD 5.36).
 *
 * M6: seviye × derece ödül tablosu + ekipman yükseltme maliyeti. Sponsorluk/kulüp bütçesi sonra.
 */
import type { TournamentLevel } from "./domain";

export const STARTING_BALANCE = 1000;

/** Seviye × derece → para ödülü. Prestij arttıkça ödül artar (GDD 17.75). */
const PRIZE_TABLES: Record<TournamentLevel, Record<number, number>> = {
  IL: { 1: 100, 2: 60, 3: 40 },
  OPEN: { 1: 250, 2: 150, 3: 100, 5: 50 },
  TURKIYE: { 1: 800, 2: 500, 3: 300, 5: 150, 9: 80 },
  SATELLITE: { 1: 1500, 2: 1000, 3: 700, 5: 400, 9: 200 },
  GRAND_PRIX: { 1: 3000, 2: 2000, 3: 1400, 5: 800, 9: 400 },
  EUROPEAN: { 1: 5000, 2: 3500, 3: 2500, 5: 1500, 9: 800 },
  WORLD_CUP: { 1: 8000, 2: 5500, 3: 4000, 5: 2500, 9: 1200 },
};

export function prizeFor(level: TournamentLevel, position: number): number {
  return PRIZE_TABLES[level][position] ?? 0;
}

export const MAX_EQUIPMENT_LEVEL = 5;

/** `level` → `level+1` yükseltme maliyeti. Üst seviyeler pahalıdır. */
export function equipmentUpgradeCost(level: number): number {
  return level * 500;
}
