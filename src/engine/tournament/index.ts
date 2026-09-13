/**
 * Tournament Engine — turnuvayı organize eder (GDD 17). Maçı Combat'a yaptırır (GDD 5.16),
 * ranking puanını hesaplamaz (GDD 5.36).
 *
 * M3: gerçek FIE akışı — Havuz (round-robin) → Turnuva Ranking (FIE tie-break) → Eleme
 * (seed'li, bye'lı) → dereceler. Turlar arası yorgunluk taşınır (GDD 18.37).
 *
 * TASARIM KARARI (GDD 2.25): GDD 17.54 ile 17.62 eleme tablosu boyutunda çelişir. Gerçek FIE
 * ve bye sistemiyle tutarlı olması için: havuzdan kesme YOK, eleme tablosu = katılımcıdan
 * büyük/eşit en küçük 2'nin kuvveti; fazlalık üst seed'lere bye olur (GDD 17.62).
 */
import type { SeededRng } from "../probability";
import { MATCH_FORMATS, simulateMatch, type Combatant, type MatchResult } from "../combat";

const DEFAULT_POOL_SIZE = 6;

export interface TournamentMatch extends MatchResult {
  phase: "POOL" | "DE";
  round: string;
  aName: string;
  bName: string;
}

/** Bir oyuncunun havuz istatistikleri (GDD 17.44, 22.28). */
export interface PoolPlayerResult {
  playerId: number;
  name: string;
  poolNumber: number;
  matches: number;
  wins: number;
  losses: number;
  touchesScored: number;
  touchesReceived: number;
  indicator: number; // atılan − yenilen
}

export interface RankingEntry {
  playerId: number;
  name: string;
  seedRank: number; // Turnuva Ranking sırası (1 = en iyi)
}

export interface Standing {
  playerId: number;
  position: number; // 1 = şampiyon; aynı turda elenenler pozisyonu paylaşır (GDD 17.66)
}

export interface TournamentOutcome {
  pools: PoolPlayerResult[];
  ranking: RankingEntry[];
  matches: TournamentMatch[];
  standings: Standing[];
  championId: number;
  finalFatigue: Record<number, number>;
}

/** N katılımcıyı olabildiğince eşit (5–7 kişilik) havuz boyutlarına böler (GDD 17.39–17.40). */
export function computePoolSizes(n: number, target = DEFAULT_POOL_SIZE): number[] {
  if (n < 2) throw new RangeError("En az 2 katılımcı gerekli");
  const poolCount = Math.max(1, Math.round(n / target));
  const base = Math.floor(n / poolCount);
  const remainder = n % poolCount;
  const sizes: number[] = [];
  for (let i = 0; i < poolCount; i++) sizes.push(base + (i < remainder ? 1 : 0));
  return sizes;
}

/** Katılımcıdan büyük/eşit en küçük 2'nin kuvveti (eleme tablosu boyutu, GDD 17.53). */
export function bracketSize(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

/**
 * Standart eleme tablosu seed sırası: pozisyonlar öyle dizilir ki 1 en zayıfla eşleşir,
 * güçlü seed'ler geç karşılaşır (GDD 17.59–17.60). `size` 2'nin kuvveti olmalı.
 */
export function bracketSeedOrder(size: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(sum - s);
    }
    seeds = next;
  }
  return seeds;
}

/** Kalan oyuncu sayısına göre eleme tur adı (GDD 17.61). */
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

/**
 * Turnuvayı çalıştırır: havuz → seeding → eleme. Saf: girdi combatant'ları değiştirmez.
 */
