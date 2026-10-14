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
/** Anlatım havuzundan dile göre seç; dil yoksa TR'ye düşer (yeni dil = sadece ekleme). */
const narrPool = <T,>(pool: Partial<Record<Locale, T>>, l: Locale): T => pool[l] ?? (pool.tr as T);
/** Satır-içi anlatım için dil seçici: istenen dil yoksa TR'ye düşer. */
const pickLoc = (l: Locale, m: Partial<Record<Locale, string>> & { tr: string }): string => m[l] ?? m.tr;

const ACTION_LINES: Partial<Record<Locale, Record<Weapon, string[]>>> = {
  tr: {
    FOIL: ["mesafeyi kapatıp atağa geçti", "tempoyu yükseltti", "hızlı bir fleş denedi"],
    EPEE: ["sabırla açığı kolladı", "bilek vuruşuyla karşılık verdi", "mesafeyi koruyup karşı atak yaptı"],
    SABRE: ["patlayıcı bir hücum başlattı", "hızlı bir baş kesme denedi", "reaksiyonla öne atıldı"],
  },
  en: {
    FOIL: ["closed distance and attacked", "picked up the tempo", "tried a quick flèche"],
    EPEE: ["patiently waited for an opening", "answered with a wrist hit", "kept distance and counter-attacked"],
    SABRE: ["launched an explosive attack", "tried a quick head cut", "sprang forward on reaction"],
  },
  fr: {
    FOIL: ["a fermé la distance et attaqué", "a accéléré le tempo", "a tenté une flèche rapide"],
    EPEE: ["a patiemment guetté l'ouverture", "a répliqué d'une touche au poignet", "a gardé la distance et contre-attaqué"],
    SABRE: ["a lancé une attaque explosive", "a tenté un coup rapide à la tête", "a bondi en avant sur réaction"],
  },
  de: {
    FOIL: ["schloss die Distanz und griff an", "erhöhte das Tempo", "versuchte einen schnellen Flèche-Angriff"],
    EPEE: ["lauerte geduldig auf die Lücke", "antwortete mit einem Treffer aufs Handgelenk", "hielt Distanz und konterte"],
    SABRE: ["setzte einen explosiven Angriff", "versuchte einen schnellen Kopfhieb", "stürmte auf Reaktion nach vorn"],
  },
  es: {
    FOIL: ["cerró la distancia y atacó", "subió el ritmo", "intentó una flecha rápida"],
    EPEE: ["aguardó con paciencia la apertura", "respondió con un tocado a la muñeca", "mantuvo la distancia y contraatacó"],
    SABRE: ["lanzó un ataque explosivo", "intentó un corte rápido a la cabeza", "saltó al frente por reacción"],
  },
  it: {
    FOIL: ["ha chiuso la distanza e attaccato", "ha alzato il ritmo", "ha tentato una frecciata rapida"],
    EPEE: ["ha atteso con pazienza l'apertura", "ha risposto con una stoccata al polso", "ha tenuto la distanza e contrattaccato"],
    SABRE: ["ha lanciato un attacco esplosivo", "ha tentato un colpo rapido alla testa", "è scattato in avanti di reazione"],
  },
  ru: {
    FOIL: ["сократил дистанцию и атаковал", "поднял темп", "попробовал быстрый флеш"],
    EPEE: ["терпеливо ждал открытия", "ответил уколом в кисть", "держал дистанцию и контратаковал"],
    SABRE: ["провёл взрывную атаку", "попробовал быстрый удар по маске", "рванул вперёд на реакции"],
  },
  pt: {
    FOIL: ["fechou a distância e atacou", "aumentou o ritmo", "tentou uma flecha rápida"],
    EPEE: ["esperou com paciência a abertura", "respondeu com um tocado no punho", "manteve a distância e contra-atacou"],
    SABRE: ["lançou um ataque explosivo", "tentou um golpe rápido na máscara", "disparou à frente por reação"],
  },
  zh: {
    FOIL: ["拉近距离发起进攻", "提高了节奏", "尝试了一记快速飞刺"],
    EPEE: ["耐心等待空当", "以刺腕还击", "保持距离并反攻"],
    SABRE: ["发起一记爆发式进攻", "尝试了一记快速劈头", "凭反应冲了上去"],
  },
};

/**
 * Tuş-başı anlatım — "kaç zamanlı" (tempo) aksiyona göre katmanlı (GDD 18.9–18.26), dile göre.
 * 1 = tek zamanlı basit hücum; 2 = çift zamanlı (feint/beat/parat-ripost); 3–4 = karmaşık diziler.
 */
type Tempo = 1 | 2 | 3 | 4;

