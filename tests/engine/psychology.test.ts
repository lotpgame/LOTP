import { describe, expect, it } from "vitest";
import {
  DEFAULT_PSYCHOLOGY,
  afterTournament,
  afterTrainingWeek,
  psychologyCombatModifier,
  psychologyTrainingMultiplier,
  type Psychology,
} from "@/engine/psychology";

describe("Psychology Engine", () => {
  it("yüksek motivasyon verimi artırır, yüksek stres düşürür", () => {
    const motivated: Psychology = { morale: 50, motivation: 90, confidence: 50, stress: 10 };
    const stressed: Psychology = { morale: 50, motivation: 40, confidence: 50, stress: 90 };
    expect(psychologyTrainingMultiplier(motivated)).toBeGreaterThan(1);
    expect(psychologyTrainingMultiplier(stressed)).toBeLessThan(1);
  });

  it("özgüven combat'a +, stres −", () => {
    expect(psychologyCombatModifier({ morale: 50, motivation: 50, confidence: 90, stress: 10 })).toBeGreaterThan(0);
    expect(psychologyCombatModifier({ morale: 50, motivation: 50, confidence: 20, stress: 90 })).toBeLessThan(0);
  });

  it("iyi turnuva sonucu morali/özgüveni artırır; kötü sonuç düşürür", () => {
    const win = afterTournament(DEFAULT_PSYCHOLOGY, 1, 24);
    const flop = afterTournament(DEFAULT_PSYCHOLOGY, 24, 24);
    expect(win.confidence).toBeGreaterThan(DEFAULT_PSYCHOLOGY.confidence);
    expect(flop.confidence).toBeLessThan(DEFAULT_PSYCHOLOGY.confidence);
  });

  it("değerler 0–100 aralığında kalır", () => {
    const extreme: Psychology = { morale: 2, motivation: 2, confidence: 2, stress: 98 };
    const after = afterTournament(extreme, 24, 24);
    for (const v of Object.values(after)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("dinlenmeli hafta stresi azaltır", () => {
    const busy = afterTrainingWeek({ morale: 50, motivation: 50, confidence: 50, stress: 50 }, 0);
    const rested = afterTrainingWeek({ morale: 50, motivation: 50, confidence: 50, stress: 50 }, 2);
    expect(rested.stress).toBeLessThan(busy.stress);
  });
});
