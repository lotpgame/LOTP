import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  SKILL_KEYS,
  HARD_CEILING,
  generateStartingSkills,
  growSkill,
  maturity,
  skillAgeCeiling,
  overall,
  type SkillValue,
} from "@/engine/skill";

describe("Skill Engine", () => {
  it("yaş-orantılı tavan: 10 yaş yetişkin potansiyeline ulaşamaz, 26'da tam açılır", () => {
    expect(maturity(8)).toBeLessThan(maturity(17));
    expect(maturity(17)).toBeLessThan(maturity(26));
    expect(maturity(26)).toBe(1);
    expect(maturity(35)).toBe(1);
    // Potansiyel 85, taban 12: 10 yaşında tavan çok daha düşük; 26'da potansiyele eşit.
    expect(skillAgeCeiling(85, 12, 10)).toBeLessThan(60);
    expect(skillAgeCeiling(85, 12, 26)).toBeCloseTo(85, 5);
  });

  it("hiçbir başlangıç skill'i HARD_CEILING'i (90) aşmaz; 10 yaşında değerler düşük", () => {
    for (let i = 0; i < 50; i++) {
      const s = generateStartingSkills(createRng(`u10-${i}`), { age: 10, profile: "BALANCED" });
      for (const k of SKILL_KEYS) {
        expect(s[k].potential).toBeLessThanOrEqual(HARD_CEILING);
        expect(s[k].current).toBeLessThanOrEqual(skillAgeCeiling(s[k].potential, s[k].floor, 10) + 0.01);
        expect(s[k].current).toBeLessThan(55); // 10 yaşında kimse yüksek değilde
      }
    }
  });

  it("growSkill maxNow (yaş tavanı) verilince onu aşmaz", () => {
    const s: SkillValue = { current: 30, potential: 90, floor: 10, ceiling: 90 };
    let v = s;
    for (let i = 0; i < 200; i++) v = growSkill(v, 2, 1.4, 40); // yaş tavanı 40
    expect(v.current).toBeLessThanOrEqual(40);
    expect(v.current).toBeGreaterThan(38); // tavana yaklaşır
  });
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
