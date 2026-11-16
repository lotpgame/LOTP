import { describe, it, expect } from "vitest";
import { entryFee, prizeFor, travelCost } from "@/engine/economy";

describe("economy — turnuva yol/konaklama masrafı (kullanıcı kararı 16.11)", () => {
  it("İl = kendi şehrin → masraf yok", () => {
    expect(travelCost("IL", "Kocaeli", "Kocaeli")).toBe(0);
  });

  it("Yurt-içi (Türkiye/Open) BAŞKA şehir → yol masrafı var", () => {
    expect(travelCost("TURKIYE", "Ankara", "Kocaeli")).toBe(5);
    expect(travelCost("OPEN", "İzmir", "Kocaeli")).toBe(5);
  });

  it("Yurt-içi AMA ev sahibi = kendi şehrin → masraf yok", () => {
    expect(travelCost("TURKIYE", "Kocaeli", "Kocaeli")).toBe(0);
  });

  it("Uluslararası seviyeler her zaman uzak (ev sahibi şehirden bağımsız)", () => {
    expect(travelCost("SATELLITE", "Paris", "Kocaeli")).toBe(12);
    expect(travelCost("GRAND_PRIX", "Tokyo", "Kocaeli")).toBe(18);
    expect(travelCost("EUROPEAN", null, "Kocaeli")).toBe(25); // kıta = şehirsiz, yine uzak
    expect(travelCost("WORLD_CUP", null, "Kocaeli")).toBe(40);
  });

  it("entry fee + prize temel değerleri (regresyon)", () => {
    expect(entryFee("IL")).toBe(0);
    expect(entryFee("TURKIYE")).toBe(2);
    expect(prizeFor("IL", 1)).toBe(10);
    expect(prizeFor("IL", 5)).toBe(0);
  });
});
