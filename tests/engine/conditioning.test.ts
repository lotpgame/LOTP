import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  applySharpness,
  injuryChance,
  rollInjury,
  sessionSharpnessDelta,
} from "@/engine/conditioning";

describe("Conditioning — keskinlik & sakatlık", () => {
  it("seans keskinlik etkisi: çalışma +, dinlenme −", () => {
    expect(sessionSharpnessDelta("TECHNICAL")).toBeGreaterThan(0);
    expect(sessionSharpnessDelta("REST")).toBeLessThan(0);
  });

  it("applySharpness 0–100 aralığında sıkışır", () => {
    expect(applySharpness(98, 10)).toBe(100);
    expect(applySharpness(2, -10)).toBe(0);
    expect(applySharpness(50, 4)).toBe(54);
  });

  it("injuryChance yorgunlukla artar ve sınırlı kalır", () => {
    expect(injuryChance(20, 16)).toBeLessThan(injuryChance(70, 16));
    expect(injuryChance(70, 16)).toBeLessThan(injuryChance(95, 16));
    expect(injuryChance(95, 30)).toBeLessThanOrEqual(0.4);
    expect(injuryChance(10, 16)).toBeGreaterThan(0);
  });

  it("rollInjury deterministik; yüksek yorgunlukta sakatlık görülür, düşükte nadir", () => {
    const a = rollInjury(createRng("x"), 95, 20);
    const b = rollInjury(createRng("x"), 95, 20);
    expect(a).toEqual(b);
    if (a.injured) expect(a.weeks).toBeGreaterThanOrEqual(1);

    let highInjuries = 0;
    let lowInjuries = 0;
    for (let i = 0; i < 500; i++) {
      if (rollInjury(createRng(`h${i}`), 95, 20).injured) highInjuries++;
      if (rollInjury(createRng(`l${i}`), 15, 16).injured) lowInjuries++;
    }
    expect(highInjuries).toBeGreaterThan(lowInjuries);
    expect(highInjuries).toBeGreaterThan(0);
  });
});
