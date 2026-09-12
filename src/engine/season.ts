/**
 * Sezon/zaman modeli — hafta ve Quarter (GDD 17.5–17.10).
 *
 * 12 hafta = 1 Quarter = 1 oyun yılı. Quarter sonunda yaş +1 ve Quarter Ranking sıfırlanır
 * (GDD 17.90). Haftalık takvim hangi turnuvaların açık olduğunu belirler (GDD 17.7–17.8);
 * uluslararası organizasyonlar Quarter Ranking'e göre davetle (GDD 17.25–17.36).
 *
 * Saf ve deterministik: yalnız hafta indeksinden türetir.
 */
import type { TournamentLevel } from "./domain";

export const WEEKS_PER_QUARTER = 12;

/** 0-tabanlı global hafta indeksinden quarter numarası (1'den başlar). */
export function quarterOf(weekIndex: number): number {
  return Math.floor(weekIndex / WEEKS_PER_QUARTER) + 1;
}

/** Quarter içindeki hafta (1..12). */
export function weekInQuarter(weekIndex: number): number {
  return (weekIndex % WEEKS_PER_QUARTER) + 1;
}

/** Katılım kuralı: serbest / Quarter Ranking ilk 16 / milli takım ilk 4. */
export type Qualification = "OPEN" | "TOP16" | "TOP4";

export interface ScheduledEvent {
  level: TournamentLevel;
  qualification: Qualification;
}

/**
 * Verilen quarter-içi haftada (1..12) düzenlenen organizasyonlar (GDD 17.7–17.8).
 * Yurt içi (İl/Open) her hafta; Türkiye çift haftalarda; uluslararası quarter'da bir kez.
 */
export function eventsForWeek(week: number): ScheduledEvent[] {
  const events: ScheduledEvent[] = [
    { level: "IL", qualification: "OPEN" },
    { level: "OPEN", qualification: "OPEN" },
  ];
  if (week % 2 === 0) events.push({ level: "TURKIYE", qualification: "OPEN" });
  if (week === 4) events.push({ level: "SATELLITE", qualification: "TOP16" });
  if (week === 8) events.push({ level: "GRAND_PRIX", qualification: "TOP16" });
  if (week === 10) events.push({ level: "EUROPEAN", qualification: "TOP4" });
  if (week === 12) events.push({ level: "WORLD_CUP", qualification: "TOP4" });
  return events;
}

/** Quarter Ranking pozisyonuna göre katılım hakkı (GDD 17.29–17.34). */
export function qualifies(qualification: Qualification, rankingPosition: number | null): boolean {
  if (qualification === "OPEN") return true;
  if (rankingPosition == null) return false;
  if (qualification === "TOP16") return rankingPosition <= 16;
  return rankingPosition <= 4; // TOP4 → milli takım
}

/** Katılım kuralının kısa Türkçe açıklaması (UI'da kilit sebebi). */
export function qualificationLabel(qualification: Qualification): string {
  switch (qualification) {
    case "OPEN":
      return "Herkese açık";
    case "TOP16":
      return "Quarter Ranking ilk 16";
    case "TOP4":
      return "Milli takım (ilk 4)";
  }
}
