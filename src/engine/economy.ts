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
 * DENGE (kullanıcı kararı 10.11): ucuz ekonomiye göre yeniden ayarlandı — İLK 4 derece ödül alır (4. de).
 * Denar hâlâ kıt (asıl ödül ranking/prestij) ama çocuk kendi temel bakımını karşılayabilir.
 * Uluslararası (yılda 4, kotayla) daha büyük elit bonus.
 */
const PRIZE_TABLES: Record<TournamentLevel, Record<number, number>> = {
  IL: { 1: 10, 2: 6, 3: 3, 4: 3 },
  OPEN: { 1: 10, 2: 6, 3: 3, 4: 3 },
  TURKIYE: { 1: 20, 2: 12, 3: 6, 4: 6 },
  SATELLITE: { 1: 30, 2: 20, 3: 15, 4: 15 },
  GRAND_PRIX: { 1: 40, 2: 30, 3: 20, 4: 20 },
  EUROPEAN: { 1: 50, 2: 40, 3: 30, 4: 30 },
  WORLD_CUP: { 1: 100, 2: 80, 3: 60, 4: 60 },
};

export function prizeFor(level: TournamentLevel, position: number): number {
  return PRIZE_TABLES[level][position] ?? 0;
}

// Maça katılım ücreti (Dilim 2B): küçük, o seviyenin 1. ödülünün ALTINDA (engel değil, denge). İl bedava (çocuk/sık).
const ENTRY_FEES: Record<TournamentLevel, number> = {
  IL: 0, OPEN: 2, TURKIYE: 2, SATELLITE: 5, GRAND_PRIX: 10, EUROPEAN: 15, WORLD_CUP: 20,
};
export function entryFee(level: TournamentLevel): number {
  return ENTRY_FEES[level] ?? 0;
}

/**
 * Kulüp HAFTALIK aidatı (kullanıcı kararı 10.11): her oyun-haftasında (7 gün, Pazar) kesilir; kulüp KALİTESİNE
 * (facility = tesis kalitesi 0–100; coachSkill bunu birebir takip eder) bağlı kademeli:
 *   0–20 → 2 · 20–40 → 4 · 40–60 → 6 · 60–80 → 8 · 80–100 → 10 Đ/hafta.
 * İyi kulüp = daha iyi gelişim ama daha pahalı (anlamlı seçim). Pazar ödenmezse o haftanın antrenmanı
 * %20 düşer + "aidat ödenmedi" olayı (careerService advanceDay).
 */
export function clubWeeklyDues(facility: number): number {
  const tier = Math.min(4, Math.floor(Math.max(0, facility) / 20)); // 0..4 (80–100 dahil en üst)
  return (tier + 1) * 2; // 2,4,6,8,10
}

/** Aidat ödenmeyen hafta için antrenman kazancı çarpanı (0.8 = %20 düşüş). */
export const DUES_UNPAID_TRAINING_MULT = 0.8;

export const MAX_EQUIPMENT_LEVEL = 5;

/** `level` → `level+1` yükseltme maliyeti. Üst seviyeler pahalıdır. */
export function equipmentUpgradeCost(level: number): number {
  return level * 500;
}
