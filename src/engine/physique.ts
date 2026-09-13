/**
 * Physique — fiziksel yapı (boy, kulaç/erişim, bacak, kilo, el tercihi) (GDD 2.7–2.8).
 *
 * Bunlar antrenmanla değişen skill DEĞİL; yaşa bağlı büyüyen fiziksel attribute'lardır.
 * "Genetik" parametreler (yetişkin boyu, kol payı, yapı, el tercihi) saklanır; güncel ölçüler
 * yaştan türetilir (gençlerde büyüme). Etkiler KÜÇÜK tutulur — yetenek ana faktördür.
 */
import { clamp, type AgeCategory, type Weapon } from "./domain";
import type { SeededRng } from "./probability";

/** Kalıcı (genetik) fiziksel parametreler — Player'da saklanır. */
export interface Genetics {
  adultHeightCm: number; // yetişkinlikteki boy
  reachBiasCm: number; // bireysel kol payı (armspan − boy sapması)
  buildFactor: number; // −1 (ince) … +1 (iri); kilo/yapı eğilimi
  leftHanded: boolean;
}

/** Yaşa göre türetilen güncel ölçüler. */
export interface Physique {
  heightCm: number;
  reachCm: number;
  legLengthCm: number;
  weightKg: number;
}

/** Başlangıç genetiği üretir (cinsiyete göre). Deterministik (rng). */
export function generateGenetics(rng: SeededRng, gender: "MALE" | "FEMALE"): Genetics {
  const adultHeightCm =
    gender === "MALE" ? rng.float(166, 193) : rng.float(158, 182);
  return {
    adultHeightCm: round1(adultHeightCm),
    reachBiasCm: round1(rng.float(-4, 6)),
    buildFactor: round2(rng.float(-1, 1)),
    leftHanded: rng.bool(0.13), // ~%13 solak
  };
}

/** Boyun yaşa göre yetişkine oranı: ~8 yaş %72 → 18 yaş %100, sonra sabit. */
export function heightFraction(age: number): number {
  return clamp(0.72 + (age - 8) * (0.28 / 10), 0.72, 1);
}

/** Genetik + yaştan güncel fiziksel ölçüleri hesaplar. */
export function computePhysique(g: Genetics, age: number): Physique {
  const heightCm = g.adultHeightCm * heightFraction(age);
  const reachCm = heightCm * 1.02 + g.reachBiasCm; // armspan ≈ boy
  const legLengthCm = heightCm * 0.47;
  const bmi = 19 + g.buildFactor * 3; // 16–22
  const weightKg = bmi * (heightCm / 100) ** 2;
  return {
    heightCm: round1(heightCm),
    reachCm: round1(reachCm),
    legLengthCm: round1(legLengthCm),
    weightKg: round1(weightKg),
  };
}

/** Silaha göre erişim (kulaç) katsayısı — Epe mesafe silahı olduğu için en yüksek. */
const WEAPON_REACH_FACTOR: Record<Weapon, number> = { EPEE: 0.05, FOIL: 0.03, SABRE: 0.015 };

export interface PhysicalProfile {
  reachCm: number;
  legLengthCm: number;
  buildFactor: number;
  leftHanded: boolean;
}

/**
 * A oyuncusunun B'ye karşı fiziksel combat avantajı (RELATIF, küçük). Kulaç farkı (silaha
 * göre) + bacak (hamle mesafesi) + yapı/güç (ağır → küçük güç) + el tercihi (yalnız U10–U12'de,
 * çok küçük). Sonuç ±3 ile sınırlandırılır — yeteneğin önüne geçmez.
 */
export function physiqueCombatEdge(
  a: PhysicalProfile,
  b: PhysicalProfile,
  weapon: Weapon,
  ageCategory: AgeCategory,
): number {
  let edge = (a.reachCm - b.reachCm) * WEAPON_REACH_FACTOR[weapon];
  edge += (a.legLengthCm - b.legLengthCm) * 0.01; // hamle mesafesi
  edge += (a.buildFactor - b.buildFactor) * 0.8; // güç/denge (ağır yapı)
  // El tercihi: yalnız erken kategorilerde ufak avantaj (GDD tarzı, sonuç belirleyici değil).
  if ((ageCategory === "U10" || ageCategory === "U12") && a.leftHanded !== b.leftHanded) {
    edge += a.leftHanded ? 0.4 : -0.4;
  }
  return clamp(edge, -3, 3);
}

/** Ağırlık/yapının HIZ gelişimine etkisi: ağır → daha yavaş, hafif → daha hızlı. */
export function speedTrainingMultiplier(buildFactor: number): number {
  return clamp(1 - buildFactor * 0.08, 0.9, 1.1);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
