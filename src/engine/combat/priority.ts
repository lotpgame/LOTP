/**
 * Öncelik / Hak-yolu motoru (#5) — bir mübadeleyi "inisiyatif + yetenek" ile çözer, silaha göre.
 *
 * Oyun sahibi (antrenör) modeli:
 *  - ANA ETMENLER: **mesafe** (footwork + kulaç) ve **zamanlama** (timing skill). Diğer skiller yardımcı.
 *  - İnisiyatif (atağa çıkan) taban avantaj alır; büyüklüğü SİLAHA göre değişir:
 *      Kılıç: BÜYÜK (ilk atağa çıkan ağır basar) · Flöre: ORTA (iyi parat inisiyatifi çalar) · Epe: KÜÇÜK.
 *  - Katı üçgen YOK: iyi savunan aceleci atağı yener; sonucu yetenek (mesafe/zamanlama) belirler.
 *  - Epe: öncelik yok → kontra geçerli + **çift tuş** mümkün. Flöre/Kılıç: eşzamanlı hücum → İPTAL.
 *
 * Saf: I/O yok. Katsayılar başa toplandı → playtest ile ayarlanır.
 */
import { clamp, type Weapon } from "../domain";
import type { SeededRng } from "../probability";
import type { TraitKey } from "../trait";

export type Intent = "ATTACK" | "DEFEND" | "COUNTER"; // hücum · bekle-parat-riposte · kontra
export type { Weapon };

/** Niyet seçimi için gereken (0–100) yetenekler. */
export interface IntentSkills {
  attack: number;
  defense: number;
  reaction: number;
  speed: number;
  reading: number;
  timing: number;
}

import type { Tactic } from "./tactics";

/** 0–100 → −1..+1 (50 nötr). */
function c(v: number): number {
  return (v - 50) / 50;
}

/**
 * Bu mübadelenin niyetini seçer: taktik DAĞILIMI belirler, yetenek/trait eğim verir. Tohumlu.
 * Baskı kur (OFFENSIVE) → çok hücum · Bekle&karşıla (DEFENSIVE) → çok parat-riposte/kontra · Dengeli → karışık.
 */
export function pickIntent(tactic: Tactic, s: IntentSkills, traits: readonly TraitKey[], rng: SeededRng): Intent {
  let wAtk = tactic === "OFFENSIVE" ? 0.62 : tactic === "DEFENSIVE" ? 0.16 : 0.40;
  let wDef = tactic === "OFFENSIVE" ? 0.16 : tactic === "DEFENSIVE" ? 0.54 : 0.35;
  let wCnt = tactic === "OFFENSIVE" ? 0.22 : tactic === "DEFENSIVE" ? 0.30 : 0.25;
  wAtk += 0.15 * Math.max(0, c(0.6 * s.attack + 0.4 * s.speed));
  wDef += 0.15 * Math.max(0, c(0.6 * s.defense + 0.4 * s.reaction));
  wCnt += 0.15 * Math.max(0, c(0.6 * s.reading + 0.4 * s.timing));
  if (traits.includes("AGGRESSIVE")) wAtk += 0.15;
  if (traits.includes("CALM")) wDef += 0.1;
  const total = wAtk + wDef + wCnt;
  const r = rng.next() * total;
  if (r < wAtk) return "ATTACK";
  if (r < wAtk + wDef) return "DEFEND";
  return "COUNTER";
}

/** Mesafe ağırlığı — epede en yüksek (mesafe silahı). */
const W_DISTANCE: Record<Weapon, number> = { EPEE: 0.24, FOIL: 0.15, SABRE: 0.1 };
const W_TIMING = 0.22; // zamanlama — tüm silahlarda ANA etmen
const W_GENERAL = 0.16; // genel güç/form/yaş tilt'i (aggregate p'den)

/**
 * Bir niyet eşleşmesinde bu tarafın avantajı (silaha göre). Katı üçgen değil: değerler eğim verir,
 * mesafe/zamanlama/yetenek asıl sonucu belirler. Flöre'de üçgen belirgin; kılıçta hücum baskın; epede düz.
 */
