import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  createPlayerSchema,
  deriveIdentity,
  generateAiOpponents,
} from "@/engine/player";

const GAME_DATE = new Date("2026-01-01");

describe("Player Engine", () => {
  it("createPlayerSchema geçerli girdiyi kabul eder", () => {
    const res = createPlayerSchema.safeParse({
      firstName: "  Ahmet ",
      lastName: "Yılmaz",
      gender: "MALE",
      weapon: "EPEE",
      profile: "BALANCED",
      birthDate: "2010-05-20",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.firstName).toBe("Ahmet"); // trim
      expect(res.data.birthDate).toBeInstanceOf(Date);
    }
  });

  it("createPlayerSchema geçersiz girdiyi reddeder", () => {
    expect(createPlayerSchema.safeParse({
      firstName: "",
      lastName: "X",
      gender: "MALE",
      weapon: "EPEE",
      profile: "BALANCED",
      birthDate: "2010-05-20",
    }).success).toBe(false);

    expect(createPlayerSchema.safeParse({
      firstName: "A",
      lastName: "B",
      gender: "OTHER", // geçersiz enum
      weapon: "EPEE",
      profile: "BALANCED",
      birthDate: "2010-05-20",
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
});
