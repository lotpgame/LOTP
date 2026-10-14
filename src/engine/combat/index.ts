/**
 * Combat Engine — maçı simüle eder (GDD 18). Güç/olasılık hesabını Probability Engine'e
 * bırakır (GDD 20.4); burada maç akışı, momentum, aksiyon anlatımı ve sonuç üretilir.
 *
 * Sorumluluk sınırı (GDD 18.4): skill/ranking/para/bracket HESAPLAMAZ. effective strength
 * (yorgunluk etkili) + tuş olasılığı + küçük momentum (GDD 18.33–18.34) + silaha göre anlatım
 * + açıklanabilir analiz. Deterministik (aynı seed → aynı sonuç, GDD 20.30).
 *
 * Anlatım (tuş-tuş) ve saat, skoru belirleyen `rng`'den AYRI bir akıştan (`seed+":narr"`) üretilir
 * → metin/zaman çeşitliliği maçın sonucunu/determinizmini bozmaz.
 */
import { clamp, type AgeCategory, type Weapon } from "../domain";
import {
  computeEffectiveStrength,
  createRng,
  winProbability,
  type EffectiveStrength,
  type SeededRng,
} from "../probability";
import type { PlayerSkills } from "../skill";
import { incomingGamesmanshipPenalty, traitSelfRisk, type TraitKey } from "../trait";
import { physiqueCombatEdge, type PhysicalProfile } from "../physique";
import { t, type Locale } from "@/i18n";
import { tacticChaos, tacticStrengthMod, type Tactic } from "./tactics";
import {
  pickIntent,
  resolveExchange,
  type ExchangeContext,
  type Intent,
  type IntentSkills,
} from "./priority";

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
  ageCategory?: AgeCategory; // el tercihi avantajı + tuş anlatım karmaşıklığı (zamanlı atak) için
  age?: number; // tam yaş — ~30 sonrası combat'ta kademeli gerileme (verilmezse yaş etkisi yok)
  tactic?: Tactic; // maç öncesi taktik tercihi (GDD 18.22); verilmezse "BALANCED" (nötr)
  traits?: readonly TraitKey[]; // taktik-trait sinerjisi için (Agresif/Soğukkanlı…)
}

/** Maç formatları (GDD 18.8): havuz 5 tuş, eleme 15 tuş. */
export const MATCH_FORMATS = { POOL: 5, DE: 15 } as const;

/** Eleme maçı zamanlaması (GDD 18.8): 3 periyot × 3 dk (9 dk). Havuz tek 3 dk periyot. */
export const PERIOD_SECONDS = 180;
export const DE_PERIODS = 3;

/**
 * Yaş kategorisine göre eleme maç formatı (USA Fencing gençler SYC — doğrulandı 12.10):
 * U10 (Y10) → 10 tuş / 2 periyot (1. periyot 3 dk veya 5 tuşta biter, sonra 10'a); U12 (Y12) ve üstü → 15 tuş / 3 periyot.
 * `periods` = üst sınır: maç tuş barajına (10/15) ulaşınca erken biter. Havuz = 5 tuş / tek periyot.
 */
export function deFormat(ageCategory?: string): { touches: number; periods: number } {
  return ageCategory === "U10" ? { touches: 10, periods: 2 } : { touches: 15, periods: 3 };
}

