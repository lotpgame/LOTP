import { describe, expect, it } from "vitest";
import {
  SCHEDULE,
  dePlan,
  formatDayMinute,
  layoutSequential,
  matchPlayDurationSec,
  periodWindows,
  poolPlan,
  tacticWindows,
  type MatchSpec,
} from "@/engine/schedule";

describe("schedule — maç süresi (FIE)", () => {
  it("tek periyot (pul) = 3 dk", () => {
    expect(matchPlayDurationSec(1)).toBe(180);
  });

  it("3 periyot (15 tuş) = 3×3dk + 2×1dk = 11 dk", () => {
    // FIE düzeltmesi: periyot arası 1 dk (30 sn değil)
    expect(matchPlayDurationSec(3)).toBe(3 * 180 + 2 * 60);
    expect(matchPlayDurationSec(3)).toBe(660);
  });

  it("2 periyot (U10 10 tuş) = 2×3dk + 1×1dk = 7 dk", () => {
    expect(matchPlayDurationSec(2)).toBe(420);
  });

  it("0 periyot → hata", () => {
    expect(() => matchPlayDurationSec(0)).toThrow(RangeError);
  });
});

describe("schedule — periyot ve taktik pencereleri", () => {
  it("3 periyotun sınırları mola kadar boşlukla ilerler", () => {
    expect(periodWindows(3)).toEqual([
      { index: 1, startSec: 0, endSec: 180 },
      { index: 2, startSec: 240, endSec: 420 },
      { index: 3, startSec: 480, endSec: 660 },
    ]);
  });

  it("N periyot → N-1 taktik penceresi (periyot aralarında)", () => {
    expect(tacticWindows(3)).toEqual([
      { index: 1, startSec: 180, endSec: 240 },
      { index: 2, startSec: 420, endSec: 480 },
    ]);
    expect(tacticWindows(1)).toEqual([]); // tek periyot → taktik değişimi yok
  });
});

describe("schedule — havuz planı", () => {
  it("ilk maç 11:05'te, sonra 4 dk tempoyla (3 dk maç + 1 dk ara)", () => {
    const plan = poolPlan(3);
    expect(plan).toHaveLength(3);
    expect(formatDayMinute(plan[0].startMinute)).toBe("11:05");
    expect(formatDayMinute(plan[1].startMinute)).toBe("11:09");
    expect(formatDayMinute(plan[2].startMinute)).toBe("11:13");
    expect(plan.every((m) => m.phase === "POOL" && m.periods === 1)).toBe(true);
  });

  it("0 maç → boş plan", () => {
    expect(poolPlan(0)).toEqual([]);
  });
});

describe("schedule — eleme planı", () => {
  it("çeyrek finale kadar 14:00 bloğu; yarı+final 17:00 bloğu", () => {
    const rounds: MatchSpec[] = [
      { phase: "DE", round: "Son 16", periods: 3 },
      { phase: "DE", round: "Çeyrek Final", periods: 3 },
      { phase: "DE", round: "Yarı Final", periods: 3 },
      { phase: "DE", round: "Final", periods: 3 },
    ];
    const plan = dePlan(rounds);
    expect(formatDayMinute(plan[0].startMinute)).toBe("14:00"); // Son 16
    // Çeyrek: 14:00 + 11 dk maç + 2 dk ara = 14:13
    expect(formatDayMinute(plan[1].startMinute)).toBe("14:13");
    expect(formatDayMinute(plan[2].startMinute)).toBe("17:00"); // Yarı Final
    expect(formatDayMinute(plan[3].startMinute)).toBe("17:13"); // Final
  });

  it("erken elenen oyuncu için kısa plan (yalnız oynadığı turlar)", () => {
    const plan = dePlan([{ phase: "DE", round: "Son 32", periods: 3 }]);
    expect(plan).toHaveLength(1);
    expect(formatDayMinute(plan[0].startMinute)).toBe("14:00");
  });
});

describe("schedule — layoutSequential temposu", () => {
  it("her maç öncekinin oynama süresi + boşluk kadar sonra başlar", () => {
    const specs: MatchSpec[] = [
      { phase: "POOL", round: "Havuz", periods: 1 },
      { phase: "POOL", round: "Havuz", periods: 1 },
    ];
    const plan = layoutSequential(specs, 600, 60); // 10:00'dan itibaren, 1 dk ara
    expect(plan[0].startSec).toBe(600 * 60);
    // 2. maç: 600*60 + 180 (oynama) + 60 (ara) = 36240 sn
    expect(plan[1].startSec).toBe(600 * 60 + 180 + 60);
  });
});

describe("schedule — sabitler FIE ile uyumlu", () => {
  it("periyot 3 dk, periyot arası 1 dk", () => {
    expect(SCHEDULE.periodSeconds).toBe(180);
    expect(SCHEDULE.periodBreakSeconds).toBe(60);
  });
});
