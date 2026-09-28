/**
 * Economy Engine — para, ödül ve gider (GDD 16). Sportif performansı hesaplamaz; turnuva
 * derecesini paraya çevirir (GDD 5.14). Skill geliştirmez (GDD 5.36).
 *
 * M6: seviye × derece ödül tablosu + ekipman yükseltme maliyeti. Sponsorluk/kulüp bütçesi sonra.
 */
import type { TournamentLevel } from "./domain";

// Başlangıç bakiyesi 0 (kullanıcı kararı, 28.09): yeni oyuncu Denar'sız başlar — kıt ekonomi +
// monetization ile tutarlı (bedava başlangıç parası yok). Denar turnuvayla kazanılır / satın alınır.
export const STARTING_BALANCE = 0;

/**
 * Seviye × derece → para ödülü (GDD 17.75). Prestij arttıkça ödül artar.
 * DENGE (28.09, docs/EKONOMI.md): kazanç kasıtlı ÇOK DÜŞÜK (kullanıcı kararı). Sezonluk toplam ≈
 * şampiyon ~300 · 2. ~200 · 3. ~150 Đ. Şampiyon bile 1 sezonda 1 silah (400) ALAMAZ → oyuncu
 * malzeme için bizden Denar satın alır (monetization baskısı). Denar kıt; asıl ödül ranking/prestij.
 * Uluslararası (yılda 4, kotayla) küçük elit bonus.
 */
const PRIZE_TABLES: Record<TournamentLevel, Record<number, number>> = {
  IL: { 1: 6, 2: 4, 3: 3 },
  OPEN: { 1: 10, 2: 5, 3: 5 },
  TURKIYE: { 1: 14, 2: 10, 3: 7 },
  SATELLITE: { 1: 20, 2: 12, 3: 8, 5: 4 },
  GRAND_PRIX: { 1: 35, 2: 22, 3: 15, 5: 7 },
  EUROPEAN: { 1: 55, 2: 35, 3: 24, 5: 12 },
  WORLD_CUP: { 1: 80, 2: 55, 3: 38, 5: 20 },
};

export function prizeFor(level: TournamentLevel, position: number): number {
  return PRIZE_TABLES[level][position] ?? 0;
}

export const MAX_EQUIPMENT_LEVEL = 5;

/** `level` → `level+1` yükseltme maliyeti. Üst seviyeler pahalıdır. */
export function equipmentUpgradeCost(level: number): number {
  return level * 500;
}
