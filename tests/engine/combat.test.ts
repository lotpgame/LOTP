import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { SKILL_KEYS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import {
  simulateMatch,
  touchWinProbability,
  type Combatant,
} from "@/engine/combat";

/** Tüm skill'leri sabit değere ayarlayan yardımcı (test kurgusu). */
function flatSkills(current: number): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
}

function combatant(id: number, name: string, current: number): Combatant {
  return { id, name, weapon: "EPEE", skills: flatSkills(current), fatigue: 0 };
}

describe("Combat Engine", () => {
  it("touchWinProbability: monoton, simetrik, soft-cap içinde", () => {
    expect(touchWinProbability(0)).toBeCloseTo(0.5, 5);
    expect(touchWinProbability(20)).toBeGreaterThan(touchWinProbability(5));
    expect(touchWinProbability(1000)).toBeLessThanOrEqual(0.94); // %100 olmaz
    expect(touchWinProbability(-1000)).toBeGreaterThanOrEqual(0.06); // %0 olmaz
  });

  it("maç hedef tuşa ulaşır ve deterministiktir", () => {
    const a = combatant(1, "A", 70);
    const b = combatant(2, "B", 65);
    const r1 = simulateMatch(a, b, createRng("m"), 15);
    const r2 = simulateMatch(a, b, createRng("m"), 15);
    expect(r1).toEqual(r2); // aynı seed → aynı sonuç
    expect(Math.max(r1.scoreA, r1.scoreB)).toBe(15);
    expect(r1.log.length).toBeGreaterThanOrEqual(2);
  });

  it("büyük fark → güçlü oyuncu net üstünlük kurar (GDD 18.31)", () => {
    let strongWins = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const r = simulateMatch(
        combatant(1, "Güçlü", 85),
        combatant(2, "Zayıf", 55),
        createRng(`big-${i}`),
        15,
      );
      if (r.winnerId === 1) strongWins++;
    }
    expect(strongWins).toBeGreaterThan(n * 0.9); // 15 tuşta büyük fark neredeyse kesinleşir
  });

  it("yakın maçlarda her iki sonuç da mümkün (GDD 18.32: yenilmez yok)", () => {
    let favWins = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const r = simulateMatch(
        combatant(1, "Favori", 62),
        combatant(2, "Rakip", 58),
        createRng(`close-${i}`),
        15,
      );
      if (r.winnerId === 1) favWins++;
    }
    expect(favWins).toBeGreaterThan(n * 0.5); // favori çoğunlukla kazanır
    expect(favWins).toBeLessThan(n); // ama her zaman değil — sürpriz mümkün
  });
});
