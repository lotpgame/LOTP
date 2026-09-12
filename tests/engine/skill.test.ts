import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  SKILL_KEYS,
  generateStartingSkills,
  growSkill,
  overall,
  type SkillValue,
} from "@/engine/skill";

describe("Skill Engine", () => {
  it("başlangıç skill'leri deterministik ve sınırlar tutarlı", () => {
    const a = generateStartingSkills(createRng("p1"), { age: 14, profile: "BALANCED" });
    const b = generateStartingSkills(createRng("p1"), { age: 14, profile: "BALANCED" });
    expect(a).toEqual(b); // aynı seed → aynı skill'ler

    for (const key of SKILL_KEYS) {
      const s = a[key];
      expect(s.current).toBeGreaterThanOrEqual(s.floor);
      expect(s.current).toBeLessThanOrEqual(s.potential);
      expect(s.potential).toBeLessThanOrEqual(100);
      expect(s.floor).toBeGreaterThanOrEqual(0);
    }
  });

  it("genç oyuncu daha yüksek potansiyel boşluğuna sahip (ortalama)", () => {
    const young = generateStartingSkills(createRng("y"), { age: 12, profile: "BALANCED" });
    const old = generateStartingSkills(createRng("y"), { age: 28, profile: "BALANCED" });
    const gap = (s: Record<string, SkillValue>) =>
      SKILL_KEYS.reduce((acc, k) => acc + (s[k].potential - s[k].current), 0) / SKILL_KEYS.length;
    expect(gap(young)).toBeGreaterThan(gap(old));
  });

  it("profil arketipi ilgili grubu yukarı çeker", () => {
    const tech = generateStartingSkills(createRng("x"), { age: 16, profile: "TECHNICAL" });
    const phys = generateStartingSkills(createRng("x"), { age: 16, profile: "PHYSICAL" });
    // Aynı seed, farklı profil: teknik profilin atağı, fiziksel profilinkinden yüksek olmalı
    expect(tech.attack.current).toBeGreaterThan(phys.attack.current);
  });

  it("growSkill azalan verim: potansiyele yakınken az, uzakken çok gelişir", () => {
    const far: SkillValue = { current: 40, potential: 90, floor: 30, ceiling: 90 };
    const near: SkillValue = { current: 88, potential: 90, floor: 30, ceiling: 90 };
    const gainFar = growSkill(far, 1, 1).current - far.current;
    const gainNear = growSkill(near, 1, 1).current - near.current;
    expect(gainFar).toBeGreaterThan(gainNear);
  });

  it("growSkill potansiyeli/ceiling'i aşmaz", () => {
    const s: SkillValue = { current: 89.9, potential: 90, floor: 30, ceiling: 90 };
    const grown = growSkill(s, 100, 5); // aşırı stimulus
    expect(grown.current).toBeLessThanOrEqual(90);
  });

  it("overall makul aralıkta bir sayı döner", () => {
    const s = generateStartingSkills(createRng("o"), { age: 18, profile: "BALANCED" });
    const o = overall(s);
    expect(o).toBeGreaterThan(0);
    expect(o).toBeLessThan(100);
  });
});
