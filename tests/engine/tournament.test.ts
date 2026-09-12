import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { SKILL_KEYS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import type { Combatant } from "@/engine/combat";
import {
  bracketSeedOrder,
  bracketSize,
  computePoolSizes,
  simulateTournament,
} from "@/engine/tournament";

function flatSkills(current: number): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
}

function field(size: number): Combatant[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    name: `P${i + 1}`,
    weapon: "EPEE" as const,
    skills: flatSkills(45 + (i % 20) * 2),
    fatigue: 0,
  }));
}

describe("Tournament yardımcıları", () => {
  it("computePoolSizes 5–7 arası dengeli havuzlar üretir", () => {
    expect(computePoolSizes(24)).toEqual([6, 6, 6, 6]);
    expect(computePoolSizes(23)).toEqual([6, 6, 6, 5]);
    expect(computePoolSizes(30)).toEqual([6, 6, 6, 6, 6]);
    expect(computePoolSizes(13)).toEqual([7, 6]);
    expect(computePoolSizes(24).reduce((a, b) => a + b, 0)).toBe(24);
  });

  it("bracketSize en küçük 2'nin kuvveti (≥ N)", () => {
    expect(bracketSize(24)).toBe(32);
    expect(bracketSize(16)).toBe(16);
    expect(bracketSize(17)).toBe(32);
    expect(bracketSize(8)).toBe(8);
  });

  it("bracketSeedOrder standart eşleşme (1 en zayıfla)", () => {
    expect(bracketSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(bracketSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe("simulateTournament (havuz + eleme)", () => {
  it("24 kişilik turnuva: herkes derece alır, tek şampiyon, havuz+eleme maçları", () => {
    const out = simulateTournament(field(24), createRng("t"), { poolSize: 6 });
    expect(out.standings).toHaveLength(24);
    expect(out.standings.filter((s) => s.position === 1)).toHaveLength(1);
    expect(out.ranking).toHaveLength(24);
    expect(out.pools).toHaveLength(24); // her oyuncu için havuz kaydı
    expect(out.matches.some((m) => m.phase === "POOL")).toBe(true);
    expect(out.matches.some((m) => m.phase === "DE")).toBe(true);

    // Derece kademeleri (bracket 32): 1,2,3,5,9,17
    const positions = new Set(out.standings.map((s) => s.position));
    for (const p of positions) expect([1, 2, 3, 5, 9, 17]).toContain(p);
  });

  it("aynı seed → aynı şampiyon ve sıralama (tekrarlanabilir)", () => {
    const a = simulateTournament(field(24), createRng("same"), { poolSize: 6 });
    const b = simulateTournament(field(24), createRng("same"), { poolSize: 6 });
    expect(a.championId).toBe(b.championId);
    expect(a.standings).toEqual(b.standings);
    expect(a.ranking).toEqual(b.ranking);
  });

  it("havuz istatistikleri tutarlı (galibiyet+mağlubiyet = maç sayısı, indicator=TS−TR)", () => {
    const out = simulateTournament(field(12), createRng("p"), { poolSize: 6 });
    for (const pr of out.pools) {
      expect(pr.wins + pr.losses).toBe(pr.matches);
      expect(pr.indicator).toBe(pr.touchesScored - pr.touchesReceived);
    }
  });

  it("bye çalışır: 24 oyuncu 32'lik tabloda, ilk tur elenen 17. kademe", () => {
    const out = simulateTournament(field(24), createRng("bye"), { poolSize: 6 });
    // İlk DE turunda (Son 32) elenenler 17. pozisyon; bye alanlar maçsız ilerler
    expect(out.standings.filter((s) => s.position === 17).length).toBeGreaterThan(0);
    expect(out.standings.filter((s) => s.position === 17).length).toBeLessThanOrEqual(8);
  });
});
