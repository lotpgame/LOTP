import { describe, expect, it } from "vitest";
import { radarGrowth, radarPoint, radarPolygon } from "@/app/ui/radar";

describe("yetenek radarı geometrisi", () => {
  it("ilk eksen tepede, sonrakiler saat yönünde", () => {
    expect(radarPoint(0, 4, 10)).toEqual({ x: 0, y: -10 });
    expect(radarPoint(1, 4, 10)).toEqual({ x: 10, y: 0 });
    expect(radarPoint(2, 4, 10)).toEqual({ x: 0, y: 10 });
  });

  it("değeri max'a oranlar; max'ı aşan ya da negatif değer kenarda/merkezde kalır", () => {
    expect(radarPolygon([5, 20, -3, 10], 10, 10)).toBe("0,-5 10,0 0,0 -10,0");
  });

  it("büyüme tam sayıya yuvarlanır; çeyrek başı yoksa 0", () => {
    expect(radarGrowth(13.6, 11.2)).toBe(2);
    expect(radarGrowth(12.3, 12.1)).toBe(0);
    expect(radarGrowth(12.3, undefined)).toBe(0);
  });
});
