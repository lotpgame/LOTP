import { describe, expect, it } from "vitest";
import { currentPeriodNo, isPriorityPhase, periodBand } from "@/app/ui/liveBand";

const TR_LOG = [
  "Maç gücü A hafif önde.",
  "▸ 1. Periyot — sen: Dengeli, rakip: Saldırgan",
  "A tuşu buldu — 1–0.",
  "▸ 2. Periyot — sen: Saldırgan, rakip: Dengeli",
  "B tuşu buldu — 1–1.",
];

const EN_LOG = ["▸ Period 1 — you: Balanced, opp: Aggressive", "A scored — 1–0."];

const LA_BELLE_LOG = [
  ...TR_LOG,
  "▸ 3. Periyot — sen: Dengeli, rakip: Dengeli",
  "Skor 14-14 berabere → öncelik kurası: A.",
  "🏅 Altın tuş! A buldu — 15–14.",
];

describe("currentPeriodNo", () => {
  it("en son açılmış periyot başlığının numarasını verir (TR)", () => {
    expect(currentPeriodNo(TR_LOG, 3)).toBe(1);
    expect(currentPeriodNo(TR_LOG, 5)).toBe(2);
  });

  it("İngilizce başlığı da tanır", () => {
    expect(currentPeriodNo(EN_LOG, 2)).toBe(1);
  });

  it("henüz hiçbir başlık açılmadıysa null döner", () => {
    expect(currentPeriodNo(TR_LOG, 0)).toBeNull();
  });
});

describe("isPriorityPhase", () => {
  it("öncelik kurası satırı açılmadan önce false", () => {
    expect(isPriorityPhase(LA_BELLE_LOG, 6)).toBe(false);
  });

  it("öncelik kurası satırı açılınca true", () => {
    expect(isPriorityPhase(LA_BELLE_LOG, 7)).toBe(true);
  });
});

describe("periodBand", () => {
  it("normal periyotta 'N. Periyot' etiketi (prio yok)", () => {
    expect(periodBand("tr", TR_LOG, 5)).toEqual({ label: "2. Periyot" });
  });

  it("altın tuş açılınca periyot numarasını geçersiz kılar", () => {
    expect(periodBand("tr", LA_BELLE_LOG, 7)).toEqual({ label: "Altın Tuş", prio: true });
  });

  it("henüz başlık yoksa undefined (band gösterilmez)", () => {
    expect(periodBand("tr", TR_LOG, 0)).toBeUndefined();
  });
});
