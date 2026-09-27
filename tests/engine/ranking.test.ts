import { describe, expect, it } from "vitest";
import {
  experienceCombatModifier,
  experienceForTournament,
  levelGivesRankingPoints,
  rankEntries,
  rankingPointsForPosition,
} from "@/engine/ranking";

describe("Ranking Engine", () => {
  it("seviyeye göre puan tabloları (GDD 17.82–17.88)", () => {
    // Open KLASMAN PUANI VERMEZ (#28) — yalnız tecrübe
    expect(rankingPointsForPosition(1, "OPEN")).toBe(0);
    expect(levelGivesRankingPoints("OPEN")).toBe(false);
    // Şampiyonalar puan verir
    expect(rankingPointsForPosition(1, "IL")).toBe(5);
    expect(rankingPointsForPosition(1, "TURKIYE")).toBe(12);
    expect(rankingPointsForPosition(1, "WORLD_CUP")).toBe(40);
    expect(levelGivesRankingPoints("TURKIYE")).toBe(true);
    // puansız derece
    expect(rankingPointsForPosition(9, "EUROPEAN")).toBe(10);
    expect(rankingPointsForPosition(33, "EUROPEAN")).toBe(0); // Avrupa'da son 64 yok
    expect(rankingPointsForPosition(999, "IL")).toBe(0);
  });

  it("tecrübe (XP): Open en çok grind verir; şampiyon > pool-out; antrenman küçük; combat tavanı +3", () => {
    expect(experienceForTournament(1, "OPEN")).toBeGreaterThan(experienceForTournament(99, "OPEN")); // şampiyon > katılım
    expect(experienceForTournament(99, "OPEN")).toBeGreaterThan(0); // pool-out bile katılım tecrübesi
    expect(experienceCombatModifier(100000)).toBe(3); // tavan
    expect(experienceCombatModifier(0)).toBe(0);
  });

  it("rankEntries puana göre sıralar ve pozisyon atar", () => {
    const ranked = rankEntries([
      { playerId: 10, points: 3 },
      { playerId: 20, points: 9 },
      { playerId: 30, points: 6 },
    ]);
    expect(ranked.map((r) => r.playerId)).toEqual([20, 30, 10]);
    expect(ranked.map((r) => r.position)).toEqual([1, 2, 3]);
  });

  it("eşit puan deterministik (playerId ile) ayrışır", () => {
    const ranked = rankEntries([
      { playerId: 5, points: 4 },
      { playerId: 2, points: 4 },
    ]);
    expect(ranked.map((r) => r.playerId)).toEqual([2, 5]);
  });
});