export function simulateTournament(
  participants: readonly Combatant[],
  rng: SeededRng,
  opts: { poolSize?: number; poolTouches?: number; deTouches?: number } = {},
): TournamentOutcome {
  const poolSize = opts.poolSize ?? DEFAULT_POOL_SIZE;
  const poolTouches = opts.poolTouches ?? MATCH_FORMATS.POOL;
  const deTouches = opts.deTouches ?? MATCH_FORMATS.DE;

  const fatigue: Record<number, number> = {};
  for (const p of participants) fatigue[p.id] = p.fatigue;
  const byId = new Map(participants.map((p) => [p.id, p]));
  const matches: TournamentMatch[] = [];

  // --- 1) Havuzlar (rastgele dağıtım, GDD 17.41) ---
  const shuffled = rng.shuffle(participants);
  const sizes = computePoolSizes(shuffled.length, poolSize);
  const pools: Combatant[][] = [];
  let cursor = 0;
  for (const size of sizes) {
    pools.push(shuffled.slice(cursor, cursor + size));
    cursor += size;
  }

  const poolResults: PoolPlayerResult[] = [];
  pools.forEach((pool, pi) => {
    const stat = new Map<number, PoolPlayerResult>();
    for (const p of pool) {
      stat.set(p.id, {
        playerId: p.id,
        name: p.name,
        poolNumber: pi + 1,
        matches: 0,
        wins: 0,
        losses: 0,
        touchesScored: 0,
        touchesReceived: 0,
        indicator: 0,
      });
    }
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const a = { ...pool[i], fatigue: fatigue[pool[i].id] };
        const b = { ...pool[j], fatigue: fatigue[pool[j].id] };
        const r = simulateMatch(a, b, rng, poolTouches);
        matches.push({ ...r, phase: "POOL", round: `Pul ${pi + 1}`, aName: a.name, bName: b.name });
        fatigue[a.id] += r.fatigueGain;
        fatigue[b.id] += r.fatigueGain;

        const sa = stat.get(a.id)!;
        const sb = stat.get(b.id)!;
        sa.matches++;
        sb.matches++;
        sa.touchesScored += r.scoreA;
        sa.touchesReceived += r.scoreB;
        sb.touchesScored += r.scoreB;
        sb.touchesReceived += r.scoreA;
        if (r.winnerId === a.id) {
          sa.wins++;
          sb.losses++;
        } else {
          sb.wins++;
          sa.losses++;
        }
      }
    }
    for (const s of stat.values()) {
      s.indicator = s.touchesScored - s.touchesReceived;
      poolResults.push(s);
    }
  });

  // --- 2) Turnuva Ranking (FIE tie-break, GDD 17.44–17.50) ---
  const tiebreak = new Map(poolResults.map((r) => [r.playerId, rng.next()])); // son eşitlik: kura
  const ranked = [...poolResults].sort((a, b) => {
    const va = a.matches ? a.wins / a.matches : 0;
    const vb = b.matches ? b.wins / b.matches : 0;
    if (vb !== va) return vb - va; // galibiyet oranı
    if (b.indicator !== a.indicator) return b.indicator - a.indicator; // tuş farkı
    if (b.touchesScored !== a.touchesScored) return b.touchesScored - a.touchesScored; // atılan tuş
    return tiebreak.get(a.playerId)! - tiebreak.get(b.playerId)!; // kura
  });
  const ranking: RankingEntry[] = ranked.map((r, i) => ({
    playerId: r.playerId,
    name: r.name,
    seedRank: i + 1,
  }));

  // --- 3) Eleme (seed'li + bye'lı, GDD 17.57–17.62) ---
  const size = bracketSize(ranking.length);
  const seedOrder = bracketSeedOrder(size); // seed numaraları, bracket pozisyon sırasıyla
  const BYE = -1;
  // seedRank → playerId; seed > N ise BYE
  let slots: number[] = seedOrder.map((seedNo) =>
    seedNo <= ranking.length ? ranking[seedNo - 1].playerId : BYE,
  );

  const standings: Standing[] = [];
  while (slots.length > 1) {
    const label = roundLabel(slots.length);
    const winners: number[] = [];
    for (let i = 0; i < slots.length; i += 2) {
      const x = slots[i];
      const y = slots[i + 1];
      if (x === BYE && y === BYE) continue;
      if (x === BYE) {
        winners.push(y);
        continue;
      }
      if (y === BYE) {
        winners.push(x);
        continue;
      }
      const a = { ...byId.get(x)!, fatigue: fatigue[x] };
      const b = { ...byId.get(y)!, fatigue: fatigue[y] };
      const r = simulateMatch(a, b, rng, deTouches);
      matches.push({ ...r, phase: "DE", round: label, aName: a.name, bName: b.name });
      fatigue[x] += r.fatigueGain;
      fatigue[y] += r.fatigueGain;
      standings.push({ playerId: r.loserId, position: slots.length / 2 + 1 });
      winners.push(r.winnerId);
    }
    slots = winners;
  }

  const championId = slots[0];
  standings.push({ playerId: championId, position: 1 });
  standings.sort((a, b) => a.position - b.position);

  return { pools: poolResults, ranking, matches, standings, championId, finalFatigue: fatigue };
}
