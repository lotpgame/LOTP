/**
 * Hayat Olayları (Event) Motoru — Dilim 3 (docs/EKIPMAN_VE_OLAYLAR.md §5). Bir çocuk→genç sporcunun
 * kariyerinde ~haftada 2 küçük olay yaşanır (psikoloji). Deterministik (seeded), etkiler KÜÇÜK (sık çıkar),
 * olumlu/olumsuz dengeli. 3-1: yalnız psikoloji; malzeme olayları + fırsat teklifleri sonraki dilimler.
 */
import { clamp } from "./domain";
import type { SeededRng } from "./probability";
import type { Psychology } from "./psychology";

export const EVENTS_PER_WEEK = 2;

export interface LifeEvent {
  key: string; // i18n: event.<key>
  tone: "pos" | "neg"; // DENGE: her hafta 1 olumlu + 1 olumsuz (oyuncu hep kötüden bırakmasın)
  weight: number; // seçilme ağırlığı (sık/nadir)
  morale?: number;
  motivation?: number;
  confidence?: number;
  stress?: number;
  minAge?: number; // yaş kapısı (örn. sınav/ergenlik)
  maxAge?: number;
}

// Etkiler KÜÇÜK (±2–5). Yaşa duyarlı olanlar min/maxAge taşır.
export const LIFE_EVENTS: readonly LifeEvent[] = [
  // — Olumlu —
  { key: "goodDay", tone: "pos", weight: 10, morale: 4 },
  { key: "coachPraise", tone: "pos", weight: 8, confidence: 4, motivation: 2 },
  { key: "familySupport", tone: "pos", weight: 7, morale: 4, stress: -3 },
  { key: "wellRested", tone: "pos", weight: 7, stress: -4 },
  { key: "smallGoal", tone: "pos", weight: 6, motivation: 4 },
  { key: "teammateWin", tone: "pos", weight: 6, morale: 3 },
  { key: "gearLove", tone: "pos", weight: 5, motivation: 3 },
  { key: "goodReport", tone: "pos", weight: 5, morale: 3, minAge: 9 }, // karne
  { key: "inPress", tone: "pos", weight: 3, morale: 4 },
  { key: "metIdol", tone: "pos", weight: 1, motivation: 8 }, // nadir, güçlü
  // — Olumsuz —
  { key: "badDay", tone: "neg", weight: 10, morale: -4 },
  { key: "coachCritique", tone: "neg", weight: 7, confidence: -4, stress: 3 },
  { key: "schoolBusy", tone: "neg", weight: 7, motivation: -3, stress: 3, minAge: 9 },
  { key: "examWeek", tone: "neg", weight: 6, motivation: -4, stress: 2, minAge: 10 },
  { key: "slumpTraining", tone: "neg", weight: 6, confidence: -4 },
  { key: "rivalryTension", tone: "neg", weight: 5, stress: 4, motivation: 2 },
  { key: "nervousBigMatch", tone: "neg", weight: 5, stress: 4 },
  { key: "travelTired", tone: "neg", weight: 4, stress: 2 },
  { key: "growthSpurt", tone: "neg", weight: 3, confidence: -3, minAge: 12, maxAge: 16 }, // ergenlik
  { key: "teammateLeft", tone: "neg", weight: 3, morale: -3 },
] as const;

function pickWeighted(rng: SeededRng, pool: readonly LifeEvent[]): LifeEvent | null {
  if (pool.length === 0) return null;
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = rng.next() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return pool[pool.length - 1];
}

/**
 * Bir haftanın olayları: DENGE için **1 olumlu + 1 olumsuz** (yaş kapısına uyanlar içinden, ağırlıklı, deterministik).
 * Böylece oyuncu hep kötü olaylardan yılıp bırakmaz. Bir taraf boşsa (yaş) yalnız diğeri gelir.
 */
export function rollWeeklyEvents(rng: SeededRng, age: number): LifeEvent[] {
  const fits = (e: LifeEvent) => (e.minAge == null || age >= e.minAge) && (e.maxAge == null || age <= e.maxAge);
  const pos = pickWeighted(rng, LIFE_EVENTS.filter((e) => e.tone === "pos" && fits(e)));
  const neg = pickWeighted(rng, LIFE_EVENTS.filter((e) => e.tone === "neg" && fits(e)));
  return [pos, neg].filter((e): e is LifeEvent => e != null);
}

/** Olayların psikolojiye toplam etkisini uygular (0–100 sınırlı). */
export function applyEventsToPsych(p: Psychology, events: readonly LifeEvent[]): Psychology {
  const sum = (f: "morale" | "motivation" | "confidence" | "stress") => events.reduce((s, e) => s + (e[f] ?? 0), 0);
  return {
    morale: clamp(p.morale + sum("morale"), 0, 100),
    motivation: clamp(p.motivation + sum("motivation"), 0, 100),
    confidence: clamp(p.confidence + sum("confidence"), 0, 100),
    stress: clamp(p.stress + sum("stress"), 0, 100),
  };
}
