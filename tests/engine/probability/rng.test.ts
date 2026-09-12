import { describe, expect, it } from "vitest";
import { SeededRng, createRng } from "@/engine/probability";

describe("SeededRng", () => {
  it("aynı seed → birebir aynı dizi (tekrarlanabilirlik, GDD 20.30)", () => {
    const a = createRng("engarde");
    const b = createRng("engarde");
    const seqA = Array.from({ length: 100 }, () => a.next());
    const seqB = Array.from({ length: 100 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("farklı seed → farklı dizi", () => {
    const a = Array.from({ length: 20 }, () => createRng("A").next());
    const b = Array.from({ length: 20 }, () => createRng("B").next());
    expect(a).not.toEqual(b);
  });

  it("next() daima [0, 1) aralığında", () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("int(min, max) iki uç dahil aralıkta kalır ve her iki uca da ulaşır", () => {
    const rng = createRng("dice");
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 2000; i++) {
      const x = rng.int(1, 6);
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(1);
      expect(x).toBeLessThanOrEqual(6);
      if (x === 1) sawMin = true;
      if (x === 6) sawMax = true;
    }
    expect(sawMin && sawMax).toBe(true);
  });

  it("int(max < min) hata fırlatır", () => {
    const rng = createRng(1);
    expect(() => rng.int(5, 1)).toThrow();
  });

  it("bool(p) olasılığı yaklaşık tutturur", () => {
    const rng = createRng("coin");
    let heads = 0;
    const n = 10000;
    for (let i = 0; i < n; i++) if (rng.bool(0.3)) heads++;
    const ratio = heads / n;
    expect(ratio).toBeGreaterThan(0.27);
    expect(ratio).toBeLessThan(0.33);
  });

  it("shuffle girdiyi bozmaz ve aynı elemanları korur; aynı seed → aynı sıralama", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = createRng("mix").shuffle(input);
    const s2 = createRng("mix").shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // orijinal korunur
    expect(s1).toEqual(s2); // deterministik
    expect([...s1].sort((a, b) => a - b)).toEqual(input); // aynı elemanlar
  });

  it("pick() boş dizide hata fırlatır", () => {
    const rng = createRng(1);
    expect(() => rng.pick([])).toThrow();
  });

  it("seed özelliği okunabilir ve number seed string'e normalize edilir", () => {
    expect(new SeededRng(123).seed).toBe("123");
  });
});