export interface MatchAnalysis {
  effA: number;
  effB: number;
  winProbA: number;
  modsA: EffectiveStrength["modifiers"];
  modsB: EffectiveStrength["modifiers"];
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

/** Maç sonu özet satırı için silaha göre kısa aksiyon kalıpları (dile göre). */
// Maç anlatım bankaları yalnız TR/EN; diğer diller (de/es/fr) çeviri gelene kadar TR anlatımıyla oynar.
const narrLocale = (l: Locale): "tr" | "en" => (l === "en" ? "en" : "tr");

const ACTION_LINES: Record<"tr" | "en", Record<Weapon, string[]>> = {
  tr: {
    FOIL: ["mesafeyi kapatıp atağa geçti", "tempoyu yükseltti", "hızlı bir flèche denedi"],
    EPEE: ["sabırla açığı kolladı", "bilek vuruşuyla karşılık verdi", "mesafeyi koruyup karşı atak yaptı"],
    SABRE: ["patlayıcı bir hücum başlattı", "hızlı bir baş kesme denedi", "reaksiyonla öne atıldı"],
  },
  en: {
    FOIL: ["closed distance and attacked", "picked up the tempo", "tried a quick flèche"],
    EPEE: ["patiently waited for an opening", "answered with a wrist hit", "kept distance and counter-attacked"],
    SABRE: ["launched an explosive attack", "tried a quick head cut", "sprang forward on reaction"],
  },
};

/**
 * Tuş-başı anlatım — "kaç zamanlı" (tempo) aksiyona göre katmanlı (GDD 18.9–18.26), dile göre.
 * 1 = tek zamanlı basit hücum; 2 = çift zamanlı (feint/beat/parat-riposta); 3–4 = karmaşık diziler.
 */
type Tempo = 1 | 2 | 3 | 4;

const TOUCH_LINES_BY_TEMPO: Record<"tr" | "en", Record<Weapon, Record<Tempo, string[]>>> = {
  tr: {
    FOIL: {
      1: [
        "basit bir hücumla göğse dokundu",
        "doğrudan atakla açığı buldu",
        "hızlı bir fleşle öne çıkıp vurdu",
        "temiz bir uzanışla göğsü buldu",
        "mesafeyi kapatıp basit hücumla sayıyı aldı",
        "hamle içinde uzanışla dokundu",
        "tek tempolu atakla hattı açıp sayı buldu",
      ],
      2: [
        "bate sonrası hücumla açığı buldu",
        "parad dört ile durdurup riposta yaptı",
        "parad altı sonrası riposta ile sayıyı aldı",
        "feint sonrası degaje ile güzel bir hamleyle bitirdi",
        "hazırlık–hücum ikilisiyle göğse dokundu",
        "apel sonrası fleşle patlayıp sayı buldu",
        "kupe ile açığı bulup dokundu",
        "bate–degaje ile savunmayı aşıp vurdu",
        "parad yedi ile savunup riposta ile vurdu",
      ],
      3: [
        "feint–feint–hücumla savunmayı çözdü",
        "parad–riposta–römiz zinciriyle sayıyı aldı",
        "çift degaje sonrası hücumu bağlayıp vurdu",
        "bate–feint–degaje ile açığı büyütüp dokundu",
      ],
      4: [
        "feint–degaje–feint–hücum kombinasyonuyla açığı buldu",
        "uzun bir aksiyon dizisinin sonunda tuşu kopardı",
        "çift parad–riposta sonrası römizle bitirdi",
      ],
    },
    EPEE: {
      1: [
        "öne çıkan bileğe ani bir vuruş yerleştirdi",
        "el üstüne kısa ve temiz bir dokunuşla sayıyı aldı",
        "basit bir uzanışla açığı buldu",
        "karşı atakla bileği yakaladı",
        "uzatılmış kolla bekleyip rakibin hamlesine sayı buldu",
        "mesafeyi iyi ayarlayıp bileğe tek dokunuş yaptı",
        "ön kola hızlı bir kontr atakla değdi",
        "soğukkanlı bir uzanışla ön kolu buldu",
        "bacağa/dize alçalan bir dokunuşla sayı aldı",
      ],
      2: [
        "bate sonrası bileğe uzanışla tuş aldı",
        "bate–degaje ile güzel bir hamleyle bitirdi",
        "feint sonrası açı vererek el üstüne dokundu",
        "hazırlık–hücum ikilisiyle gövdeye sayı buldu",
        "uzatılmış kol tehdidini gösterip degaje ile vurdu",
        "hamle içinde degaje ile açığı buldu",
        "priz de fer ile bileği kontrol edip dokundu",
        "parad altı ile durdurup bileğe riposta yaptı",
        "parad sekiz sonrası riposta ile el üstüne dokundu",
      ],
      3: [
        "çift feint sonrası bileği yakaladı",
        "priz de fer sonrası açıya temiz bir dokunuş yaptı",
        "iki tempolu hazırlıkla açığı büyütüp vurdu",
        "bate–degaje–hücum zinciriyle sayıyı kopardı",
      ],
      4: [
        "uzun bir hazırlık dizisinin sonunda açığı buldu",
        "feint–degaje–açı–hücum kombinasyonuyla tuşu kopardı",
        "çift bate sonrası açı verip bileği buldu",
      ],
    },
    SABRE: {
      1: [
        "baş kesmeyle sayıyı aldı",
        "hızlı bir hücumla öne çıkıp kesti",
        "fleşle patlayıp baş kesişi yaptı",
        "reaksiyon hızıyla ilk dokunan oldu",
        "yanağa temiz bir kesişle sayı buldu",
        "mesafeyi kapatıp kola kesiş yaptı",
      ],
      2: [
        "bate–baş kesmeyle vurdu",
        "parad beş ile başı koruyup riposta kesişi yaptı",
        "parad üç sonrası riposta ile yanağa kesti",
        "yanağa dönüp kesişi tamamladı",
        "feint sonrası yan kesişiyle dokundu",
        "apel–fleşle patlayıp başı kesti",
        "bate sonrası dönüşle güzel bir kesiş yaptı",
      ],
      3: [
        "çift feint sonrası baş kesmeyi bağladı",
        "parad–riposta–karşı kesme zinciriyle sayıyı aldı",
        "iki tempolu hazırlıkla açığı bulup kesti",
      ],
      4: [
        "uzun bir aksiyon dizisiyle savunmayı çözüp kesti",
        "feint–feint–yan–baş kesme kombinasyonuyla vurdu",
      ],
    },
  },
  en: {
    FOIL: {
      1: [
        "scored with a simple attack to the chest",
        "found the opening with a direct attack",
        "sprang in with a quick flèche",
        "landed a clean extension to the chest",
        "closed distance and scored with a simple attack",
        "hit inside a lunge with a clean extension",
      ],
      2: [
        "found the opening with a beat-attack",
        "took the point with a parry–riposte",
        "disengaged after a feint and finished nicely",
        "scored on a preparation–attack combo",
        "exploded in with an appel–flèche",
        "found the line with a coupé (cutover)",
        "beat–disengaged past the defense and hit",
      ],
      3: [
        "broke the defense with feint–feint–attack",
        "scored with a parry–riposte–remise chain",
        "bound the attack after a double disengage",
      ],
      4: [
        "found the opening with a feint–disengage–feint–attack combo",
        "tore off the touch after a long sequence",
      ],
    },
    EPEE: {
      1: [
        "snapped a hit to the advancing wrist",
        "scored with a short, clean touch to the hand",
        "found the opening with a simple extension",
        "counter-attacked to catch the wrist",
        "held point-in-line and scored on the attack",
        "placed a single touch to the wrist on good distance",
        "landed an arrêt (stop-hit) to the forearm",
        "dropped a touch to the knee/leg",
      ],
      2: [
        "found the wrist with an extension after a beat",
        "beat–disengaged, changed line and finished nicely",
        "gave angulation after a feint and hit the hand",
        "scored to the body with a preparation–attack",
        "threatened point-in-line, changed line and hit",
        "disengaged inside the lunge to find the opening",
        "controlled the blade with a prise-de-fer and hit",
      ],
      3: [
        "caught the wrist after a double feint",
        "touched the opening after a prise-de-fer",
        "widened the gap with a two-tempo preparation and hit",
        "tore off the point with a beat–disengage–attack chain",
      ],
      4: [
        "found the opening at the end of a long preparation",
        "tore off the touch with feint–disengage–angle–attack",
      ],
    },
    SABRE: {
      1: [
        "scored with a head cut (tête)",
        "surged ahead with a quick attack and cut",
        "burst in with a flèche to the head",
        "was first to land on pure reaction",
        "cut cleanly to the cheek (joue)",
        "closed distance and cut to the arm",
      ],
      2: [
        "hit with a beat–head cut",
        "took the point with a parry–riposte",
        "changed to the cheek and finished the cut",
        "cut to the flank after a feint",
        "exploded with an appel–flèche to the head",
      ],
      3: [
        "bound the head cut after a double feint",
        "scored with a parry–riposte–counter-cut chain",
        "found the opening with a two-tempo prep and cut",
      ],
      4: [
        "broke the defense and cut after a long sequence",
        "hit with a feint–feint–flank–head cut combo",
      ],
    },
  },
};

/**
 * Yaş kategorisine göre tuşun tempo dağılımı (kullanıcı kuralı):
 * U10 sadece tek zamanlı; U12 %35 çift; üst kategorilerde 3–4 zamanlı da çıkar.
 */
const TEMPO_MIX: Record<AgeCategory, Partial<Record<Tempo, number>>> = {
  U10: { 1: 0.55, 2: 0.45 }, // U10'da da basit bate/dégajé/parat-riposta çıksın (11.10) — ama 3-4'lü uzun diziler yok
  U12: { 1: 0.6, 2: 0.4 },
  U14: { 1: 0.5, 2: 0.38, 3: 0.12 },
  U17: { 1: 0.35, 2: 0.4, 3: 0.2, 4: 0.05 },
  U21: { 1: 0.28, 2: 0.42, 3: 0.22, 4: 0.08 },
  SENIOR: { 1: 0.25, 2: 0.42, 3: 0.23, 4: 0.1 },
};

/**
 * Silaha göre tuş-başı ortalama süre (sn) + yaş çarpanı. Küçük kategoriler daha hızlı bitirir
 * (maçlar erken 15'e ulaşır); büyük kategorilerde epe maçları 3. periyoda sarkabilir (GDD 18.12).
 */
const TOUCH_SECONDS: Record<Weapon, number> = { SABRE: 9, FOIL: 12, EPEE: 16 };
const CATEGORY_TIME_FACTOR: Record<AgeCategory, number> = {
  U10: 0.8,
  U12: 0.95,
  U14: 1.05,
  U17: 1.12,
  U21: 1.2,
  SENIOR: 1.2,
};

const MOMENTUM_STEP = 0.02;
const MOMENTUM_CAP = 3; // en çok ±0.06

function pickTempo(cat: AgeCategory, narr: SeededRng): Tempo {
  const mix = TEMPO_MIX[cat];
  const roll = narr.next();
  let acc = 0;
  for (const t of [1, 2, 3, 4] as Tempo[]) {
    acc += mix[t] ?? 0;
    if (roll < acc) return t;
  }
  return 1;
}

/** Bir tuşun anlatım satırını (zamanlı ataklı) üretir. */
function touchPhrase(scorer: Combatant, cat: AgeCategory, narr: SeededRng, locale: Locale): string {
  const tempo = pickTempo(cat, narr);
  return narr.pick(TOUCH_LINES_BY_TEMPO[narrLocale(locale)][scorer.weapon][tempo]);
}

/** Bir tuşun "fencing time" süresi (sn) — periyot saatini ilerletir. */
function touchSeconds(weapon: Weapon, cat: AgeCategory, narr: SeededRng): number {
  return TOUCH_SECONDS[weapon] * CATEGORY_TIME_FACTOR[cat] * (0.75 + narr.next() * 0.5);
}

/**
 * Sayı GETİRMEYEN hakem olayları (kullanıcı 12.10): "flash geldi ama geçersiz", vücut teması (corps-à-corps),
 * çift lamba-öncelik yok, ayak çaprazı, kart… Silaha göre (flöre/kılıç öncelikli; epede corps-à-corps serbest ama
 * durdurur; kılıçta corps-à-corps/ayak çaprazı yasak). Tempo/iptal turlarında ARA ARA yazılır → maç daha canlı.
 */
const REF_EVENTS_BY_WEAPON: Record<"tr" | "en", Record<Weapon, string[]>> = {
  tr: {
    FOIL: [
      "Çift lamba yandı — hakem önceliği netleştiremedi, sayı yok.",
      "Vücut teması — hakem ayırdı, sayı yok.",
      "Hücum hakkı belirsiz — hakem 'dur' deyip yeniden başlattı.",
      "Lamba yandı ama hakem tuşu geçersiz saydı — sayı yok.",
      "Hazırlıkta temas oldu — hakem durdurdu, sayı yok.",
      "Sarı kart — kural ihlali, hakem uyardı.",
    ],
    EPEE: [
      "Vücut teması — hakem durdurdu, sayı yok.",
      "Lamba yandı ama hakem tuşu geçersiz saydı — sayı yok.",
      "Uç piste değdi — geçersiz, sayı yok.",
      "İkisi de uzandı ama lamba yanmadı — sayı yok.",
      "Mesafe bozuldu — hakem 'dur' dedi, sayı yok.",
      "Sarı kart — kural ihlali, hakem uyardı.",
    ],
    SABRE: [
      "Çift lamba — hakem önceliği veremedi, sayı yok.",
      "Vücut teması — kılıçta yasak, hakem durdurdu.",
      "Ayak çaprazı — kural ihlali, hakem durdurdu.",
      "Lamba yandı ama hakem geçersiz saydı — sayı yok.",
      "Hücum hakkı tartışmalı — hakem yeniden başlattı.",
      "Sarı kart — kural ihlali, hakem uyardı.",
    ],
  },
  en: {
    FOIL: [
      "Both lights — the referee couldn't award priority, no touch.",
      "Corps-à-corps (body contact) — the referee separated them, no touch.",
      "Right-of-way unclear — the referee called halt and restarted.",
      "A light came on but the referee annulled the touch — no point.",
      "Contact during preparation — the referee called halt, no touch.",
      "Yellow card — rule violation (warning).",
    ],
    EPEE: [
      "Corps-à-corps (body contact) — the referee called halt, no touch.",
      "A light came on but the referee annulled the touch — no point.",
      "The point hit the strip — invalid, no touch.",
      "Both extended but no light — no touch.",
      "Distance broke down — the referee called halt, no touch.",
      "Yellow card — rule violation (warning).",
    ],
    SABRE: [
      "Both lights — the referee couldn't award priority, no touch.",
      "Corps-à-corps — forbidden in sabre, the referee called halt.",
      "Crossing the feet (passing) — rule violation, the referee called halt.",
      "A light came on but the referee annulled it — no point.",
      "Right-of-way disputed — the referee restarted.",
      "Yellow card — rule violation (warning).",
    ],
  },
};

const REF_EVENT_PROB = 0.6; // sayısız (tempo/iptal) turda bu olasılıkla bir hakem olayı yazılır
/** Tempo/iptal turunda ara ara bir hakem olayı satırı (yoksa null → tur sessiz geçer). */
function refEventLine(weapon: Weapon, narr: SeededRng, locale: Locale): string | null {
  if (!narr.bool(REF_EVENT_PROB)) return null;
  return narr.pick(REF_EVENTS_BY_WEAPON[narrLocale(locale)][weapon]);
}

interface IntentSide {
  tactic: Tactic;
  skills: IntentSkills;
  traits: readonly TraitKey[];
}

interface Matchup {
  esA: EffectiveStrength;
  esB: EffectiveStrength;
  baseP: number; // A'nın tuş kazanma temel olasılığı
  chaos: number; // taktik kaynaklı salınım (0–0.45) — eski model (artık öncelik motoru kullanılır)
  weapon: Weapon;
  timingDiff: number; // (A−B) zamanlama, −1..+1 (ANA etmen)
  distanceDiff: number; // (A−B) mesafe = footwork + kulaç, −1..+1 (ANA etmen)
  sideA: IntentSide;
  sideB: IntentSide;
}

/** Combatant'tan niyet-seçimi için gereken (0–100) yetenekleri çıkarır. */
function intentSkillsOf(cmb: Combatant): IntentSkills {
  const s = cmb.skills;
  return {
    attack: s.attack.current,
    defense: s.defense.current,
    reaction: s.reaction.current,
    speed: s.speed.current,
    reading: s.reading.current,
    timing: s.timing.current,
  };
}

/** İki oyuncunun (taktikleri dahil) effective strength + tuş olasılığı + kaosunu hesaplar. */
function buildMatchup(a: Combatant, b: Combatant): Matchup {
  const esA = computeEffectiveStrength(a.skills, a.weapon, {
    fatigue: a.fatigue,
    sharpness: a.sharpness,
    conditionBonus: a.conditionBonus,
    age: a.age,
  });
  const esB = computeEffectiveStrength(b.skills, b.weapon, {
    fatigue: b.fatigue,
    sharpness: b.sharpness,
    conditionBonus: b.conditionBonus,
    age: b.age,
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
  // Gamesmanship (çirkef/hilekâr): rakibi bozar (rakibin sükûneti azaltır) + kendine risk bindirir.
  // Küçük ama riskli: nötr rakipte ~kendi riskini karşılar, hassas rakipte kâr, soğukkanlıda zarar.
  const gpA = incomingGamesmanshipPenalty(b.traits ?? [], a.traits ?? []) + traitSelfRisk(a.traits ?? []);
  const gpB = incomingGamesmanshipPenalty(a.traits ?? [], b.traits ?? []) + traitSelfRisk(b.traits ?? []);
  if (gpA > 0.05) {
    esA.modifiers.push({ label: "Sportmenlik", value: -Math.round(gpA * 10) / 10 });
    esA.total = Math.round((esA.total - gpA) * 10) / 10;
  }
  if (gpB > 0.05) {
    esB.modifiers.push({ label: "Sportmenlik", value: -Math.round(gpB * 10) / 10 });
    esB.total = Math.round((esB.total - gpB) * 10) / 10;
  }

  // Kaos: (eski model — öncelik motoru geldi, artık döngüde kullanılmıyor; geriye uyum için tutulur).
  const chaos = clamp(tacticChaos(tacticA) + tacticChaos(tacticB), 0, 0.45);

  // ANA etmenler: zamanlama (timing) + mesafe (footwork + kulaç). −1..+1 (A − B).
  const timingDiff = clamp((a.skills.timing.current - b.skills.timing.current) / 50, -1, 1);
  const distanceDiff = clamp(
    ((a.skills.footwork.current - b.skills.footwork.current) / 50) * 0.7 +
      ((a.physical?.reachCm ?? 175) - (b.physical?.reachCm ?? 175)) * 0.02,
    -1,
    1,
  );

  return {
    esA,
    esB,
    baseP: winProbability(esA.total - esB.total),
    chaos,
    weapon: a.weapon,
    timingDiff,
    distanceDiff,
    sideA: { tactic: tacticA, skills: intentSkillsOf(a), traits: a.traits ?? [] },
    sideB: { tactic: tacticB, skills: intentSkillsOf(b), traits: b.traits ?? [] },
  };
}

function strengthLine(a: Combatant, b: Combatant, m: Matchup, locale: Locale): string {
  const pct = Math.round(m.baseP * 100);
  return locale === "en"
    ? `Match strength — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (${a.name} win chance ${pct}%).`
    : `Maç gücü — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (${a.name} kazanma ihtimali %${pct}).`;
}

/** Bir tuşun sonuç satırını (skor + durum notu) yazar. */
function touchLine(
  scorer: Combatant,
  cat: AgeCategory,
  narr: SeededRng,
  scoreA: number,
  scoreB: number,
  run: number,
  target: number,
  locale: Locale,
): string {
  let line = `${scorer.name} ${touchPhrase(scorer, cat, narr, locale)}. ${scoreA}–${scoreB}`;
  if (run >= 3) line += locale === "en" ? ` — streak of ${run}!` : ` — üst üste ${run}!`;
  else if (scoreA === scoreB) line += locale === "en" ? " — even." : " — eşitlik.";
  else if (scoreA === target - 1 || scoreB === target - 1) line += locale === "en" ? " — match point!" : " — maç sayısı!";
  return line;
}

/** Epe çift-tuş anlatımı (ikisi de aynı anda değdi). */
function doubleTouchLine(a: Combatant, b: Combatant, scoreA: number, scoreB: number, locale: Locale): string {
  return locale === "en"
    ? `Double touch! Both land together. ${scoreA}–${scoreB}`
    : `Çift tuş! İkisi de aynı anda değdi. ${scoreA}–${scoreB}`;
}

/**
 * Flöre hedef-dışı (beyaz lamba) oranı — tunable. Sadece FLÖRE: geçerli hedef gövde olduğu için kola/
 * kafaya/bacağa dokunuş beyaz lamba yakar (sayı yok, hamle durur). Epe/kılıçta bu kavram yok (FIE).
 */
const FOIL_OFF_TARGET_PROB = 0.1;

/** Beyaz lamba anlatımı (flöre hedef-dışı; sayı yok). UI bu satırdan beyaz lambayı yakar. */
function whiteLampLine(scorer: Combatant, locale: Locale): string {
  return locale === "en"
    ? `⚪ White light — ${scorer.name} hit off-target. No touch.`
    : `⚪ Beyaz lamba — ${scorer.name} hedef dışına dokundu. Sayı yok.`;
}

interface ExchangeOutcome {
  a: boolean;
  b: boolean;
}

/** Bir mübadeleyi oynatır: niyetleri seç → öncelik motoruyla çöz (mesafe+zamanlama ana etmen). */
function runExchange(m: Matchup, momentum: number, rng: SeededRng): ExchangeOutcome {
  const iA: Intent = pickIntent(m.sideA.tactic, m.sideA.skills, m.sideA.traits, rng);
  const iB: Intent = pickIntent(m.sideB.tactic, m.sideB.skills, m.sideB.traits, rng);
  const ctx: ExchangeContext = {
    p: clamp(m.baseP + momentum, 0.05, 0.95),
    timingDiff: m.timingDiff,
    distanceDiff: m.distanceDiff,
  };
  return resolveExchange(m.weapon, iA, iB, ctx, rng);
}

/**
 * Tam maçı simüle eder (havuz + AI-AI eleme maçları — periyot duraklaması yok).
 * İnsanın canlı eleme maçı `simulatePeriod` ile periyot periyot oynanır.
 */
export function simulateMatch(
  a: Combatant,
  b: Combatant,
  rng: SeededRng,
  targetTouches: number = MATCH_FORMATS.DE,
  locale: Locale = "tr",
): MatchResult {
  const m = buildMatchup(a, b);
  const narr = createRng(`${rng.seed}:narr`);
  const cat = a.ageCategory ?? "SENIOR";

  const log: string[] = [strengthLine(a, b, m, locale)];
  const tacticA = a.tactic ?? "BALANCED";
  const tacticB = b.tactic ?? "BALANCED";
  if (tacticA !== "BALANCED" || tacticB !== "BALANCED") {
    const prefix = locale === "en" ? "Tactic" : "Taktik";
    log.push(`${prefix} — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}.`);
  }

  let scoreA = 0;
  let scoreB = 0;
  let lastScorer: 0 | 1 | 2 = 0;
  let run = 0;
  let momentum = 0;

  // Öncelik motoru (#5): her tur niyet seç + silaha göre çöz. İptal/tempo turları olabildiği için
  // daha fazla tur payı bırakılır. Epede çift tuş; flöre/kılıçta eşzamanlı hücum iptal.
  const refRng = createRng(`${rng.seed}:ref`);
  const maxExchanges = targetTouches * 8;
  for (let i = 0; i < maxExchanges && scoreA < targetTouches && scoreB < targetTouches; i++) {
    let { a: aScored, b: bScored } = runExchange(m, momentum, rng);
    // Maç sonu çift-tuş koruması (epe DE): çift, iki tarafı da hedefe götürüyorsa tek tuşa iner.
    if (aScored && bScored && (scoreA + 1 >= targetTouches || scoreB + 1 >= targetTouches)) {
      if (rng.bool(clamp(m.baseP + momentum, 0.05, 0.95))) bScored = false;
      else aScored = false;
    }
    if (!aScored && !bScored) {
      const ev = refEventLine(m.weapon, refRng, locale); // iptal/tempo → ara ara hakem olayı (sayı yok), yoksa sessiz
      if (ev) log.push(ev);
      continue;
    }
    // Flöre: hedef-dışı (beyaz lamba). Tek taraf tuş bulduysa küçük olasılıkla geçersiz → sayı yok, hamle durur.
    if (m.weapon === "FOIL" && aScored !== bScored && rng.bool(FOIL_OFF_TARGET_PROB)) {
      log.push(whiteLampLine(aScored ? a : b, locale));
      continue;
    }
    if (aScored) scoreA++;
    if (bScored) scoreB++;
    if (aScored && bScored) {
      run = 0;
      lastScorer = 0;
      momentum = 0;
    } else if (aScored) {
      run = lastScorer === 1 ? run + 1 : 1;
      lastScorer = 1;
      momentum = Math.min(run, MOMENTUM_CAP) * MOMENTUM_STEP;
    } else {
      run = lastScorer === 2 ? run + 1 : 1;
      lastScorer = 2;
      momentum = -Math.min(run, MOMENTUM_CAP) * MOMENTUM_STEP;
    }

    if (scoreA >= targetTouches || scoreB >= targetTouches) break; // son tuşu kapanış anlatır
    if (aScored && bScored) log.push(doubleTouchLine(a, b, scoreA, scoreB, locale));
    else log.push(touchLine(aScored ? a : b, cat, narr, scoreA, scoreB, run, targetTouches, locale));
  }

  const winnerIsA = scoreA >= scoreB;
  const winner = winnerIsA ? a : b;
  const [wScore, lScore] = winnerIsA ? [scoreA, scoreB] : [scoreB, scoreA];
  const act = narr.pick(ACTION_LINES[narrLocale(locale)][winner.weapon]);
  log.push(
    locale === "en"
      ? `🏁 ${winner.name} ${act} and won the match ${wScore}-${lScore}.`
      : `🏁 ${winner.name} ${act} ve maçı ${wScore}-${lScore} kazandı.`,
  );

  return {
    aId: a.id,
    bId: b.id,
    scoreA,
    scoreB,
    winnerId: winnerIsA ? a.id : b.id,
    loserId: winnerIsA ? b.id : a.id,
    log,
    fatigueGain: Math.max(2, Math.round(targetTouches * 0.45)),
    analysis: { effA: m.esA.total, effB: m.esB.total, winProbA: m.baseP, modsA: m.esA.modifiers, modsB: m.esB.modifiers },
  };
}

export interface PeriodResult {
  log: string[];
  scoreA: number; // periyot sonu birikmiş skor
  scoreB: number;
  clockSec: number; // birikmiş süre (sn)
  decided: boolean; // biri hedefe (15) ulaştı mı
  winnerId?: number;
}

/**
 * Tek bir periyodu (3 dk) simüle eder — insanın canlı eleme maçı için. Başlangıç skoru/saatinden
 * devam eder; periyot dolunca veya hedefe ulaşınca durur. Her periyot kendi taktiğiyle çağrılır.
 */
export function simulatePeriod(
  a: Combatant,
  b: Combatant,
  rng: SeededRng,
  opts: {
    target: number;
    startA: number;
    startB: number;
    startClockSec: number;
    periodEndSec: number;
    includeHeader?: boolean;
    periodCap?: number; // bu periyodun tuş tavanı (U10 1. periyot = 5); ulaşınca periyot biter
    locale?: Locale;
  },
): PeriodResult {
  const m = buildMatchup(a, b);
  const narr = createRng(`${rng.seed}:narr`);
  const cat = a.ageCategory ?? "SENIOR";
  const locale = opts.locale ?? "tr";

  const log: string[] = [];
  if (opts.includeHeader) log.push(strengthLine(a, b, m, locale));

  let scoreA = opts.startA;
  let scoreB = opts.startB;
  let clock = opts.startClockSec;
  let lastScorer: 0 | 1 | 2 = 0;
  let run = 0;
  let momentum = 0;
  const refRng = createRng(`${rng.seed}:ref`);
  const cap = opts.periodCap ?? opts.target; // periyot tuş tavanı (yoksa maç hedefi)

  while (
    scoreA < opts.target &&
    scoreB < opts.target &&
    Math.max(scoreA, scoreB) < cap &&
    clock < opts.periodEndSec
  ) {
    clock += touchSeconds(a.weapon, cat, narr); // her mübadele süre yer (skor olsun olmasın)
    // Öncelik motoru (#5): niyet + silaha göre çöz. İptal/tempo turu = tuşsuz (süre yine akar → la belle mümkün).
    let { a: aScored, b: bScored } = runExchange(m, momentum, rng);
    if (aScored && bScored && (scoreA + 1 >= opts.target || scoreB + 1 >= opts.target)) {
      if (rng.bool(clamp(m.baseP + momentum, 0.05, 0.95))) bScored = false;
      else aScored = false;
    }
    if (!aScored && !bScored) {
      const ev = refEventLine(m.weapon, refRng, locale); // tuşsuz tur → ara ara hakem olayı (süre yine aktı)
      if (ev) log.push(ev);
      continue;
    }
    // Flöre: hedef-dışı (beyaz lamba). Sayı yok, hamle durur; süre yine akmış olur (yukarıda clock işledi).
    if (m.weapon === "FOIL" && aScored !== bScored && rng.bool(FOIL_OFF_TARGET_PROB)) {
      log.push(whiteLampLine(aScored ? a : b, locale));
      continue;
    }
    if (aScored) scoreA++;
    if (bScored) scoreB++;
    if (aScored && bScored) {
      run = 0;
      lastScorer = 0;
      momentum = 0;
    } else if (aScored) {
      run = lastScorer === 1 ? run + 1 : 1;
      lastScorer = 1;
      momentum = Math.min(run, MOMENTUM_CAP) * MOMENTUM_STEP;
    } else {
      run = lastScorer === 2 ? run + 1 : 1;
      lastScorer = 2;
      momentum = -Math.min(run, MOMENTUM_CAP) * MOMENTUM_STEP;
    }
    if (aScored && bScored) log.push(doubleTouchLine(a, b, scoreA, scoreB, locale));
    else log.push(touchLine(aScored ? a : b, cat, narr, scoreA, scoreB, run, opts.target, locale));
  }

  const decided = scoreA >= opts.target || scoreB >= opts.target;
  return {
    log,
    scoreA,
    scoreB,
    clockSec: clock,
    decided,
    winnerId: decided ? (scoreA >= opts.target ? a.id : b.id) : undefined,
  };
}

export interface LaBelleResult {
  log: string[];
  scoreA: number;
  scoreB: number;
  winnerId: number;
}

/**
 * Beraberlikte "altın tuş / öncelik dakikası" (FIE t.40–41): kura ile öncelik → 1 dk ani ölüm;
 * ilk tuş kazanır, tuşsuz geçerse öncelikli kazanır. Alt kategorilerde nadir (maçlar erken biter).
 */
export function simulateLaBelle(
  a: Combatant,
  b: Combatant,
  rng: SeededRng,
  opts: { startA: number; startB: number; locale?: Locale },
): LaBelleResult {
  const m = buildMatchup(a, b);
  const narr = createRng(`${rng.seed}:narr`);
  const locale = opts.locale ?? "tr";
  const priorityA = rng.bool(0.5);
  const prioName = (priorityA ? a : b).name;
  const log: string[] = [
    locale === "en"
      ? `Score ${opts.startA}-${opts.startB} tied → priority draw: ${prioName}.`
      : `Skor ${opts.startA}-${opts.startB} berabere → öncelik kurası: ${prioName}.`,
  ];

  let scoreA = opts.startA;
  let scoreB = opts.startB;
  let winnerIsA: boolean;

  if (rng.bool(0.22)) {
    // Altın dakika tuşsuz geçti → öncelik sahibi kazanır.
    winnerIsA = priorityA;
    log.push(
      locale === "en"
        ? `The golden minute passed with no touch — priority holder ${prioName} wins.`
        : `Altın dakika tuşsuz geçti — öncelik ${prioName}'de, ${prioName} kazandı.`,
    );
  } else {
    winnerIsA = rng.bool(clamp(m.baseP, 0.05, 0.95));
    if (winnerIsA) scoreA++;
    else scoreB++;
    const w = winnerIsA ? a : b;
    const phrase = touchPhrase(w, a.ageCategory ?? "SENIOR", narr, locale);
    log.push(
      locale === "en"
        ? `🏅 Golden touch! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`
        : `🏅 Altın tuş! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
    );
  }

  return { log, scoreA, scoreB, winnerId: winnerIsA ? a.id : b.id };
}

/** Bir periyodun taktiğini veren kaynak (M11.3): periyot no → taktik. AI=stil, offline=önceden/default, online=kayıt. */
export type PeriodTactic = (periodNo: number) => Tactic;

export interface BoutByPeriodsOpts {
  touches: number; // maç hedefi (15 / 10)
  periods: number; // periyot sayısı (3 / 2)
  tacticA?: PeriodTactic; // periyot başına A taktiği (yoksa a.tactic / BALANCED sabit)
  tacticB?: PeriodTactic;
  locale?: Locale;
}

/** Periyot-periyot eleme maçının birikmiş durumu — atomik (offline) ve canlı periyot-adım çözümü ORTAK kullanır. */
export interface DeBoutState {
  scoreA: number;
  scoreB: number;
  clockSec: number;
  periodsPlayed: number; // tamamlanan periyot sayısı
  log: string[]; // birikmiş anlatım (final "🏁 kazandı" satırı HARİÇ)
  decided: boolean;
  winnerId?: number;
}

/** Boş eleme maçı durumu (periyot 0). */
export function newDeBout(): DeBoutState {
  return { scoreA: 0, scoreB: 0, clockSec: 0, periodsPlayed: 0, log: [], decided: false };
}

export interface DeBoutPeriodOpts {
  touches: number; // maç hedefi (15 / 10)
  periods: number; // toplam periyot (3 / 2)
  tacticA: Tactic; // bu periyodun A taktiği
  tacticB: Tactic; // bu periyodun B taktiği
  locale?: Locale;
}

/**
 * Eleme maçının BİR periyodunu ilerletir — atomik çözüm ile canlı periyot-adım çözümünün ORTAK çekirdeği
 * (iki yol da birebir aynı sonucu versin diye). `matchSeed` maçın tohumu; her periyot `${matchSeed}:p{N}`
 * alt-tohumundan deterministik (narration ayrı akış). Son periyotta karar yoksa süre/altın tuş uygulanır.
 * Durumu MUTATE ETMEZ; yeni `DeBoutState` döndürür. Her periyot kendi taktiğiyle çağrılır (canlıda insan
 * periyot arasında değiştirebilir, GDD 18.22; AI/offline sabit stil).
 */
export function advanceDeBoutPeriod(
  a: Combatant,
  b: Combatant,
  matchSeed: string,
  state: DeBoutState,
  opts: DeBoutPeriodOpts,
): DeBoutState {
  const { touches, periods, tacticA, tacticB, locale = "tr" } = opts;
  if (state.decided) return state;
  const periodNo = state.periodsPlayed + 1;
  const log = [...state.log];
  const pa: Combatant = { ...a, tactic: tacticA };
  const pb: Combatant = { ...b, tactic: tacticB };
  // U10: 1. periyot 5 tuşta biter (FIE gençler); diğerlerinde tavan = maç hedefi.
  const periodCap = touches === 10 && periodNo === 1 ? 5 : touches;
  const pr = simulatePeriod(pa, pb, createRng(`${matchSeed}:p${periodNo}`), {
    target: touches,
    startA: state.scoreA,
    startB: state.scoreB,
    startClockSec: state.clockSec,
    periodEndSec: periodNo * PERIOD_SECONDS,
    includeHeader: periodNo === 1,
    periodCap,
    locale,
  });
  if (periodNo === 1 && pr.log.length > 0) log.push(pr.log[0]); // "Maç gücü …" satırı
  log.push(
    locale === "en"
      ? `▸ Period ${periodNo} started — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`
      : `▸ ${periodNo}. Periyot başladı — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`,
  );
  log.push(...pr.log.slice(periodNo === 1 ? 1 : 0));

  let scoreA = pr.scoreA;
  let scoreB = pr.scoreB;
  let decided = pr.decided;
  let winnerId = pr.winnerId;

  if (!decided && periodNo >= periods) {
    // Süre bitti: skor farklıysa yüksek kazanır, eşitse altın tuş (öncelikli, FIE).
    if (scoreA !== scoreB) {
      winnerId = scoreA > scoreB ? a.id : b.id;
      const wname = winnerId === a.id ? a.name : b.name;
      log.push(
        locale === "en"
          ? `⏱ Time up — ${wname} finished ahead ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`
          : `⏱ Süre doldu — ${wname} ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)} önde bitirdi.`,
      );
    } else {
      const lb = simulateLaBelle(a, b, createRng(`${matchSeed}:belle`), { startA: scoreA, startB: scoreB, locale });
      log.push(...lb.log);
      scoreA = lb.scoreA;
      scoreB = lb.scoreB;
      winnerId = lb.winnerId;
    }
    decided = true;
  }

  // #52: periyot BİTTİ işareti — maç kapanmadıysa ve daha periyot varsa (başladı = yukarıdaki "▸ … Periyot" başlığı).
  if (!decided && periodNo < periods) {
    log.push(
      locale === "en"
        ? `⏸ End of period ${periodNo} — ${scoreA}-${scoreB}`
        : `⏸ ${periodNo}. periyot bitti — ${scoreA}–${scoreB}`,
    );
  }

  return { scoreA, scoreB, clockSec: pr.clockSec, periodsPlayed: periodNo, log, decided, winnerId };
}

/** Eleme maçının final "🏁 … maçı kazandı" satırı (maç tamamlanınca eklenir — canlıda son periyotta). */
export function deBoutFinishLine(a: Combatant, b: Combatant, state: DeBoutState, locale: Locale = "tr"): string {
  const winIsA = state.winnerId === a.id;
  const wname = winIsA ? a.name : b.name;
  return locale === "en"
    ? `🏁 ${wname} won the match ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA}.`
    : `🏁 ${wname} maçı ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA} kazandı.`;
}

/**
 * Bir bout'u PERİYOT PERİYOT çözer — atomik sürüm (offline otomatik oynatma, AI-vs-AI, replay, başsız sim).
 * Canlı insan maçı `liveTournament` içinde periyot-adım çözülür (periyot arası taktik penceresi) ama AYNI
 * `advanceDeBoutPeriod` çekirdeğini kullanır → her periyotta aynı taktik verilirse sonuç buna birebir eşittir.
 * Her periyot öncesi her tarafın taktiği KAYNAĞINDAN gelir (AI=stil, offline=önceden/default, replay=kaydı).
 */
export function simulateBoutByPeriods(
  a: Combatant,
  b: Combatant,
  rng: SeededRng,
  opts: BoutByPeriodsOpts,
): MatchResult {
  const { touches, periods, locale = "tr" } = opts;
  const tacticA = opts.tacticA ?? (() => a.tactic ?? "BALANCED");
  const tacticB = opts.tacticB ?? (() => b.tactic ?? "BALANCED");

  let state = newDeBout();
  for (let periodNo = 1; periodNo <= periods && !state.decided; periodNo++) {
    state = advanceDeBoutPeriod(a, b, rng.seed, state, {
      touches,
      periods,
      tacticA: tacticA(periodNo),
      tacticB: tacticB(periodNo),
      locale,
    });
  }

  const log = [...state.log, deBoutFinishLine(a, b, state, locale)];
  const m = buildMatchup(a, b); // analiz satırı için (nötr)
  return {
    aId: a.id,
    bId: b.id,
    scoreA: state.scoreA,
    scoreB: state.scoreB,
    winnerId: state.winnerId!,
    loserId: state.winnerId === a.id ? b.id : a.id,
    log,
    fatigueGain: Math.max(2, Math.round(touches * 0.45)),
    analysis: { effA: m.esA.total, effB: m.esB.total, winProbA: m.baseP, modsA: m.esA.modifiers, modsB: m.esB.modifiers },
  };
}
