import { describe, expect, it } from "vitest";
import { CONTINENTS, citiesForCountry, continentOfCountry, countryByPhone, normalizePhone, parsePhone } from "@/engine/geo";

describe("geo — ülke / telefon", () => {
  it("TR şehir listesi dolu ve İstanbul içeriyor", () => {
    const cities = citiesForCountry("TR");
    expect(cities.length).toBeGreaterThan(50);
    expect(cities).toContain("İstanbul");
  });

  it("telefonu normalize eder (boşluk/tire/00 → +)", () => {
    expect(normalizePhone("+90 532 123 45 67")).toBe("+905321234567");
    expect(normalizePhone("0090-532-1234567")).toBe("+905321234567");
    expect(normalizePhone("(532) 123 45 67")).toBe("5321234567"); // + yok → olduğu gibi rakam
  });

  it("ülke kodundan ülkeyi bulur (+90 → TR)", () => {
    expect(countryByPhone("+905321234567")?.code).toBe("TR");
    expect(countryByPhone("905321234567")).toBeUndefined(); // + yok → çözülemez
  });

  it("parsePhone: geçerli TR numarası ok + ülke TR", () => {
    const r = parsePhone("+90 532 123 45 67");
    expect(r.ok).toBe(true);
    expect(r.country?.code).toBe("TR");
    expect(r.phone).toBe("+905321234567");
  });

  it("parsePhone: desteklenmeyen ülke kodu → unsupported", () => {
    const r = parsePhone("+1 415 555 0100"); // ABD henüz eklenmedi
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("unsupported");
  });

  it("parsePhone: bozuk biçim → format", () => {
    expect(parsePhone("123").reason).toBe("format");
    expect(parsePhone("abc").reason).toBe("format");
  });

  it("kıtalar FIE'nin 4 konfederasyonu; TR Avrupa'da", () => {
    expect(CONTINENTS.map((c) => c.code).sort()).toEqual(["AF", "AM", "AS", "EU"]);
    expect(continentOfCountry("TR")).toBe("EU");
    expect(continentOfCountry("ZZ")).toBeUndefined();
  });
});
