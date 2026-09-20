import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { pickIntent, resolveExchange, type ExchangeContext, type IntentSkills } from "@/engine/combat/priority";

const flat: IntentSkills = { attack: 60, defense: 60, reaction: 60, speed: 60, reading: 60, timing: 60 };
const even: ExchangeContext = { p: 0.5, timingDiff: 0, distanceDiff: 0 };

describe("priority — öncelik/hak-yolu motoru (#5)", () => {
  it("deterministik: aynı seed → aynı sonuç", () => {
    const r1 = resolveExchange("FOIL", "ATTACK", "DEFEND", even, createRng("x"));
    const r2 = resolveExchange("FOIL", "ATTACK", "DEFEND", even, createRng("x"));
    expect(r1).toEqual(r2);
  });

  it("EPE: iki taraf da atağa çıkınca ÇİFT TUŞ görülür", () => {
    let doubles = 0;
    for (let i = 0; i < 400; i++) {
      const r = resolveExchange("EPEE", "ATTACK", "ATTACK", even, createRng(`e${i}`));
      if (r.a && r.b) doubles++;
    }
    expect(doubles).toBeGreaterThan(30); // epenin imzası: çift tuş olur
  });

  it("FLÖRE/KILIÇ: çift tuş YOK; eşzamanlı hücum bazen İPTAL", () => {
    let foilDoubles = 0;
    let foilAnnul = 0;
    for (let i = 0; i < 400; i++) {
      const r = resolveExchange("FOIL", "ATTACK", "ATTACK", even, createRng(`f${i}`));
      if (r.a && r.b) foilDoubles++;
      if (!r.a && !r.b) foilAnnul++;
    }
    expect(foilDoubles).toBe(0); // öncelik silahında çift tuş olmaz
    expect(foilAnnul).toBeGreaterThan(30); // eşzamanlı hücum iptal olur
  });

  it("zamanlama üstünlüğü kazanmayı artırır (ana etmen)", () => {
    let winsWithTiming = 0;
    let winsNeutral = 0;
    const good: ExchangeContext = { p: 0.5, timingDiff: 1, distanceDiff: 0 };
    for (let i = 0; i < 500; i++) {
      if (resolveExchange("FOIL", "ATTACK", "DEFEND", good, createRng(`t${i}`)).a) winsWithTiming++;
      if (resolveExchange("FOIL", "ATTACK", "DEFEND", even, createRng(`n${i}`)).a) winsNeutral++;
    }
    expect(winsWithTiming).toBeGreaterThan(winsNeutral);
  });

  it("pickIntent: Baskı kur → çoğu ATTACK; Bekle&karşıla → çoğu DEFEND", () => {
    let atk = 0;
    let def = 0;
    for (let i = 0; i < 400; i++) {
      if (pickIntent("OFFENSIVE", flat, [], createRng(`o${i}`)) === "ATTACK") atk++;
      if (pickIntent("DEFENSIVE", flat, [], createRng(`d${i}`)) === "DEFEND") def++;
    }
    expect(atk).toBeGreaterThan(200); // >%50 hücum
    expect(def).toBeGreaterThan(200); // >%50 bekle
  });
});
