import { describe, expect, it } from "vitest";
import {
  DAYS_PER_MONTH,
  DAYS_PER_QUARTER,
  activityForDay,
  dayOfWeek,
  monthOfQuarter,
  qualifies,
  quarterOf,
} from "@/engine/season";

describe("Season/zaman modeli (gün-bazlı)", () => {
  it("Q = 12 ay × 7 gün = 84 gün", () => {
    expect(DAYS_PER_MONTH).toBe(7);
    expect(DAYS_PER_QUARTER).toBe(84);
    expect(quarterOf(0)).toBe(1);
    expect(quarterOf(83)).toBe(1);
    expect(quarterOf(84)).toBe(2);
    expect(monthOfQuarter(0)).toBe(1); // h1
    expect(monthOfQuarter(6)).toBe(1);
    expect(monthOfQuarter(7)).toBe(2); // h2
    expect(monthOfQuarter(83)).toBe(12);
    expect(dayOfWeek(0)).toBe(0); // Pazartesi
    expect(dayOfWeek(6)).toBe(6); // Pazar
    expect(dayOfWeek(7)).toBe(0); // sonraki ayın Pazartesi'si
  });

  it("günlük program: Pzt/Çrş/Cuma/Pazar antrenman; Salı İl, Perşembe Türkiye, Cmt Open", () => {
    expect(activityForDay(0).kind).toBe("TRAINING"); // Pazartesi
    expect(activityForDay(2).kind).toBe("TRAINING"); // Çarşamba
    expect(activityForDay(4).kind).toBe("TRAINING"); // Cuma
    const sali = activityForDay(1);
    expect(sali).toEqual({ kind: "TOURNAMENT", level: "IL", qualification: "OPEN" });
    const persembe = activityForDay(3);
    expect(persembe.kind).toBe("TOURNAMENT");
    if (persembe.kind === "TOURNAMENT") expect(persembe.level).toBe("TURKIYE");
    const cmt = activityForDay(5);
    if (cmt.kind === "TOURNAMENT") expect(cmt.level).toBe("OPEN");
  });

  it("uluslararası yılda 1 kez, doğru ayların Pazar günü", () => {
    const sundayOf = (month: number) => (month - 1) * DAYS_PER_MONTH + 6;
    const lvl = (d: number) => {
      const a = activityForDay(d);
      return a.kind === "TOURNAMENT" ? a.level : null;
    };
    expect(lvl(sundayOf(4))).toBe("SATELLITE");
    expect(lvl(sundayOf(6))).toBe("EUROPEAN");
    expect(lvl(sundayOf(8))).toBe("GRAND_PRIX");
    expect(lvl(sundayOf(10))).toBe("WORLD_CUP");
    // Normal ayın Pazar'ı antrenman
    expect(activityForDay(sundayOf(1)).kind).toBe("TRAINING");
    expect(activityForDay(sundayOf(2)).kind).toBe("TRAINING");
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
