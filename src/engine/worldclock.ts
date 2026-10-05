/**
 * Ortak dünya saati (M10) — Hattrick modeli. Oyun zamanı GERÇEK zamandan türetilir; herkes için
 * TEK dünya takvimi. Cron gerekmez: dünya günü, epoch'tan geçen gerçek gün sayısıdır (saf fonksiyon).
 *
 *   worldDayIndex = floor((now − epoch) / gün_uzunluğu)
 *
 * 1 oyun-günü = 1 gerçek gün (varsayılan). `dayIndex` season.ts ile uyumlu (quarterOf/dayOfWeek):
 * epoch bir PAZARTESİ 00:00 **GMT (UTC)** olduğundan dayIndex%7 gerçek haftanın gününe oturur
 * (gerçek Salı = İl) VE günlük etkinlik anı (EVENT_HOUR) gerçek GMT saatine denk gelir.
 * Config (epoch + gün uzunluğu) opsiyoneldir → sunucu dev'de hızlandırmak için override eder.
 *
 * ⚠️ OYUN ZAMANI = GMT (dünya saati). TR saati KULLANILMAZ: oyuncu bulunduğu bölgeye göre kendi
 * yerel saatine çevirir (UI'da sağ üstteki GMT saat rozeti bunun için). Karar: Yusuf, 05.10.
 */

/**
 * Dünya başlangıcı: 21 Eylül 2026, Pazartesi 00:00 **GMT (UTC)** (= 1789948800000; canlı dünyanın
 * gerçek başlangıç haftası). Gün başı 00:00 GMT'de döner; günlük etkinlik (turnuva) EVENT_HOUR=18 →
 * 18:00 GMT'de olur. (Önceki TR-çapalı epoch 20 Eylül 21:00 UTC'ydi; 05.10'da GMT'ye +3 saat kaydırıldı
 * — gün sınırı artık 00:00 GMT. dayIndex haftası korundu → canlı kariyerler bozulmaz. Bkz. CLAUDE.md §7.)
 */
export const WORLD_EPOCH_MS = Date.UTC(2026, 8, 21, 0, 0, 0);

/** 1 oyun-günü kaç gerçek ms — varsayılan 1 gerçek gün. Dev'de config ile kısaltılır. */
export const MS_PER_GAME_DAY = 24 * 60 * 60 * 1000;

/**
 * Günün ETKİNLİK saati GMT (turnuva / o günün antrenman etkisi). Gün 00:00 GMT'de döner ama etkinlik
 * 18:00 GMT'de olur. Oran olarak tutulur (18/24) → dev'de gün kısaltılınca etkinlik anı da orantılı kayar.
 */
export const EVENT_HOUR = 18;
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

/** Bir günün ETKİNLİK anı (gerçek zaman, ms): o günün başlangıcı + 18:00 GMT oranı. Turnuva/antrenman burada işlenir. */
export function worldEventStartMs(dayIndex: number, cfg: WorldClockConfig = {}): number {
  const per = cfg.msPerDay ?? MS_PER_GAME_DAY;
  return worldDayStartMs(dayIndex, cfg) + per * EVENT_FRACTION;
}

/**
 * Etkinliği (18:00 GMT) ARTIK gerçekleşmiş EN SON gün indeksi. Gün 00:00 GMT'de döner (worldDayIndex) ama
 * o günün turnuvası/antrenmanı 18:00 GMT'de olur → 18:00'dan önce o günün etkinliği henüz işlenmemiştir.
 * = worldDayIndex(now − 18:00 offset).
 */
export function eventDayIndex(nowMs: number = Date.now(), cfg: WorldClockConfig = {}): number {
  const per = cfg.msPerDay ?? MS_PER_GAME_DAY;
  return worldDayIndex(nowMs - per * EVENT_FRACTION, cfg);
}
