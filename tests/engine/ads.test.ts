import { describe, it, expect } from "vitest";
import {
  AD_COOLDOWN_MS,
  AD_REWARD,
  DENAR_PACKAGES,
  adReadyAtMs,
  canWatchAd,
  watchAd,
  type AdState,
} from "@/engine/ads";

const T0 = 1_700_000_000_000; // sabit referans zaman (epoch ms) — deterministik test
const fresh: AdState = { lastAdAt: null };

describe("ads — ödüllü reklam (gerçek-zaman cooldown)", () => {
  it("sabitler makul (ödül 2 Đ, cooldown 2 saat)", () => {
    expect(AD_REWARD).toBe(2);
    expect(AD_COOLDOWN_MS).toBe(2 * 60 * 60 * 1000);
  });

  it("hiç izlenmemişse hazır", () => {
    expect(canWatchAd(fresh, T0)).toBe(true);
    expect(adReadyAtMs(fresh, T0)).toBeNull(); // null = şu an hazır
  });

  it("izleyince ödül verir + cooldown başlar", () => {
    const r = watchAd(fresh, T0);
    expect(r.reward).toBe(AD_REWARD);
    expect(r.state.lastAdAt).toBe(T0);
    // Hemen ardından hazır değil, cooldown bitişini döner
    expect(canWatchAd(r.state, T0)).toBe(false);
    expect(adReadyAtMs(r.state, T0)).toBe(T0 + AD_COOLDOWN_MS);
    // 1 ms önce hâlâ kilitli
    expect(canWatchAd(r.state, T0 + AD_COOLDOWN_MS - 1)).toBe(false);
  });

  it("cooldown dolunca tekrar hazır", () => {
    const s: AdState = { lastAdAt: T0 };
    expect(canWatchAd(s, T0 + AD_COOLDOWN_MS)).toBe(true);
    expect(adReadyAtMs(s, T0 + AD_COOLDOWN_MS)).toBeNull();
    const r = watchAd(s, T0 + AD_COOLDOWN_MS);
    expect(r.reward).toBe(AD_REWARD);
    expect(r.state.lastAdAt).toBe(T0 + AD_COOLDOWN_MS);
  });

  it("cooldown dolmadan izleme ödül vermez, durum değişmez", () => {
    const s: AdState = { lastAdAt: T0 };
    const r = watchAd(s, T0 + 60_000); // 1 dk sonra
    expect(r.reward).toBe(0);
    expect(r.state).toEqual(s);
  });

  it("paket kataloğu: tek ürün — 500 Đ / £4.99 (kullanıcı kararı 16.11)", () => {
    expect(DENAR_PACKAGES).toHaveLength(1);
    expect(DENAR_PACKAGES[0].denar).toBe(500);
    expect(DENAR_PACKAGES[0].gbp).toBe("£4.99");
  });
});
