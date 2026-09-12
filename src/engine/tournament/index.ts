/**
 * Tournament Engine — turnuvayı organize eder (GDD 17). Maçın sonucunu HESAPLAMAZ; her maçı
 * Combat Engine'e yaptırır (GDD 5.16). Ranking puanını da hesaplamaz (GDD 5.36).
 *
 * M1: 8 kişilik tek eleme (pool YOK — M3'te gelir), rastgele seed (GDD 17.41). Turlar arası
 * yorgunluk taşınır (GDD 18.37). Dereceler: şampiyon, finalist, ortak yarı-finalistler, vb.
 */
import type { SeededRng } from "../probability";
import { simulateMatch, type Combatant, type MatchResult } from "../combat";

export interface TournamentMatch extends MatchResult {
  round: string;
  aName: string;
  bName: string;
}

export interface Standing {
  playerId: number;
  position: number; // 1 = şampiyon. Aynı turda elenenler aynı pozisyonu paylaşır (GDD 17.66).
}

export interface TournamentOutcome {
  matches: TournamentMatch[];
  standings: Standing[];
  championId: number;
  /** Turnuva sonrası her oyuncunun güncel yorgunluğu (kalıcılaştırmak için). */
  finalFatigue: Record<number, number>;
}

/** Kalan oyuncu sayısına göre tur adı (GDD 17.61). */
function roundLabel(size: number): string {
  switch (size) {
    case 2:
      return "Final";
    case 4:
      return "Yarı Final";
    case 8:
      return "Çeyrek Final";
    default:
      return `Son ${size}`;
  }
}

function isPowerOfTwo(n: number): boolean {
  return n >= 2 && (n & (n - 1)) === 0;
}

/**
 * Tek eleme turnuvasını çalıştırır. `participants` uzunluğu 2'nin kuvveti olmalıdır (M1: 8).
 * Saf: girdi combatant'ları değiştirmez; sonuç ve güncel yorgunluk döndürür.
 */
export function runSingleElimination(
  participants: readonly Combatant[],
  rng: SeededRng,
  targetTouches = 15,
): TournamentOutcome {
  if (!isPowerOfTwo(participants.length)) {
    throw new RangeError(
      `runSingleElimination: katılımcı sayısı 2'nin kuvveti olmalı (verilen: ${participants.length})`,
    );
  }

  const fatigue: Record<number, number> = {};
  for (const p of participants) fatigue[p.id] = p.fatigue;

  const matches: TournamentMatch[] = [];
  const standings: Standing[] = [];

  // Rastgele seed: sırayı karıştır, komşuları eşleştir (GDD 17.41).
  let alive = rng.shuffle(participants);

  while (alive.length > 1) {
    const size = alive.length;
    const label = roundLabel(size);
    const winners: Combatant[] = [];

    for (let i = 0; i < alive.length; i += 2) {
      const a = { ...alive[i], fatigue: fatigue[alive[i].id] };
      const b = { ...alive[i + 1], fatigue: fatigue[alive[i + 1].id] };
      const result = simulateMatch(a, b, rng, targetTouches);

      matches.push({ ...result, round: label, aName: a.name, bName: b.name });
      fatigue[a.id] += result.fatigueGain;
      fatigue[b.id] += result.fatigueGain;

      const winner = result.winnerId === a.id ? alive[i] : alive[i + 1];
      // Bu turda elenen bu pozisyonu paylaşır: (size/2 + 1). Örn. çeyrek finalde elenen → 5.
      standings.push({ playerId: result.loserId, position: size / 2 + 1 });
      winners.push(winner);
    }

    alive = winners;
  }

  const championId = alive[0].id;
  standings.push({ playerId: championId, position: 1 });
  standings.sort((x, y) => x.position - y.position);

  return { matches, standings, championId, finalFatigue: fatigue };
}
