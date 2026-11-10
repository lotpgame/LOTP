import { describe, it, expect } from "vitest";
import {
  AD_DAILY_CAP,
  AD_REWARD,
  DENAR_PACKAGES,
  adsLeftToday,
  adsWatchedToday,
  canWatchAd,
  watchAd,
  type AdState,
} from "@/engine/ads";

const fresh: AdState = { lastAdDay: 0, adsToday: 0 };

describe("ads — ödüllü reklam sayacı", () => {
  it("sabitler makul (ödül 5, günlük tavan 5 → max 25/gün)", () => {
    expect(AD_REWARD).toBe(5);
    expect(AD_DAILY_CAP).toBe(5);
  });

  it("yeni günde sayaç sıfırlanır (adsWatchedToday)", () => {
    const used: AdState = { lastAdDay: 5, adsToday: 3 };
    expect(adsWatchedToday(used, 5)).toBe(3); // aynı gün
    expect(adsWatchedToday(used, 6)).toBe(0); // ertesi gün
    expect(adsLeftToday(used, 6)).toBe(AD_DAILY_CAP);
  });

  it("izlendikçe ödül verir ve sayaç artar", () => {
    let s = fresh;
    let total = 0;
    for (let i = 0; i < AD_DAILY_CAP; i++) {
      expect(canWatchAd(s, 10)).toBe(true);
      const r = watchAd(s, 10);
      s = r.state;
      total += r.reward;
    }
    expect(total).toBe(AD_REWARD * AD_DAILY_CAP);
    expect(adsLeftToday(s, 10)).toBe(0);
  });

  it("tavan dolunca ödül yok, durum değişmez", () => {
    const capped: AdState = { lastAdDay: 10, adsToday: AD_DAILY_CAP };
    expect(canWatchAd(capped, 10)).toBe(false);
    const r = watchAd(capped, 10);
    expect(r.reward).toBe(0);
    expect(r.state).toEqual(capped);
  });

  it("gün değişince tavan tekrar dolar", () => {
    const capped: AdState = { lastAdDay: 10, adsToday: AD_DAILY_CAP };
    expect(canWatchAd(capped, 11)).toBe(true);
    const r = watchAd(capped, 11);
    expect(r.reward).toBe(AD_REWARD);
    expect(r.state).toEqual({ lastAdDay: 11, adsToday: 1 });
  });

  it("paket kataloğu: tek ürün — 1.000 Đ / £4.99 (kullanıcı kararı 06.11)", () => {
    expect(DENAR_PACKAGES).toHaveLength(1);
    expect(DENAR_PACKAGES[0].denar).toBe(1000);
    expect(DENAR_PACKAGES[0].gbp).toBe("£4.99");
  });
});
