import { describe, expect, it } from "vitest";
import { rankEntries, rankingPointsForPosition } from "@/engine/ranking";

describe("Ranking Engine", () => {
  it("Open puan tablosu (GDD 17.83)", () => {
    expect(rankingPointsForPosition(1)).toBe(6);
    expect(rankingPointsForPosition(2)).toBe(4.5);
    expect(rankingPointsForPosition(3)).toBe(3.5);
    expect(rankingPointsForPosition(5)).toBe(2.5);
    expect(rankingPointsForPosition(9)).toBe(0); // puansız derece
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
