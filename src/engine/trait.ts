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

/**
 * Zıt/çift trait'leri eler, erken OLUŞANI (küçük unlockAge) tutar. Kişilik önce oturduğu haliyle kalır;
 * sonradan gelen çelişik trait düşer. Üretim zaten zıt-çift vermez (generateTraitPlan); bu, faz4 öncesi
 * üretilmiş ESKİ kayıtları okuma anında güvenceye alır (canlı veri silinmeden kural garanti edilir).
 */
export function sanitizeTraitKeys(keys: readonly TraitKey[]): TraitKey[] {
  const kept: TraitKey[] = [];
  for (const k of keys) {
    if (!(k in TRAITS)) continue;
    if (kept.includes(k)) continue; // çift
    const opp = TRAITS[k].opposite;
    if (opp && kept.includes(opp)) continue; // zıt-çift
    kept.push(k);
  }
  return kept;
}

/** Verilen yaşta AKTİF trait anahtarları (unlockAge ≤ yaş). Zıt/çift elenir (erken oluşan tutulur). */
export function activeTraitKeys(plan: readonly TraitPlanEntry[], age: number): TraitKey[] {
  const ordered = [...plan]
    .filter((e) => age >= e.unlockAge)
    .sort((a, b) => a.unlockAge - b.unlockAge) // erken oluşan önce → çelişkide o tutulur
    .map((e) => e.key);
  return sanitizeTraitKeys(ordered);
}

// ——— Katman 2: Yaşanmışlıkla trait gelişimi (GDD 10.31–10.37) ———

/** Trait evrimi için kariyer sinyalleri — hepsi mevcut veriden türetilir (yeni takip gerekmez). */
export interface TraitSignals {
  age: number;
  championships: number; // kümülatif şampiyonluk (ulusal+)
  medals: number; // uluslararası madalya
  nationalTeam: boolean; // milli takıma seçildi mi
  coachQuality: number; // 0..1 antrenman/koç kalitesi
  tournamentsPlayed: number; // oynanan turnuva (tecrübe)
  recentSetback: boolean; // son dönemde önemli bir düşüş/büyük kayıp
  daysSinceLastChange: number; // son trait değişiminden bu yana gün
}

/** Uygulanacak TEK trait değişimi (yoksa null). reason = i18n bildirim anahtarı ("traitEvo.*"). */
export interface TraitChange {
  kind: "TRANSFORM" | "ACQUIRE";
  from?: TraitKey; // TRANSFORM'da dönüşen eski trait
  to: TraitKey;
  reason: string;
}

/** Değişimler arası en az bekleme (1 oyun-yılı ≈ 12 hafta × 7 = 84 gün). Karakter sık sık dönmez (GDD 10.32). */
export const TRAIT_CHANGE_COOLDOWN_DAYS = 84;
/** Bu yaştan sonra karakter oturur → değişim çok nadir (GDD 10.35). */
const TRAIT_STABILIZE_AGE = 20;

/** Yaşa göre değişime açıklık: genç çok, yaşlı az (GDD 10.35). 8→1.0, 20→0.2, sonrası 0.05. */
function changeOpennessByAge(age: number): number {
  if (age >= TRAIT_STABILIZE_AGE) return 0.05;
  return clamp(1.0 - ((age - 8) / (TRAIT_STABILIZE_AGE - 8)) * 0.8, 0.2, 1.0);
}

/**
 * Kariyer yaşanmışlığına göre EN FAZLA BİR trait değişimi önerir (yoksa null). Deterministik (rng).
 * Ani değildir: cooldown + yaş kapısı + düşük olasılık (GDD 10.32). Zıt-çift korunur (dönüşüm zaten
 * olgun/zıt haline gider); max 3 trait → edinme yalnız boş slotta. Çağıran uygular + Memory'ye yazar (10.37).
 */
