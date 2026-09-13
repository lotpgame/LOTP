/**
 * Combat Engine — maçı simüle eder (GDD 18). Güç/olasılık hesabını Probability Engine'e
 * bırakır (GDD 20.4); burada maç akışı, momentum, aksiyon anlatımı ve sonuç üretilir.
 *
 * Sorumluluk sınırı (GDD 18.4): skill/ranking/para/bracket HESAPLAMAZ. M2: effective strength
 * (yorgunluk etkili) + tuş olasılığı + küçük momentum (GDD 18.33–18.34) + silaha göre anlatım
 * + açıklanabilir analiz. Deterministik (aynı seed → aynı sonuç, GDD 20.30).
 */
import { clamp, type AgeCategory, type Weapon } from "../domain";
import {
  computeEffectiveStrength,
  createRng,
  winProbability,
  type SeededRng,
  type StrengthModifier,
} from "../probability";
import type { PlayerSkills } from "../skill";
import type { TraitKey } from "../trait";
import { physiqueCombatEdge, type PhysicalProfile } from "../physique";
import { tacticChaos, tacticStrengthMod, TACTIC_LABEL_TR, type Tactic } from "./tactics";

export {
  TACTICS,
  TACTIC_LABEL_TR,
  TACTIC_DESC_TR,
  tacticStrengthMod,
  tacticChaos,
  type Tactic,
} from "./tactics";

