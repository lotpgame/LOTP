import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import {
  TRAITS,
  activeTraitKeys,
  generateTraitPlan,
  sanitizeTraitKeys,
  reputationAfterEvent,
  evolveTraits,
  applyTraitChange,
  parseTraitPlan,
  encodeTraitPlan,
  TRAIT_CHANGE_COOLDOWN_DAYS,
  type TraitSignals,
  traitCombatModifier,
  traitTrainingMultiplier,
} from "@/engine/trait";
import { equipmentUpgradeCost, prizeFor } from "@/engine/economy";
import { applyKitPurchase, encodeKit, itemById, kitItemFits, requiredSize, resolveKit, sizeLabel, starterKit } from "@/engine/equipment";
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
  it("itibar: Çirkef düşer (en çok), Hilekâr az düşer, Dürüst toparlar, nötr tavana sürüklenir", () => {
    expect(reputationAfterEvent(100, ["NASTY"])).toBeLessThan(reputationAfterEvent(100, ["DECEITFUL"]));
    expect(reputationAfterEvent(100, ["DECEITFUL"])).toBeLessThan(100);
    expect(reputationAfterEvent(50, ["HONEST"])).toBeGreaterThan(50); // toparlar
    expect(reputationAfterEvent(50, ["CALM"])).toBeGreaterThan(50); // nötr → hafif yukarı
    // sınırlar: 0–100 dışına taşmaz
    expect(reputationAfterEvent(1, ["NASTY"])).toBe(0);
    expect(reputationAfterEvent(100, ["HONEST"])).toBe(100);
    // Çirkeflik tekrar ettikçe birikir (uzun vadede dışlanma)
    let r = 100;
    for (let i = 0; i < 10; i++) r = reputationAfterEvent(r, ["NASTY"]);
    expect(r).toBeLessThan(65);
  });
  it("Katman 2 — trait evrimi: cooldown, dönüşüm, max-3, yaş kapısı, determinizm", () => {
    // Güçlü "olgunlaşma" sinyali: genç, iyi koç, çok tecrübe → Sabırsız → Sabırlı adayı.
    const mature = (over: Partial<TraitSignals> = {}): TraitSignals => ({
      age: 13, championships: 0, medals: 0, nationalTeam: false,
      coachQuality: 0.7, tournamentsPlayed: 20, recentSetback: false,
      daysSinceLastChange: 200, ...over,
    });

    // 1) Cooldown: son değişim çok yakınsa HİÇBİR tohumda değişmez.
    for (let i = 0; i < 40; i++) {
      expect(evolveTraits(["IMPATIENT"], mature({ daysSinceLastChange: TRAIT_CHANGE_COOLDOWN_DAYS - 1 }), createRng(`cd${i}`))).toBeNull();
    }

    // 2) Dönüşüm gerçekleşir: bazı tohumlarda Sabırsız → Sabırlı; başka bir şeye dönüşmez.
    let transformed = 0;
    for (let i = 0; i < 60; i++) {
      const ch = evolveTraits(["IMPATIENT"], mature(), createRng(`tf${i}`));
      if (ch) {
        expect(ch).toEqual({ kind: "TRANSFORM", from: "IMPATIENT", to: "PATIENT", reason: "traitEvo.impatientToPatient" });
        transformed++;
      }
    }
    expect(transformed).toBeGreaterThan(0);

    // 3) Determinizm: aynı tohum → aynı sonuç.
    expect(evolveTraits(["IMPATIENT"], mature(), createRng("same"))).toEqual(evolveTraits(["IMPATIENT"], mature(), createRng("same")));

    // 4) Uygun aday yoksa null (nötr trait + zayıf sinyal).
    for (let i = 0; i < 30; i++) {
      expect(evolveTraits(["DISCIPLINED"], mature({ coachQuality: 0.2, tournamentsPlayed: 2 }), createRng(`no${i}`))).toBeNull();
    }

    // 5) Max 3 korunur: 3 trait doluyken edinme (ACQUIRE) tetiklenmez.
    const full = ["DISCIPLINED", "AMBITIOUS", "RISK_TAKER"] as const;
    for (let i = 0; i < 40; i++) {
      expect(evolveTraits(full, mature({ championships: 5 }), createRng(`full${i}`))).toBeNull();
    }

    // 6) Yaş kapısı: genç, yaşlıdan daha sık değişir (GDD 10.35).
    const count = (age: number) => {
      let n = 0;
      for (let i = 0; i < 200; i++) if (evolveTraits(["IMPATIENT"], mature({ age }), createRng(`age${age}:${i}`))) n++;
      return n;
    };
    expect(count(12)).toBeGreaterThan(count(25));
  });
  it("applyTraitChange: dönüşüm eski trait'i çıkarır, yenisi aktif olur (zıt-çift kalmaz)", () => {
    const plan = parseTraitPlan("IMPATIENT:11,CALM:12");
    // Sabırsız → Sabırlı (14 yaşında)
    const next = applyTraitChange(plan, { kind: "TRANSFORM", from: "IMPATIENT", to: "PATIENT", reason: "x" }, 14);
    const active = activeTraitKeys(next, 20);
    expect(active).toContain("PATIENT");
    expect(active).not.toContain("IMPATIENT"); // eski çıktı → zıt-çift yok
    expect(active).toContain("CALM"); // diğer trait korunur
    // CSV olarak saklanabilir (round-trip)
    expect(parseTraitPlan(encodeTraitPlan(next)).length).toBe(next.length);
    // Edinme: boş slota yeni trait, eskiler durur
    const gained = applyTraitChange(parseTraitPlan("DISCIPLINED:8"), { kind: "ACQUIRE", to: "CONFIDENT", reason: "x" }, 17);
    expect(activeTraitKeys(gained, 20).sort()).toEqual(["CONFIDENT", "DISCIPLINED"]);
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

describe("Malzeme çantası (equipmentState)", () => {
  it("starterKit: tam takım, kozmetik hariç, beden 0 + tam dayanıklılık + kırık değil", () => {
    const kit = starterKit("FOIL");
    expect(kit.length).toBeGreaterThan(5);
    for (const k of kit) {
      expect(itemById(k.itemId)?.cosmetic).not.toBe(true); // kozmetik (çanta) yok
      expect(k.size).toBe(0);
      expect(k.durability).toBe(100);
      expect(k.broken).toBe(false);
    }
    // flöre yeleği içerir, epe içermez
    expect(starterKit("FOIL").some((k) => k.slot === "LAME")).toBe(true);
    expect(starterKit("EPEE").some((k) => k.slot === "LAME")).toBe(false);
  });
  it("resolveKit: null/boş/bozuk → başlangıç takımı; geçerli JSON → kendisi", () => {
    expect(resolveKit(null, "EPEE")).toEqual(starterKit("EPEE"));
    expect(resolveKit("bozuk-json", "EPEE")).toEqual(starterKit("EPEE"));
    const kit = starterKit("SABRE");
    expect(resolveKit(encodeKit(kit), "SABRE")).toEqual(kit);
  });
  it("beden (Dilim 2A): silah yaş kategorisine göre 0/2/5; diğer parçalar bedensiz; küçük gelince uymaz", () => {
    expect(requiredSize("WEAPON", "U10")).toBe(0);
    expect(requiredSize("WEAPON", "U12")).toBe(2);
    expect(requiredSize("WEAPON", "U14")).toBe(5);
    expect(requiredSize("WEAPON", "SENIOR")).toBe(5);
    expect(requiredSize("MASK", "U14")).toBe(0); // silah dışı 2A'da bedensiz
    expect(sizeLabel(0)).toBe("U10");
    expect(sizeLabel(2)).toBe("U12");
    expect(sizeLabel(5)).toBe("U14+");
    // U10 silahı (beden 0) U10'da uyar, U12'de küçük gelir
    const w = { slot: "WEAPON" as const, itemId: "gl-weapon-foil", size: 0, durability: 100, broken: false };
    expect(kitItemFits(w, "U10")).toBe(true);
    expect(kitItemFits(w, "U12")).toBe(false);
    // starterKit kategoriye göre doğru silah bedeni verir
    expect(starterKit("FOIL", "U14").find((k) => k.slot === "WEAPON")?.size).toBe(5);
    expect(starterKit("FOIL").find((k) => k.slot === "WEAPON")?.size).toBe(0); // varsayılan U10
  });
  it("applyKitPurchase: o slotu yeni ürünle değiştirir (tam dayanıklılık), slot sayısı artmaz", () => {
    const kit = starterKit("FOIL");
    const weapon = itemById("gl-weapon-foil")!;
    const worn = kit.map((k) => (k.slot === "WEAPON" ? { ...k, durability: 20, broken: true } : k));
    const next = applyKitPurchase(worn, weapon);
    const w = next.find((k) => k.slot === "WEAPON")!;
    expect(w.durability).toBe(100);
    expect(w.broken).toBe(false);
    expect(next.filter((k) => k.slot === "WEAPON").length).toBe(1); // slot başına tek parça
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
