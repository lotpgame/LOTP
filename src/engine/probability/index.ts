/**
 * Probability Engine — kontrollü belirsizlik katmanı (GDD 20).
 *
 * Tohumlanabilir RNG (rng) + güç/olasılık modeli (strength). Combat bu modeli kullanarak
 * maçı simüle eder; Probability Engine sonucu doğrudan belirlemez (GDD 20.4).
 */
export { SeededRng, createRng } from "./rng";
export {
  WEAPON_WEIGHTS,
  computeEffectiveStrength,
  winProbability,
  type EffectiveStrength,
  type StrengthModifier,
} from "./strength";
