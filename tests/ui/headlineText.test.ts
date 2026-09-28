import { describe, expect, it } from "vitest";
import { buildHeadline, headlineShareText, lastBoutFrom } from "@/app/ui/headlineText";

const base = { name: "Deniz Aksoy", tournament: "U10 İl Şampiyonası" };

describe("manşet cümleleri", () => {
  it("dereceye göre doğru şablonu seçer (FIE eşitlikli dereceler dahil)", () => {
    expect(buildHeadline("tr", { ...base, position: 1 }).title).toBe("U10 İl Şampiyonası: Deniz Aksoy şampiyon!");
    expect(buildHeadline("tr", { ...base, position: 3 }).title).toBe("U10 İl Şampiyonası: Deniz Aksoy bronz madalya");
    expect(buildHeadline("tr", { ...base, position: 9 }).title).toBe("U10 İl Şampiyonası: Deniz Aksoy son 16'da");
    expect(buildHeadline("tr", { ...base, position: 33 }).title).toBe("U10 İl Şampiyonası: Deniz Aksoy son 64'te");
    expect(buildHeadline("tr", { ...base, position: 14 }).title).toBe("U10 İl Şampiyonası: Deniz Aksoy 14. oldu");
    expect(buildHeadline("en", { ...base, position: 2 }).title).toBe("U10 İl Şampiyonası: Deniz Aksoy takes silver");
  });

  it("yalnız şampiyonlukta champion işaretli", () => {
    expect(buildHeadline("tr", { ...base, position: 1 }).champion).toBe(true);
    expect(buildHeadline("tr", { ...base, position: 2 }).champion).toBe(false);
  });

  it("alt satır: son maç, pul özeti (averaj işaretli), katılımcı sayısı", () => {
    const h = buildHeadline("tr", {
      ...base,
      position: 2,
      fieldSize: 24,
      pool: { wins: 4, losses: 1, indicator: 9 },
      lastBout: { round: "Final", opp: "Arda Öztürk", scoreHuman: 12, scoreOpp: 15 },
    });
    expect(h.deck).toEqual([
      "Final: Arda Öztürk karşısında 12–15",
      "Pulda 4 galibiyet, 1 mağlubiyet, averaj +9",
      "24 sporcu",
    ]);
    const neg = buildHeadline("tr", { ...base, position: 20, pool: { wins: 1, losses: 4, indicator: -7 } });
    expect(neg.deck).toEqual(["Pulda 1 galibiyet, 4 mağlubiyet, averaj -7"]);
  });

  it("son eleme maçını sporcunun tarafından okur", () => {
    const matches = [
      { phase: "POOL", round: "Pul 1", aName: "A", bName: "B", scoreA: 5, scoreB: 3, aIsHuman: true, bIsHuman: false },
      { phase: "DE", round: "Son 16", aName: "C", bName: "Sen", scoreA: 10, scoreB: 15, aIsHuman: false, bIsHuman: true },
      { phase: "DE", round: "Son 8", aName: "D", bName: "E", scoreA: 15, scoreB: 9, aIsHuman: false, bIsHuman: false },
      { phase: "DE", round: "Son 8", aName: "Sen", bName: "F", scoreA: 11, scoreB: 15, aIsHuman: true, bIsHuman: false },
    ];
    expect(lastBoutFrom(matches)).toEqual({ round: "Son 8", opp: "F", scoreHuman: 11, scoreOpp: 15 });
    expect(lastBoutFrom(matches.slice(0, 1))).toBeNull();
  });

  it("paylaşım metni: manşet + alt satır + davet bağlantısı", () => {
    const h = buildHeadline("tr", { ...base, position: 1, fieldSize: 12 });
    expect(headlineShareText("tr", h, "https://ornek.test")).toBe(
      "U10 İl Şampiyonası: Deniz Aksoy şampiyon!\n12 sporcu\n\nSen de eskrimci ol — Legends of the Piste: https://ornek.test",
    );
  });
});
