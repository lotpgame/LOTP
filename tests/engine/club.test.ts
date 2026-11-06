import { describe, expect, it } from "vitest";
import { BASE_FACILITY, computeFacility } from "@/engine/club";

describe("club facility — tesis büyüme modeli", () => {
  it("taban 30'dan başlar", () => {
    expect(BASE_FACILITY).toBe(30);
  });

  it("üye yoksa taban döner (botlar sayılmaz → 0 gerçek üye)", () => {
    expect(computeFacility(30, 0, 0)).toBe(30);
  });

  it("hepsi başarısızsa taban kalır (oran 0)", () => {
    expect(computeFacility(30, 10, 0)).toBe(30);
  });

  // Kullanıcının örneği (06.11): başarı oranı kilit — kalabalık ama başarısız kulüp DÜŞÜK çıkmalı.
  it("5 üye, 5'i de başarılı (oran 1.0) → 58", () => {
    // 30 + (5*1.5 + 5*4)*1.0 = 30 + 27.5 = 57.5 → 58
    expect(computeFacility(30, 5, 5)).toBe(58);
  });

  it("20 üye, 5 başarılı/15 başarısız (oran 0.25) → 43 (elit küçük kulüpten DÜŞÜK)", () => {
    // 30 + (20*1.5 + 5*4)*0.25 = 30 + 12.5 = 42.5 → 43
    expect(computeFacility(30, 20, 5)).toBe(43);
    // kalabalık başarısız kulüp (43) < küçük elit kulüp (58)
    expect(computeFacility(30, 20, 5)).toBeLessThan(computeFacility(30, 5, 5));
  });

  it("büyük ve tam başarılı kulüp tavana (100) yaklaşır/ulaşır", () => {
    expect(computeFacility(30, 12, 12)).toBe(96); // 30 + (18+48) = 96
    expect(computeFacility(30, 20, 20)).toBe(100); // 30 + 110 = 140 → 100 tavan
  });

  it("mezun sayısı üyeyi aşamaz (güvenlik)", () => {
    expect(computeFacility(30, 5, 99)).toBe(computeFacility(30, 5, 5));
  });

  it("sonuç hep [taban, 100] arasında", () => {
    for (const [b, m, g] of [[30, 3, 1], [30, 50, 50], [30, 1, 1], [45, 8, 4]] as const) {
      const f = computeFacility(b, m, g);
      expect(f).toBeGreaterThanOrEqual(b);
      expect(f).toBeLessThanOrEqual(100);
    }
  });
});
