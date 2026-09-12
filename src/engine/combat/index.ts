/**
 * Combat Engine — maçı simüle eder (GDD 18). Güç/olasılık hesabını Probability Engine'e
 * bırakır (GDD 20.4); burada maç akışı, momentum, aksiyon anlatımı ve sonuç üretilir.
 *
 * Sorumluluk sınırı (GDD 18.4): skill/ranking/para/bracket HESAPLAMAZ. M2: effective strength
 * (yorgunluk etkili) + tuş olasılığı + küçük momentum (GDD 18.33–18.34) + silaha göre anlatım
 * + açıklanabilir analiz. Deterministik (aynı seed → aynı sonuç, GDD 20.30).
 */
import { clamp, type Weapon } from "../domain";
import {
  computeEffectiveStrength,
  winProbability,
  type SeededRng,
  type StrengthModifier,
} from "../probability";
import type { PlayerSkills } from "../skill";

export interface Combatant {
  id: number;
  name: string;
  weapon: Weapon;
  skills: PlayerSkills;
  fatigue: number; // 0–100
  sharpness?: number; // 0–100 (keskinlik); verilmezse combat modifier uygulanmaz
}

/** Maç formatları (GDD 18.8): havuz 5 tuş, eleme 15 tuş. */
export const MATCH_FORMATS = { POOL: 5, DE: 15 } as const;

export interface MatchAnalysis {
  effA: number;
  effB: number;
  winProbA: number;
  modsA: StrengthModifier[];
  modsB: StrengthModifier[];
}

export interface MatchResult {
  aId: number;
  bId: number;
  scoreA: number;
  scoreB: number;
  winnerId: number;
  loserId: number;
  log: string[];
  fatigueGain: number;
  analysis: MatchAnalysis;
}

/** Silaha göre aksiyon anlatım kalıpları (metin renk katmanı). */
const ACTION_LINES: Record<Weapon, string[]> = {
  FOIL: ["mesafeyi kapatıp atağa geçti", "tempoyu yükseltti", "hızlı bir flèche denedi"],
  EPEE: ["sabırla açığı kolladı", "bilek vuruşuyla karşılık verdi", "mesafeyi koruyup karşı atak yaptı"],
  SABRE: ["patlayıcı bir hücum başlattı", "hızlı bir baş kesme denedi", "reaksiyonla öne atıldı"],
};

const MOMENTUM_STEP = 0.02;
const MOMENTUM_CAP = 3; // en çok ±0.06

export function simulateMatch(
  a: Combatant,
  b: Combatant,
  rng: SeededRng,
  targetTouches: number = MATCH_FORMATS.DE,
): MatchResult {
  const esA = computeEffectiveStrength(a.skills, a.weapon, { fatigue: a.fatigue, sharpness: a.sharpness });
  const esB = computeEffectiveStrength(b.skills, b.weapon, { fatigue: b.fatigue, sharpness: b.sharpness });
  const baseP = winProbability(esA.total - esB.total);

  const log: string[] = [];
  log.push(
    `Güç — ${a.name}: ${esA.total} · ${b.name}: ${esB.total} (${a.name} kazanma ihtimali %${Math.round(baseP * 100)}).`,
  );

  let scoreA = 0;
  let scoreB = 0;
  let lastScorer: 0 | 1 | 2 = 0; // 0 yok, 1 A, 2 B
  let run = 0;
  let momentum = 0; // + A lehine, − B lehine (GDD 18.34: küçük etki)
  let midLogged = false;
  let runLogged = false;

  const maxExchanges = targetTouches * 4;
  for (let i = 0; i < maxExchanges && scoreA < targetTouches && scoreB < targetTouches; i++) {
    const p = clamp(baseP + momentum, 0.03, 0.97);
    const aScores = rng.bool(p);

    if (aScores) {
      scoreA++;
      run = lastScorer === 1 ? run + 1 : 1;
      lastScorer = 1;
      momentum = Math.min(run, MOMENTUM_CAP) * MOMENTUM_STEP;
    } else {
      scoreB++;
      run = lastScorer === 2 ? run + 1 : 1;
      lastScorer = 2;
      momentum = -Math.min(run, MOMENTUM_CAP) * MOMENTUM_STEP;
    }

    if (!runLogged && run >= 3) {
      runLogged = true;
      const who = lastScorer === 1 ? a : b;
      log.push(`${who.name} üst üste sayılarla baskı kuruyor.`);
    }

    if (!midLogged && scoreA + scoreB >= targetTouches) {
      midLogged = true;
      const leaderIsA = scoreA >= scoreB;
      const leader = leaderIsA ? a : b;
      const [ls, ts] = leaderIsA ? [scoreA, scoreB] : [scoreB, scoreA];
      const action = rng.pick(ACTION_LINES[leader.weapon]);
      log.push(
        ls === ts
          ? `Mücadele başa baş: ${ls}-${ts}.`
          : `${leader.name} ${action}; ${ls}-${ts} önde.`,
      );
    }
  }

  const winnerIsA = scoreA >= scoreB;
  const winner = winnerIsA ? a : b;
  const [wScore, lScore] = winnerIsA ? [scoreA, scoreB] : [scoreB, scoreA];
  log.push(
    `${winner.name} ${rng.pick(ACTION_LINES[winner.weapon])} ve maçı ${wScore}-${lScore} kazandı.`,
  );

  return {
    aId: a.id,
    bId: b.id,
    scoreA,
    scoreB,
    winnerId: winnerIsA ? a.id : b.id,
    loserId: winnerIsA ? b.id : a.id,
    log,
    fatigueGain: Math.max(3, Math.round(targetTouches * 0.55)),
    analysis: {
      effA: esA.total,
      effB: esB.total,
      winProbA: baseP,
      modsA: esA.modifiers,
      modsB: esB.modifiers,
    },
  };
}
