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
  | "AMBITIOUS";

export type TraitCategory = "CHARACTER" | "PSYCH" | "COMPETITIVE";

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
}

export const TRAITS: Record<TraitKey, TraitDef> = {
  // — Karakter —
  DISCIPLINED: { key: "DISCIPLINED", label: "Disiplinli", category: "CHARACTER", description: "Antrenman programına istikrarlı uyar; verimi biraz artar.", trainingMult: 1.06, combatMod: 0 },
  HARDWORKING: { key: "HARDWORKING", label: "Çalışkan", category: "CHARACTER", description: "Antrenmandan daha çok verim alır (uzun kariyerde avantaj).", trainingMult: 1.1, combatMod: 0, opposite: "LAZY" },
  LAZY: { key: "LAZY", label: "Tembel", category: "CHARACTER", description: "Antrenman verimi düşüktür (ama yetenekliyse yine başarılı olabilir).", trainingMult: 0.9, combatMod: 0, opposite: "HARDWORKING" },
  PATIENT: { key: "PATIENT", label: "Sabırlı", category: "CHARACTER", description: "Taktiksel, bekleme gerektiren maçlarda kontrollü; küçük combat avantajı.", trainingMult: 1.0, combatMod: 0.6, opposite: "IMPATIENT" },
  IMPATIENT: { key: "IMPATIENT", label: "Sabırsız", category: "CHARACTER", description: "Erken saldırır, acele eder; toparlanma/verim biraz düşük.", trainingMult: 0.97, combatMod: -0.3, opposite: "PATIENT" },
  // — Psikolojik —
  CALM: { key: "CALM", label: "Soğukkanlı", category: "PSYCH", description: "Baskı altında sakin kalır; kritik anlarda avantaj.", trainingMult: 1.0, combatMod: 1.0, opposite: "ANXIOUS" },
  PRESSURE_PROOF: { key: "PRESSURE_PROOF", label: "Baskıya Dayanıklı", category: "PSYCH", description: "Final, son vuruş, eşitlik gibi kritik anlarda güçlü.", trainingMult: 1.0, combatMod: 1.0 },
  CONFIDENT: { key: "CONFIDENT", label: "Özgüvenli", category: "PSYCH", description: "Momentumu korur, yenilgiden çabuk toparlar.", trainingMult: 1.0, combatMod: 0.6, opposite: "SENSITIVE" },
  SENSITIVE: { key: "SENSITIVE", label: "Hassas", category: "PSYCH", description: "Başarısızlıktan çok etkilenir; psikolojik dalgalanmaya açık.", trainingMult: 1.0, combatMod: -0.6, opposite: "CONFIDENT" },
  ANXIOUS: { key: "ANXIOUS", label: "Kaygılı", category: "PSYCH", description: "Baskı altında zorlanır; kritik anlarda dezavantaj.", trainingMult: 1.0, combatMod: -0.6, opposite: "CALM" },
  // — Rekabetçi —
  AGGRESSIVE: { key: "AGGRESSIVE", label: "Agresif", category: "COMPETITIVE", description: "Maçta baskı kurar, çok atağa çıkar; risk de yüksek.", trainingMult: 1.0, combatMod: 1.5, opposite: "CONTROLLED" },
  COMPETITIVE: { key: "COMPETITIVE", label: "Mücadeleci", category: "COMPETITIVE", description: "Pes etmez, zorlu maçlarda direnir.", trainingMult: 1.0, combatMod: 0.8 },
  RISK_TAKER: { key: "RISK_TAKER", label: "Risk Alan", category: "COMPETITIVE", description: "Cesur hamleler yapar; bazen kazandırır, bazen açık verir.", trainingMult: 1.0, combatMod: 0.5 },
  CONTROLLED: { key: "CONTROLLED", label: "Kontrollü", category: "COMPETITIVE", description: "Riskten kaçınır, rakibin hatasını bekler; sağlam ama fırsat kaçırabilir.", trainingMult: 1.0, combatMod: 0.8, opposite: "AGGRESSIVE" },
  AMBITIOUS: { key: "AMBITIOUS", label: "Hırslı", category: "COMPETITIVE", description: "Gelişime aç, hedef odaklı; antrenmana biraz katkı.", trainingMult: 1.05, combatMod: 0.5 },
};

export const TRAIT_KEYS = Object.keys(TRAITS) as TraitKey[];

export const TRAIT_CATEGORY_LABEL: Record<TraitCategory, string> = {
  CHARACTER: "Karakter",
  PSYCH: "Psikolojik",
  COMPETITIVE: "Rekabetçi",
};

/** Kademeli açılım: bir trait planı kaydı — hangi yaşta açılır. */
export interface TraitPlanEntry {
  key: TraitKey;
  unlockAge: number;
}

/** Açılım takvimi (kullanıcı kararı): 1. trait doğuşta, 2. 11 yaşında, 3. 12 yaşında (max 3). */
export const TRAIT_UNLOCK_AGES = [8, 11, 12] as const;

/**
 * Doğuşta trait PLANI üretir (max 3, zıt-çift YOK). Deterministik (rng). Yaşla açılır (activeTraitKeys).
 */
export function generateTraitPlan(rng: SeededRng): TraitPlanEntry[] {
  const pool = rng.shuffle([...TRAIT_KEYS]);
  const chosen: TraitKey[] = [];
  for (const key of pool) {
    if (chosen.length >= TRAIT_UNLOCK_AGES.length) break;
    const opp = TRAITS[key].opposite;
    if (opp && chosen.includes(opp)) continue; // zıt-çift kuralı (GDD 10.28)
    chosen.push(key);
  }
  return chosen.map((key, i) => ({ key, unlockAge: TRAIT_UNLOCK_AGES[i] }));
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
