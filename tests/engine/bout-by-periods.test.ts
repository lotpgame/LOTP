import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { SKILL_KEYS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import { simulateBoutByPeriods, type Combatant } from "@/engine/combat";

function flatSkills(current: number): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
}
function combatant(id: number, name: string, current: number, tactic?: Combatant["tactic"]): Combatant {
  return { id, name, weapon: "EPEE", skills: flatSkills(current), fatigue: 0, ageCategory: "SENIOR", tactic };
}

describe("simulateBoutByPeriods (M11.3a)", () => {
  it("deterministik: aynı seed → birebir aynı sonuç", () => {
    const a = combatant(1, "A", 70);
    const b = combatant(2, "B", 64);
    const r1 = simulateBoutByPeriods(a, b, createRng("bout"), { touches: 15, periods: 3 });
    const r2 = simulateBoutByPeriods(a, b, createRng("bout"), { touches: 15, periods: 3 });
    expect(r1).toEqual(r2);
  });

  it("bir kazanan çıkar; skorlar tutarlı", () => {
    const a = combatant(1, "A", 72);
    const b = combatant(2, "B", 60);
    const r = simulateBoutByPeriods(a, b, createRng("x"), { touches: 15, periods: 3 });
    expect([a.id, b.id]).toContain(r.winnerId);
    expect(r.loserId).toBe(r.winnerId === a.id ? b.id : a.id);
    const winScore = r.winnerId === a.id ? r.scoreA : r.scoreB;
    const loseScore = r.winnerId === a.id ? r.scoreB : r.scoreA;
    expect(winScore).toBeGreaterThanOrEqual(loseScore);
    expect(winScore).toBeLessThanOrEqual(15);
  });

  it("log periyot başlıklı (▸ … Periyot) ve maç sonu satırı içerir", () => {
    const r = simulateBoutByPeriods(combatant(1, "A", 68), combatant(2, "B", 66), createRng("y"), {
      touches: 15,
      periods: 3,
    });
    const periodHeads = r.log.filter((l) => /Periyot/.test(l));
    expect(periodHeads.length).toBeGreaterThanOrEqual(1); // en az 1 periyot oynanır
    expect(periodHeads.length).toBeLessThanOrEqual(3);
    expect(r.log.some((l) => l.startsWith("🏁"))).toBe(true);
  });

  it("periyot başına taktik kaynağı log'a yansır (P1 ofansif, P2 defansif)", () => {
    const tactics = ["OFFENSIVE", "DEFENSIVE", "BALANCED"] as const;
    const r = simulateBoutByPeriods(combatant(1, "Sen", 66), combatant(2, "Rakip", 66), createRng("z"), {
      touches: 15,
      periods: 3,
      tacticA: (p) => tactics[p - 1],
    });
    const p1 = r.log.find((l) => l.includes("1. Periyot"));
    expect(p1).toContain("Atak"); // P1 kaynağı OFFENSIVE (yeni etiket)
  });

  it("U10 (10 tuş / 2 periyot): 1. periyot 5 tuş tavanıyla biter, kazanan ≤10", () => {
    const r = simulateBoutByPeriods(combatant(1, "A", 66), combatant(2, "B", 66), createRng("u10"), {
      touches: 10,
      periods: 2,
    });
    const winScore = r.winnerId === r.aId ? r.scoreA : r.scoreB;
    expect(winScore).toBeLessThanOrEqual(10);
  });
});
