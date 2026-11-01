/**
 * Sezon/zaman modeli — GÜN bazlı (GDD 17.5–17.10, kullanıcı takvimi q1-gunluk).
 *
 * Q = 1 oyun yılı. İçinde 12 "ay" (h1–h12). Her ay 7 günlük SABİT program (Pazartesi→Pazar),
 * her ay aynı döner. Gün = oyunun temel birimi. Aynı güne asla iki turnuva gelmez.
 *   Pzt: Antrenman · Salı: İl · Çrş: Antrenman · Prş: Türkiye · Cuma: Antrenman · Cmt: Open
 *   Pazar: Antrenman — ama h4 Satellite · h6 Avrupa · h8 Grand Prix · h10 World Cup (yılda 1'er)
 * Quarter (yıl) sonunda yaş +1 ve kategori ranking'i sıfırlanır. Saf ve deterministik.
 */
import type { TournamentLevel } from "./domain";

export const DAYS_PER_MONTH = 7;
export const MONTHS_PER_QUARTER = 12; // 12 ay = 1 oyun yılı = 1 Quarter
export const DAYS_PER_QUARTER = DAYS_PER_MONTH * MONTHS_PER_QUARTER; // 84

/** 0-tabanlı global gün indeksinden Quarter (oyun yılı) numarası (1'den başlar). */
export function quarterOf(dayIndex: number): number {
  return Math.floor(dayIndex / DAYS_PER_QUARTER) + 1;
}

/** Quarter içindeki ay (1..12) — "h1..h12". */
export function monthOfQuarter(dayIndex: number): number {
  return Math.floor((dayIndex % DAYS_PER_QUARTER) / DAYS_PER_MONTH) + 1;
}

/** Ay içindeki gün (0 = Pazartesi … 6 = Pazar). Negatif-güvenli: JS'te negatif modulo negatif döner
 * (dev'de kısa dünya saati sınırında dayIndex anlık negatif olup "dayShort.-1" verebiliyordu). */
export function dayOfWeek(dayIndex: number): number {
  return ((dayIndex % DAYS_PER_MONTH) + DAYS_PER_MONTH) % DAYS_PER_MONTH;
}

/** Katılım kuralı: serbest / kategori sıralaması ilk 16 / milli takım ilk 4. */
export type Qualification = "OPEN" | "TOP16" | "TOP4";

export interface ScheduledEvent {
  level: TournamentLevel;
  qualification: Qualification;
}

/** Bir günün etkinliği: antrenman (plan seansı), dinlenme veya turnuva. */
export type DayActivity =
  | { kind: "TRAINING"; slot: number } // slot: hangi plan seansı (Pzt=0, Çrş=1, Cuma=2, Pazar=3)
  | { kind: "TOURNAMENT"; level: TournamentLevel; qualification: Qualification };

/** Uluslararası organizasyonun düzenlendiği ay (Pazar günü), yılda bir kez. */
// Tüm uluslararası turnuvalar oyuncunun ÜLKESİNİN ilk 4'üne açık (milli takım) — kullanıcı kuralı.
// (Uygunluk kontrolü ÜLKE-İÇİ ranka bakar; bkz. careerService qualifies çağrıları.)
const INTERNATIONAL_BY_MONTH: Record<number, ScheduledEvent> = {
  4: { level: "SATELLITE", qualification: "TOP4" },
  6: { level: "EUROPEAN", qualification: "TOP4" },
  8: { level: "GRAND_PRIX", qualification: "TOP4" },
  10: { level: "WORLD_CUP", qualification: "TOP4" },
};

/** Verilen global günün etkinliği (sabit haftalık program). */
export function activityForDay(dayIndex: number): DayActivity {
  const dow = dayOfWeek(dayIndex);
  switch (dow) {
    case 0: // Pazartesi
      return { kind: "TRAINING", slot: 0 };
    case 1: // Salı
      return { kind: "TOURNAMENT", level: "IL", qualification: "OPEN" };
    case 2: // Çarşamba
      return { kind: "TRAINING", slot: 1 };
    case 3: // Perşembe
      return { kind: "TOURNAMENT", level: "TURKIYE", qualification: "OPEN" };
    case 4: // Cuma
      return { kind: "TRAINING", slot: 2 };
    case 5: // Cumartesi — Open 2 HAFTADA BİR (dönüşümlü); ara haftalarda antrenman (#23)
      return Math.floor(dayIndex / DAYS_PER_MONTH) % 2 === 0
        ? { kind: "TOURNAMENT", level: "OPEN", qualification: "OPEN" }
        : { kind: "TRAINING", slot: 3 };
    default: {
      // Pazar: uluslararası varsa turnuva, yoksa antrenman (4. seans)
      const intl = INTERNATIONAL_BY_MONTH[monthOfQuarter(dayIndex)];
      return intl ? { kind: "TOURNAMENT", ...intl } : { kind: "TRAINING", slot: 3 };
    }
  }
}

/** Kategori sıralaması pozisyonuna göre katılım hakkı (GDD 17.29–17.34). */
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
      return "Klasman ilk 16";
    case "TOP4":
      return "Milli takım (ilk 4)";
  }
}
