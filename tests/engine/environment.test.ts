import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  TRAITS,
  activeTraitKeys,
  generateTraitPlan,
  sanitizeTraitKeys,
  traitCombatModifier,
  traitTrainingMultiplier,
} from "@/engine/trait";
import { equipmentUpgradeCost, prizeFor } from "@/engine/economy";
import {
  clubTrainingMultiplier,
  coachTrainingMultiplier,
  equipmentCombatModifier,
  equipmentTrainingMultiplier,
} from "@/engine/environment";

describe("Trait Engine", () => {
  it("çalışkan verimi artırır, tembel azaltır", () => {
    expect(traitTrainingMultiplier(["HARDWORKING"])).toBeGreaterThan(1);
    expect(traitTrainingMultiplier(["LAZY"])).toBeLessThan(1);
  });
  it("agresif/soğukkanlı combat katkısı verir", () => {
    expect(traitCombatModifier(["AGGRESSIVE"])).toBeGreaterThan(0);
    expect(traitCombatModifier(["DISCIPLINED"])).toBe(0);
  });
  it("generateTraitPlan deterministik, max 3, tekrarsız ve ZIT-ÇİFT içermez", () => {
    const a = generateTraitPlan(createRng("t"));
    const b = generateTraitPlan(createRng("t"));
    expect(a).toEqual(b); // deterministik
    expect(a.length).toBeLessThanOrEqual(3);
    const keys = a.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length); // tekrarsız
    // zıt-çift yok (Disiplinli+Tembel gibi aynı anda olamaz)
    for (const k of keys) {
      const opp = TRAITS[k].opposite;
      if (opp) expect(keys).not.toContain(opp);
    }
  });
  it("zıt-harita simetrik (A.opposite=B ⟺ B.opposite=A)", () => {
    for (const def of Object.values(TRAITS)) {
      if (!def.opposite) continue;
      expect(TRAITS[def.opposite].opposite).toBe(def.key);
    }
  });
  it("hiçbir tohum zıt/çift trait üretmez (5000 tohum)", () => {
    for (let i = 0; i < 5000; i++) {
      const keys = generateTraitPlan(createRng(`seed:${i}`)).map((e) => e.key);
      expect(new Set(keys).size).toBe(keys.length); // tekrarsız
      for (const k of keys) {
        const opp = TRAITS[k].opposite;
        if (opp) expect(keys).not.toContain(opp);
      }
    }
  });
  it("sanitizeTraitKeys: zıt/çift eski kaydı temizler, erken OLUŞANI tutar", () => {
    // faz4 öncesi bozuk kayıt: Çalışkan + Tembel (zıt) + tekrar
    expect(sanitizeTraitKeys(["HARDWORKING", "LAZY", "HARDWORKING"])).toEqual(["HARDWORKING"]);
    // önce gelen (daha erken oluşan) tutulur
    expect(sanitizeTraitKeys(["CALM", "ANXIOUS"])).toEqual(["CALM"]);
    expect(sanitizeTraitKeys(["ANXIOUS", "CALM"])).toEqual(["ANXIOUS"]);
    // çelişkisiz set olduğu gibi kalır
    expect(sanitizeTraitKeys(["HARDWORKING", "CALM", "AGGRESSIVE"])).toEqual(["HARDWORKING", "CALM", "AGGRESSIVE"]);
  });
  it("activeTraitKeys zıt-çift bozuk planı okuma anında temizler (küçük unlockAge tutulur)", () => {
    // Elle kurulmuş BOZUK plan (üretim böyle vermez): Tembel(8) + Çalışkan(12) → zıt.
    const badPlan = [
      { key: "LAZY" as const, unlockAge: 8 },
      { key: "CALM" as const, unlockAge: 11 },
      { key: "HARDWORKING" as const, unlockAge: 12 },
    ];
    const active = activeTraitKeys(badPlan, 20);
    expect(active).toContain("LAZY"); // erken oluşan kaldı
    expect(active).not.toContain("HARDWORKING"); // zıt olan düştü
    expect(active).toContain("CALM");
  });
  it("kademeli açılım: 8-10 yaş 1 trait, 11'de 2, 12'de 3", () => {
    // Zıt-çift filtresi bazen <3 üretebilir; birçok tohumdan tam 3'lük bir plan bul.
    let plan = generateTraitPlan(createRng("x"));
    for (let i = 0; plan.length < 3 && i < 50; i++) plan = generateTraitPlan(createRng(`x${i}`));
    expect(plan.length).toBe(3);
    expect(activeTraitKeys(plan, 8)).toHaveLength(1);
    expect(activeTraitKeys(plan, 10)).toHaveLength(1);
    expect(activeTraitKeys(plan, 11)).toHaveLength(2);
    expect(activeTraitKeys(plan, 12)).toHaveLength(3);
  });
});

describe("Economy Engine", () => {
  it("ödül seviyeye ve dereceye göre; prestij arttıkça artar", () => {
    expect(prizeFor("OPEN", 1)).toBeGreaterThan(prizeFor("IL", 1));
    expect(prizeFor("WORLD_CUP", 1)).toBeGreaterThan(prizeFor("TURKIYE", 1));
    expect(prizeFor("OPEN", 1)).toBeGreaterThan(prizeFor("OPEN", 3));
    expect(prizeFor("IL", 9)).toBe(0);
  });
  it("ekipman yükseltme maliyeti seviyeyle artar", () => {
    expect(equipmentUpgradeCost(2)).toBeGreaterThan(equipmentUpgradeCost(1));
  });
});

describe("Environment (kulüp/koç/ekipman) modifier'ları", () => {
  it("kulüp tesisi verimi 0.9–1.1 arası etkiler", () => {
    expect(clubTrainingMultiplier(100)).toBeGreaterThan(clubTrainingMultiplier(0));
    expect(clubTrainingMultiplier(100)).toBeLessThanOrEqual(1.1);
    expect(clubTrainingMultiplier(0)).toBeGreaterThanOrEqual(0.9);
  });
  it("koç uzmanlığı uyumlu antrenmanı güçlendirir", () => {
    const match = coachTrainingMultiplier(80, "TECHNICAL", "TECHNICAL");
    const noMatch = coachTrainingMultiplier(80, "TECHNICAL", "PHYSICAL");
    expect(match).toBeGreaterThan(noMatch);
  });
  it("ekipman seviyesi küçük antrenman + combat etkisi", () => {
    expect(equipmentTrainingMultiplier(5)).toBeGreaterThan(equipmentTrainingMultiplier(1));
    expect(equipmentCombatModifier(5)).toBeGreaterThan(equipmentCombatModifier(1));
    expect(equipmentCombatModifier(1)).toBe(0);
  });
});
