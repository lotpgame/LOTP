/**
 * Ortak dünya saati (M10) — Hattrick modeli. Oyun zamanı GERÇEK zamandan türetilir; herkes için
 * TEK dünya takvimi. Cron gerekmez: dünya günü, epoch'tan geçen gerçek gün sayısıdır (saf fonksiyon).
 *
 *   worldDayIndex = floor((now − epoch) / gün_uzunluğu)
 *
 * 1 oyun-günü = 1 gerçek gün (varsayılan). `dayIndex` season.ts ile uyumlu (quarterOf/dayOfWeek):
 * epoch bir PAZARTESİ 00:00 **TR saatinde (Europe/Istanbul, UTC+3)** olduğundan dayIndex%7 gerçek
 * haftanın gününe oturur (gerçek Salı = İl) VE günlük etkinlik anı (EVENT_HOUR) gerçekten TR saatine
 * denk gelir. Config (epoch + gün uzunluğu) opsiyoneldir → sunucu dev'de hızlandırmak için override eder.
 */

/**
 * Dünya başlangıcı: 5 Ocak 2026, Pazartesi 00:00 **TR saati** (= 4 Ocak 21:00 UTC — Türkiye UTC+3,
 * DST yok). Bilerek UTC gece yarısı DEĞİL: aksi halde EVENT_HOUR=19 gerçekte 22:00 TR'de tetiklenir
 * (bulgu: 02.10, canlı turnuvaya giriş "19:00'da başlar" diyip 22:00'a kadar açılmıyordu).
 */
export const WORLD_EPOCH_MS = Date.UTC(2026, 0, 4, 21, 0, 0);

/** 1 oyun-günü kaç gerçek ms — varsayılan 1 gerçek gün. Dev'de config ile kısaltılır. */
export const MS_PER_GAME_DAY = 24 * 60 * 60 * 1000;

/**
 * Günün ETKİNLİK saati (turnuva / o günün antrenman etkisi). Gün 00:00'da döner ama etkinlik akşam olur.
 * Oran olarak tutulur (19/24) → dev'de gün kısaltılınca etkinlik anı da orantılı kayar.
 */
export const EVENT_HOUR = 19;
const EVENT_FRACTION = EVENT_HOUR / 24;

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

/** Bir günün ETKİNLİK anı (gerçek zaman, ms): o günün başlangıcı + 19:00 oranı. Turnuva/antrenman burada işlenir. */
export function worldEventStartMs(dayIndex: number, cfg: WorldClockConfig = {}): number {
  const per = cfg.msPerDay ?? MS_PER_GAME_DAY;
  return worldDayStartMs(dayIndex, cfg) + per * EVENT_FRACTION;
}

/**
 * Etkinliği (19:00) ARTIK gerçekleşmiş EN SON gün indeksi. Gün 00:00'da döner (worldDayIndex) ama
 * o günün turnuvası/antrenmanı 19:00'da olur → 19:00'dan önce o günün etkinliği henüz işlenmemiştir.
 * = worldDayIndex(now − 19:00 offset).
 */
export function eventDayIndex(nowMs: number = Date.now(), cfg: WorldClockConfig = {}): number {
  const per = cfg.msPerDay ?? MS_PER_GAME_DAY;
  return worldDayIndex(nowMs - per * EVENT_FRACTION, cfg);
}
