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
import { applyKitPurchase, applyMatchWear, applyRestAging, activeInSlot, bodySize, damageActive, discardKitItem, encodeKit, itemById, itemsInSlot, kitItemFits, requiredSize, resolveKit, validateKit, weaponsInKit, weaponSizeLabel, starterKit } from "@/engine/equipment";
import { clubMonthlyDues, entryFee } from "@/engine/economy";
import { applyEventsToPsych, rollWeeklyEvents, rollWeeklyMaterial } from "@/engine/lifeEvents";
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
  it("beden (2A silah + 2B kıyafet): silah kategoriye 0/2/5; kıyafet yaş/2; küçük gelince uymaz", () => {
    // Silah: yaş kategorisi
    expect(requiredSize("WEAPON", 9, "U10")).toBe(0);
    expect(requiredSize("WEAPON", 11, "U12")).toBe(2);
    expect(requiredSize("WEAPON", 13, "U14")).toBe(5);
    expect(weaponSizeLabel(0)).toBe("U10");
    expect(weaponSizeLabel(2)).toBe("U12");
    expect(weaponSizeLabel(5)).toBe("U14+");
    // Gövde bedeni: 8→0, 10→1, 12→2, 20→6 (20'de donar)
    expect(bodySize(8)).toBe(0);
    expect(bodySize(10)).toBe(1);
    expect(bodySize(12)).toBe(2);
    expect(bodySize(20)).toBe(6);
    expect(bodySize(25)).toBe(6);
    // Kıyafet gövde bedenli, kordon/çorap bedensiz
    expect(requiredSize("CLOTHING", 12, "U12")).toBe(2);
    expect(requiredSize("CORD", 12, "U12")).toBe(0);
    // U10 silahı U10'da uyar, U12'de küçük gelir
    const w = { slot: "WEAPON" as const, itemId: "gl-weapon-foil", size: 0, durability: 100, broken: false };
    expect(kitItemFits(w, 9, "U10")).toBe(true);
    expect(kitItemFits(w, 11, "U12")).toBe(false);
    // 8 yaş kıyafeti (beden 0), 12 yaşında küçük gelir
    const cl = { slot: "CLOTHING" as const, itemId: "gl-clothing", size: 0, durability: 100, broken: false };
    expect(kitItemFits(cl, 8, "U10")).toBe(true);
    expect(kitItemFits(cl, 12, "U12")).toBe(false);
    // starterKit yaşa göre doğru bedenler
    expect(starterKit("FOIL", 13, "U14").find((k) => k.slot === "WEAPON")?.size).toBe(5);
    expect(starterKit("FOIL", 12, "U12").find((k) => k.slot === "CLOTHING")?.size).toBe(2);
    expect(starterKit("FOIL").find((k) => k.slot === "WEAPON")?.size).toBe(0); // varsayılan 8/U10
  });
  it("yıpranma (2C-2): maçta AKTİF (en sağlam) parça aşınır; yedek korunur; 0'da kırılır", () => {
    // 2 silah: 100 ve 60 → aktif = 100 olan; o aşınır, 60'lık el değmez
    let kit = starterKit("FOIL");
    const w2 = itemById("gl-weapon-foil")!;
    kit = applyKitPurchase(kit, w2); // 2. silah (100)
    kit = kit.map((k, i) => (k.slot === "WEAPON" && itemsInSlot(kit, "WEAPON").indexOf(k) === 1 ? { ...k, durability: 60 } : k));
    const active = activeInSlot(kit, "WEAPON", 9, "U10");
    expect(active?.durability).toBe(100); // en sağlamı aktif
    const worn = applyMatchWear(kit, "FOIL", 9, "U10", 500);
    const weapons = itemsInSlot(worn, "WEAPON").map((k) => k.durability).sort((a, b) => a - b);
    expect(weapons).toEqual([60, 95]); // aktif 100→95, yedek 60 sabit
    expect(itemsInSlot(worn, "WEAPON").some((k) => k.lastUsedDay === 500)).toBe(true);
    // Dayanıklılık 0'a inince kırılır
    let low = starterKit("FOIL").map((k) => (k.slot === "WEAPON" ? { ...k, durability: 3 } : k));
    low = applyMatchWear(low, "FOIL", 9, "U10", 10); // 3 - 5 → 0 → kırık
    expect(itemsInSlot(low, "WEAPON")[0].broken).toBe(true);
  });
  it("paslanma (2C-3): atıl parça zamanla düşer; yakın kullanılan paslanmaz; pencere bir kez", () => {
    const base = starterKit("FOIL").map((k) => (k.slot === "WEAPON" ? { ...k, lastUsedDay: 0 } : k));
    // Grace (21g) içinde: paslanmaz
    expect(applyRestAging(base, 0, 20).find((k) => k.slot === "WEAPON")?.durability).toBe(100);
    // Uzun atıl: 0→100 gün, ~79 idle gün → gözle görülür düşüş (<100)
    const aged = applyRestAging(base, 0, 100).find((k) => k.slot === "WEAPON")!;
    expect(aged.durability).toBeLessThan(100);
    expect(aged.durability).toBeGreaterThan(0);
    // Yakın zamanda kullanılan (lastUsedDay büyük) paslanmaz
    const used = starterKit("FOIL").map((k) => (k.slot === "WEAPON" ? { ...k, lastUsedDay: 95 } : k));
    expect(applyRestAging(used, 90, 100).find((k) => k.slot === "WEAPON")?.durability).toBe(100);
    // Pencere yoksa (toDay<=fromDay) değişmez
    expect(applyRestAging(base, 100, 100)).toEqual(base);
  });
  it("validateKit (2B): tam+doğru beden+kırık değil → null; aksi halde hata kodu; entryFee seviyeye göre", () => {
    // Başlangıç takımı U10'da geçerli
    expect(validateKit(starterKit("FOIL"), "FOIL", 9, "U10")).toBeNull();
    // Kırık parça → kit_broken
    const broken = starterKit("FOIL").map((k) => (k.slot === "WEAPON" ? { ...k, broken: true } : k));
    expect(validateKit(broken, "FOIL", 9, "U10")).toBe("kit_broken");
    // Büyüyünce (U12) silah/kıyafet küçük → kit_small
    expect(validateKit(starterKit("FOIL"), "FOIL", 11, "U12")).toBe("kit_small");
    // Eksik parça → kit_incomplete
    const incomplete = starterKit("FOIL").filter((k) => k.slot !== "WEAPON");
    expect(validateKit(incomplete, "FOIL", 9, "U10")).toBe("kit_incomplete");
    // Katılım ücreti: İl bedava, ulusal/uluslararası artar; hepsi 1. ödülün altında
    expect(entryFee("IL")).toBe(0);
    expect(entryFee("TURKIYE")).toBeGreaterThan(0);
    expect(entryFee("WORLD_CUP")).toBeGreaterThan(entryFee("TURKIYE"));
    // Kulüp aidatı: iyi kulüp daha pahalı; küçük tutulur (ay=hafta)
    expect(clubMonthlyDues(100)).toBeGreaterThan(clubMonthlyDues(40));
    expect(clubMonthlyDues(60)).toBeLessThanOrEqual(4);
    expect(clubMonthlyDues(0)).toBeGreaterThanOrEqual(1);
  });
  it("çoklu silah (2C): 3'e kadar yedek; en az bir sağlam silah yeterli; dolu→en kötüyü değiştirir", () => {
    const foilWeapon = itemById("gl-weapon-foil")!;
    let kit = starterKit("FOIL"); // 1 silah
    expect(weaponsInKit(kit).length).toBe(1);
    kit = applyKitPurchase(kit, foilWeapon, 0); // 2. silah
    kit = applyKitPurchase(kit, foilWeapon, 0); // 3. silah
    expect(weaponsInKit(kit).length).toBe(3);
    kit = applyKitPurchase(kit, foilWeapon, 0); // dolu → hâlâ 3
    expect(weaponsInKit(kit).length).toBe(3);
    // Bir silah kırık ama diğeri sağlam → maça girilebilir (null)
    const w = weaponsInKit(kit);
    const mixed = kit.map((k) => (k === w[0] ? { ...k, broken: true } : k));
    expect(validateKit(mixed, "FOIL", 9, "U10")).toBeNull();
    // Tüm silahlar kırık → kit_broken
    const allBroken = kit.map((k) => (k.slot === "WEAPON" ? { ...k, broken: true } : k));
    expect(validateKit(allBroken, "FOIL", 9, "U10")).toBe("kit_broken");
  });
  it("applyKitPurchase: her slot 3'e kadar YEDEK ekler; dolunca en kötüyü değiştirir; discardKitItem çöpe atar", () => {
    const mask = itemById("gl-mask-foil")!;
    let kit = starterKit("FOIL"); // 1 maske
    expect(itemsInSlot(kit, "MASK").length).toBe(1);
    kit = applyKitPurchase(kit, mask); // 2. maske (yedek)
    kit = applyKitPurchase(kit, mask); // 3. maske
    expect(itemsInSlot(kit, "MASK").length).toBe(3);
    // Dolu: en yıpranmış maske (durability 10) değişir, sayı 3 kalır
    kit = kit.map((k) => (k.slot === "MASK" && itemsInSlot(kit, "MASK").indexOf(k) === 0 ? { ...k, durability: 10 } : k));
    kit = applyKitPurchase(kit, mask);
    expect(itemsInSlot(kit, "MASK").length).toBe(3);
    expect(itemsInSlot(kit, "MASK").every((m) => m.durability >= 100 || m.durability > 10)).toBe(true); // 10'luk atıldı
    // Çöp at: 1. maskeyi çıkar → 2 kalır
    const after = discardKitItem(kit, "MASK", 0);
    expect(itemsInSlot(after, "MASK").length).toBe(2);
  });
});

