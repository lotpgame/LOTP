/**
 * Ortak dünya saati (M10) — Hattrick modeli. Oyun zamanı GERÇEK zamandan türetilir; herkes için
 * TEK dünya takvimi. Cron gerekmez: dünya günü, epoch'tan geçen gerçek gün sayısıdır (saf fonksiyon).
 *
 *   worldDayIndex = floor((now − epoch) / gün_uzunluğu)
 *
 * 1 oyun-günü = 1 gerçek gün (varsayılan). `dayIndex` season.ts ile uyumlu (quarterOf/dayOfWeek):
 * epoch bir PAZARTESİ 00:00 UTC olduğundan dayIndex%7 gerçek haftanın gününe oturur (gerçek Salı = İl).
 * Config (epoch + gün uzunluğu) opsiyoneldir → sunucu dev'de hızlandırmak için override eder (engine saf kalır).
 */

/** Dünya başlangıcı: 5 Ocak 2026, Pazartesi 00:00 UTC (dayIndex 0 = Pazartesi). */
export const WORLD_EPOCH_MS = Date.UTC(2026, 0, 5, 0, 0, 0);

/** 1 oyun-günü kaç gerçek ms — varsayılan 1 gerçek gün. Dev'de config ile kısaltılır. */
export const MS_PER_GAME_DAY = 24 * 60 * 60 * 1000;

export interface WorldClockConfig {
  epochMs?: number;
  msPerDay?: number;
}

/** Verilen gerçek ana (varsayılan: şimdi) karşılık gelen global dünya gün indeksi (0-tabanlı, ≥0). */
export function worldDayIndex(nowMs: number = Date.now(), cfg: WorldClockConfig = {}): number {
  const epoch = cfg.epochMs ?? WORLD_EPOCH_MS;
  const per = cfg.msPerDay ?? MS_PER_GAME_DAY;
  return Math.max(0, Math.floor((nowMs - epoch) / per));
}

/** Bir dünya gününün GERÇEK zamanda başladığı an (ms) — turnuva saatini gerçek sadate bağlamak için. */
export function worldDayStartMs(dayIndex: number, cfg: WorldClockConfig = {}): number {
  const epoch = cfg.epochMs ?? WORLD_EPOCH_MS;
  const per = cfg.msPerDay ?? MS_PER_GAME_DAY;
  return epoch + dayIndex * per;
}

/** O günün ne kadarı geçti (0..1) — gün-içi turnuva zamanlaması / "şu an" göstergesi için. */
export function worldDayProgress(nowMs: number = Date.now(), cfg: WorldClockConfig = {}): number {
  const per = cfg.msPerDay ?? MS_PER_GAME_DAY;
  const start = worldDayStartMs(worldDayIndex(nowMs, cfg), cfg);
  return Math.min(1, Math.max(0, (nowMs - start) / per));
}
