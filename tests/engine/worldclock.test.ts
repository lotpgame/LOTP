import { describe, expect, it } from "vitest";
import { dayOfWeek } from "@/engine/season";
import {
  MS_PER_GAME_DAY,
  WORLD_EPOCH_MS,
  worldDayIndex,
  worldDayProgress,
  worldDayStartMs,
  worldEventStartMs,
} from "@/engine/worldclock";

const DAY = MS_PER_GAME_DAY;
const TZ = "Europe/Istanbul";

/** Bir ms anının TR saatindeki saat:dakika + haftanın günü — epoch/etkinlik hizasını doğrulamak için. */
function trParts(ms: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return { weekday: get("weekday"), hhmm: `${get("hour")}:${get("minute")}` };
}

describe("worldclock — ortak dünya saati", () => {
  it("epoch anı TR saatinde Pazartesi 00:00 (dünya saati TR yerel saatine hizalı, bkz. 02.10 bulgusu)", () => {
    expect(trParts(WORLD_EPOCH_MS)).toEqual({ weekday: "Mon", hhmm: "00:00" });
  });

  it("günlük etkinlik anı (EVENT_HOUR) gerçekten 19:00 TR saatinde tetiklenir", () => {
    for (let d = 0; d < 5; d++) {
      expect(trParts(worldEventStartMs(d)).hhmm).toBe("19:00");
    }
  });

  it("epoch anı → dünya günü 0; epoch öncesi 0'a sıkışır", () => {
    expect(worldDayIndex(WORLD_EPOCH_MS)).toBe(0);
    expect(worldDayIndex(WORLD_EPOCH_MS - 5 * DAY)).toBe(0);
  });

  it("gerçek gün geçtikçe dünya günü artar (1 oyun-günü = 1 gerçek gün)", () => {
    expect(worldDayIndex(WORLD_EPOCH_MS + 3 * DAY + DAY / 2)).toBe(3);
    expect(worldDayIndex(WORLD_EPOCH_MS + 84 * DAY)).toBe(84); // 1 Quarter sonra
  });

  it("dayIndex season.ts ile hizalı: gün 0 = Pazartesi, gün 1 = Salı (İl)", () => {
    expect(dayOfWeek(worldDayIndex(WORLD_EPOCH_MS))).toBe(0); // Pazartesi
    expect(dayOfWeek(worldDayIndex(WORLD_EPOCH_MS + 1 * DAY))).toBe(1); // Salı
  });

  it("gün başlangıcı + gün-içi ilerleme", () => {
    expect(worldDayStartMs(3)).toBe(WORLD_EPOCH_MS + 3 * DAY);
    expect(worldDayProgress(WORLD_EPOCH_MS + 3 * DAY + DAY / 4)).toBeCloseTo(0.25, 5);
  });

  it("config ile hızlandırılabilir (dev): msPerDay küçük", () => {
    const cfg = { epochMs: 0, msPerDay: 1000 };
    expect(worldDayIndex(5000, cfg)).toBe(5);
  });
});
