import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { generateStartingSkills, skillKeysOf } from "@/engine/skill";
import { applyTraining } from "@/engine/training";

const baseSkills = () =>
  generateStartingSkills(createRng("trainee"), { age: 15, profile: "BALANCED" });

describe("Training Engine", () => {
  it("teknik antrenman en çok teknik'i geliştirir; diğer gruplara küçük çapraz katkı (#18)", () => {
    const skills = baseSkills();
    const { skills: next, gains } = applyTraining(skills, {
      type: "TECHNICAL",
      age: 15,
      currentFatigue: 0,
    });
    for (const k of skillKeysOf("TECHNICAL")) {
      expect(next[k].current).toBeGreaterThan(skills[k].current);
      expect(gains[k]).toBeGreaterThan(0);
    }
    // Çapraz katkı: fiziksel de biraz gelişir ama teknik'ten belirgin şekilde az.
    const grown = (keys: readonly string[]) =>
      keys.reduce((a, k) => a + (next[k as keyof typeof next].current - skills[k as keyof typeof skills].current), 0);
    const tech = grown(skillKeysOf("TECHNICAL"));
    const phys = grown(skillKeysOf("PHYSICAL"));
    expect(phys).toBeGreaterThan(0);
    expect(tech).toBeGreaterThan(phys);
  });

  it("antrenman yorgunluk üretir, REST toparlar", () => {
    const skills = baseSkills();
    expect(applyTraining(skills, { type: "PHYSICAL", age: 15, currentFatigue: 0 }).fatigueDelta)
      .toBeGreaterThan(0);
    const rest = applyTraining(skills, { type: "REST", age: 15, currentFatigue: 50 });
    expect(rest.fatigueDelta).toBeLessThan(0);
    expect(rest.gains).toEqual({}); // dinlenme skill geliştirmez
  });

  it("yüksek yorgunluk verimi düşürür (aynı antrenman daha az gelişim)", () => {
    const skills = baseSkills();
    const fresh = applyTraining(skills, { type: "TECHNICAL", age: 15, currentFatigue: 0 });
    const tired = applyTraining(skills, { type: "TECHNICAL", age: 15, currentFatigue: 90 });
    const sum = (g: Record<string, number | undefined>) =>
      Object.values(g).reduce<number>((a, b) => a + (b ?? 0), 0);
    expect(sum(fresh.gains)).toBeGreaterThan(sum(tired.gains));
  });

  it("saf: girdi skill nesnesini bozmaz", () => {
    const skills = baseSkills();
    const before = skills.attack.current;
    applyTraining(skills, { type: "TECHNICAL", age: 15, currentFatigue: 0 });
    expect(skills.attack.current).toBe(before);
  });
});
