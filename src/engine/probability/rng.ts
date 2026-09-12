/**
 * Tohumlanabilir (seeded) deterministik rastgelelik motoru.
 *
 * NEDEN: GDD 2.4 (kontrollü belirsizlik) ve 20.29–20.30 (reproducibility) gereği oyundaki
 * TÜM rastgelelik buradan geçmelidir. Aynı seed → birebir aynı sonuç dizisi. Böylece:
 * maç tekrar üretilebilir (replay/debug), denge simülasyonları (GDD 4.33) tekrarlanabilir.
 *
 * `Math.random()` KULLANILMAZ — deterministik değildir. Onun yerine daima bu motor.
 *
 * Algoritma: cyrb128 (seed karıştırma) + sfc32 (üreteç). Küçük, hızlı, iyi dağılımlı,
 * platformdan bağımsız (yalnız 32-bit tamsayı aritmetiği → makineler arası aynı sonuç).
 */

/** Bir string/number seed'i 4×32-bit başlangıç durumuna dağıtır. */
function cyrb128(seed: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

/** sfc32 üreteci: 4×32-bit durumdan [0,1) aralığında sayı üretir. */
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return function next(): number {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/**
 * Tohumlanabilir rastgelelik kaynağı. Bir kez `new SeededRng(seed)` ile oluşturulur ve
 * simülasyon boyunca aynı örnek kullanılır; çağrı sırası sonucu belirler.
 */
export class SeededRng {
  private readonly draw: () => number;
  readonly seed: string;

  constructor(seed: string | number) {
    this.seed = String(seed);
    const [a, b, c, d] = cyrb128(this.seed);
    this.draw = sfc32(a, b, c, d);
  }

  /** [0, 1) aralığında ondalık. Tüm diğer yardımcılar bunun üzerine kuruludur. */
  next(): number {
    return this.draw();
  }

  /** [min, max) aralığında ondalık. */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** [min, max] aralığında tamsayı (iki uç dahil). */
  int(min: number, max: number): number {
    if (max < min) throw new RangeError(`int(${min}, ${max}): max < min`);
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** `pTrue` olasılıkla true (varsayılan %50). Örn. isabet/başarı denemesi. */
  bool(pTrue = 0.5): boolean {
    return this.next() < pTrue;
  }

  /** Diziden rastgele bir eleman seçer. Boş dizi hatadır. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError("pick(): boş dizi");
    return items[this.int(0, items.length - 1)];
  }

  /** Fisher–Yates ile karıştırılmış YENİ bir dizi döndürür (girdiyi bozmaz). */
  shuffle<T>(items: readonly T[]): T[] {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/** Kısayol fabrika: `createRng(seed)`. */
export function createRng(seed: string | number): SeededRng {
  return new SeededRng(seed);
}
