import { describe, expect, it } from "vitest";
import { detectAchievements, type AchievementType } from "@/engine/memory";

const base = {
  level: "OPEN" as const,
  tournamentName: "U17 Open Turnuva",
  position: 10,
  postRank: null as number | null,
  earnedUnique: new Set<AchievementType>(),
};

describe("Memory Engine — achievement tespiti", () => {
  it("ilk turnuva her zaman FIRST_TOURNAMENT verir (bir kez)", () => {
    const first = detectAchievements(base).map((a) => a.type);
    expect(first).toContain("FIRST_TOURNAMENT");
    const again = detectAchievements({
      ...base,
      earnedUnique: new Set(["FIRST_TOURNAMENT"]),
    }).map((a) => a.type);
    expect(again).not.toContain("FIRST_TOURNAMENT");
  });

  it("şampiyonluk: ilk kez FIRST_CHAMPIONSHIP + tekrarlı CHAMPIONSHIP", () => {
    const champ = detectAchievements({ ...base, position: 1 }).map((a) => a.type);
    expect(champ).toContain("FIRST_CHAMPIONSHIP");
    expect(champ).toContain("CHAMPIONSHIP");
    // İkinci şampiyonlukta FIRST_ gelmez ama CHAMPIONSHIP gelir
    const second = detectAchievements({
      ...base,
      position: 1,
      earnedUnique: new Set(["FIRST_TOURNAMENT", "FIRST_MEDAL", "FIRST_CHAMPIONSHIP"]),
    }).map((a) => a.type);
    expect(second).not.toContain("FIRST_CHAMPIONSHIP");
    expect(second).toContain("CHAMPIONSHIP");
  });

  it("uluslararası madalya yalnız uluslararası seviyelerde", () => {
    const openMedal = detectAchievements({ ...base, position: 2 }).map((a) => a.type);
    expect(openMedal).not.toContain("INTERNATIONAL_MEDAL");
    const satMedal = detectAchievements({ ...base, level: "SATELLITE", position: 2 }).map((a) => a.type);
    expect(satMedal).toContain("INTERNATIONAL_MEDAL");
  });

  it("ranking başarıları postRank'e göre", () => {
    const top = detectAchievements({ ...base, postRank: 1 }).map((a) => a.type);
    expect(top).toContain("NATIONAL_TEAM");
    expect(top).toContain("RANKING_TOP3");
    expect(top).toContain("RANKING_NUMBER_ONE");
    const rank10 = detectAchievements({ ...base, postRank: 10 }).map((a) => a.type);
    expect(rank10).not.toContain("NATIONAL_TEAM");
  });
});
