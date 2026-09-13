import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { SKILL_KEYS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import { MATCH_FORMATS, simulateMatch, type Combatant } from "@/engine/combat";

function flatSkills(current: number): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
}

function combatant(id: number, name: string, current: number, fatigue = 0): Combatant {
  return { id, name, weapon: "EPEE", skills: flatSkills(current), fatigue };
}

describe("Combat Engine", () => {
  it("maç hedef tuşa ulaşır, deterministik ve analiz üretir", () => {
    const a = combatant(1, "A", 70);
    const b = combatant(2, "B", 65);
    const r1 = simulateMatch(a, b, createRng("m"), MATCH_FORMATS.DE);
    const r2 = simulateMatch(a, b, createRng("m"), MATCH_FORMATS.DE);
    expect(r1).toEqual(r2);
    expect(Math.max(r1.scoreA, r1.scoreB)).toBe(15);
    expect(r1.analysis.winProbA).toBeGreaterThan(0);
    expect(r1.analysis.winProbA).toBeLessThan(1);
    expect(r1.analysis.effA).toBeGreaterThan(r1.analysis.effB); // A daha güçlü
    expect(r1.log[0]).toContain("Maç gücü"); // açıklanabilir giriş satırı
  });

  it("havuz formatı (5 tuş) daha kısa maç", () => {
    const r = simulateMatch(combatant(1, "A", 60), combatant(2, "B", 60), createRng("p"), MATCH_FORMATS.POOL);
    expect(Math.max(r.scoreA, r.scoreB)).toBe(5);
    expect(r.fatigueGain).toBeLessThan(8); // eleme maçından az yorar
  });

  it("yorgunluk effective gücü düşürür → kazanma ihtimalini azaltır", () => {
    const fresh = simulateMatch(combatant(1, "A", 70, 0), combatant(2, "B", 70, 0), createRng("f"), 15);
    const tired = simulateMatch(combatant(1, "A", 70, 90), combatant(2, "B", 70, 0), createRng("f"), 15);
    expect(tired.analysis.winProbA).toBeLessThan(fresh.analysis.winProbA);
  });

  it("büyük fark → güçlü oyuncu net üstünlük (GDD 18.31)", () => {
    let strongWins = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const r = simulateMatch(combatant(1, "Güçlü", 85), combatant(2, "Zayıf", 55), createRng(`big-${i}`), 15);
      if (r.winnerId === 1) strongWins++;
    }
    expect(strongWins).toBeGreaterThan(n * 0.9);
  });

  it("yakın maçlarda her iki sonuç da mümkün (GDD 18.32)", () => {
    let favWins = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const r = simulateMatch(combatant(1, "Favori", 62), combatant(2, "Rakip", 58), createRng(`close-${i}`), 15);
      if (r.winnerId === 1) favWins++;
    }
    expect(favWins).toBeGreaterThan(n * 0.5);
    expect(favWins).toBeLessThan(n);
  });
});
