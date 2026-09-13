import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { SKILL_KEYS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import {
  simulateMatch,
  tacticChaos,
  tacticStrengthMod,
  type Combatant,
} from "@/engine/combat";

/** Tüm skill'leri eşit veren yardımcı; sonra tekil skill'ler override edilebilir. */
function skills(current: number, over: Partial<Record<string, number>> = {}): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  const s = Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
  for (const [k, val] of Object.entries(over)) {
    if (val != null) s[k as keyof PlayerSkills] = { ...v, current: val };
  }
  return s;
}

describe("Taktik — effective strength modifier (GDD 18.22–18.25)", () => {
  it("BALANCED etkisizdir (0)", () => {
    expect(tacticStrengthMod("BALANCED", skills(60), skills(60))).toBe(0);
  });

  it("Ofansif: güçlü atak + zayıf savunan rakip → pozitif; tersi → negatif", () => {
    const strongAttacker = skills(50, { attack: 85, speed: 80, reading: 70, timing: 70 });
    const weakDefender = skills(50, { defense: 30, reaction: 30 });
    const good = tacticStrengthMod("OFFENSIVE", strongAttacker, weakDefender);
    expect(good).toBeGreaterThan(0);

    const weakAttacker = skills(50, { attack: 30, speed: 35 });
    const strongDefender = skills(50, { defense: 85, reaction: 85 });
    const bad = tacticStrengthMod("OFFENSIVE", weakAttacker, strongDefender);
    expect(bad).toBeLessThan(0);
  });

  it("Agresif trait ofansif taktiği güçlendirir", () => {
    const self = skills(55, { attack: 60, speed: 60, reading: 55, timing: 55 });
    const opp = skills(55);
    const withTrait = tacticStrengthMod("OFFENSIVE", self, opp, ["AGGRESSIVE"]);
    const without = tacticStrengthMod("OFFENSIVE", self, opp, []);
    expect(withTrait).toBeGreaterThan(without);
  });

  it("Defansif: güçlü savunma → pozitif; zayıf savunma → negatif (tempo kaybı)", () => {
    const solid = skills(50, { defense: 85, reaction: 80, reading: 65, timing: 65 });
    expect(tacticStrengthMod("DEFENSIVE", solid, skills(50))).toBeGreaterThan(0);

    const leaky = skills(50, { defense: 30, reaction: 30, reading: 35, timing: 35 });
    expect(tacticStrengthMod("DEFENSIVE", leaky, skills(50))).toBeLessThan(0);
  });

  it("Soğukkanlı trait defansif tempo kaybını hafifletir", () => {
    const self = skills(50, { defense: 60, reaction: 60, reading: 45, timing: 45 });
    const calm = tacticStrengthMod("DEFENSIVE", self, skills(50), ["CALM"]);
    const plain = tacticStrengthMod("DEFENSIVE", self, skills(50), []);
    expect(calm).toBeGreaterThan(plain);
  });

  it("modifier ±3.5 ile sınırlı (beceriyi ezmez)", () => {
    const monster = skills(100, { attack: 100, speed: 100 });
    const m = tacticStrengthMod("OFFENSIVE", monster, skills(0), ["AGGRESSIVE"]);
    expect(Math.abs(m)).toBeLessThanOrEqual(3.5);
  });
});

describe("Taktik — kaos (varyans)", () => {
  it("ofansif kaosu artırır, defansif azaltır", () => {
    expect(tacticChaos("OFFENSIVE")).toBeGreaterThan(0);
    expect(tacticChaos("DEFENSIVE")).toBeLessThan(0);
    expect(tacticChaos("BALANCED")).toBe(0);
  });
});

describe("Taktik — combat entegrasyonu", () => {
  const base = (id: number, name: string, current: number): Combatant => ({
    id,
    name,
    weapon: "EPEE",
    skills: skills(current),
    fatigue: 0,
  });

  it("BALANCED (varsayılan) mevcut davranışı bozmaz — RNG dizisi korunur", () => {
    const a = base(1, "A", 70);
    const b = base(2, "B", 62);
    const noTactic = simulateMatch(a, b, createRng("seed-x"), 15);
    const withBalanced = simulateMatch(
      { ...a, tactic: "BALANCED" },
      { ...b, tactic: "BALANCED" },
      createRng("seed-x"),
      15,
    );
    expect(withBalanced.scoreA).toBe(noTactic.scoreA);
    expect(withBalanced.scoreB).toBe(noTactic.scoreB);
  });

  it("taktik satırı log'a eklenir (biri BALANCED değilse)", () => {
    const r = simulateMatch(
      { ...base(1, "A", 60), tactic: "OFFENSIVE" },
      base(2, "B", 60),
      createRng("t"),
      15,
    );
    expect(r.log.some((l) => l.includes("Taktik —"))).toBe(true);
  });

  it("underdog ofansif oynayınca defansif oynamaktan daha çok sürpriz yapar (kaos)", () => {
    // Kaos: ofansif tuş-başı salınımı artırır (sürpriz ↑), defansif azaltır (grind, favoriyi korur).
    // Aynı zayıf oyuncu (A) için ofansif kazanç sayısı > defansif kazanç sayısı olmalı.
    let winsOff = 0;
    let winsDef = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const a = base(1, "A", 60); // underdog
      const b = base(2, "B", 66); // favori
      const off = simulateMatch({ ...a, tactic: "OFFENSIVE" }, b, createRng(`s-${i}`), 15);
      if (off.winnerId === 1) winsOff++;
      const def = simulateMatch({ ...a, tactic: "DEFENSIVE" }, b, createRng(`s-${i}`), 15);
      if (def.winnerId === 1) winsDef++;
    }
    expect(winsOff).toBeGreaterThan(winsDef);
  });
});