function intentSideAdv(weapon: Weapon, mine: Intent, theirs: Intent): number {
  if (weapon === "EPEE") {
    // Öncelik yok → niyet küçük etki; kontra tamamen geçerli.
    if (mine === "COUNTER" && theirs === "DEFEND") return 0.05;
    if (mine === "DEFEND" && theirs === "COUNTER") return -0.03;
    return 0.02 * (mine === "ATTACK" ? 1 : 0); // hafif inisiyatif
  }
  const big = weapon === "SABRE";
  if (mine === "ATTACK") {
    if (theirs === "COUNTER") return big ? 0.22 : 0.16; // hücum, kontrayı yener (öncelik)
    if (theirs === "DEFEND") return big ? 0.16 : 0.05; // kılıçta hücum baskın; flörede parat çalabilir
    return 0; // ATTACK vs ATTACK → eşzamanlı (dışarıda iptal)
  }
  if (mine === "DEFEND") {
    if (theirs === "ATTACK") return big ? 0.05 : 0.15; // parat-riposte: flörede güçlü, kılıçta zor
    if (theirs === "COUNTER") return big ? -0.1 : -0.08; // beklerken kontra yer
    return 0;
  }
  // COUNTER
  if (theirs === "ATTACK") return big ? -0.22 : -0.16; // kontra, hücuma önceliği kaptırır (riskli)
  if (theirs === "DEFEND") return big ? 0.08 : 0.1; // kontra, tereddüdü/paratı geçer
  return 0;
}

export interface ExchangeContext {
  p: number; // A'nın aggregate güç-tabanlı tuş olasılığı (0..1) — form/yaş/yorgunluk dahil
  timingDiff: number; // (A−B) zamanlama, −1..+1
  distanceDiff: number; // (A−B) mesafe (footwork+kulaç), −1..+1
}

export interface ExchangeResult {
  a: boolean; // A sayı aldı mı
  b: boolean; // B sayı aldı mı (epede ikisi de olabilir = çift tuş)
}

/**
 * Bir mübadeleyi çözer. A'nın kazanma eğilimi = inisiyatif + zamanlama + mesafe + niyet eşleşmesi +
 * genel güç. Silah kuralları: epe çift tuş; flöre/kılıç eşzamanlı hücum iptal, tek tuş.
 */
export function resolveExchange(
  weapon: Weapon,
  iA: Intent,
  iB: Intent,
  ctx: ExchangeContext,
  rng: SeededRng,
): ExchangeResult {
  const netIntent = intentSideAdv(weapon, iA, iB) - intentSideAdv(weapon, iB, iA);
  const advA =
    netIntent +
    W_TIMING * ctx.timingDiff +
    W_DISTANCE[weapon] * ctx.distanceDiff +
    W_GENERAL * (ctx.p - 0.5) * 2;
  const pA = clamp(0.5 + advA, 0.05, 0.95); // A tek-tuş kazanır (rakip alternatifi)

  const aAggr = iA !== "DEFEND";
  const bAggr = iB !== "DEFEND";
  const bothStall = !aAggr && !bAggr;
  const winner = (): ExchangeResult => (rng.bool(pA) ? { a: true, b: false } : { a: false, b: true });

  if (weapon === "EPEE") {
    if (bothStall) return rng.bool(0.15) ? winner() : { a: false, b: false }; // iki taraf da bekliyor → tempo
    if (aAggr && bAggr) {
      // İkisi de hücuma/kontraya çıktı → çift tuş mümkün (epenin imzası). Eşit mesafe/zamanlama → daha çok çift.
      const parity = 1 - Math.abs(advA); // fark azsa çift olasılığı yüksek
      if (rng.bool(clamp(0.28 + 0.25 * parity, 0.15, 0.55))) return { a: true, b: true };
      return winner();
    }
    // Biri bekliyor (parat-riposte) → tek tuş; remise ile küçük çift ihtimali.
    if (rng.bool(0.1)) return { a: true, b: true };
    return winner();
  }

  // FLÖRE / KILIÇ — öncelik: en çok tek tuş; eşzamanlı hücum İPTAL.
  if (iA === "ATTACK" && iB === "ATTACK") {
    const annul = weapon === "SABRE" ? 0.28 : 0.42; // flörede eşzamanlı iptal daha sık
    if (rng.bool(annul)) return { a: false, b: false };
    return winner();
  }
  if (bothStall) return rng.bool(0.12) ? winner() : { a: false, b: false };
  // Aksi halde öncelik+yetenek pA'ya gömülü → tek tuş; küçük iptal (temassız).
  if (rng.bool(0.06)) return { a: false, b: false };
  return winner();
}