const TOUCH_LINES_BY_TEMPO: Partial<Record<Locale, Record<Weapon, Record<Tempo, string[]>>>> = {
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
        "parat dört ile durdurup ripost yaptı",
        "parat altı sonrası ripost ile sayıyı aldı",
        "feint sonrası degaje ile güzel bir hamleyle bitirdi",
        "hazırlık–hücum ikilisiyle göğse dokundu",
        "apel sonrası fleşle patlayıp sayı buldu",
        "kupe ile açığı bulup dokundu",
        "bate–degaje ile savunmayı aşıp vurdu",
        "parat yedi ile savunup ripost ile vurdu",
      ],
      3: [
        "feint–feint–hücumla savunmayı çözdü",
        "parat–ripost–römiz zinciriyle sayıyı aldı",
        "çift degaje sonrası hücumu bağlayıp vurdu",
        "bate–feint–degaje ile açığı büyütüp dokundu",
      ],
      4: [
        "feint–degaje–feint–hücum kombinasyonuyla açığı buldu",
        "uzun bir aksiyon dizisinin sonunda tuşu kopardı",
        "çift parat–ripost sonrası römizle bitirdi",
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
        "parat altı ile durdurup bileğe ripost yaptı",
        "parat sekiz sonrası ripost ile el üstüne dokundu",
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
        "parat beş ile başı koruyup ripost kesişi yaptı",
        "parat üç sonrası ripost ile yanağa kesti",
        "yanağa dönüp kesişi tamamladı",
        "feint sonrası yan kesişiyle dokundu",
        "apel–fleşle patlayıp başı kesti",
        "bate sonrası dönüşle güzel bir kesiş yaptı",
      ],
      3: [
        "çift feint sonrası baş kesmeyi bağladı",
        "parat–ripost–karşı kesme zinciriyle sayıyı aldı",
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
  fr: {
    FOIL: {
      1: [
        "a touché au corps d'une attaque simple",
        "a trouvé l'ouverture d'une attaque directe",
        "a jailli d'une flèche rapide",
        "a touché proprement d'une allonge au corps",
        "a fermé la distance et marqué d'une attaque simple",
        "a touché d'une allonge dans la fente",
        "a ouvert la ligne d'une attaque à un temps et marqué",
      ],
      2: [
        "a trouvé l'ouverture après un battement",
        "a arrêté en parade de quarte puis riposté",
        "a pris la touche d'une riposte après parade de sixte",
        "a feinté puis dégagé pour finir joliment",
        "a touché au corps sur un enchaînement préparation–attaque",
        "a explosé en appel–flèche pour marquer",
        "a trouvé l'ouverture d'un coupé",
        "a franchi la défense en battement–dégagement et touché",
        "a paré en septime puis riposté pour toucher",
      ],
      3: [
        "a brisé la défense d'un feinte–feinte–attaque",
        "a marqué sur un enchaînement parade–riposte–remise",
        "a lié l'attaque après un double dégagement et touché",
        "a élargi l'ouverture d'un battement–feinte–dégagement et touché",
      ],
      4: [
        "a trouvé l'ouverture d'un combiné feinte–dégagement–feinte–attaque",
        "a arraché la touche au bout d'une longue séquence",
        "a conclu d'une remise après double parade–riposte",
      ],
    },
    EPEE: {
      1: [
        "a placé une touche vive au poignet qui avançait",
        "a pris la touche d'un toucher court et net à la main",
        "a trouvé l'ouverture d'une simple allonge",
        "a saisi le poignet en contre-attaque",
        "a attendu pointe en ligne et marqué sur l'attaque adverse",
        "a bien réglé la distance et placé une touche au poignet",
        "a touché l'avant-bras d'un coup d'arrêt rapide",
        "a trouvé l'avant-bras d'une allonge posée",
        "a marqué d'un toucher plongeant à la jambe/au genou",
      ],
      2: [
        "a pris la touche au poignet d'une allonge après battement",
        "a changé de ligne en battement–dégagement pour finir joliment",
        "a donné de l'angle après une feinte et touché la main",
        "a marqué au corps sur un enchaînement préparation–attaque",
        "a menacé pointe en ligne puis changé de ligne pour toucher",
        "a trouvé l'ouverture d'un dégagement dans la fente",
        "a contrôlé le fer en prise de fer et touché",
        "a arrêté en parade de sixte puis riposté au poignet",
        "a touché le dessus de la main d'une riposte après parade d'octave",
      ],
      3: [
        "a saisi le poignet après une double feinte",
        "a touché proprement l'ouverture après une prise de fer",
        "a élargi l'ouverture d'une préparation à deux temps et touché",
        "a arraché la touche sur un enchaînement battement–dégagement–attaque",
      ],
      4: [
        "a trouvé l'ouverture au bout d'une longue préparation",
        "a arraché la touche sur un feinte–dégagement–angle–attaque",
        "a touché le poignet d'un double battement puis de l'angle",
      ],
    },
    SABRE: {
      1: [
        "a marqué d'un coup à la tête",
        "a pris les devants d'une attaque rapide et taillé",
        "a jailli d'une flèche à la tête",
        "a touché le premier sur pure réaction",
        "a taillé proprement à la joue",
        "a fermé la distance et taillé au bras",
      ],
      2: [
        "a touché d'un battement–coup à la tête",
        "a paré en quinte puis riposté d'une taille",
        "a taillé à la joue d'une riposte après parade de tierce",
        "a changé vers la joue pour finir la taille",
        "a taillé au flanc après une feinte",
        "a explosé en appel–flèche à la tête",
        "a taillé joliment après un battement et une volte",
      ],
      3: [
        "a lié le coup à la tête après une double feinte",
        "a marqué sur un enchaînement parade–riposte–contre-taille",
        "a trouvé l'ouverture d'une préparation à deux temps et taillé",
      ],
      4: [
        "a brisé la défense et taillé au bout d'une longue séquence",
        "a touché d'un combiné feinte–feinte–flanc–coup à la tête",
      ],
    },
  },
  de: {
    FOIL: {
      1: [
        "traf mit einem einfachen Angriff zum Körper",
        "fand die Lücke mit einem direkten Angriff",
        "stürmte mit einem schnellen Flèche-Angriff vor",
        "setzte eine saubere Streckung zum Körper",
        "schloss die Distanz und traf mit einem einfachen Angriff",
        "traf mit einer Streckung im Ausfall",
        "öffnete die Linie mit einem Ein-Tempo-Angriff und traf",
      ],
      2: [
        "fand die Lücke nach einer Battuta",
        "stoppte in Quart-Parade und setzte die Riposte",
        "nahm den Treffer als Riposte nach Sixt-Parade",
        "fintierte, degagierte und schloss schön ab",
        "traf zum Körper über eine Vorbereitung–Angriff-Folge",
        "explodierte mit Appell–Flèche und traf",
        "fand die Lücke mit einem Coupé",
        "durchbrach die Abwehr mit Battuta–Degagement und traf",
        "parierte in Septim und setzte die Riposte zum Treffer",
      ],
      3: [
        "brach die Abwehr mit Finte–Finte–Angriff",
        "traf über eine Parade–Riposte–Remise-Folge",
        "band den Angriff nach doppeltem Degagement und traf",
        "vergrößerte die Lücke mit Battuta–Finte–Degagement und traf",
      ],
      4: [
        "fand die Lücke mit einer Finte–Degagement–Finte–Angriff-Kombination",
        "riss den Treffer am Ende einer langen Folge an sich",
        "schloss mit einer Remise nach doppelter Parade–Riposte ab",
      ],
    },
    EPEE: {
      1: [
        "setzte einen schnellen Treffer aufs vorrückende Handgelenk",
        "nahm den Treffer mit einem kurzen, sauberen Stich zur Hand",
        "fand die Lücke mit einer einfachen Streckung",
        "fing das Handgelenk im Konterangriff",
        "wartete mit Klinge in Linie und traf auf den Angriff",
        "stellte die Distanz gut ein und setzte einen Treffer aufs Handgelenk",
        "traf den Unterarm mit einem schnellen Stoppstoß",
        "fand den Unterarm mit einer ruhigen Streckung",
        "setzte einen tiefen Treffer zum Bein/Knie",
      ],
      2: [
        "nahm den Treffer am Handgelenk mit einer Streckung nach Battuta",
        "wechselte mit Battuta–Degagement die Linie und schloss schön ab",
        "gab nach einer Finte Winkel und traf die Hand",
        "traf zum Körper über eine Vorbereitung–Angriff-Folge",
        "drohte mit Klinge in Linie, wechselte die Linie und traf",
        "fand die Lücke mit einem Degagement im Ausfall",
        "kontrollierte die Klinge mit Prise de fer und traf",
        "stoppte in Sixt-Parade und setzte die Riposte zum Handgelenk",
        "traf den Handrücken als Riposte nach Oktav-Parade",
      ],
      3: [
        "fing das Handgelenk nach einer doppelten Finte",
        "traf die Lücke sauber nach einer Prise de fer",
        "vergrößerte die Lücke mit einer Zwei-Tempo-Vorbereitung und traf",
        "riss den Treffer über eine Battuta–Degagement–Angriff-Folge an sich",
      ],
      4: [
        "fand die Lücke am Ende einer langen Vorbereitung",
        "riss den Treffer mit Finte–Degagement–Winkel–Angriff an sich",
        "traf das Handgelenk mit doppelter Battuta und dann Winkel",
      ],
    },
    SABRE: {
      1: [
        "traf mit einem Kopfhieb",
        "ging mit einem schnellen Angriff voran und hieb",
        "stürmte mit einem Flèche-Angriff zum Kopf",
        "traf als Erster auf reine Reaktion",
        "hieb sauber zur Wange",
        "schloss die Distanz und hieb zum Arm",
      ],
      2: [
        "traf mit Battuta–Kopfhieb",
        "parierte in Quint und setzte die Riposte als Hieb",
        "hieb zur Wange als Riposte nach Terz-Parade",
        "wechselte zur Wange und vollendete den Hieb",
        "hieb nach einer Finte zur Flanke",
        "explodierte mit Appell–Flèche zum Kopf",
        "hieb schön nach einer Battuta und einer Wendung",
      ],
      3: [
        "band den Kopfhieb nach einer doppelten Finte",
        "traf über eine Parade–Riposte–Gegenhieb-Folge",
        "fand die Lücke mit einer Zwei-Tempo-Vorbereitung und hieb",
      ],
      4: [
        "durchbrach die Abwehr und hieb am Ende einer langen Folge",
        "traf mit einer Finte–Finte–Flanke–Kopfhieb-Kombination",
      ],
    },
  },
  es: {
    FOIL: {
      1: [
        "tocó al cuerpo con un ataque simple",
        "encontró la apertura con un ataque directo",
        "irrumpió con una flecha rápida",
        "tocó limpiamente con una extensión al cuerpo",
        "cerró la distancia y marcó con un ataque simple",
        "tocó con una extensión en el fondo",
        "abrió la línea con un ataque a un tiempo y marcó",
      ],
      2: [
        "encontró la apertura tras un batimiento",
        "detuvo con parada de cuarta y dio la respuesta",
        "se llevó el tocado con una respuesta tras parada de sexta",
        "fintó y esquivó para terminar con elegancia",
        "marcó al cuerpo en un encadenado preparación–ataque",
        "explotó con appel–flecha y marcó",
        "encontró la apertura con un coupé",
        "franqueó la defensa con batimiento–esquive y tocó",
        "paró en séptima y dio la respuesta para tocar",
      ],
      3: [
        "rompió la defensa con finta–finta–ataque",
        "marcó en un encadenado parada–respuesta–remise",
        "ligó el ataque tras un doble esquive y tocó",
        "amplió la apertura con batimiento–finta–esquive y tocó",
      ],
      4: [
        "encontró la apertura con un combinado finta–esquive–finta–ataque",
        "arrancó el tocado al final de una larga secuencia",
        "cerró con una remise tras doble parada–respuesta",
      ],
    },
    EPEE: {
      1: [
        "colocó un tocado veloz a la muñeca que avanzaba",
        "se llevó el tocado con un toque corto y limpio a la mano",
        "encontró la apertura con una simple extensión",
        "atrapó la muñeca en contraataque",
        "aguardó con punta en línea y marcó sobre el ataque rival",
        "ajustó bien la distancia y colocó un tocado a la muñeca",
        "tocó el antebrazo con un golpe de parada rápido",
        "encontró el antebrazo con una extensión serena",
        "marcó con un toque descendente a la pierna/rodilla",
      ],
      2: [
        "se llevó el tocado a la muñeca con una extensión tras batimiento",
        "cambió de línea con batimiento–esquive y terminó con elegancia",
        "dio ángulo tras una finta y tocó la mano",
        "marcó al cuerpo en un encadenado preparación–ataque",
        "amenazó con punta en línea, cambió de línea y tocó",
        "encontró la apertura con un esquive en el fondo",
        "controló el hierro con una toma de hierro y tocó",
        "paró en sexta y dio la respuesta a la muñeca",
        "tocó el dorso de la mano con una respuesta tras parada de octava",
      ],
      3: [
        "atrapó la muñeca tras una doble finta",
        "tocó limpiamente la apertura tras una toma de hierro",
        "amplió la apertura con una preparación a dos tiempos y tocó",
        "arrancó el tocado en un encadenado batimiento–esquive–ataque",
      ],
      4: [
        "encontró la apertura al final de una larga preparación",
        "arrancó el tocado con finta–esquive–ángulo–ataque",
        "tocó la muñeca con doble batimiento y luego ángulo",
      ],
    },
    SABRE: {
      1: [
        "marcó con un corte a la cabeza",
        "tomó la delantera con un ataque rápido y cortó",
        "irrumpió con una flecha a la cabeza",
        "fue el primero en tocar por pura reacción",
        "cortó limpiamente a la mejilla",
        "cerró la distancia y cortó al brazo",
      ],
      2: [
        "tocó con un batimiento–corte a la cabeza",
        "paró en quinta y dio la respuesta con un corte",
        "cortó a la mejilla con una respuesta tras parada de tercera",
        "cambió hacia la mejilla y completó el corte",
        "cortó al flanco tras una finta",
        "explotó con appel–flecha a la cabeza",
        "cortó con elegancia tras un batimiento y un giro",
      ],
      3: [
        "ligó el corte a la cabeza tras una doble finta",
        "marcó en un encadenado parada–respuesta–contracorte",
        "encontró la apertura con una preparación a dos tiempos y cortó",
      ],
      4: [
        "rompió la defensa y cortó al final de una larga secuencia",
        "tocó con un combinado finta–finta–flanco–corte a la cabeza",
      ],
    },
  },
  it: {
    FOIL: {
      1: [
        "ha toccato al corpo con un attacco semplice",
        "ha trovato l'apertura con un attacco diretto",
        "è scattato con una frecciata rapida",
        "ha toccato pulito con un allungo al corpo",
        "ha chiuso la distanza e segnato con un attacco semplice",
        "ha toccato con un allungo in affondo",
        "ha aperto la linea con un attacco a un tempo e segnato",
      ],
      2: [
        "ha trovato l'apertura dopo una battuta",
        "ha fermato in parata di quarta e dato la risposta",
        "ha preso la stoccata con una risposta dopo parata di sesta",
        "ha finto e cavato per chiudere con eleganza",
        "ha segnato al corpo su una sequenza preparazione–attacco",
        "è esploso con appello–frecciata e ha segnato",
        "ha trovato l'apertura con un coupé",
        "ha superato la difesa con battuta–cavazione e toccato",
        "ha parato in settima e dato la risposta per toccare",
      ],
      3: [
        "ha rotto la difesa con finta–finta–attacco",
        "ha segnato su una sequenza parata–risposta–rimessa",
        "ha legato l'attacco dopo una doppia cavazione e toccato",
        "ha ampliato l'apertura con battuta–finta–cavazione e toccato",
      ],
      4: [
        "ha trovato l'apertura con una combinazione finta–cavazione–finta–attacco",
        "ha strappato la stoccata alla fine di una lunga sequenza",
        "ha chiuso con una rimessa dopo doppia parata–risposta",
      ],
    },
    EPEE: {
      1: [
        "ha piazzato una stoccata rapida al polso che avanzava",
        "ha preso la stoccata con un tocco corto e pulito alla mano",
        "ha trovato l'apertura con un semplice allungo",
        "ha agganciato il polso in contrattacco",
        "ha atteso in punta in linea e segnato sull'attacco avversario",
        "ha regolato bene la distanza e piazzato una stoccata al polso",
        "ha toccato l'avambraccio con un colpo d'arresto rapido",
        "ha trovato l'avambraccio con un allungo calmo",
        "ha segnato con un tocco discendente alla gamba/ginocchio",
      ],
      2: [
        "ha preso la stoccata al polso con un allungo dopo battuta",
        "ha cambiato linea con battuta–cavazione e chiuso con eleganza",
        "ha dato angolo dopo una finta e toccato la mano",
        "ha segnato al corpo su una sequenza preparazione–attacco",
        "ha minacciato in punta in linea, cambiato linea e toccato",
        "ha trovato l'apertura con una cavazione in affondo",
        "ha controllato il ferro con una presa di ferro e toccato",
        "ha parato in sesta e dato la risposta al polso",
        "ha toccato il dorso della mano con una risposta dopo parata di ottava",
      ],
      3: [
        "ha agganciato il polso dopo una doppia finta",
        "ha toccato pulito l'apertura dopo una presa di ferro",
        "ha ampliato l'apertura con una preparazione a due tempi e toccato",
        "ha strappato la stoccata su una sequenza battuta–cavazione–attacco",
      ],
      4: [
        "ha trovato l'apertura alla fine di una lunga preparazione",
        "ha strappato la stoccata con finta–cavazione–angolo–attacco",
        "ha toccato il polso con doppia battuta e poi angolo",
      ],
    },
    SABRE: {
      1: [
        "ha segnato con un colpo alla testa",
        "ha preso il comando con un attacco rapido e colpito",
        "è scattato con una frecciata alla testa",
        "è stato il primo a toccare di pura reazione",
        "ha colpito pulito alla guancia",
        "ha chiuso la distanza e colpito al braccio",
      ],
      2: [
        "ha toccato con una battuta–colpo alla testa",
        "ha parato in quinta e dato la risposta con un colpo",
        "ha colpito alla guancia con una risposta dopo parata di terza",
        "è passato alla guancia e completato il colpo",
        "ha colpito al fianco dopo una finta",
        "è esploso con appello–frecciata alla testa",
        "ha colpito con eleganza dopo una battuta e una girata",
      ],
      3: [
        "ha legato il colpo alla testa dopo una doppia finta",
        "ha segnato su una sequenza parata–risposta–contro-colpo",
        "ha trovato l'apertura con una preparazione a due tempi e colpito",
      ],
      4: [
        "ha rotto la difesa e colpito alla fine di una lunga sequenza",
        "ha toccato con una combinazione finta–finta–fianco–colpo alla testa",
      ],
    },
  },
  ru: {
    FOIL: {
      1: [
        "нанёс укол в корпус простой атакой",
        "нашёл открытие прямой атакой",
        "рванул быстрым флешем",
        "чисто достал корпус выпрямлением руки",
        "сократил дистанцию и забил простой атакой",
        "достал уколом в выпаде",
        "вскрыл линию однотемповой атакой и забил",
      ],
      2: [
        "нашёл открытие после батмана",
        "остановил защитой-кварт и ответил",
        "взял укол ответом после защиты-сикст",
        "сделал финт, перевёл и красиво завершил",
        "забил в корпус связкой подготовка–атака",
        "взорвался аппель–флешем и забил",
        "нашёл открытие переносом",
        "прошёл защиту батман–переводом и попал",
        "взял защиту-септим и ответил уколом",
      ],
      3: [
        "взломал защиту финт–финт–атакой",
        "забил связкой защита–ответ–ремиз",
        "связал атаку после двойного перевода и попал",
        "расширил открытие батман–финт–переводом и попал",
      ],
      4: [
        "нашёл открытие комбинацией финт–перевод–финт–атака",
        "вырвал укол в конце длинной серии",
        "завершил ремизом после двойной защиты–ответа",
      ],
    },
    EPEE: {
      1: [
        "поставил быстрый укол в наступающую кисть",
        "взял укол коротким чистым касанием в кисть",
        "нашёл открытие простым выпрямлением руки",
        "поймал кисть контратакой",
        "держал укол в линию и забил на атаке соперника",
        "хорошо выставил дистанцию и поставил укол в кисть",
        "достал предплечье быстрым контртемпом",
        "нашёл предплечье спокойным выпрямлением",
        "забил нисходящим уколом в ногу/колено",
      ],
      2: [
        "взял укол в кисть выпрямлением после батмана",
        "сменил линию батман–переводом и красиво завершил",
        "дал угол после финта и попал в кисть",
        "забил в корпус связкой подготовка–атака",
        "пригрозил уколом в линию, сменил линию и попал",
        "нашёл открытие переводом в выпаде",
        "контролировал клинок захватом и попал",
        "взял защиту-сикст и ответил в кисть",
        "попал в тыл кисти ответом после защиты-октав",
      ],
      3: [
        "поймал кисть после двойного финта",
        "чисто попал в открытие после захвата",
        "расширил открытие двухтемповой подготовкой и попал",
        "вырвал укол связкой батман–перевод–атака",
      ],
      4: [
        "нашёл открытие в конце длинной подготовки",
        "вырвал укол финт–перевод–угол–атакой",
        "попал в кисть двойным батманом, затем углом",
      ],
    },
    SABRE: {
      1: [
        "забил ударом по маске",
        "вышел вперёд быстрой атакой и рубанул",
        "рванул флешем в голову",
        "первым нанёс удар на чистой реакции",
        "чисто рубанул по щеке",
        "сократил дистанцию и рубанул по руке",
      ],
      2: [
        "попал батман–ударом по маске",
        "взял защиту-квинт и ответил рубящим",
        "рубанул по щеке ответом после защиты-терц",
        "перевёл на щеку и завершил удар",
        "рубанул по флангу после финта",
        "взорвался аппель–флешем в голову",
        "красиво рубанул после батмана и разворота",
      ],
      3: [
        "связал удар по маске после двойного финта",
        "забил связкой защита–ответ–контрудар",
        "нашёл открытие двухтемповой подготовкой и рубанул",
      ],
      4: [
        "взломал защиту и рубанул в конце длинной серии",
        "попал комбинацией финт–финт–фланг–удар по маске",
      ],
    },
  },
  pt: {
    FOIL: {
      1: [
        "tocou no tronco com um ataque simples",
        "achou a abertura com um ataque direto",
        "disparou numa flecha rápida",
        "tocou limpo no tronco com uma extensão",
        "fechou a distância e marcou com um ataque simples",
        "tocou com uma extensão no afundo",
        "abriu a linha com um ataque de um tempo e marcou",
      ],
      2: [
        "achou a abertura após uma batida",
        "parou na quarta e deu a resposta",
        "levou o tocado com uma resposta após parada de sexta",
        "fintou e desengajou para fechar com elegância",
        "marcou no tronco numa sequência preparação–ataque",
        "explodiu num apelo–flecha e marcou",
        "achou a abertura com um coupé",
        "passou a defesa com batida–desengajamento e tocou",
        "parou na sétima e deu a resposta para tocar",
      ],
      3: [
        "quebrou a defesa com finta–finta–ataque",
        "marcou numa sequência parada–resposta–remise",
        "ligou o ataque após um duplo desengajamento e tocou",
        "ampliou a abertura com batida–finta–desengajamento e tocou",
      ],
      4: [
        "achou a abertura numa combinação finta–desengajamento–finta–ataque",
        "arrancou o tocado no fim de uma longa sequência",
        "fechou com um remise após dupla parada–resposta",
      ],
    },
    EPEE: {
      1: [
        "cravou um tocado rápido no punho que avançava",
        "levou o tocado com um toque curto e limpo na mão",
        "achou a abertura com uma extensão simples",
        "pegou o punho em contra-ataque",
        "esperou com a ponta em linha e marcou no ataque do adversário",
        "ajustou bem a distância e cravou um tocado no punho",
        "tocou o antebraço com um golpe de parada rápido",
        "achou o antebraço com uma extensão tranquila",
        "marcou com um toque descendente na perna/joelho",
      ],
      2: [
        "levou o tocado no punho com uma extensão após batida",
        "mudou de linha com batida–desengajamento e fechou com elegância",
        "deu ângulo após uma finta e tocou a mão",
        "marcou no tronco numa sequência preparação–ataque",
        "ameaçou com a ponta em linha, mudou de linha e tocou",
        "achou a abertura com um desengajamento no afundo",
        "controlou o ferro com uma tomada de ferro e tocou",
        "parou na sexta e deu a resposta no punho",
        "tocou o dorso da mão com uma resposta após parada de oitava",
      ],
      3: [
        "pegou o punho após uma dupla finta",
        "tocou limpo a abertura após uma tomada de ferro",
        "ampliou a abertura com uma preparação de dois tempos e tocou",
        "arrancou o tocado numa sequência batida–desengajamento–ataque",
      ],
      4: [
        "achou a abertura no fim de uma longa preparação",
        "arrancou o tocado com finta–desengajamento–ângulo–ataque",
        "tocou o punho com dupla batida e depois ângulo",
      ],
    },
    SABRE: {
      1: [
        "marcou com um golpe na máscara",
        "tomou a frente com um ataque rápido e cortou",
        "disparou numa flecha na cabeça",
        "foi o primeiro a tocar por pura reação",
        "cortou limpo na bochecha",
        "fechou a distância e cortou no braço",
      ],
      2: [
        "tocou com uma batida–golpe na máscara",
        "parou na quinta e deu a resposta com um corte",
        "cortou na bochecha com uma resposta após parada de terça",
        "mudou para a bochecha e completou o corte",
        "cortou no flanco após uma finta",
        "explodiu num apelo–flecha na cabeça",
        "cortou com elegância após uma batida e um giro",
      ],
      3: [
        "ligou o golpe na máscara após uma dupla finta",
        "marcou numa sequência parada–resposta–contragolpe",
        "achou a abertura com uma preparação de dois tempos e cortou",
      ],
      4: [
        "quebrou a defesa e cortou no fim de uma longa sequência",
        "tocou numa combinação finta–finta–flanco–golpe na máscara",
      ],
    },
  },
  zh: {
    FOIL: {
      1: [
        "以简单进攻刺中躯干",
        "以直接进攻找到空当",
        "一记快速飞刺扑了上去",
        "以干净的伸臂刺中躯干",
        "拉近距离以简单进攻得分",
        "在弓步中以伸臂刺中",
        "以单一节奏进攻打开剑路并得分",
      ],
      2: [
        "击打后找到空当",
        "以四号防守挡下并还击",
        "六号防守后以还击得分",
        "佯攻后转移，漂亮收尾",
        "以准备–进攻连招刺中躯干",
        "顿足–飞刺爆发得分",
        "以上绕找到空当刺中",
        "以击打–转移突破防守刺中",
        "七号防守挡下后还击刺中",
      ],
      3: [
        "以佯攻–佯攻–进攻破防",
        "以防守–还击–再刺连招得分",
        "双重转移后连上进攻刺中",
        "以击打–佯攻–转移扩大空当刺中",
      ],
      4: [
        "以佯攻–转移–佯攻–进攻组合找到空当",
        "在长回合末尾抢下一剑",
        "双重防守–还击后以再刺收尾",
      ],
    },
    EPEE: {
      1: [
        "对前压的手腕刺出一记快剑",
        "以短促干净的刺击刺中手部",
        "以简单伸臂找到空当",
        "反攻抓住手腕",
        "保持直刺线并在对手进攻时得分",
        "调好距离对手腕刺出一剑",
        "以快速阻击刺中前臂",
        "以从容的伸臂找到前臂",
        "以下沉的刺击得分于腿/膝",
      ],
      2: [
        "击打后以伸臂刺中手腕得分",
        "以击打–转移换线，漂亮收尾",
        "佯攻后给出角度刺中手部",
        "以准备–进攻连招刺中躯干",
        "亮出直刺线威胁后换线刺中",
        "在弓步中以转移找到空当",
        "以压剑控制对方剑刺中",
        "六号防守挡下后还击刺中手腕",
        "八号防守后以还击刺中手背",
      ],
      3: [
        "双重佯攻后抓住手腕",
        "压剑后干净地刺中空当",
        "以两拍准备扩大空当刺中",
        "以击打–转移–进攻连招抢下一剑",
      ],
      4: [
        "在长准备末尾找到空当",
        "以佯攻–转移–角度–进攻抢下一剑",
        "双重击打后以角度刺中手腕",
      ],
    },
    SABRE: {
      1: [
        "以劈头得分",
        "以快速进攻抢先并劈中",
        "以飞刺扑向头部",
        "凭纯反应率先击中",
        "干净地劈中脸颊",
        "拉近距离劈中手臂",
      ],
      2: [
        "以击打–劈头得分",
        "五号防守护头后以还击劈中",
        "三号防守后以还击劈中脸颊",
        "转向脸颊完成劈击",
        "佯攻后劈中侧腹",
        "顿足–飞刺爆发劈向头部",
        "击打与转身后漂亮地劈中",
      ],
      3: [
        "双重佯攻后连上劈头",
        "以防守–还击–反劈连招得分",
        "以两拍准备找到空当劈中",
      ],
      4: [
        "在长回合末尾破防劈中",
        "以佯攻–佯攻–侧–劈头组合得分",
      ],
    },
  },
};

