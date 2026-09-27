/**
 * Trait Engine (GDD 10) — oyuncunun KARAKTERİ ve davranış eğilimleri. Trait ≠ skill (10.2, 10.43):
 * doğrudan güç vermez, davranışsal modifier üretir (training/combat/psychology). Amaç: aynı skill'e
 * sahip oyuncular farklı KARAKTERDE olsun (10.4, 10.50).
 *
 * V1 kararları:
 * - Kademeli açılım (kullanıcı): 8–10 yaş 1 trait → 11'de 2 → 12+ 3 (max 3). Plan doğuşta üretilir,
 *   yaşla açılır (unlockAge). Trait evrimi/olayla değişim (GDD 10.31–10.37) V2.
 * - Zıt-çift kuralı (GDD 10.28): zıt trait'ler birlikte verilmez (Disiplinli+Tembel gibi).
 * - Yoğunluk 0–4 (GDD 10.6) V2 — V1'de her trait sabit "belirgin" şiddette; etkiler küçük tutulur.
 */
import { clamp } from "./domain";
import type { SeededRng } from "./probability";

export type TraitKey =
  // Karakter
  | "DISCIPLINED"
  | "HARDWORKING"
  | "LAZY"
  | "PATIENT"
  | "IMPATIENT"
  // Psikolojik
  | "CALM"
  | "PRESSURE_PROOF"
  | "CONFIDENT"
  | "SENSITIVE"
  | "ANXIOUS"
  // Rekabetçi
  | "AGGRESSIVE"
  | "COMPETITIVE"
  | "RISK_TAKER"
  | "CONTROLLED"
  | "AMBITIOUS"
  // Ahlak / Sportmenlik (ergenlikte belirir — GDD 10 + gelişim psikolojisi)
  | "HONEST"
  | "DECEITFUL"
  | "NASTY";

export type TraitCategory = "CHARACTER" | "PSYCH" | "COMPETITIVE" | "MORAL";

export interface TraitDef {
  key: TraitKey;
  label: string;
  category: TraitCategory;
  description: string;
  /** Antrenman verimi çarpanı (1 = etkisiz). GDD 10.22–10.23: skill'e dolaylı etki. */
  trainingMult: number;
  /** Combat effective strength'e katkı (puan, küçük). GDD 10.24: davranışsal. */
  combatMod: number;
  /** Zıt trait (aynı anda verilmez, GDD 10.28). */
  opposite?: TraitKey;
  /** Gamesmanship: rakibin sükûnetini bozma gücü (0–1.2). RAKİBE etki eder (combat'ta). */
  gamesmanship?: number;
  /** Gamesmanship'in kendine bindirdiği risk (kendi gücüne − puan). "küçük ama riskli". */
  selfRisk?: number;
  /** Sükûnet: rakibin gamesmanship baskısına direnç katkısı (+ direnir, − kırılır). */
  composure?: number;
}