export interface Combatant {
  id: number;
  name: string;
  weapon: Weapon;
  skills: PlayerSkills;
  fatigue: number; // 0–100
  sharpness?: number; // 0–100 (keskinlik); verilmezse combat modifier uygulanmaz
  conditionBonus?: number; // psikoloji+trait+ekipman birleşik katkısı (puan)
  physical?: PhysicalProfile; // boy/kulaç/bacak/yapı/el — verilirse fiziksel erişim avantajı
  ageCategory?: AgeCategory; // el tercihi avantajının kategoriye bağlılığı için
  tactic?: Tactic; // maç öncesi taktik tercihi (GDD 18.22); verilmezse "BALANCED" (nötr)
  traits?: readonly TraitKey[]; // taktik-trait sinerjisi için (Agresif/Soğukkanlı…)
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

/** Silaha göre aksiyon anlatım kalıpları (maç sonu özet satırı için). */
const ACTION_LINES: Record<Weapon, string[]> = {
  FOIL: ["mesafeyi kapatıp atağa geçti", "tempoyu yükseltti", "hızlı bir flèche denedi"],
  EPEE: ["sabırla açığı kolladı", "bilek vuruşuyla karşılık verdi", "mesafeyi koruyup karşı atak yaptı"],
  SABRE: ["patlayıcı bir hücum başlattı", "hızlı bir baş kesme denedi", "reaksiyonla öne atıldı"],
};

/**
 * Tuş-başı anlatım kalıpları (GDD 18.54): her sayının NASIL alındığını silaha uygun
 * eskrim terimleriyle yazar. 15 tuşluk elemede oyuncular detay görebilsin diye zengin.
 * Anlatım ayrı bir RNG akışından seçilir → maçın skor dizisini (determinizm/testler) BOZMAZ.
 */
const TOUCH_LINES: Record<Weapon, string[]> = {
  // Flöre: hücum hakkı (right-of-way), hedef gövde.
  FOIL: [
    "hücum hakkını kullanıp gövdeye dokundu",
    "parat-riposta ile sayıyı aldı",
    "flèche ile öne atılıp tuşu buldu",
    "beat (çelme) sonrası hücumu tamamladı",
    "bağ değiştirip açığa net dokundu",
    "kontratakta hakkı alıp vurdu",
    "remise ile ikinci niyeti değerlendirdi",
    "hazırlıkla mesafeyi ayarlayıp isabet buldu",
  ],
  // Epe: hak yok, tüm vücut hedef, çift tuş olur.
  EPEE: [
    "öne çıkan bileğe ani vuruş yaptı",
    "el üstüne kısa dokunuşla sayı aldı",
    "mesafeyi kapatıp gövdeye tuş buldu",
    "karşı atakla dize/ayağa dokundu",
    "açı vererek (angulation) kolu buldu",
    "point-in-line'ı tutup rakibi üzerine çekti",
    "sabırla bekleyip açığı cezalandırdı",
    "çift tuşu göze alıp öne geçti",
  ],
  // Kılıç: hak var, kesme+dürtme, çok hızlı.
  SABRE: [
    "baş kesmeyle (tête) sayıyı aldı",
    "yanağa (joue) hızlı kesişle dokundu",
    "flank kesişiyle gövdeyi buldu",
    "flèche'le patlayıp öne çıktı",
    "beat (çelme) sonrası hücumu bitirdi",
    "kontr-kesmeyle hakkı geri aldı",
    "reaksiyon hızıyla ilk dokunan oldu",
    "mesafeden ani hücumla vurdu",
  ],
};

const MOMENTUM_STEP = 0.02;
const MOMENTUM_CAP = 3; // en çok ±0.06

export function simulateMatch(
  a: Combatant,
  b: Combatant,
  rng: SeededRng,
  targetTouches: number = MATCH_FORMATS.DE,
): MatchResult {
  const esA = computeEffectiveStrength(a.skills, a.weapon, {
    fatigue: a.fatigue,
    sharpness: a.sharpness,
    conditionBonus: a.conditionBonus,
  });
  const esB = computeEffectiveStrength(b.skills, b.weapon, {
    fatigue: b.fatigue,
    sharpness: b.sharpness,
    conditionBonus: b.conditionBonus,
  });

  // Fiziksel erişim avantajı (relatif, küçük): kulaç/bacak/yapı/el (GDD 2.7–2.8).
  if (a.physical && b.physical && a.ageCategory) {
    const edge = physiqueCombatEdge(a.physical, b.physical, a.weapon, a.ageCategory);
    if (Math.abs(edge) > 0.05) {
      const half = Math.round((edge / 2) * 10) / 10;
      esA.modifiers.push({ label: "Fizik", value: half });
      esB.modifiers.push({ label: "Fizik", value: -half });
      esA.total = Math.round((esA.total + half) * 10) / 10;
      esB.total = Math.round((esB.total - half) * 10) / 10;
    }
  }

  // Taktik (GDD 18.22): effective strength'e küçük matchup+trait modifier'ı + tuş-başı kaos.
  const tacticA = a.tactic ?? "BALANCED";
  const tacticB = b.tactic ?? "BALANCED";
  const tmodA = tacticStrengthMod(tacticA, a.skills, b.skills, a.traits ?? []);
  const tmodB = tacticStrengthMod(tacticB, b.skills, a.skills, b.traits ?? []);
  if (Math.abs(tmodA) > 0.05) {
    esA.modifiers.push({ label: "Taktik", value: tmodA });
    esA.total = Math.round((esA.total + tmodA) * 10) / 10;
  }
  if (Math.abs(tmodB) > 0.05) {
    esB.modifiers.push({ label: "Taktik", value: tmodB });
    esB.total = Math.round((esB.total + tmodB) * 10) / 10;
  }
  // Kaos: ofansif salınımı artırır, defansif azaltır (0–0.45). BALANCED→0 → RNG dizisi değişmez.
  const chaos = clamp(tacticChaos(tacticA) + tacticChaos(tacticB), 0, 0.45);

  const baseP = winProbability(esA.total - esB.total);

  const log: string[] = [];
  log.push(
    `Maç gücü — ${a.name}: ${esA.total} · ${b.name}: ${esB.total} (${a.name} kazanma ihtimali %${Math.round(baseP * 100)}).`,
  );
  if (tacticA !== "BALANCED" || tacticB !== "BALANCED") {
    log.push(`Taktik — ${a.name}: ${TACTIC_LABEL_TR[tacticA]}, ${b.name}: ${TACTIC_LABEL_TR[tacticB]}.`);
  }

  // Anlatım için AYRI RNG akışı: skoru belirleyen `rng`'yi tüketmez → determinizm korunur.
  const narr = createRng(`${rng.seed}:narr`);

  let scoreA = 0;
  let scoreB = 0;
  let lastScorer: 0 | 1 | 2 = 0; // 0 yok, 1 A, 2 B
  let run = 0;
  let momentum = 0; // + A lehine, − B lehine (GDD 18.34: küçük etki)

  const maxExchanges = targetTouches * 4;
  for (let i = 0; i < maxExchanges && scoreA < targetTouches && scoreB < targetTouches; i++) {
    const p = clamp(baseP + momentum, 0.03, 0.97);
    // Kaos: bazı tuşlar "risk"le yazı-tura belirlenir (ofansif ↑ sürpriz, defansif ↓ salınım).
    // BALANCED maçlarda chaos=0 → rng.bool(chaos) hiç çağrılmaz, dizinin sırası korunur.
    const aScores = chaos > 0 && rng.bool(chaos) ? rng.bool(0.5) : rng.bool(p);

    const scorer = aScores ? a : b;
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

    const decisive = scoreA >= targetTouches || scoreB >= targetTouches;
    if (decisive) break; // son tuşu kapanış satırı anlatır (tekrarı önler)

    // Her tuş için bir satır: NASIL alındığı + güncel skor (A–B).
    const matchPoint = scoreA === targetTouches - 1 || scoreB === targetTouches - 1;
    let line = `${scorer.name} ${narr.pick(TOUCH_LINES[scorer.weapon])}. ${scoreA}–${scoreB}`;
    if (run >= 3) line += ` — üst üste ${run}!`;
    else if (scoreA === scoreB) line += " — eşitlik.";
    else if (matchPoint) line += " — maç sayısı!";
    log.push(line);
  }

  const winnerIsA = scoreA >= scoreB;
  const winner = winnerIsA ? a : b;
  const [wScore, lScore] = winnerIsA ? [scoreA, scoreB] : [scoreB, scoreA];
  log.push(
    `🏁 ${winner.name} ${narr.pick(ACTION_LINES[winner.weapon])} ve maçı ${wScore}-${lScore} kazandı.`,
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