/**
 * Yaş kategorisine göre tuşun tempo dağılımı (kullanıcı kuralı):
 * U10 sadece tek zamanlı; U12 %35 çift; üst kategorilerde 3–4 zamanlı da çıkar.
 */
const TEMPO_MIX: Record<AgeCategory, Partial<Record<Tempo, number>>> = {
  U10: { 1: 0.55, 2: 0.45 }, // U10'da da basit bate/dégajé/parat-ripost çıksın (11.10) — ama 3-4'lü uzun diziler yok
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
  return narr.pick(narrPool(TOUCH_LINES_BY_TEMPO, locale)[scorer.weapon][tempo]);
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
const REF_EVENTS_BY_WEAPON: Partial<Record<Locale, Record<Weapon, string[]>>> = {
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
  fr: {
    FOIL: [
      "Deux lampes — l'arbitre n'a pu attribuer la priorité, pas de touche.",
      "Corps à corps — l'arbitre a séparé, pas de touche.",
      "Priorité incertaine — l'arbitre a dit « halte » et remis en garde.",
      "Une lampe s'est allumée mais l'arbitre a annulé la touche — rien.",
      "Contact pendant la préparation — l'arbitre a dit « halte », pas de touche.",
      "Carton jaune — infraction, avertissement.",
    ],
    EPEE: [
      "Corps à corps — l'arbitre a dit « halte », pas de touche.",
      "Une lampe s'est allumée mais l'arbitre a annulé la touche — rien.",
      "La pointe a touché la piste — invalide, pas de touche.",
      "Les deux ont allongé mais aucune lampe — pas de touche.",
      "La distance s'est rompue — l'arbitre a dit « halte », pas de touche.",
      "Carton jaune — infraction, avertissement.",
    ],
    SABRE: [
      "Deux lampes — l'arbitre n'a pu donner la priorité, pas de touche.",
      "Corps à corps — interdit au sabre, l'arbitre a dit « halte ».",
      "Croisement des jambes — infraction, l'arbitre a dit « halte ».",
      "Une lampe s'est allumée mais l'arbitre a annulé — rien.",
      "Priorité contestée — l'arbitre a remis en garde.",
      "Carton jaune — infraction, avertissement.",
    ],
  },
  de: {
    FOIL: [
      "Zwei Lampen — der Kampfrichter konnte das Vorrecht nicht vergeben, kein Treffer.",
      "Nahkampf (Corps-à-corps) — der Kampfrichter trennte, kein Treffer.",
      "Vorrecht unklar — der Kampfrichter rief „Halt“ und setzte neu.",
      "Eine Lampe leuchtete, aber der Kampfrichter annullierte den Treffer — nichts.",
      "Kontakt in der Vorbereitung — der Kampfrichter rief „Halt“, kein Treffer.",
      "Gelbe Karte — Regelverstoß, Verwarnung.",
    ],
    EPEE: [
      "Nahkampf (Corps-à-corps) — der Kampfrichter rief „Halt“, kein Treffer.",
      "Eine Lampe leuchtete, aber der Kampfrichter annullierte den Treffer — nichts.",
      "Die Spitze traf die Bahn — ungültig, kein Treffer.",
      "Beide streckten, aber keine Lampe — kein Treffer.",
      "Die Distanz brach zusammen — der Kampfrichter rief „Halt“, kein Treffer.",
      "Gelbe Karte — Regelverstoß, Verwarnung.",
    ],
    SABRE: [
      "Zwei Lampen — der Kampfrichter konnte das Vorrecht nicht vergeben, kein Treffer.",
      "Nahkampf — beim Säbel verboten, der Kampfrichter rief „Halt“.",
      "Beinkreuzen — Regelverstoß, der Kampfrichter rief „Halt“.",
      "Eine Lampe leuchtete, aber der Kampfrichter annullierte sie — nichts.",
      "Vorrecht umstritten — der Kampfrichter setzte neu.",
      "Gelbe Karte — Regelverstoß, Verwarnung.",
    ],
  },
  es: {
    FOIL: [
      "Dos luces — el árbitro no pudo conceder la prioridad, sin tocado.",
      "Cuerpo a cuerpo — el árbitro separó, sin tocado.",
      "Prioridad poco clara — el árbitro dijo «alto» y reanudó.",
      "Se encendió una luz pero el árbitro anuló el tocado — nada.",
      "Contacto en la preparación — el árbitro dijo «alto», sin tocado.",
      "Tarjeta amarilla — infracción, amonestación.",
    ],
    EPEE: [
      "Cuerpo a cuerpo — el árbitro dijo «alto», sin tocado.",
      "Se encendió una luz pero el árbitro anuló el tocado — nada.",
      "La punta tocó la pista — inválido, sin tocado.",
      "Ambos se estiraron pero ninguna luz — sin tocado.",
      "La distancia se rompió — el árbitro dijo «alto», sin tocado.",
      "Tarjeta amarilla — infracción, amonestación.",
    ],
    SABRE: [
      "Dos luces — el árbitro no pudo dar la prioridad, sin tocado.",
      "Cuerpo a cuerpo — prohibido en sable, el árbitro dijo «alto».",
      "Cruce de piernas — infracción, el árbitro dijo «alto».",
      "Se encendió una luz pero el árbitro la anuló — nada.",
      "Prioridad en disputa — el árbitro reanudó.",
      "Tarjeta amarilla — infracción, amonestación.",
    ],
  },
  it: {
    FOIL: [
      "Due luci — l'arbitro non ha potuto assegnare la priorità, nessuna stoccata.",
      "Corpo a corpo — l'arbitro ha separato, nessuna stoccata.",
      "Priorità incerta — l'arbitro ha detto «alt» e fatto riprendere.",
      "Una luce si è accesa ma l'arbitro ha annullato la stoccata — niente.",
      "Contatto in preparazione — l'arbitro ha detto «alt», nessuna stoccata.",
      "Cartellino giallo — infrazione, ammonizione.",
    ],
    EPEE: [
      "Corpo a corpo — l'arbitro ha detto «alt», nessuna stoccata.",
      "Una luce si è accesa ma l'arbitro ha annullato la stoccata — niente.",
      "La punta ha toccato la pedana — non valida, nessuna stoccata.",
      "Entrambi si sono allungati ma nessuna luce — nessuna stoccata.",
      "La distanza si è rotta — l'arbitro ha detto «alt», nessuna stoccata.",
      "Cartellino giallo — infrazione, ammonizione.",
    ],
    SABRE: [
      "Due luci — l'arbitro non ha potuto dare la priorità, nessuna stoccata.",
      "Corpo a corpo — vietato nella sciabola, l'arbitro ha detto «alt».",
      "Incrocio delle gambe — infrazione, l'arbitro ha detto «alt».",
      "Una luce si è accesa ma l'arbitro l'ha annullata — niente.",
      "Priorità contestata — l'arbitro ha fatto riprendere.",
      "Cartellino giallo — infrazione, ammonizione.",
    ],
  },
  ru: {
    FOIL: [
      "Две лампы — судья не смог определить приоритет, укола нет.",
      "Корпус в корпус — судья развёл, укола нет.",
      "Приоритет неясен — судья дал «стоп» и перезапустил.",
      "Загорелась лампа, но судья отменил укол — ничего.",
      "Контакт в подготовке — судья дал «стоп», укола нет.",
      "Жёлтая карточка — нарушение, предупреждение.",
    ],
    EPEE: [
      "Корпус в корпус — судья дал «стоп», укола нет.",
      "Загорелась лампа, но судья отменил укол — ничего.",
      "Остриё коснулось дорожки — недействительно, укола нет.",
      "Оба выпрямили руку, но лампа не загорелась — укола нет.",
      "Дистанция сломалась — судья дал «стоп», укола нет.",
      "Жёлтая карточка — нарушение, предупреждение.",
    ],
    SABRE: [
      "Две лампы — судья не смог дать приоритет, укола нет.",
      "Корпус в корпус — в сабле запрещён, судья дал «стоп».",
      "Скрещивание ног — нарушение, судья дал «стоп».",
      "Загорелась лампа, но судья её отменил — ничего.",
      "Приоритет спорный — судья перезапустил.",
      "Жёлтая карточка — нарушение, предупреждение.",
    ],
  },
  pt: {
    FOIL: [
      "Duas luzes — o árbitro não pôde dar prioridade, sem tocado.",
      "Corpo a corpo — o árbitro separou, sem tocado.",
      "Prioridade incerta — o árbitro disse «alto» e reiniciou.",
      "Uma luz acendeu mas o árbitro anulou o tocado — nada.",
      "Contato na preparação — o árbitro disse «alto», sem tocado.",
      "Cartão amarelo — infração, advertência.",
    ],
    EPEE: [
      "Corpo a corpo — o árbitro disse «alto», sem tocado.",
      "Uma luz acendeu mas o árbitro anulou o tocado — nada.",
      "A ponta tocou a pista — inválido, sem tocado.",
      "Os dois estenderam mas nenhuma luz — sem tocado.",
      "A distância se rompeu — o árbitro disse «alto», sem tocado.",
      "Cartão amarelo — infração, advertência.",
    ],
    SABRE: [
      "Duas luzes — o árbitro não pôde dar prioridade, sem tocado.",
      "Corpo a corpo — proibido no sabre, o árbitro disse «alto».",
      "Cruzamento de pernas — infração, o árbitro disse «alto».",
      "Uma luz acendeu mas o árbitro a anulou — nada.",
      "Prioridade contestada — o árbitro reiniciou.",
      "Cartão amarelo — infração, advertência.",
    ],
  },
  zh: {
    FOIL: [
      "双灯 — 裁判无法判定优先权，无效。",
      "贴身 — 裁判分开，无效。",
      "优先权不明 — 裁判喊「停」并重新开始。",
      "灯亮了但裁判判无效 — 无得分。",
      "准备中接触 — 裁判喊「停」，无效。",
      "黄牌 — 犯规，警告。",
    ],
    EPEE: [
      "贴身 — 裁判喊「停」，无效。",
      "灯亮了但裁判判无效 — 无得分。",
      "剑尖触及剑道 — 无效。",
      "两人都伸臂但无灯 — 无效。",
      "距离崩了 — 裁判喊「停」，无效。",
      "黄牌 — 犯规，警告。",
    ],
    SABRE: [
      "双灯 — 裁判无法给出优先权，无效。",
      "贴身 — 佩剑禁止，裁判喊「停」。",
      "交叉步 — 犯规，裁判喊「停」。",
      "灯亮了但裁判判无效 — 无得分。",
      "优先权有争议 — 裁判重新开始。",
      "黄牌 — 犯规，警告。",
    ],
  },
};

const REF_EVENT_PROB = 0.6; // sayısız (tempo/iptal) turda bu olasılıkla bir hakem olayı yazılır
/** Tempo/iptal turunda ara ara bir hakem olayı satırı (yoksa null → tur sessiz geçer). */
function refEventLine(weapon: Weapon, narr: SeededRng, locale: Locale): string | null {
  if (!narr.bool(REF_EVENT_PROB)) return null;
  return narr.pick(narrPool(REF_EVENTS_BY_WEAPON, locale)[weapon]);
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
  return pickLoc(locale, {
    tr: `Maç gücü — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (${a.name} kazanma ihtimali %${pct}).`,
    en: `Match strength — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (${a.name} win chance ${pct}%).`,
    fr: `Force du match — ${a.name} : ${m.esA.total} · ${b.name} : ${m.esB.total} (chance de victoire de ${a.name} : ${pct} %).`,
    de: `Kampfstärke — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (Siegchance von ${a.name}: ${pct} %).`,
    es: `Fuerza del combate — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (probabilidad de victoria de ${a.name}: ${pct} %).`,
    it: `Forza dell'incontro — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (probabilità di vittoria di ${a.name}: ${pct} %).`,
    ru: `Сила боя — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (шанс победы ${a.name}: ${pct} %).`,
    pt: `Força do combate — ${a.name}: ${m.esA.total} · ${b.name}: ${m.esB.total} (chance de vitória de ${a.name}: ${pct} %).`,
    zh: `比赛实力 — ${a.name}：${m.esA.total} · ${b.name}：${m.esB.total}（${a.name} 获胜概率 ${pct}%）。`,
  });
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
  if (run >= 3)
    line += pickLoc(locale, {
      tr: ` — üst üste ${run}!`,
      en: ` — streak of ${run}!`,
      fr: ` — ${run} d'affilée !`,
      de: ` — ${run} in Folge!`,
      es: ` — ${run} seguidos!`,
      it: ` — ${run} di fila!`,
      ru: ` — ${run} подряд!`,
      pt: ` — ${run} seguidos!`,
      zh: ` — 连续 ${run} 剑！`,
    });
  else if (scoreA === scoreB)
    line += pickLoc(locale, {
      tr: " — eşitlik.",
      en: " — even.",
      fr: " — égalité.",
      de: " — Gleichstand.",
      es: " — empate.",
      it: " — parità.",
      ru: " — равно.",
      pt: " — empate.",
      zh: " — 平局。",
    });
  else if (scoreA === target - 1 || scoreB === target - 1)
    line += pickLoc(locale, {
      tr: " — maç sayısı!",
      en: " — match point!",
      fr: " — balle de match !",
      de: " — Matchball!",
      es: " — ¡punto de combate!",
      it: " — match point!",
      ru: " — матч-пойнт!",
      pt: " — match point!",
      zh: " — 赛点！",
    });
  return line;
}

/** Epe çift-tuş anlatımı (ikisi de aynı anda değdi). */
function doubleTouchLine(a: Combatant, b: Combatant, scoreA: number, scoreB: number, locale: Locale): string {
  return pickLoc(locale, {
    tr: `Çift tuş! İkisi de aynı anda değdi. ${scoreA}–${scoreB}`,
    en: `Double touch! Both land together. ${scoreA}–${scoreB}`,
    fr: `Coup double ! Les deux touchent en même temps. ${scoreA}–${scoreB}`,
    de: `Doppeltreffer! Beide treffen gleichzeitig. ${scoreA}–${scoreB}`,
    es: `¡Tocado doble! Ambos tocan a la vez. ${scoreA}–${scoreB}`,
    it: `Stoccata doppia! Entrambi toccano insieme. ${scoreA}–${scoreB}`,
    ru: `Обоюдный укол! Оба попали одновременно. ${scoreA}–${scoreB}`,
    pt: `Tocado duplo! Ambos tocam juntos. ${scoreA}–${scoreB}`,
    zh: `双击中！两人同时刺中。${scoreA}–${scoreB}`,
  });
}

/**
 * Flöre hedef-dışı (beyaz lamba) oranı — tunable. Sadece FLÖRE: geçerli hedef gövde olduğu için kola/
 * kafaya/bacağa dokunuş beyaz lamba yakar (sayı yok, hamle durur). Epe/kılıçta bu kavram yok (FIE).
 */
const FOIL_OFF_TARGET_PROB = 0.1;

/** Beyaz lamba anlatımı (flöre hedef-dışı; sayı yok). UI bu satırdan beyaz lambayı yakar. */
function whiteLampLine(scorer: Combatant, locale: Locale): string {
  return pickLoc(locale, {
    tr: `⚪ Beyaz lamba — ${scorer.name} hedef dışına dokundu. Sayı yok.`,
    en: `⚪ White light — ${scorer.name} hit off-target. No touch.`,
    fr: `⚪ Lampe blanche — ${scorer.name} a touché hors cible. Pas de touche.`,
    de: `⚪ Weiße Lampe — ${scorer.name} traf daneben. Kein Treffer.`,
    es: `⚪ Luz blanca — ${scorer.name} tocó fuera del blanco. Sin tocado.`,
    it: `⚪ Lampada bianca — ${scorer.name} ha toccato fuori bersaglio. Nessuna stoccata.`,
    ru: `⚪ Белая лампа — ${scorer.name} попал мимо цели. Укола нет.`,
    pt: `⚪ Lâmpada branca — ${scorer.name} tocou fora do alvo. Sem tocado.`,
    zh: `⚪ 白灯 — ${scorer.name} 刺在有效区外。无得分。`,
  });
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
    const prefix = pickLoc(locale, { tr: "Taktik", en: "Tactic", fr: "Tactique", de: "Taktik", es: "Táctica", it: "Tattica", ru: "Тактика", pt: "Tática", zh: "战术" });
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
  const act = narr.pick(narrPool(ACTION_LINES, locale)[winner.weapon]);
  log.push(
    pickLoc(locale, {
      tr: `🏁 ${winner.name} ${act} ve maçı ${wScore}-${lScore} kazandı.`,
      en: `🏁 ${winner.name} ${act} and won the match ${wScore}-${lScore}.`,
      fr: `🏁 ${winner.name} ${act} et a gagné le match ${wScore}-${lScore}.`,
      de: `🏁 ${winner.name} ${act} und gewann das Gefecht ${wScore}-${lScore}.`,
      es: `🏁 ${winner.name} ${act} y ganó el combate ${wScore}-${lScore}.`,
      it: `🏁 ${winner.name} ${act} e ha vinto l'incontro ${wScore}-${lScore}.`,
      ru: `🏁 ${winner.name} ${act} и выиграл бой ${wScore}-${lScore}.`,
      pt: `🏁 ${winner.name} ${act} e venceu o combate ${wScore}-${lScore}.`,
      zh: `🏁 ${winner.name}${act}，以 ${wScore}-${lScore} 赢得比赛。`,
    }),
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
    pickLoc(locale, {
      tr: `Skor ${opts.startA}-${opts.startB} berabere → öncelik kurası: ${prioName}.`,
      en: `Score ${opts.startA}-${opts.startB} tied → priority draw: ${prioName}.`,
      fr: `Score ${opts.startA}-${opts.startB} à égalité → tirage de la priorité : ${prioName}.`,
      de: `Stand ${opts.startA}-${opts.startB} unentschieden → Vorrechts-Los: ${prioName}.`,
      es: `Marcador ${opts.startA}-${opts.startB} empatado → sorteo de prioridad: ${prioName}.`,
      it: `Punteggio ${opts.startA}-${opts.startB} in parità → sorteggio della priorità: ${prioName}.`,
      ru: `Счёт ${opts.startA}-${opts.startB} равный → жребий приоритета: ${prioName}.`,
      pt: `Placar ${opts.startA}-${opts.startB} empatado → sorteio de prioridade: ${prioName}.`,
      zh: `比分 ${opts.startA}-${opts.startB} 平 → 抽签决定优先权：${prioName}。`,
    }),
  ];

  let scoreA = opts.startA;
  let scoreB = opts.startB;
  let winnerIsA: boolean;

  if (rng.bool(0.22)) {
    // Altın dakika tuşsuz geçti → öncelik sahibi kazanır.
    winnerIsA = priorityA;
    log.push(
      pickLoc(locale, {
        tr: `Altın dakika tuşsuz geçti — öncelik ${prioName}'de, ${prioName} kazandı.`,
        en: `The golden minute passed with no touch — priority holder ${prioName} wins.`,
        fr: `La minute en or s'est écoulée sans touche — ${prioName}, détenteur de la priorité, l'emporte.`,
        de: `Die goldene Minute verstrich ohne Treffer — Vorrechtsinhaber ${prioName} gewinnt.`,
        es: `El minuto de oro pasó sin tocado — gana ${prioName}, que tenía la prioridad.`,
        it: `Il minuto d'oro è passato senza stoccata — vince ${prioName}, che aveva la priorità.`,
        ru: `Золотая минута прошла без укола — побеждает ${prioName}, у кого был приоритет.`,
        pt: `O minuto de ouro passou sem tocado — vence ${prioName}, que tinha a prioridade.`,
        zh: `决胜一分钟无得分 — 拥有优先权的 ${prioName} 获胜。`,
      }),
    );
  } else {
    winnerIsA = rng.bool(clamp(m.baseP, 0.05, 0.95));
    if (winnerIsA) scoreA++;
    else scoreB++;
    const w = winnerIsA ? a : b;
    const phrase = touchPhrase(w, a.ageCategory ?? "SENIOR", narr, locale);
    log.push(
      pickLoc(locale, {
        tr: `🏅 Altın tuş! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
        en: `🏅 Golden touch! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
        fr: `🏅 Touche en or ! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
        de: `🏅 Goldener Treffer! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
        es: `🏅 ¡Tocado de oro! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
        it: `🏅 Stoccata d'oro! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
        ru: `🏅 Золотой укол! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
        pt: `🏅 Tocado de ouro! ${w.name} ${phrase} — ${scoreA}–${scoreB}.`,
        zh: `🏅 决胜一剑！${w.name}${phrase} — ${scoreA}–${scoreB}。`,
      }),
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
    pickLoc(locale, {
      tr: `▸ ${periodNo}. Periyot başladı — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`,
      en: `▸ Period ${periodNo} started — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`,
      fr: `▸ Période ${periodNo} commencée — ${a.name} : ${t(locale, `tactic.${tacticA}`)}, ${b.name} : ${t(locale, `tactic.${tacticB}`)}`,
      de: `▸ Periode ${periodNo} begonnen — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`,
      es: `▸ Periodo ${periodNo} iniciado — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`,
      it: `▸ Periodo ${periodNo} iniziato — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`,
      ru: `▸ Период ${periodNo} начался — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`,
      pt: `▸ Período ${periodNo} começou — ${a.name}: ${t(locale, `tactic.${tacticA}`)}, ${b.name}: ${t(locale, `tactic.${tacticB}`)}`,
      zh: `▸ 第 ${periodNo} 局开始 — ${a.name}：${t(locale, `tactic.${tacticA}`)}，${b.name}：${t(locale, `tactic.${tacticB}`)}`,
    }),
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
        pickLoc(locale, {
          tr: `⏱ Süre doldu — ${wname} ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)} önde bitirdi.`,
          en: `⏱ Time up — ${wname} finished ahead ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`,
          fr: `⏱ Temps écoulé — ${wname} a terminé en tête ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`,
          de: `⏱ Zeit abgelaufen — ${wname} beendete in Führung ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`,
          es: `⏱ Tiempo agotado — ${wname} terminó por delante ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`,
          it: `⏱ Tempo scaduto — ${wname} ha chiuso in vantaggio ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`,
          ru: `⏱ Время вышло — ${wname} завершил впереди ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`,
          pt: `⏱ Tempo esgotado — ${wname} terminou à frente ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}.`,
          zh: `⏱ 时间到 — ${wname} 以 ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)} 领先结束。`,
        }),
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
      pickLoc(locale, {
        tr: `⏸ ${periodNo}. periyot bitti — ${scoreA}–${scoreB}`,
        en: `⏸ End of period ${periodNo} — ${scoreA}-${scoreB}`,
        fr: `⏸ Fin de la période ${periodNo} — ${scoreA}–${scoreB}`,
        de: `⏸ Ende der Periode ${periodNo} — ${scoreA}–${scoreB}`,
        es: `⏸ Fin del periodo ${periodNo} — ${scoreA}–${scoreB}`,
        it: `⏸ Fine del periodo ${periodNo} — ${scoreA}–${scoreB}`,
        ru: `⏸ Конец периода ${periodNo} — ${scoreA}–${scoreB}`,
        pt: `⏸ Fim do período ${periodNo} — ${scoreA}–${scoreB}`,
        zh: `⏸ 第 ${periodNo} 局结束 — ${scoreA}–${scoreB}`,
      }),
    );
  }

  return { scoreA, scoreB, clockSec: pr.clockSec, periodsPlayed: periodNo, log, decided, winnerId };
}

/** Eleme maçının final "🏁 … maçı kazandı" satırı (maç tamamlanınca eklenir — canlıda son periyotta). */
export function deBoutFinishLine(a: Combatant, b: Combatant, state: DeBoutState, locale: Locale = "tr"): string {
  const winIsA = state.winnerId === a.id;
  const wname = winIsA ? a.name : b.name;
  return pickLoc(locale, {
    tr: `🏁 ${wname} maçı ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA} kazandı.`,
    en: `🏁 ${wname} won the match ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA}.`,
    fr: `🏁 ${wname} a gagné le match ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA}.`,
    de: `🏁 ${wname} gewann das Gefecht ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA}.`,
    es: `🏁 ${wname} ganó el combate ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA}.`,
    it: `🏁 ${wname} ha vinto l'incontro ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA}.`,
    ru: `🏁 ${wname} выиграл бой ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA}.`,
    pt: `🏁 ${wname} venceu o combate ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA}.`,
    zh: `🏁 ${wname} 以 ${winIsA ? state.scoreA : state.scoreB}-${winIsA ? state.scoreB : state.scoreA} 赢得比赛。`,
  });
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