export function evolveTraits(active: readonly TraitKey[], s: TraitSignals, rng: SeededRng): TraitChange | null {
  if (s.daysSinceLastChange < TRAIT_CHANGE_COOLDOWN_DAYS) return null; // çok yakın — bekle
  const openness = changeOpennessByAge(s.age);
  const has = (k: TraitKey) => active.includes(k);
  const success = s.championships + s.medals + (s.nationalTeam ? 1 : 0);

  // Aday değişimler: koşul + taban olasılık. Öncelik sırayla; koşulu sağlayan İLK adayda olasılık atılır.
  const cands: { when: boolean; p: number; change: TraitChange }[] = [
    // — Olgunlaşma dönüşümleri —
    { when: has("IMPATIENT") && s.age >= 12 && s.coachQuality >= 0.55 && s.tournamentsPlayed >= 12, p: 0.5,
      change: { kind: "TRANSFORM", from: "IMPATIENT", to: "PATIENT", reason: "traitEvo.impatientToPatient" } },
    { when: has("ANXIOUS") && success >= 2, p: 0.5,
      change: { kind: "TRANSFORM", from: "ANXIOUS", to: "CALM", reason: "traitEvo.anxiousToCalm" } },
    { when: has("SENSITIVE") && success >= 2, p: 0.5,
      change: { kind: "TRANSFORM", from: "SENSITIVE", to: "CONFIDENT", reason: "traitEvo.sensitiveToConfident" } },
    { when: has("LAZY") && s.coachQuality >= 0.6 && s.tournamentsPlayed >= 16, p: 0.4,
      change: { kind: "TRANSFORM", from: "LAZY", to: "HARDWORKING", reason: "traitEvo.lazyToHardworking" } },
    // — Olumsuz dönüşüm (büyük düşüş, başarısızlık) —
    { when: has("CONFIDENT") && s.recentSetback && success === 0, p: 0.4,
      change: { kind: "TRANSFORM", from: "CONFIDENT", to: "SENSITIVE", reason: "traitEvo.confidentToSensitive" } },
    // — Edinme (yalnız boş slot; max 3 korunur) —
    { when: active.length < 3 && success >= 3 && !has("CONFIDENT") && !has("SENSITIVE"), p: 0.5,
      change: { kind: "ACQUIRE", to: "CONFIDENT", reason: "traitEvo.gainConfident" } },
    { when: active.length < 3 && s.recentSetback && !has("PRESSURE_PROOF") && !has("ANXIOUS") && !has("SENSITIVE"), p: 0.35,
      change: { kind: "ACQUIRE", to: "PRESSURE_PROOF", reason: "traitEvo.gainPressureProof" } },
  ];

  for (const c of cands) {
    if (c.when && rng.bool(c.p * openness)) return c.change;
  }
  return null;
}

/**
 * Bir TraitChange'i saklı PLANA uygular. Dönüşümde eski trait (`from`) çıkar; her iki türde de yeni trait
 * (`to`) ŞU ANKİ yaşla eklenir (hemen aktif). Zıt-çift kalmaz (dönüşümde zıttı zaten çıktı); edinmede
 * çağıran boş slotu garanti eder. Çıktı encodeTraitPlan ile saklanır.
 */
export function applyTraitChange(plan: readonly TraitPlanEntry[], change: TraitChange, atAge: number): TraitPlanEntry[] {
  const kept = plan.filter((e) => e.key !== change.to && !(change.kind === "TRANSFORM" && e.key === change.from));
  kept.push({ key: change.to, unlockAge: atAge });
  return kept;
}

/** Verilen (aktif) trait'lerin antrenman verimi çarpanları çarpımı. */
export function traitTrainingMultiplier(traits: readonly TraitKey[]): number {
  return traits.reduce((acc, t) => acc * (TRAITS[t]?.trainingMult ?? 1), 1);
}

/** Verilen (aktif) trait'lerin combat katkıları toplamı. */
export function traitCombatModifier(traits: readonly TraitKey[]): number {
  return traits.reduce((acc, t) => acc + (TRAITS[t]?.combatMod ?? 0), 0);
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

// ——— İtibar / fair-play (ahlak ekseni, GDD 10) ———

/** İtibar değişimi: bir turnuva/etkinlik sonrası uygulanacak miktar (puan). Çirkef düşer en çok. */
export const REPUTATION_STEP = { NASTY: -4, DECEITFUL: -2.5, HONEST: +1.5, NEUTRAL: +0.5 } as const;

/**
 * İtibar (0–100), bir turnuva SONRASI güncellenir. Çirkef/Hilekâr AKTİFSE düşer (çirkef daha çok),
 * Dürüst yavaşça toparlar, nötrse zamanla tavana (100) sürüklenir. Oyuncu en çok BİR ahlak trait'i
 * taşır (tek havuzdan tek seçim), o yüzden öncelik: Çirkef > Hilekâr > Dürüst > nötr.
 * Düşük itibarın oyun-içi cezası (hakem/kart/dışlanma) → V2.
 */
export function reputationAfterEvent(current: number, activeTraits: readonly TraitKey[]): number {
  const step = activeTraits.includes("NASTY")
    ? REPUTATION_STEP.NASTY
    : activeTraits.includes("DECEITFUL")
      ? REPUTATION_STEP.DECEITFUL
      : activeTraits.includes("HONEST")
        ? REPUTATION_STEP.HONEST
        : REPUTATION_STEP.NEUTRAL;
  return clamp(current + step, 0, 100);
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
