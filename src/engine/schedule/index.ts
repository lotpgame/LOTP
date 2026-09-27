/**
 * Schedule Engine (M11.1) — turnuvanın gün-içi ZAMAN ÇİZELGESİ (GDD 17 + ROADMAP §B2/M11).
 *
 * Saf mantık: I/O yok, DB yok, combat yok. Sadece sabitlerden her maçın gün-dakikası
 * cinsinden [başlangıç–bitiş] dilimini ve periyot/periyot-arası pencerelerini üretir.
 * "Dünya saati" (src/server/world.ts) bu gün-dakikalarını gerçek zamana çevirir.
 *
 * Neden ayrı ve saf: aynı çizelge hem sunucu oynatmasında (offline otomatik) hem canlı
 * replay/taktik penceresinde hem başsız denge simülasyonunda çalışsın diye.
 *
 * FIE denetimi (oyun sahibi onayı 2026-09-20): periyot = 3 dk, periyot arası = 1 dk
 * (taktik değişim penceresi). Pul 5 tuş / tek periyot; eleme 15 tuş / 3 periyot (U10 10/2).
 */

/** Zaman sabitleri — gün-içi "oyun-saati" (dünya saati gerçek zamana çevirir). */
export const SCHEDULE = {
  periodSeconds: 180, // FIE: bir periyot 3 dk
  periodBreakSeconds: 60, // FIE: periyot arası 1 dk (online oyuncu taktik değiştirir)
  poolMatchGapSeconds: 60, // pul maçları arası boşluk
  roundGapSeconds: 120, // eleme turları arası (~2 dk)
  poolWarmupSeconds: 300, // pul 19:00 açılır, ilk maç 19:05
  poolStartMinute: 19 * 60, // 19:00 — turnuva akşam başlar (gün 00:00 döner, etkinlik 19:00)
  deStartMinute: 19 * 60 + 45, // 19:45 — elemeler (pul bitiminden ~15 dk sonra)
  finalsStartMinute: 20 * 60 + 30, // 20:30 — Yarı Final + Final
} as const;

export type Phase = "POOL" | "DE";

/** Bir maça göre (match-relative) saniye penceresi. */
export interface Window {
  index: number; // 1-tabanlı
  startSec: number;
  endSec: number;
}

export interface ScheduledMatch {
  phase: Phase;
  round: string; // "Havuz", "Son 16", "Çeyrek Final", "Yarı Final", "Final"
  periods: number;
  startMinute: number; // gün-dakikası (00:00'dan itibaren, 0..1439)
  startSec: number; // gün-saniyesi = startMinute*60
  playDurationSec: number; // tam dilim oynama süresi (periyotlar + aralar)
  endSec: number; // startSec + playDurationSec (dilim sonu; erken biterse daha erken bitebilir)
  periodWindows: Window[]; // periyotların match-relative sınırları
  tacticWindows: Window[]; // periyot ARASI pencereler (taktik değişimi) — match-relative
}

/** Tam oynama süresi (saniye): periyotlar + aralarındaki molalar. */
export function matchPlayDurationSec(periods: number): number {
  if (periods < 1) throw new RangeError("En az 1 periyot gerekli");
  const { periodSeconds, periodBreakSeconds } = SCHEDULE;
  return periods * periodSeconds + (periods - 1) * periodBreakSeconds;
}

/** Periyotların match-relative [start,end] sınırları. */
export function periodWindows(periods: number): Window[] {
  const { periodSeconds, periodBreakSeconds } = SCHEDULE;
  const out: Window[] = [];
  let cursor = 0;
  for (let i = 1; i <= periods; i++) {
    out.push({ index: i, startSec: cursor, endSec: cursor + periodSeconds });
    cursor += periodSeconds + periodBreakSeconds; // sonraki periyottan önce mola
  }
  return out;
}

/**
 * Periyot ARASI taktik pencereleri (match-relative). N periyot → N-1 pencere.
 * Online insan bu pencerede taktik değiştirir; süre dolarsa önceden-taktik kalır.
 */
export function tacticWindows(periods: number): Window[] {
  const { periodSeconds, periodBreakSeconds } = SCHEDULE;
  const out: Window[] = [];
  let cursor = periodSeconds;
  for (let i = 1; i < periods; i++) {
    out.push({ index: i, startSec: cursor, endSec: cursor + periodBreakSeconds });
    cursor += periodBreakSeconds + periodSeconds;
  }
  return out;
}

/** Girdi: bir maçın türü + periyot sayısı (combat.deFormat / MATCH_FORMATS'tan gelir). */
export interface MatchSpec {
  phase: Phase;
  round: string;
  periods: number;
}

/**
 * Bir maç dizisini `startMinute`'tan itibaren SIRALI yerleştirir. Cadence (tempo) =
 * oynama süresi + verilen boşluk. Erken biten maç dilimini kısaltır AMA sonraki maç yine
 * sabit tempoda başlar (oyun sahibi kararı: "sonraki tur 1-2 dk sonra sabit arayla").
 */
export function layoutSequential(
  specs: readonly MatchSpec[],
  startMinute: number,
  gapSec: number,
): ScheduledMatch[] {
  const out: ScheduledMatch[] = [];
  let cursorSec = startMinute * 60;
  for (const spec of specs) {
    const playDurationSec = matchPlayDurationSec(spec.periods);
    out.push({
      phase: spec.phase,
      round: spec.round,
      periods: spec.periods,
      startMinute: Math.round(cursorSec / 60),
      startSec: cursorSec,
      playDurationSec,
      endSec: cursorSec + playDurationSec,
      periodWindows: periodWindows(spec.periods),
      tacticWindows: tacticWindows(spec.periods),
    });
    cursorSec += playDurationSec + gapSec;
  }
  return out;
}

/**
 * Bir oyuncunun havuz maçlarını çizelgeler: 11:00 açılış + 5 dk ısınma → 11:05 ilk maç,
 * her maç tek periyot (5 tuş / ~3 dk), aralarında 1 dk. `matchCount` = oyuncunun havuzda
 * oynadığı maç sayısı (havuz boyutu − 1).
 */
export function poolPlan(matchCount: number): ScheduledMatch[] {
  const specs: MatchSpec[] = Array.from({ length: Math.max(0, matchCount) }, () => ({
    phase: "POOL" as const,
    round: "Havuz",
    periods: 1,
  }));
  const startMinute = SCHEDULE.poolStartMinute + Math.round(SCHEDULE.poolWarmupSeconds / 60);
  return layoutSequential(specs, startMinute, SCHEDULE.poolMatchGapSeconds);
}

/**
 * Bir oyuncunun eleme maçlarını çizelgeler. Öğleden sonra bloğu (14:00) = Yarı Final'e
 * kadar olan turlar sıralı; Yarı Final + Final ayrı akşam bloğu (17:00). Girdi: oyuncunun
 * gerçekten oynadığı DE turları (round + periods), erken elenirse liste kısa olur.
 */
export function dePlan(rounds: readonly MatchSpec[]): ScheduledMatch[] {
  const finals = rounds.filter((r) => r.round === "Yarı Final" || r.round === "Final");
  const afternoon = rounds.filter((r) => r.round !== "Yarı Final" && r.round !== "Final");
  return [
    ...layoutSequential(afternoon, SCHEDULE.deStartMinute, SCHEDULE.roundGapSeconds),
    ...layoutSequential(finals, SCHEDULE.finalsStartMinute, SCHEDULE.roundGapSeconds),
  ];
}

/** Gün-dakikasını "HH:MM" biçimine çevirir (UI/log için). */
export function formatDayMinute(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
