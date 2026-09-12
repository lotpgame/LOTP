import { describe, expect, it } from "vitest";
import {
  WEEKS_PER_QUARTER,
  eventsForWeek,
  qualifies,
  quarterOf,
  weekInQuarter,
} from "@/engine/season";

describe("Season/zaman modeli", () => {
  it("12 hafta = 1 quarter", () => {
    expect(WEEKS_PER_QUARTER).toBe(12);
    expect(quarterOf(0)).toBe(1);
    expect(quarterOf(11)).toBe(1);
    expect(quarterOf(12)).toBe(2);
    expect(quarterOf(24)).toBe(3);
    expect(weekInQuarter(0)).toBe(1);
    expect(weekInQuarter(11)).toBe(12);
    expect(weekInQuarter(12)).toBe(1);
  });

  it("haftalık takvim: yurt içi her hafta, Türkiye çift, uluslararası özel haftalar", () => {
    const w1 = eventsForWeek(1).map((e) => e.level);
    expect(w1).toContain("IL");
    expect(w1).toContain("OPEN");
    expect(w1).not.toContain("TURKIYE");

    expect(eventsForWeek(2).map((e) => e.level)).toContain("TURKIYE");
    expect(eventsForWeek(4).map((e) => e.level)).toContain("SATELLITE");
    expect(eventsForWeek(8).map((e) => e.level)).toContain("GRAND_PRIX");
    expect(eventsForWeek(10).map((e) => e.level)).toContain("EUROPEAN");
    expect(eventsForWeek(12).map((e) => e.level)).toContain("WORLD_CUP");
  });

  it("uygunluk: OPEN serbest, TOP16/TOP4 sıralamaya bağlı", () => {
    expect(qualifies("OPEN", null)).toBe(true);
    expect(qualifies("TOP16", null)).toBe(false);
    expect(qualifies("TOP16", 16)).toBe(true);
    expect(qualifies("TOP16", 17)).toBe(false);
    expect(qualifies("TOP4", 4)).toBe(true);
    expect(qualifies("TOP4", 5)).toBe(false);
  });
});
