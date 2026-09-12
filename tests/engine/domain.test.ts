import { describe, expect, it } from "vitest";
import {
  ageToCategory,
  computeAge,
  formatPlayerCode,
  makeCategoryId,
} from "@/engine/domain";

describe("domain", () => {
  it("ageToCategory sınırları (GDD 7.9)", () => {
    expect(ageToCategory(9)).toBe("U10");
    expect(ageToCategory(11)).toBe("U12"); // GDD örneği: 11 → U12
    expect(ageToCategory(13)).toBe("U14");
    expect(ageToCategory(16)).toBe("U17");
    expect(ageToCategory(20)).toBe("U21");
    expect(ageToCategory(25)).toBe("SENIOR");
  });

  it("computeAge doğum gününe göre hesaplar", () => {
    const birth = new Date("2010-06-15");
    expect(computeAge(birth, new Date("2026-06-15"))).toBe(16); // tam doğum günü
    expect(computeAge(birth, new Date("2026-06-14"))).toBe(15); // bir gün önce
    expect(computeAge(birth, new Date("2026-12-31"))).toBe(16);
  });

  it("makeCategoryId GDD formatı (U17-M-FL)", () => {
    expect(makeCategoryId("U17", "MALE", "FOIL")).toBe("U17-M-FL");
    expect(makeCategoryId("SENIOR", "FEMALE", "SABRE")).toBe("SENIOR-F-KIL");
    expect(makeCategoryId("U14", "MALE", "EPEE")).toBe("U14-M-EPE");
  });

  it("formatPlayerCode 6 haneye sıfır doldurur", () => {
    expect(formatPlayerCode(1)).toBe("P-000001");
    expect(formatPlayerCode(123456)).toBe("P-123456");
  });
});
