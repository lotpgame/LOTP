/**
 * Psychology Engine — oyuncunun zihinsel durumu (GDD 11). Moral, motivasyon, özgüven, stres.
 * Statik sayı değil; olaylardan değişir (GDD 6.13) ve antrenman verimi + combat performansını
 * etkiler (GDD 14.48, 20.11). Kalıcı değerlerin sahibi bu engine'dir (Player Engine kopyalamaz).
 *
 * M6: temel 4 değer + olay güncellemeleri + modifier'lar. Değerler 0–100.
 */
import { clamp } from "./domain";

export interface Psychology {
  morale: number;
  motivation: number;
  confidence: number;
  stress: number;
}

export const DEFAULT_PSYCHOLOGY: Psychology = {
  morale: 60,
  motivation: 65,
  confidence: 50,
  stress: 20,
};

function c(v: number): number {
  return clamp(v, 0, 100);
}

/** Antrenman verimi çarpanı: yüksek motivasyon +, yüksek stres − (GDD 14.48). */
export function psychologyTrainingMultiplier(p: Psychology): number {
  const m = 1 + (p.motivation - 50) / 250 - p.stress / 400;
  return clamp(m, 0.8, 1.2);
}

/** Combat effective strength katkısı: özgüven +, stres − (GDD 20.11). */
export function psychologyCombatModifier(p: Psychology): number {
  // Tüm psikoloji maça yansır (GDD 11): özgüven en güçlü; moral ("bugün iyi hissediyorum") ve
  // motivasyon katkı verir; stres düşürür. Toplam ~±4 ile sınırlı kalır (barem 0–100).
  return (
    (p.confidence - 50) * 0.03 +
    (p.morale - 50) * 0.02 +
    (p.motivation - 50) * 0.015 -
    p.stress * 0.015
  );
}

/** Bir haftalık antrenman sonrası: çalışmak motivasyonu korur, yük stresi artırır. */
export function afterTrainingWeek(p: Psychology, restSessions: number): Psychology {
  return {
    ...p,
    motivation: c(p.motivation + (restSessions > 0 ? 1 : -1)),
    stress: c(p.stress + (3 - restSessions) * 2 - restSessions * 4),
  };
}

/** Turnuva sonrası: iyi derece morali/özgüveni artırır, kötü derece düşürür (GDD 18.59). */
export function afterTournament(
  p: Psychology,
  position: number,
  fieldSize: number,
): Psychology {
  // Normalleştirilmiş başarı: 1. sıra → 1.0, son → 0.0
  const success = fieldSize > 1 ? 1 - (position - 1) / (fieldSize - 1) : 0.5;
  const delta = (success - 0.5) * 30; // ±15
  return {
    morale: c(p.morale + delta),
    confidence: c(p.confidence + delta),
    motivation: c(p.motivation + delta * 0.3),
    stress: c(p.stress + 8 - success * 6), // yarışma stresi; iyi sonuç biraz azaltır
  };
}
