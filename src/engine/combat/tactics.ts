/**
 * Taktik tercihi (GDD 18.22–18.25) — maç öncesi seçilen stil. V1: Ofansif / Dengeli / Defansif.
 * (GDD'deki Counter/Pressure derinliği V2.) Taktik SONUCU tek bir bonusla belirlemez; iki yoldan
 * etkiler ve oyuncunun SKILL + TRAIT'leriyle, ayrıca RAKİBİN özellikleriyle etkileşir:
 *
 *  1) Effective strength'e küçük "Taktik" modifier'ı (matchup + trait farkındalıklı):
 *     - Ofansif: atak/hızını sayıya çevirir (+) ama rakibin savunma/reaksiyonuna açık verir (−);
 *       Agresif trait + yüksek taktik (okuma/zamanlama) riski azaltır (GDD 18.23).
 *     - Defansif: savunma/reaksiyonun tutar (+) ama sürekli savunma tempo/puan baskısı yaratır (−);
 *       Soğukkanlı trait + taktik bunu hafifletir (GDD 18.24).
 *  2) Tuş-başı KAOS (varyans): ofansif risk → sürprize açık maç; defansif → daha az salınım,
 *     beceri daha çok belirler (GDD 18.31–18.32: rastgelelik beceriyi ezmez).
 *
 * Saf fonksiyonlar (I/O yok). Etki bilinçli olarak KÜÇÜK tutulur (±~3.5 puan).
 */
import { clamp } from "../domain";
import type { PlayerSkills } from "../skill";
import type { TraitKey } from "../trait";

export type Tactic = "OFFENSIVE" | "BALANCED" | "DEFENSIVE";

export const TACTICS: readonly Tactic[] = ["OFFENSIVE", "BALANCED", "DEFENSIVE"];

export const TACTIC_LABEL_TR: Record<Tactic, string> = {
  OFFENSIVE: "Atak",
  BALANCED: "Dengeli",
  DEFENSIVE: "Defans",
};

export const TACTIC_DESC_TR: Record<Tactic, string> = {
  OFFENSIVE: "Sık atağa çık, inisiyatifi al — sayı bulursun ama parat-riposte'a açık verirsin (risk ↑).",
  BALANCED: "Duruma göre oyna — bazen atağa çık, bazen bekle.",
  DEFENSIVE: "Atağa davet et, parat-riposte ve kontra ile karşıla — az risk; aceleci olmayan rakibe tempo verir.",
};

/** 0–100 skill'i −1..+1 aralığına ortalar (50 nötr). */
function c(v: number): number {
  return (v - 50) / 50;
}

/**
 * Taktiğin effective strength'e katkısı (puan). Kendi skill/trait'lerine ve RAKİBİN skill'lerine
 * bağlı; bu yüzden matchup'a göre + veya − olabilir. ±3.5 ile sınırlı.
 */
export function tacticStrengthMod(
  tactic: Tactic,
  self: PlayerSkills,
  opp: PlayerSkills,
  traits: readonly TraitKey[] = [],
): number {
  if (tactic === "BALANCED") return 0;

  const discipline = clamp(0.5 * c(self.reading.current) + 0.5 * c(self.timing.current), -1, 1);

  if (tactic === "OFFENSIVE") {
    const aggressive = traits.includes("AGGRESSIVE") ? 1.2 : 0;
    const gain = 2.6 * (0.6 * c(self.attack.current) + 0.4 * c(self.speed.current));
    const leak = 2.2 * (0.6 * c(opp.defense.current) + 0.4 * c(opp.reaction.current));
    // Doğal risk: her ofansif oyun açık verir; disiplin (okuma/zamanlama) bunu azaltır.
    const baseRisk = 1.0 * (1 - 0.6 * Math.max(0, discipline));
    const mod = gain - leak * (1 - 0.3 * Math.max(0, discipline)) + aggressive - baseRisk;
    return clamp(round1(mod), -3.5, 3.5);
  }

  // DEFENSIVE
  const calm = traits.includes("CALM") ? 1.0 : 0;
  const solidity = 2.6 * (0.6 * c(self.defense.current) + 0.4 * c(self.reaction.current));
  // Tempo kaybı: pasiflik inisiyatifi verir; taktik + soğukkanlılık hafifletir (GDD 18.24).
  const tempoLoss = 1.6 * (1 - 0.5 * clamp(discipline + (calm ? 0.3 : 0), -1, 1));
  const mod = solidity + calm - tempoLoss;
  return clamp(round1(mod), -3.5, 3.5);
}

/**
 * Taktiğin tuş-başı KAOS katkısı: ofansif salınımı (sürpriz ihtimalini) artırır, defansif azaltır.
 * Maç kaosu iki oyuncunun katkısının toplamıdır (combat tarafında 0–0.45'e kısılır).
 */
export function tacticChaos(tactic: Tactic): number {
  if (tactic === "OFFENSIVE") return 0.12;
  if (tactic === "DEFENSIVE") return -0.08;
  return 0;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
