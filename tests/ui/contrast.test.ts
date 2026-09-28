import { describe, expect, it } from "vitest";
import { contrastRatio, MIN_CONTRAST } from "@/app/ui/contrast";

describe("kontrast oranı (WCAG)", () => {
  it("siyah/beyaz en yüksek oranı verir (21)", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("aynı renk oranı 1 verir", () => {
    expect(contrastRatio("#f4f5f2", "#f4f5f2")).toBeCloseTo(1, 5);
    expect(contrastRatio("#111418", "#f4f5f2")).toBe(contrastRatio("#f4f5f2", "#111418"));
  });

  it("uygulamanın kendi Salon ve Pist varsayılanları eşiğin üstünde", () => {
    expect(contrastRatio("#f4f5f2", "#111418")).toBeGreaterThan(MIN_CONTRAST);
    expect(contrastRatio("#0b0e12", "#e8ecf0")).toBeGreaterThan(MIN_CONTRAST);
  });

  it("birbirine yakın iki renk eşiğin altında kalır", () => {
    expect(contrastRatio("#888888", "#999999")).toBeLessThan(MIN_CONTRAST);
  });

  it("geçersiz hex için en düşük oranı (1) döndürür, patlamaz", () => {
    expect(contrastRatio("nope", "#ffffff")).toBe(1);
  });
});
