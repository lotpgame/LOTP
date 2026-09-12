/**
 * Combat Engine — maçı simüle eder (GDD 18). Kontrollü belirsizlik: skill farkı avantaj
 * verir ama kazancı garanti etmez (GDD 18.31–18.32, 20.5). Sonuç RNG'den okunur.
 *
 * Sorumluluk sınırı (GDD 18.4): maç sonucu/istatistik/log üretir; skill/ranking/para/bracket
 * HESAPLAMAZ. M1: tuş-tuş olasılık simülasyonu + kısa metin anlatım. Silaha göre ağırlıklar
 * ve derinlik M2'de artacak.
 */
import { clamp, type SkillCategory, type Weapon } from "../domain";
import { categoryAverage, type PlayerSkills } from "../skill";
import type { SeededRng } from "../probability";

export interface Combatant {
  id: number;
  name: string;
  weapon: Weapon;
  skills: PlayerSkills;
  fatigue: number; // 0–100
}

export interface MatchResult {
  aId: number;
  bId: number;
  scoreA: number;
  scoreB: number;
  winnerId: number;
  loserId: number;
  log: string[];
  /** Maçta biriken yorgunluk (her iki oyuncuya uygulanır — GDD 18.37). */
  fatigueGain: number;
}

/** Silaha göre kategori ağırlıkları (GDD 9.13, 20.8). M1 basit varyantlar; M2'de detaylanır. */
const WEAPON_WEIGHTS: Record<Weapon, Record<SkillCategory, number>> = {
  FOIL: { TECHNICAL: 0.35, PHYSICAL: 0.25, TACTICAL: 0.22, MENTAL: 0.18 },
  EPEE: { TACTICAL: 0.32, TECHNICAL: 0.28, MENTAL: 0.22, PHYSICAL: 0.18 },
  SABRE: { PHYSICAL: 0.38, TECHNICAL: 0.27, TACTICAL: 0.2, MENTAL: 0.15 },
};

/**
 * Effective strength: silaha göre ağırlıklı yetenek − yorgunluk cezası (GDD 20.10, 9.31).
 * Permanent skill değişmez; bu yalnız o anki performans için türetilir (GDD 9.32).
 */
export function effectiveStrength(
  skills: PlayerSkills,
  weapon: Weapon,
  fatigue: number,
): number {
  const w = WEAPON_WEIGHTS[weapon];
  let base = 0;
  for (const cat of Object.keys(w) as SkillCategory[]) {
    base += categoryAverage(skills, cat) * w[cat];
  }
  const fatiguePenalty = fatigue * 0.08; // yorgunluk 100 → ~8 puan düşüş
  return base - fatiguePenalty;
}

/** Güç farkını tek tuş kazanma olasılığına çevirir; soft-cap ile %0/%100'den kaçınılır (GDD 20.21–20.22). */
export function touchWinProbability(diff: number): number {
  const p = 1 / (1 + Math.pow(10, -diff / 18));
  return clamp(p, 0.06, 0.94);
}

/**
 * Bir maçı hedef tuşa kadar simüle eder (varsayılan 15 — eleme formatı, GDD 18.8).
 * Saf: aynı combatant + aynı rng durumu → aynı sonuç (GDD 20.30).
 */
export function simulateMatch(
  a: Combatant,
  b: Combatant,
  rng: SeededRng,
  targetTouches = 15,
): MatchResult {
  const effA = effectiveStrength(a.skills, a.weapon, a.fatigue);
  const effB = effectiveStrength(b.skills, b.weapon, b.fatigue);
  const pA = touchWinProbability(effA - effB);

  let scoreA = 0;
  let scoreB = 0;
  const maxExchanges = targetTouches * 3;
  let midLogged = false;
  const log: string[] = [];
  log.push(`${a.name} ile ${b.name} pistte karşı karşıya.`);

  for (let i = 0; i < maxExchanges && scoreA < targetTouches && scoreB < targetTouches; i++) {
    if (rng.bool(pA)) scoreA++;
    else scoreB++;

    if (!midLogged && scoreA + scoreB >= targetTouches) {
      midLogged = true;
      const [lead, trail, ls, ts] =
        scoreA >= scoreB ? [a.name, b.name, scoreA, scoreB] : [b.name, a.name, scoreB, scoreA];
      log.push(
        ls === ts
          ? `Mücadele başa baş: ${ls}-${ts}.`
          : `${lead}, ${trail} karşısında ${ls}-${ts} önde.`,
      );
    }
  }

  const winnerIsA = scoreA >= scoreB;
  const winnerId = winnerIsA ? a.id : b.id;
  const loserId = winnerIsA ? b.id : a.id;
  const [wName, wScore, lScore] = winnerIsA
    ? [a.name, scoreA, scoreB]
    : [b.name, scoreB, scoreA];
  log.push(`${wName} maçı ${wScore}-${lScore} kazandı.`);

  return {
    aId: a.id,
    bId: b.id,
    scoreA,
    scoreB,
    winnerId,
    loserId,
    log,
    fatigueGain: 8,
  };
}
