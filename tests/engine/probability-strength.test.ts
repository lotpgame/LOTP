import { describe, expect, it } from "vitest";
import { computeEffectiveStrength, winProbability } from "@/engine/probability";
import { SKILLS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import type { SkillCategory } from "@/engine/domain";

/** Kategori bazlı sabit değerlerle skill seti kurar (test kurgusu). */
function skillsByCategory(values: Record<SkillCategory, number>): PlayerSkills {
  const map = {} as PlayerSkills;
  for (const def of SKILLS) {
    const v: SkillValue = { current: values[def.category], potential: 100, floor: 0, ceiling: 100 };
    (map as Record<string, SkillValue>)[def.key] = v;
  }
  return map;
}

describe("Probability Engine — güç & olasılık", () => {
  it("winProbability: monoton, simetrik, soft-cap", () => {
    expect(winProbability(0)).toBeCloseTo(0.5, 5);
    expect(winProbability(20)).toBeGreaterThan(winProbability(5));
    expect(winProbability(5)).toBeGreaterThan(winProbability(-5));
    expect(winProbability(1000)).toBeLessThanOrEqual(0.94);
    expect(winProbability(-1000)).toBeGreaterThanOrEqual(0.06);
  });

  it("yorgunluk negatif modifier ekler ve toplamı düşürür", () => {
    const skills = skillsByCategory({ TECHNICAL: 70, PHYSICAL: 70, MENTAL: 70, TACTICAL: 70 });
    const fresh = computeEffectiveStrength(skills, "EPEE", { fatigue: 0 });
    const tired = computeEffectiveStrength(skills, "EPEE", { fatigue: 80 });
    expect(fresh.modifiers).toHaveLength(0);
    expect(tired.modifiers.some((m) => m.label === "Yorgunluk" && m.value < 0)).toBe(true);
    expect(tired.total).toBeLessThan(fresh.total);
  });

  it("silahlar farklı ağırlıklar kullanır (fiziksel ağırlıklı oyuncu Kılıç'ta daha güçlü)", () => {
    const physical = skillsByCategory({ TECHNICAL: 50, PHYSICAL: 90, MENTAL: 50, TACTICAL: 50 });
    const sabre = computeEffectiveStrength(physical, "SABRE", { fatigue: 0 });
    const epee = computeEffectiveStrength(physical, "EPEE", { fatigue: 0 });
    expect(sabre.total).toBeGreaterThan(epee.total); // Kılıç fiziksele daha çok ağırlık verir
  });

  it("keskinlik (sharpness) güce etki eder; verilmezse modifier yok", () => {
    const skills = skillsByCategory({ TECHNICAL: 70, PHYSICAL: 70, MENTAL: 70, TACTICAL: 70 });
    const sharp = computeEffectiveStrength(skills, "EPEE", { fatigue: 0, sharpness: 100 });
    const flat = computeEffectiveStrength(skills, "EPEE", { fatigue: 0, sharpness: 50 });
    const dull = computeEffectiveStrength(skills, "EPEE", { fatigue: 0, sharpness: 0 });
    const none = computeEffectiveStrength(skills, "EPEE", { fatigue: 0 });
    expect(sharp.total).toBeGreaterThan(flat.total);
    expect(dull.total).toBeLessThan(flat.total);
    expect(none.modifiers.some((m) => m.label === "Keskinlik")).toBe(false);
  });

  it("yaş: ~30 sonrası gerileme; genç/zirvede etki yok", () => {
    const skills = skillsByCategory({ TECHNICAL: 70, PHYSICAL: 70, MENTAL: 70, TACTICAL: 70 });
    const peak = computeEffectiveStrength(skills, "EPEE", { fatigue: 0, age: 26 });
    const old = computeEffectiveStrength(skills, "EPEE", { fatigue: 0, age: 38 });
    expect(peak.modifiers.some((m) => m.label === "Yaş")).toBe(false); // 30 altı → yok
    expect(old.total).toBeLessThan(peak.total); // yaşlı daha düşük
    expect(old.modifiers.some((m) => m.label === "Yaş" && m.value < 0)).toBe(true);
  });
});
