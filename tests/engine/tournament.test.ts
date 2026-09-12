import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { SKILL_KEYS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import type { Combatant } from "@/engine/combat";
import { runSingleElimination } from "@/engine/tournament";

function flatSkills(current: number): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
}

function field(size: number): Combatant[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    name: `P${i + 1}`,
    weapon: "FOIL" as const,
    skills: flatSkills(50 + i * 3),
    fatigue: 0,
  }));
}

describe("Tournament Engine (tek eleme)", () => {
  it("8 kişilik turnuva tek şampiyon ve tam sıralama üretir", () => {
    const out = runSingleElimination(field(8), createRng("t"), 15);
    expect(out.standings).toHaveLength(8);
    const champs = out.standings.filter((s) => s.position === 1);
    expect(champs).toHaveLength(1);
    expect(champs[0].playerId).toBe(out.championId);

    // Pozisyon kümesi: 1 şampiyon, 1 finalist(2), 2 yarı-final(3), 4 çeyrek(5)
    const positions = out.standings.map((s) => s.position).sort((a, b) => a - b);
    expect(positions).toEqual([1, 2, 3, 3, 5, 5, 5, 5]);
    // 3 tur = 4 + 2 + 1 = 7 maç
    expect(out.matches).toHaveLength(7);
    expect(out.matches.filter((m) => m.round === "Final")).toHaveLength(1);
  });

  it("aynı seed → aynı şampiyon (tekrarlanabilir)", () => {
    const a = runSingleElimination(field(8), createRng("same"), 15);
    const b = runSingleElimination(field(8), createRng("same"), 15);
    expect(a.championId).toBe(b.championId);
    expect(a.standings).toEqual(b.standings);
  });

  it("turlar arası yorgunluk birikir (şampiyon 3 maç oynar)", () => {
    const out = runSingleElimination(field(8), createRng("f"), 15);
    expect(out.finalFatigue[out.championId]).toBeGreaterThanOrEqual(24); // 3 maç × 8
  });

  it("katılımcı sayısı 2'nin kuvveti değilse hata", () => {
    expect(() => runSingleElimination(field(6), createRng("x"), 15)).toThrow();
  });
});