export const TRAITS: Record<TraitKey, TraitDef> = {
  // — Karakter —
  DISCIPLINED: { key: "DISCIPLINED", label: "Disiplinli", category: "CHARACTER", description: "Antrenman programına istikrarlı uyar; verimi biraz artar.", trainingMult: 1.06, combatMod: 0 },
  HARDWORKING: { key: "HARDWORKING", label: "Çalışkan", category: "CHARACTER", description: "Antrenmandan daha çok verim alır (uzun kariyerde avantaj).", trainingMult: 1.1, combatMod: 0, opposite: "LAZY" },
  LAZY: { key: "LAZY", label: "Tembel", category: "CHARACTER", description: "Antrenman verimi düşüktür (ama yetenekliyse yine başarılı olabilir).", trainingMult: 0.9, combatMod: 0, opposite: "HARDWORKING" },
  PATIENT: { key: "PATIENT", label: "Sabırlı", category: "CHARACTER", description: "Taktiksel, bekleme gerektiren maçlarda kontrollü; küçük combat avantajı.", trainingMult: 1.0, combatMod: 0.6, opposite: "IMPATIENT" },
  IMPATIENT: { key: "IMPATIENT", label: "Sabırsız", category: "CHARACTER", description: "Erken saldırır, acele eder; toparlanma/verim biraz düşük.", trainingMult: 0.97, combatMod: -0.3, opposite: "PATIENT" },
  // — Psikolojik —
  CALM: { key: "CALM", label: "Soğukkanlı", category: "PSYCH", description: "Baskı altında sakin kalır; kritik anlarda avantaj. Rakibin oyununa (çirkef/hilekâr) gelmez.", trainingMult: 1.0, combatMod: 1.0, opposite: "ANXIOUS", composure: 1.0 },
  PRESSURE_PROOF: { key: "PRESSURE_PROOF", label: "Baskıya Dayanıklı", category: "PSYCH", description: "Final, son vuruş, eşitlik gibi kritik anlarda güçlü. Provokasyona dirençli.", trainingMult: 1.0, combatMod: 1.0, composure: 1.0 },
  CONFIDENT: { key: "CONFIDENT", label: "Özgüvenli", category: "PSYCH", description: "Momentumu korur, yenilgiden çabuk toparlar.", trainingMult: 1.0, combatMod: 0.6, opposite: "SENSITIVE", composure: 0.5 },
  SENSITIVE: { key: "SENSITIVE", label: "Hassas", category: "PSYCH", description: "Başarısızlıktan çok etkilenir; provokasyona/çirkefliğe açık (rakibin oyununa gelir).", trainingMult: 1.0, combatMod: -0.6, opposite: "CONFIDENT", composure: -1.0 },
  ANXIOUS: { key: "ANXIOUS", label: "Kaygılı", category: "PSYCH", description: "Baskı altında zorlanır; kritik anlarda dezavantaj; provokasyona açık.", trainingMult: 1.0, combatMod: -0.6, opposite: "CALM", composure: -1.0 },
  // — Rekabetçi —
  AGGRESSIVE: { key: "AGGRESSIVE", label: "Agresif", category: "COMPETITIVE", description: "Maçta baskı kurar, çok atağa çıkar; risk de yüksek.", trainingMult: 1.0, combatMod: 1.5, opposite: "CONTROLLED" },
  COMPETITIVE: { key: "COMPETITIVE", label: "Mücadeleci", category: "COMPETITIVE", description: "Pes etmez, zorlu maçlarda direnir.", trainingMult: 1.0, combatMod: 0.8 },
  RISK_TAKER: { key: "RISK_TAKER", label: "Risk Alan", category: "COMPETITIVE", description: "Cesur hamleler yapar; bazen kazandırır, bazen açık verir.", trainingMult: 1.0, combatMod: 0.5 },
  CONTROLLED: { key: "CONTROLLED", label: "Kontrollü", category: "COMPETITIVE", description: "Riskten kaçınır, rakibin hatasını bekler; sağlam ama fırsat kaçırabilir.", trainingMult: 1.0, combatMod: 0.8, opposite: "AGGRESSIVE" },
  AMBITIOUS: { key: "AMBITIOUS", label: "Hırslı", category: "COMPETITIVE", description: "Gelişime aç, hedef odaklı; antrenmana biraz katkı.", trainingMult: 1.05, combatMod: 0.5 },
  // — Ahlak / Sportmenlik (gamesmanship KÜÇÜK + RİSKLİ; eskrim saygı sporu → itibar/dışlanma V2) —
  HONEST: { key: "HONEST", label: "Dürüst", category: "MORAL", description: "Fair-play; itibarı yüksek, rakibin oyununa gelmez. Oyun-kurma avantajı yok.", trainingMult: 1.0, combatMod: 0, opposite: "DECEITFUL", composure: 0.5 },
  DECEITFUL: { key: "DECEITFUL", label: "Hilekâr", category: "MORAL", description: "Kurnazlık (zamanlama oyunları, itiraz) — rakibi bozabilir ama kendi de risk alır; itibar düşer (uzun vadede dışlanma).", trainingMult: 1.0, combatMod: 0, opposite: "HONEST", gamesmanship: 0.9, selfRisk: 0.5 },
  NASTY: { key: "NASTY", label: "Çirkef", category: "MORAL", description: "Rakibin sinirini bozar (özellikle hassas/kaygılı rakibe) ama kendi stresini artırır; itibar düşer, zamanla dışlanır.", trainingMult: 1.0, combatMod: 0, gamesmanship: 1.2, selfRisk: 0.7 },
};

export const TRAIT_KEYS = Object.keys(TRAITS) as TraitKey[];

export const TRAIT_CATEGORY_LABEL: Record<TraitCategory, string> = {
  CHARACTER: "Karakter",
  PSYCH: "Psikolojik",
  COMPETITIVE: "Rekabetçi",
  MORAL: "Ahlak / Sportmenlik",
};

/** Kademeli açılım: bir trait planı kaydı — hangi yaşta açılır. */
export interface TraitPlanEntry {
  key: TraitKey;
  unlockAge: number;
}

/** Açılım takvimi (kullanıcı kararı): 1. trait doğuşta, 2. 11 yaşında, 3. 12 yaşında (max 3). */
export const TRAIT_UNLOCK_AGES = [8, 11, 12] as const;

/**
 * YAŞA-UYGUN HAVUZLAR (gelişim psikolojisi): mizaç → rekabet/öz-denetim → psikoloji/ahlak.
 * Her açılım kendi penceresinden gelir → 10 yaşındaki çocuk "Hilekâr" olmaz; karakter yaşla oturur.
 * (Oyun akışı için ergenlik penceresi ~12'ye sıkıştırıldı; gerçekte 14–16.)
 */
