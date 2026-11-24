import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  createPlayerSchema,
  deriveIdentity,
  generateAiOpponents,
} from "@/engine/player";
import { firstNamesFor, lastNamesFor } from "@/engine/player/names";
import { titleCaseName, isCleanName } from "@/engine/player/nameModeration";

const GAME_DATE = new Date("2026-01-01");

describe("İsim normalize + moderasyon (kullanıcı 24.11)", () => {
  it("titleCaseName: ilk harf büyük, gerisi küçük (çoklu boşluk/tire/kesme)", () => {
    expect(titleCaseName("aLLaN WeBB")).toBe("Allan Webb");
    expect(titleCaseName("  mehmet   ali ")).toBe("Mehmet Ali");
    expect(titleCaseName("JEAN-pierre")).toBe("Jean-Pierre");
    expect(titleCaseName("o'BRIEN")).toBe("O'Brien");
  });
  it("isCleanName: küfürlü adları engeller, gerçek adları geçirir", () => {
    expect(isCleanName("Allan Webb")).toBe(true);
    expect(isCleanName("Picard")).toBe(true); // 'pic' alt-dizesi gerçek adı engellemez
    expect(isCleanName("Amina")).toBe(true); // gerçek ad
    expect(isCleanName("siktir")).toBe(false);
    expect(isCleanName("a.m.k")).toBe(false); // kaçış: harf-dışı silinince 'amk'
    expect(isCleanName("orospu")).toBe(false);
    expect(isCleanName("fuck")).toBe(false);
  });
  it("createPlayerSchema: adı Title Case'e çevirir ve küfürü reddeder", () => {
    const ok = createPlayerSchema.safeParse({
      firstName: "aLLaN", lastName: "WeBB", gender: "MALE", weapon: "FOIL", profile: "BALANCED", country: "GB", city: "London",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.firstName).toBe("Allan");
      expect(ok.data.lastName).toBe("Webb");
    }
    const bad = createPlayerSchema.safeParse({
      firstName: "Siktir", lastName: "Git", gender: "MALE", weapon: "FOIL", profile: "BALANCED", country: "TR", city: "İstanbul",
    });
    expect(bad.success).toBe(false);
  });
});

describe("Player Engine", () => {
  it("createPlayerSchema geçerli girdiyi kabul eder", () => {
    const res = createPlayerSchema.safeParse({
      firstName: "  Ahmet ",
      lastName: "Yılmaz",
      gender: "MALE",
      weapon: "EPEE",
      profile: "BALANCED",
      country: "TR",
      city: "İstanbul",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.firstName).toBe("Ahmet"); // trim
      expect(res.data.city).toBe("İstanbul");
    }
  });

  it("createPlayerSchema geçersiz girdiyi reddeder", () => {
    expect(createPlayerSchema.safeParse({
      firstName: "",
      lastName: "X",
      gender: "MALE",
      weapon: "EPEE",
      profile: "BALANCED",
      city: "İstanbul",
    }).success).toBe(false);

    expect(createPlayerSchema.safeParse({
      firstName: "A",
      lastName: "B",
      gender: "OTHER", // geçersiz enum
      weapon: "EPEE",
      profile: "BALANCED",
      city: "İstanbul",
    }).success).toBe(false);
  });

  it("deriveIdentity yaş ve kategori üretir", () => {
    const id = deriveIdentity(
      { gender: "MALE", weapon: "FOIL", birthDate: new Date("2010-06-15") },
      GAME_DATE,
    );
    expect(id.age).toBe(15);
    expect(id.ageCategory).toBe("U17");
    expect(id.categoryId).toBe("U17-M-FL");
  });

  it("generateAiOpponents: istenen sayıda, aynı kategoride, deterministik", () => {
    const opts = {
      count: 7,
      gender: "MALE" as const,
      weapon: "EPEE" as const,
      ageCategory: "U17" as const,
      gameDate: GAME_DATE,
    };
    const a = generateAiOpponents(createRng("ai"), opts);
    const b = generateAiOpponents(createRng("ai"), opts);
    expect(a).toHaveLength(7);
    expect(a).toEqual(b); // deterministik

    for (const spec of a) {
      const id = deriveIdentity(spec, GAME_DATE);
      expect(id.ageCategory).toBe("U17");
      expect(spec.gender).toBe("MALE");
      expect(spec.weapon).toBe("EPEE");
      expect(Object.keys(spec.skills).length).toBeGreaterThan(0);
    }
  });

  it("generateAiOpponents: age verilince tüm AI aynı yaşta (kategoriyi birlikte atlar)", () => {
    // Yaş kategorisi ilerlemesinde saha dolu kalsın diye AI'lar oyuncuyla aynı yaşta üretilir.
    const specs = generateAiOpponents(createRng("gen"), {
      count: 12,
      gender: "MALE" as const,
      weapon: "FOIL" as const,
      ageCategory: "U10" as const,
      gameDate: GAME_DATE,
      age: 8,
    });
    for (const s of specs) {
      expect(deriveIdentity(s, GAME_DATE).age).toBe(8); // hepsi 8 yaşında
    }
  });

  it("AI ismi her zaman kendi ülkesinin havuzundan (Türk ismi İspanya'da çıkmaz)", () => {
    const opts = { count: 40, gender: "MALE" as const, weapon: "EPEE" as const, ageCategory: "SENIOR" as const, gameDate: GAME_DATE, age: 22 };
    // Tek ülke: hepsi o ülkeden + isim o havuzda.
    const es = generateAiOpponents(createRng("es"), { ...opts, countries: ["ES"] });
    const esFirst = new Set(firstNamesFor("MALE", "ES"));
    const esLast = new Set(lastNamesFor("ES"));
    for (const s of es) {
      expect(s.countryCode).toBe("ES");
      expect(esFirst.has(s.firstName)).toBe(true);
      expect(esLast.has(s.lastName)).toBe(true);
    }
    // Karışık havuz: her AI'ın adı KENDİ countryCode'unun havuzunda olmalı (çapraz sızıntı yok).
    const mix = generateAiOpponents(createRng("mix"), { ...opts, countries: ["TR", "ES", "IT", "RU"] });
    for (const s of mix) {
      expect(firstNamesFor("MALE", s.countryCode)).toContain(s.firstName);
      expect(lastNamesFor(s.countryCode)).toContain(s.lastName);
    }
  });
});
