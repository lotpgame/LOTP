import { describe, expect, it } from "vitest";
import { createRng } from "@/engine/probability";
import { SKILL_KEYS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import type { AgeCategory } from "@/engine/domain";
import {
  MATCH_FORMATS,
  PERIOD_SECONDS,
  deFormat,
  simulateLaBelle,
  simulateMatch,
  simulatePeriod,
  type Combatant,
} from "@/engine/combat";

function flatSkills(current: number): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
}

function combatant(id: number, name: string, current: number, fatigue = 0): Combatant {
  return { id, name, weapon: "EPEE", skills: flatSkills(current), fatigue };
}

// Çok-zamanlı (feint/parat/çelme…) aksiyonları işaret eden anahtar kelimeler.
const MULTI_TEMPO = /feint|parat|çelme|degaje|angulation|prise|remise|kombinasyon|zinciriyle/i;

function catCombatant(id: number, name: string, cat: AgeCategory, weapon: Combatant["weapon"] = "EPEE"): Combatant {
  return { id, name, weapon, skills: flatSkills(60), fatigue: 0, ageCategory: cat };
}

describe("Combat Engine", () => {
  it("maç hedef tuşa ulaşır, deterministik ve analiz üretir", () => {
    const a = combatant(1, "A", 70);
    const b = combatant(2, "B", 65);
    const r1 = simulateMatch(a, b, createRng("m"), MATCH_FORMATS.DE);
    const r2 = simulateMatch(a, b, createRng("m"), MATCH_FORMATS.DE);
    expect(r1).toEqual(r2);
    expect(Math.max(r1.scoreA, r1.scoreB)).toBe(15);
    expect(r1.analysis.winProbA).toBeGreaterThan(0);
    expect(r1.analysis.winProbA).toBeLessThan(1);
    expect(r1.analysis.effA).toBeGreaterThan(r1.analysis.effB); // A daha güçlü
    expect(r1.log[0]).toContain("Maç gücü"); // açıklanabilir giriş satırı
  });

  it("her tuş için anlatım satırı üretir (15 tuşluk elemede detay)", () => {
    const r = simulateMatch(combatant(1, "A", 65), combatant(2, "B", 65), createRng("narr"), MATCH_FORMATS.DE);
    // Öncelik motoru (#5): çift-tuş (epe) ve iptal turları yüzünden satır sayısı tuş sayısıyla birebir
    // eşit değildir; ama tuş-tuş DETAY üretilmeli (düz özet değil).
    const totalTouches = r.scoreA + r.scoreB;
    const touchLines = r.log.filter((l) => /\d+–\d+/.test(l)); // "3–2" içeren tuş/çift-tuş satırları
    expect(touchLines.length).toBeGreaterThan(10);
    expect(touchLines.length).toBeLessThanOrEqual(totalTouches);
    expect(r.log[r.log.length - 1]).toContain("kazandı");
    expect(r.log.length).toBeGreaterThan(15); // düz özet değil, tuş-tuş detay
  });

  it("havuz formatı (5 tuş) daha kısa maç", () => {
    const r = simulateMatch(combatant(1, "A", 60), combatant(2, "B", 60), createRng("p"), MATCH_FORMATS.POOL);
    expect(Math.max(r.scoreA, r.scoreB)).toBe(5);
    expect(r.fatigueGain).toBeLessThan(8); // eleme maçından az yorar
  });

  it("yorgunluk effective gücü düşürür → kazanma ihtimalini azaltır", () => {
    const fresh = simulateMatch(combatant(1, "A", 70, 0), combatant(2, "B", 70, 0), createRng("f"), 15);
    const tired = simulateMatch(combatant(1, "A", 70, 90), combatant(2, "B", 70, 0), createRng("f"), 15);
    expect(tired.analysis.winProbA).toBeLessThan(fresh.analysis.winProbA);
  });

  it("büyük fark → güçlü oyuncu net üstünlük (GDD 18.31)", () => {
    let strongWins = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const r = simulateMatch(combatant(1, "Güçlü", 85), combatant(2, "Zayıf", 55), createRng(`big-${i}`), 15);
      if (r.winnerId === 1) strongWins++;
    }
    expect(strongWins).toBeGreaterThan(n * 0.9);
  });

  it("U10 sadece tek zamanlı atak anlatır (çift/çok zamanlı yok)", () => {
    // GDD 18.9 + kullanıcı kuralı: U10'da çift zamanlı atak yok.
    for (let i = 0; i < 20; i++) {
      const r = simulateMatch(catCombatant(1, "A", "U10"), catCombatant(2, "B", "U10"), createRng(`u10-${i}`), MATCH_FORMATS.DE);
      const touchLines = r.log.filter((l) => /\d+–\d+/.test(l));
      expect(touchLines.some((l) => MULTI_TEMPO.test(l))).toBe(false);
    }
  });

  it("Senior maçlarında çok zamanlı ataklar görülür", () => {
    let anyMulti = false;
    for (let i = 0; i < 20 && !anyMulti; i++) {
      const r = simulateMatch(catCombatant(1, "A", "SENIOR"), catCombatant(2, "B", "SENIOR"), createRng(`sr-${i}`), MATCH_FORMATS.DE);
      if (r.log.some((l) => MULTI_TEMPO.test(l))) anyMulti = true;
    }
    expect(anyMulti).toBe(true);
  });

  it("simulatePeriod: kısa periyot maçı bitirmez, uzun periyot bitirir; deterministik", () => {
    const a = catCombatant(1, "A", "SENIOR");
    const b = catCombatant(2, "B", "SENIOR");
    // 1 sn'lik periyot → hiç/az tuş, karar yok.
    const short1 = simulatePeriod(a, b, createRng("p"), { target: 15, startA: 0, startB: 0, startClockSec: 0, periodEndSec: 1 });
    const short2 = simulatePeriod(a, b, createRng("p"), { target: 15, startA: 0, startB: 0, startClockSec: 0, periodEndSec: 1 });
    expect(short1).toEqual(short2); // deterministik
    expect(short1.decided).toBe(false);
    // Çok uzun periyot → hedefe ulaşır.
    const full = simulatePeriod(a, b, createRng("p"), { target: 15, startA: 0, startB: 0, startClockSec: 0, periodEndSec: 100000 });
    expect(full.decided).toBe(true);
    expect(Math.max(full.scoreA, full.scoreB)).toBe(15);
  });

  // Bir maçı 3 periyot boyunca oynatır; kaç periyot kullanıldığını ve 15'e ulaşıp ulaşmadığını döndürür.
  function playThreePeriods(a: Combatant, b: Combatant, seed: string) {
    let sA = 0, sB = 0, clock = 0, decided = false, periods = 0;
    for (let period = 1; period <= 3 && !decided; period++) {
      const pr = simulatePeriod(a, b, createRng(`${seed}:p${period}`), {
        target: 15, startA: sA, startB: sB, startClockSec: clock, periodEndSec: period * PERIOD_SECONDS,
      });
      sA = pr.scoreA; sB = pr.scoreB; clock = pr.clockSec; decided = pr.decided; periods = period;
    }
    return { reached15: decided, periods };
  }

  it("flöre maçları çoğunlukla 3 periyot içinde 15'e ulaşır", () => {
    const a = catCombatant(1, "A", "U17", "FOIL");
    const b = catCombatant(2, "B", "U17", "FOIL");
    let reached = 0;
    const n = 40;
    for (let i = 0; i < n; i++) if (playThreePeriods(a, b, `fl${i}`).reached15) reached++;
    // Beyaz lamba (flöre hedef-dışı ~%10) yakın maçları süreye/altın tuşa taşıyabilir (gerçekçi) →
    // eşik %90'dan %75'e; yine de "çoğunlukla" bitiyor. (Denk rakipler en zor senaryo; karışık sahada daha yüksek.)
    expect(reached).toBeGreaterThan(n * 0.75);
  });

  it("epe maçları kılıçtan daha çok periyoda sarkar (GDD 18.12)", () => {
    const n = 40;
    let epeeP3 = 0, sabreP3 = 0;
    for (let i = 0; i < n; i++) {
      if (playThreePeriods(catCombatant(1, "A", "U17", "EPEE"), catCombatant(2, "B", "U17", "EPEE"), `e${i}`).periods === 3) epeeP3++;
      if (playThreePeriods(catCombatant(1, "A", "U17", "SABRE"), catCombatant(2, "B", "U17", "SABRE"), `s${i}`).periods === 3) sabreP3++;
    }
    expect(epeeP3).toBeGreaterThan(sabreP3); // epe daha çok 3. periyoda gider
  });

  it("deFormat: U10 eleme 10 tuş/2 periyot, U12+ 15 tuş/3 periyot (FIE gençler)", () => {
    expect(deFormat("U10")).toEqual({ touches: 10, periods: 2 });
    expect(deFormat("U12")).toEqual({ touches: 15, periods: 3 });
    expect(deFormat("SENIOR")).toEqual({ touches: 15, periods: 3 });
    expect(deFormat(undefined)).toEqual({ touches: 15, periods: 3 });
  });

  it("simulatePeriod: periodCap ulaşınca periyot biter (U10 1. periyot = 5 tuş)", () => {
    const a = catCombatant(1, "A", "U10");
    const b = catCombatant(2, "B", "U10");
    const pr = simulatePeriod(a, b, createRng("cap"), {
      target: 10,
      startA: 0,
      startB: 0,
      startClockSec: 0,
      periodEndSec: 100000, // süre bitmez → yalnız tavan durdurur
      periodCap: 5,
    });
    expect(Math.max(pr.scoreA, pr.scoreB)).toBe(5); // 5'te durdu
    expect(pr.decided).toBe(false); // maç hedefi 10 → henüz bitmedi
  });

  it("simulateLaBelle: tek tuş farkıyla (veya öncelikle) kazanan belirler, deterministik", () => {
    const a = catCombatant(1, "A", "SENIOR");
    const b = catCombatant(2, "B", "SENIOR");
    const lb1 = simulateLaBelle(a, b, createRng("belle"), { startA: 14, startB: 14 });
    const lb2 = simulateLaBelle(a, b, createRng("belle"), { startA: 14, startB: 14 });
    expect(lb1).toEqual(lb2);
    expect([1, 2]).toContain(lb1.winnerId);
    const diff = Math.abs(lb1.scoreA - lb1.scoreB);
    expect(diff).toBeLessThanOrEqual(1); // en çok 1 tuş fark (tuşsuz ise 0)
  });

  it("yakın maçlarda her iki sonuç da mümkün (GDD 18.32)", () => {
    let favWins = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const r = simulateMatch(combatant(1, "Favori", 62), combatant(2, "Rakip", 58), createRng(`close-${i}`), 15);
      if (r.winnerId === 1) favWins++;
    }
    expect(favWins).toBeGreaterThan(n * 0.5);
    expect(favWins).toBeLessThan(n);
  });
});
