import { describe, expect, it } from "vitest";
import { buildShowcase, buildTimeline, nextGoal, type ShowcaseAchievement, type ShowcaseResult } from "@/app/ui/showcase";

const DAY = 86_400_000;
const ach = (type: string, day: number | null, detail = "U10 İl Şampiyonası", order = day ?? 0): ShowcaseAchievement => ({
  type,
  detail,
  dateMs: day == null ? null : day * DAY,
  quarter: 1,
  order,
});
const res = (position: number, day: number | null, level = "IL", order = day ?? 0): ShowcaseResult => ({
  position,
  level,
  dateMs: day == null ? null : day * DAY,
  quarter: 2,
  order,
});

describe("kupa vitrini", () => {
  const results = [res(1, 3), res(3, 5), res(1, 9), res(2, 12), res(17, 14), res(3, 16, "EUROPEAN")];
  const achievements = [ach("FIRST_TOURNAMENT", 3), ach("FIRST_CHAMPIONSHIP", 3), ach("CHAMPIONSHIP", 3), ach("NATIONAL_TEAM", 10, "4. sıra")];
  const byKey = Object.fromEntries(buildShowcase(achievements, results).map((b) => [b.key, b]));

  it("şampiyonluk ve madalyalar dereceden sayılır; son kazanım en yeni olanın tarihi", () => {
    expect(byKey.champion).toMatchObject({ count: 2, last: { dateMs: 9 * DAY }, locked: false });
    expect(byKey.gold.count).toBe(2);
    expect(byKey.silver).toMatchObject({ count: 1, last: { dateMs: 12 * DAY } });
    expect(byKey.bronze).toMatchObject({ count: 2, last: { dateMs: 16 * DAY } });
  });

  it("milli takım ve klasman 1.liği başarılardan; kazanılmamışsa sayı 0, son yok", () => {
    expect(byKey.national).toMatchObject({ count: 1, last: { dateMs: 10 * DAY } });
    expect(byKey.rankingOne).toMatchObject({ count: 0, last: null, locked: false });
  });

  it("üst kademe hedefleri o seviyede madalyayla açılır; olimpiyat hep kilitli", () => {
    expect(byKey.european).toMatchObject({ count: 1, locked: false });
    expect(byKey.worldCup).toMatchObject({ count: 0, locked: true });
    expect(byKey.olympics).toMatchObject({ count: 0, locked: true });
  });

  it("eski kayıtta tarih yoksa son kazanım çeyreği taşır (gösterim Q'ya düşer)", () => {
    const old = Object.fromEntries(buildShowcase([], [res(2, null, "IL", 1)]).map((b) => [b.key, b]));
    expect(old.silver.last).toEqual({ dateMs: null, quarter: 2 });
  });
});

describe("kariyer zaman çizgisi", () => {
  it("eskiden yeniye sıralar, ilk şampiyonluğun yinelenen 'Şampiyonluk' düğümünü atar, dönüm noktalarını işaretler", () => {
    const nodes = buildTimeline([
      ach("NATIONAL_TEAM", 10, "4. sıra"),
      ach("FIRST_TOURNAMENT", 3),
      ach("FIRST_CHAMPIONSHIP", 3),
      ach("CHAMPIONSHIP", 3),
      ach("CHAMPIONSHIP", 9),
    ]);
    expect(nodes.map((n) => [n.type, n.order, n.milestone])).toEqual([
      ["FIRST_TOURNAMENT", 3, false],
      ["FIRST_CHAMPIONSHIP", 3, true],
      ["CHAMPIONSHIP", 9, false],
      ["NATIONAL_TEAM", 10, true],
    ]);
  });
});

describe("sıradaki hedef", () => {
  it("kariyer basamaklarında henüz ulaşılmamış ilk hedefi verir", () => {
    expect(nextGoal([], buildShowcase([], []))).toBe("FIRST_TOURNAMENT");
    const a = [ach("FIRST_TOURNAMENT", 1), ach("FIRST_MEDAL", 2)];
    expect(nextGoal(a, buildShowcase(a, [res(3, 2)]))).toBe("FIRST_CHAMPIONSHIP");
    const all = [...a, ach("FIRST_CHAMPIONSHIP", 3), ach("NATIONAL_TEAM", 4), ach("RANKING_NUMBER_ONE", 5)];
    expect(nextGoal(all, buildShowcase(all, [res(1, 3)]))).toBe("european");
    expect(nextGoal(all, buildShowcase(all, [res(2, 6, "EUROPEAN"), res(1, 7, "WORLD_CUP")]))).toBe("olympics");
  });
});
