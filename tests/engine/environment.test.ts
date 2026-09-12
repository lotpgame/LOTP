import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  generateTraits,
  traitCombatModifier,
  traitTrainingMultiplier,
} from "@/engine/trait";
import { equipmentUpgradeCost, prizeFor } from "@/engine/economy";
import {
  clubTrainingMultiplier,
  coachTrainingMultiplier,
  equipmentCombatModifier,
  equipmentTrainingMultiplier,
} from "@/engine/environment";

describe("Trait Engine", () => {
  it("çalışkan verimi artırır, tembel azaltır", () => {
    expect(traitTrainingMultiplier(["HARDWORKING"])).toBeGreaterThan(1);
    expect(traitTrainingMultiplier(["LAZY"])).toBeLessThan(1);
  });
  it("agresif/soğukkanlı combat katkısı verir", () => {
    expect(traitCombatModifier(["AGGRESSIVE"])).toBeGreaterThan(0);
    expect(traitCombatModifier(["DISCIPLINED"])).toBe(0);
  });
  it("generateTraits deterministik, istenen sayıda ve tekrarsız", () => {
    const a = generateTraits(createRng("t"), 2);
    const b = generateTraits(createRng("t"), 2);
    expect(a).toEqual(b);
    expect(a).toHaveLength(2);
    expect(new Set(a).size).toBe(2);
  });
});

describe("Economy Engine", () => {
  it("ödül seviyeye ve dereceye göre; prestij arttıkça artar", () => {
    expect(prizeFor("OPEN", 1)).toBeGreaterThan(prizeFor("IL", 1));
    expect(prizeFor("WORLD_CUP", 1)).toBeGreaterThan(prizeFor("TURKIYE", 1));
    expect(prizeFor("OPEN", 1)).toBeGreaterThan(prizeFor("OPEN", 3));
    expect(prizeFor("IL", 9)).toBe(0);
  });
  it("ekipman yükseltme maliyeti seviyeyle artar", () => {
    expect(equipmentUpgradeCost(2)).toBeGreaterThan(equipmentUpgradeCost(1));
  });
});

describe("Environment (kulüp/koç/ekipman) modifier'ları", () => {
  it("kulüp tesisi verimi 0.9–1.1 arası etkiler", () => {
    expect(clubTrainingMultiplier(100)).toBeGreaterThan(clubTrainingMultiplier(0));
    expect(clubTrainingMultiplier(100)).toBeLessThanOrEqual(1.1);
    expect(clubTrainingMultiplier(0)).toBeGreaterThanOrEqual(0.9);
  });
  it("koç uzmanlığı uyumlu antrenmanı güçlendirir", () => {
    const match = coachTrainingMultiplier(80, "TECHNICAL", "TECHNICAL");
    const noMatch = coachTrainingMultiplier(80, "TECHNICAL", "PHYSICAL");
    expect(match).toBeGreaterThan(noMatch);
  });
  it("ekipman seviyesi küçük antrenman + combat etkisi", () => {
    expect(equipmentTrainingMultiplier(5)).toBeGreaterThan(equipmentTrainingMultiplier(1));
    expect(equipmentCombatModifier(5)).toBeGreaterThan(equipmentCombatModifier(1));
    expect(equipmentCombatModifier(1)).toBe(0);
  });
});