const TRAIT_POOLS: TraitKey[][] = [
  // Çocukluk (mizaç, çalışma alışkanlığı)
  ["HARDWORKING", "LAZY", "DISCIPLINED", "AMBITIOUS"],
  // Ergenlik öncesi (rekabet, öz-denetim, erken özgüven)
  ["COMPETITIVE", "PATIENT", "IMPATIENT", "CONFIDENT", "RISK_TAKER"],
  // Ergenlik (psikoloji + ahlak/sportmenlik: risk, baskı, dürüst/hilekâr/çirkef)
  ["AGGRESSIVE", "CONTROLLED", "CALM", "ANXIOUS", "SENSITIVE", "PRESSURE_PROOF", "HONEST", "DECEITFUL", "NASTY"],
];

/**
 * Doğuşta trait PLANI üretir (max 3). Her trait yaşına-uygun havuzdan; zıt-çift YOK (GDD 10.28).
 * Deterministik (rng). Yaşla açılır (activeTraitKeys).
 */
export function generateTraitPlan(rng: SeededRng): TraitPlanEntry[] {
  const chosen: TraitKey[] = [];
  const plan: TraitPlanEntry[] = [];
  for (let stage = 0; stage < TRAIT_UNLOCK_AGES.length; stage++) {
    const pool = rng.shuffle([...(TRAIT_POOLS[stage] ?? TRAIT_KEYS)]);
    for (const key of pool) {
      if (chosen.includes(key)) continue;
      const opp = TRAITS[key].opposite;
      if (opp && chosen.includes(opp)) continue; // zıt-çift kuralı
      chosen.push(key);
      plan.push({ key, unlockAge: TRAIT_UNLOCK_AGES[stage] });
      break;
    }
  }
  return plan;
}

/** Verilen yaşta AKTİF trait anahtarları (unlockAge ≤ yaş). */
export function activeTraitKeys(plan: readonly TraitPlanEntry[], age: number): TraitKey[] {
  return plan.filter((e) => age >= e.unlockAge).map((e) => e.key);
}

/** Verilen (aktif) trait'lerin antrenman verimi çarpanları çarpımı. */
export function traitTrainingMultiplier(traits: readonly TraitKey[]): number {
  return traits.reduce((acc, t) => acc * (TRAITS[t]?.trainingMult ?? 1), 1);
}

/** Verilen (aktif) trait'lerin combat katkıları toplamı. */
export function traitCombatModifier(traits: readonly TraitKey[]): number {
  return traits.reduce((acc, t) => acc + (TRAITS[t]?.combatMod ?? 0), 0);
}

export function traitLabels(traits: readonly TraitKey[]): string[] {
  return traits.map((t) => TRAITS[t]?.label ?? t);
}

// ——— Gamesmanship / sükûnet (rakip etkileşimi + kendi riski) ———

function sumField(traits: readonly TraitKey[], f: "gamesmanship" | "composure" | "selfRisk"): number {
  return traits.reduce((acc, t) => acc + (TRAITS[t]?.[f] ?? 0), 0);
}

/** Kendi gamesmanship davranışının kendine bindirdiği risk (combat gücüne − puan). */
export function traitSelfRisk(traits: readonly TraitKey[]): number {
  return sumField(traits, "selfRisk");
}

/**
 * Rakibin gamesmanship'inin (çirkef/hilekâr) BENİM gücüme cezası — kendi sükûnetim azaltır.
 * "küçük ama riskli": nötr rakipte ~kendi selfRisk'ini karşılar; hassas rakipte kâr, soğukkanlıda zarar.
 */
export function incomingGamesmanshipPenalty(
  oppTraits: readonly TraitKey[],
  ownTraits: readonly TraitKey[],
): number {
  const g = sumField(oppTraits, "gamesmanship");
  if (g <= 0) return 0;
  return clamp(g * 0.6 - sumField(ownTraits, "composure") * 0.6, 0, 1.5);
}

// ——— Kalıcılık kodlaması: "KEY:unlockAge" virgülle ———

export function encodeTraitPlan(plan: readonly TraitPlanEntry[]): string {
  return plan.map((e) => `${e.key}:${e.unlockAge}`).join(",");
}

/** CSV'yi plana çevirir. Eski format ("KEY,KEY") toleranslı: unlockAge 8 (hep aktif). */
export function parseTraitPlan(csv: string): TraitPlanEntry[] {
  return (csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((tok) => {
      const [key, age] = tok.split(":");
      return { key: key as TraitKey, unlockAge: age ? Number(age) : 8 };
    })
    .filter((e) => e.key in TRAITS);
}