describe("Hayat Olayları (Dilim 3-1)", () => {
  it("haftada 1 olumlu + 1 olumsuz (denge), deterministik, yaş kapılı", () => {
    const a = rollWeeklyEvents(createRng("w1"), 14);
    const b = rollWeeklyEvents(createRng("w1"), 14);
    expect(a).toEqual(b); // deterministik
    expect(a.length).toBe(2);
    expect(a.filter((e) => e.tone === "pos").length).toBe(1);
    expect(a.filter((e) => e.tone === "neg").length).toBe(1);
    // Yaş kapısı: 8 yaşında examWeek (minAge 10) ve growthSpurt (minAge 12) çıkmaz
    for (let i = 0; i < 50; i++) {
      for (const e of rollWeeklyEvents(createRng(`y${i}`), 8)) {
        expect(e.minAge == null || 8 >= e.minAge).toBe(true);
      }
    }
  });
  it("malzeme olayları (3-2): nadir; olunca 1 olumsuz + 1 olumlu (denge)", () => {
    let fired = 0;
    let twoBreaks = 0;
    for (let i = 0; i < 400; i++) {
      const m = rollWeeklyMaterial(createRng(`m${i}`));
      if (m.length === 0) continue;
      fired++;
      expect(m.length).toBe(2);
      expect(m.filter((e) => e.tone === "pos").length).toBe(1);
      expect(m.filter((e) => e.tone === "neg").length).toBe(1); // ASLA 2 kırılma
      if (m.filter((e) => e.tone === "neg").length === 2) twoBreaks++;
    }
    expect(fired).toBeGreaterThan(0); // bazen olur
    expect(fired).toBeLessThan(400); // ama nadir (her hafta değil)
    expect(twoBreaks).toBe(0);
  });
  it("damageActive: aktif silahı kırar / dayanıklılık düşürür (yedek korunur)", () => {
    let kit = starterKit("FOIL");
    kit = applyKitPurchase(kit, itemById("gl-weapon-foil")!); // 2 silah
    const broken = damageActive(kit, "WEAPON", 9, "U10", { break: true });
    expect(itemsInSlot(broken, "WEAPON").filter((k) => k.broken).length).toBe(1); // yalnız aktif kırıldı
    const worn = damageActive(kit, "WEAPON", 9, "U10", { hit: 30 });
    expect(itemsInSlot(worn, "WEAPON").some((k) => k.durability === 70)).toBe(true);
  });
  it("applyEventsToPsych: etkileri toplar, 0–100 sınırlar", () => {
    const base = { morale: 50, motivation: 50, confidence: 50, stress: 50 };
    const up = applyEventsToPsych(base, [{ key: "x", tone: "pos", weight: 1, morale: 4, stress: -3 }]);
    expect(up.morale).toBe(54);
    expect(up.stress).toBe(47);
    // sınır: taşmaz
    const hi = applyEventsToPsych({ morale: 99, motivation: 1, confidence: 50, stress: 50 }, [{ key: "x", tone: "pos", weight: 1, morale: 10, motivation: -10 }]);
    expect(hi.morale).toBe(100);
    expect(hi.motivation).toBe(0);
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
