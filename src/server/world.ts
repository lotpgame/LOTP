/**
 * Ortak dünya saati — sunucu tarafı ayar (M10). Engine saf (worldclock.ts); burada env'den config
 * okunur. `WORLD_MS_PER_DAY`: dev'de kısaltılır (gerçek gün beklemeden test), üretimde 1 gerçek gün.
 * `WORLD_EPOCH_MS`: dünya başlangıcı (varsayılan worldclock'taki Pazartesi epoch'u).
 */
import {
  MS_PER_GAME_DAY,
  WORLD_EPOCH_MS,
  type WorldClockConfig,
  eventDayIndex,
  worldDayIndex,
  worldEventStartMs,
} from "@/engine/worldclock";

export function worldClockConfig(): WorldClockConfig {
  const msPerDay = Number(process.env.WORLD_MS_PER_DAY) || MS_PER_GAME_DAY;
  const epochMs = Number(process.env.WORLD_EPOCH_MS) || WORLD_EPOCH_MS;
  return { msPerDay, epochMs };
}

/** Şu anki global dünya gün indeksi (00:00'da döner; takvim/tarih gösterimi bununla). */
export function serverWorldDay(nowMs: number = Date.now()): number {
  return worldDayIndex(nowMs, worldClockConfig());
}

/** Etkinliği (19:00) gerçekleşmiş en son gün — otomatik işleme (antrenman/offline turnuva) tavanı. */
export function serverEventDay(nowMs: number = Date.now()): number {
  return eventDayIndex(nowMs, worldClockConfig());
}

/** Bir günün turnuva/etkinlik başlangıç anı (gerçek zaman ms) — gösterim + gerçek-zaman kapısı. */
export function serverEventStartMs(dayIndex: number): number {
  return worldEventStartMs(dayIndex, worldClockConfig());
}
