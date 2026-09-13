import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  computePhysique,
  generateGenetics,
  heightFraction,
  physiqueCombatEdge,
  speedTrainingMultiplier,
  type PhysicalProfile,
} from "@/engine/physique";

describe("Physique — fiziksel yapı", () => {
  it("genetik deterministik ve makul aralıkta", () => {
    const a = generateGenetics(createRng("g"), "MALE");
    const b = generateGenetics(createRng("g"), "MALE");
    expect(a).toEqual(b);
    expect(a.adultHeightCm).toBeGreaterThan(160);
    expect(a.adultHeightCm).toBeLessThan(200);
  });

  it("boy yaşla artar, 18'de sabitlenir", () => {
    expect(heightFraction(8)).toBeCloseTo(0.72, 2);
    expect(heightFraction(18)).toBeCloseTo(1, 2);
    expect(heightFraction(25)).toBe(1);
    expect(heightFraction(12)).toBeGreaterThan(heightFraction(8));
    const g = generateGenetics(createRng("h"), "MALE");
    expect(computePhysique(g, 8).heightCm).toBeLessThan(computePhysique(g, 18).heightCm);
  });

  it("kulaç boyla ilişkili, kilo boy+yapıdan türer", () => {
    const g = generateGenetics(createRng("p"), "FEMALE");
    const p = computePhysique(g, 20);
    expect(p.reachCm).toBeGreaterThan(p.heightCm - 10);
    expect(p.weightKg).toBeGreaterThan(30);
    expect(p.legLengthCm).toBeLessThan(p.heightCm);
  });

  it("uzun kulaç Epe'de Kılıç'tan daha büyük avantaj", () => {
    const longer: PhysicalProfile = { reachCm: 190, legLengthCm: 88, buildFactor: 0, leftHanded: false };
    const shorter: PhysicalProfile = { reachCm: 178, legLengthCm: 84, buildFactor: 0, leftHanded: false };
    const epee = physiqueCombatEdge(longer, shorter, "EPEE", "SENIOR");
    const sabre = physiqueCombatEdge(longer, shorter, "SABRE", "SENIOR");
    expect(epee).toBeGreaterThan(0);
    expect(epee).toBeGreaterThan(sabre);
    expect(epee).toBeLessThanOrEqual(3); // küçük kalır
  });

  it("solak avantajı yalnız U10–U12'de ve çok küçük", () => {
    const lefty: PhysicalProfile = { reachCm: 170, legLengthCm: 80, buildFactor: 0, leftHanded: true };
    const righty: PhysicalProfile = { reachCm: 170, legLengthCm: 80, buildFactor: 0, leftHanded: false };
    expect(physiqueCombatEdge(lefty, righty, "FOIL", "U12")).toBeGreaterThan(0);
    expect(physiqueCombatEdge(lefty, righty, "FOIL", "U17")).toBe(0); // U14+ avantaj yok
    expect(Math.abs(physiqueCombatEdge(lefty, righty, "FOIL", "U12"))).toBeLessThan(1);
  });

  it("ağır yapı hız gelişimini yavaşlatır, hafif hızlandırır", () => {
    expect(speedTrainingMultiplier(1)).toBeLessThan(1);
    expect(speedTrainingMultiplier(-1)).toBeGreaterThan(1);
  });
});
