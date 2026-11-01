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
  // OPEN klasman puanı VERMEZ (yalnız tecrübe) — kullanıcı kararı #28.
  OPEN: {},
  // İL → ŞEHİR klasmanı (CITY scope). ULUSALA puan VERMEZ (kullanıcı 27.10). Ulusal yalnız Türkiye şampiyonasından.
  IL: { 1: 5, 2: 3.5, 3: 2.5, 5: 1.5, 9: 1.0, 17: 0.5 },
  // Ulusal şampiyona → YURT-İÇİ (DOMESTIC) klasman / milli takım (ülke ilk 4).
  TURKIYE: { 1: 12, 2: 9, 3: 7, 5: 5, 9: 3, 17: 2, 33: 1 },
  // DÜNYA (WORLD) klasmanı: uluslararası turnuvalar → dünya/kıta klasmanı (ülke klasmanını ETKİLEMEZ).
  // Bu puanlar WORLD scope'lu ranking satırlarına yazılır (bkz. rankingScopeForLevel + finalizeTournament).
  SATELLITE: { 1: 16, 2: 13, 3: 10, 5: 7, 9: 5, 17: 3, 33: 2 },
  GRAND_PRIX: { 1: 24, 2: 20, 3: 16, 5: 12, 9: 8, 17: 5, 33: 3 },
  EUROPEAN: { 1: 32, 2: 27, 3: 22, 5: 16, 9: 10 },
  WORLD_CUP: { 1: 40, 2: 34, 3: 28, 5: 20, 9: 14 },
};

/** Bir dereceye (position) karşılık gelen klasman puanı. Open → 0. Tanımsız derece → 0. */
export function rankingPointsForPosition(
  position: number,
  level: TournamentLevel = "IL",
): number {
  return POINT_TABLES[level][position] ?? 0;
}

/** Klasman TÜRÜ: uluslararası → DÜNYA (WORLD) klasmanı; Ulusal → YURT-İÇİ (DOMESTIC); İl → ŞEHİR. */
export type RankingTrack = "DOMESTIC" | "WORLD";
const WORLD_LEVELS: readonly TournamentLevel[] = ["SATELLITE", "EUROPEAN", "GRAND_PRIX", "WORLD_CUP"];

/**
 * Puanın yazılacağı klasman KAPSAMI (Ranking.scope satırı):
 *  - **İl → ŞEHİR klasmanı** `CITY:<geo>` (geo = "TR#Kocaeli") — ULUSALA PUAN VERMEZ (kullanıcı kararı 27.10:
 *    İl sadece tecrübe + kendi şehir klasmanı; oyuncuyu oyuna bağlayan sık/yerel döngü).
 *  - **Ulusal şampiyona (Türkiye/Almanya…) → `DOMESTIC`** (ülke klasmanı; milli takım = ilk 4).
 *  - **Uluslararası → `WORLD`** (dünya/kıta).
 *  - **Open → null** (puan yok, yalnız tecrübe).
 * `geoKey` yalnız İl için kullanılır; diğerlerinde yok sayılır.
 */
export function rankingScopeForLevel(level: TournamentLevel, geoKey: string): string | null {
  if (!levelGivesRankingPoints(level)) return null; // Open
  if (level === "IL") return `CITY:${geoKey}`;
  if (WORLD_LEVELS.includes(level)) return "WORLD";
  return "DOMESTIC";
}

/** Bu seviye (herhangi bir) klasman puanı veriyor mu? Open vermez; diğerleri verir (yurt-içi ya da dünya). */
export function levelGivesRankingPoints(level: TournamentLevel): boolean {
  return Object.keys(POINT_TABLES[level]).length > 0;
}

// ——— Tecrübe (XP) — #28: her turnuva tecrübe verir (Open en çok grind); antrenman ~1/10 ———

const XP_BASE: Record<TournamentLevel, number> = {
  OPEN: 35,
  IL: 28,
  TURKIYE: 45,
  SATELLITE: 50,
  GRAND_PRIX: 60,
  EUROPEAN: 65,
  WORLD_CUP: 75,
};

/** Dereceye göre tecrübe çarpanı; havuzda elense bile KATILIM tecrübesi (0.3). */
const XP_POS_FACTOR: Record<number, number> = { 1: 1, 2: 0.85, 3: 0.72, 5: 0.58, 9: 0.48, 17: 0.42, 33: 0.38 };

/** Bir turnuvadan kazanılan tecrübe (position = final derece; pool-out → katılım tecrübesi). */
export function experienceForTournament(position: number, level: TournamentLevel): number {
  return Math.round(XP_BASE[level] * (XP_POS_FACTOR[position] ?? 0.3));
}

/** Bir antrenman seansının tecrübesi (turnuvanın ~1/10'u). */
export const TRAINING_XP = 4;

/** Birikmiş tecrübenin combat'a katkısı — deneyimli sporcu maçı daha iyi okur. Küçük, tavanlı (+3). */
export function experienceCombatModifier(xp: number): number {
  return Math.min(Math.max(xp, 0) / 400, 3);
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
