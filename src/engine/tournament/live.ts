/**
 * Canlı turnuva motoru (B Faz 2, docs/DEVIR.md "B Faz 2-4 şartnamesi") — turnuvayı TUR TUR çözer.
 *
 * Saf: I/O yok, DB yok. Sunucu durumu DB'de tutar ve her adımda `applyLiveStep` çağırır; başsız
 * testler aynı fonksiyonu `simulateLiveTournament` ile uçtan uca koşturur (tek kod yolu).
 *
 * Determinizm: her maçın kendi tohumu var (turnuva anahtarı + aşama + tur + yer). Bir adımı kim, ne
 * zaman, kaç kez çözerse çözsün aynı girdiyle aynı sonuç çıkar; paralel turnuvalar birbirini etkilemez.
 * Bu modül maç kuralı/taktik İCAT ETMEZ: havuz ve eleme maçları mevcut combat motoruyla oynanır.
 */
import { createRng } from "../probability";
import { MATCH_FORMATS, simulateBoutByPeriods, simulateMatch, type Combatant, type Tactic } from "../combat";
import { LIVE_RESULTS_STEP, liveStep } from "../schedule";
import { bracketSeedOrder, bracketSize, roundLabel } from "./index";
import type { Locale } from "@/i18n";

/** Havuz başına en çok oyuncu (şartname: max 6 kişi/havuz → round-robin en çok 5 tur). */
export const MAX_POOL_SIZE = 6;

/**
 * Tek turnuva saha hedefi / tavanı (FIE eleme tablosu en çok 256). Toplam oyuncu sınırsız: ölçek
 * kategori-bazlı paralel turnuvalarla gelir. Bir kategori aşarsa bu sabit büyütülür, mimari değişmez.
 */
export const MAX_FIELD = 256;

/** N katılımcıyı en çok 6 kişilik, olabildiğince eşit havuzlara böler (havuz sayısı katılımcıya göre). */
export function livePoolSizes(n: number): number[] {
  if (n < 2) throw new RangeError("En az 2 katılımcı gerekli");
  const count = Math.ceil(n / MAX_POOL_SIZE);
  const base = Math.floor(n / count);
  const rem = n % count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}

/**
 * Havuz içi round-robin turları (circle yöntemi). Her turda bir oyuncu en çok bir maç yapar;
 * tek sayıda havuzda her tur bir kişi bay geçer. 6 kişi → 5 tur × 3 maç, 5 kişi → 5 tur × 2 maç.
 * Çiftler havuz-içi indekstir; küçük indeks A (sol) tarafı.
 */
export function roundRobinRounds(size: number): [number, number][][] {
  if (size < 2) return [];
  const n = size % 2 === 0 ? size : size + 1;
  const idx = Array.from({ length: n }, (_, i) => i);
  const rounds: [number, number][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      const x = idx[i];
      const y = idx[n - 1 - i];
      if (x < size && y < size) pairs.push(x < y ? [x, y] : [y, x]);
    }
    rounds.push(pairs);
    idx.splice(1, 0, idx.pop()!);
  }
  return rounds;
}

export type LivePhase = "POOL" | "DE";

/** Bir maçın yeri: havuzda (havuz no + tur), elemede (tur + tablo yeri). Tohum = kimlik. */
export interface LiveMatchRow {
  phase: LivePhase;
  roundNo: number;
  slot: number; // POOL: havuz-içi tur sırası (gösterim); DE: eleme tablosundaki maç yeri (0'dan)
  poolNo: number | null;
  aId: number | null;
  bId: number | null;
  seed: string;
}

export function poolMatchSeed(seedKey: string, poolNo: number, roundNo: number, aId: number, bId: number): string {
  return `${seedKey}:pool:${poolNo}:${roundNo}:${Math.min(aId, bId)}-${Math.max(aId, bId)}`;
}

export function deMatchSeed(seedKey: string, roundNo: number, slot: number): string {
  return `${seedKey}:de:${roundNo}:${slot}`;
}

/** Maçın çözüldüğü adım (havuz turu r → adım r; eleme turu k → sonuç adımından k sonra). */
export function liveMatchStep(m: Pick<LiveMatchRow, "phase" | "roundNo">): number {
  return m.phase === "POOL" ? m.roundNo : LIVE_RESULTS_STEP + m.roundNo;
}

export interface LiveDraw {
  pools: number[][]; // havuz → oyuncu id'leri (havuz-içi sıra = pul kağıdı sırası)
  poolMatches: LiveMatchRow[];
}

/** T+0 çekimi: havuzlar + havuz maç çizelgesi. Girdi sırası önemsiz (id'ye göre sıralanıp karıştırılır). */
export function drawLivePools(playerIds: readonly number[], seedKey: string): LiveDraw {
  const ordered = [...playerIds].sort((x, y) => x - y);
  const shuffled = createRng(`${seedKey}:draw`).shuffle(ordered);
  const pools: number[][] = [];
  let cursor = 0;
  for (const size of livePoolSizes(shuffled.length)) {
    pools.push(shuffled.slice(cursor, cursor + size));
    cursor += size;
  }
  const poolMatches: LiveMatchRow[] = [];
  pools.forEach((pool, pi) => {
    roundRobinRounds(pool.length).forEach((pairs, ri) => {
      pairs.forEach(([i, j], k) => {
        const aId = pool[i];
        const bId = pool[j];
        poolMatches.push({
          phase: "POOL",
          roundNo: ri + 1,
          slot: k,
          poolNo: pi + 1,
          aId,
          bId,
          seed: poolMatchSeed(seedKey, pi + 1, ri + 1, aId, bId),
        });
      });
    });
  });
  return { pools, poolMatches };
}

/** Taktik kaynağı (şartname): bu maç için gönderilen → kayıtlı → son kullanılan → BALANCED. */
export function effectiveTactic(p: {
  pendingTactic: Tactic | null;
  registeredTactic: Tactic | null;
  lastTactic: Tactic | null;
}): Tactic {
  return p.pendingTactic ?? p.registeredTactic ?? p.lastTactic ?? "BALANCED";
}

/** Turnuva içindeki bir oyuncunun durumu. `combatant` turnuva başındaki anlık görüntüdür (değişmez). */
export interface LivePlayerState {
  combatant: Combatant; // AI'da `tactic` = sabit stili; insanda yok sayılır (taktik kaynağı aşağıda)
  isHuman: boolean;
  poolNumber: number;
  registeredTactic: Tactic | null;
  pendingTactic: Tactic | null;
  lastTactic: Tactic | null;
  fatigue: number; // turnuva içi güncel yorgunluk (her maçla artar, GDD 18.37)
}

export interface ResolvedLiveMatch {
  scoreA: number;
  scoreB: number;
  winnerId: number;
  loserId: number;
  log: string[];
  tacticA: Tactic;
  tacticB: Tactic;
  fatigueGain: number;
}

export interface LiveMatchState extends LiveMatchRow {
  status: "PENDING" | "RESOLVED";
  result: ResolvedLiveMatch | null;
}

export interface LiveContext {
  seedKey: string;
  deFormat: { touches: number; periods: number };
  locale?: Locale;
}

function tacticOf(p: LivePlayerState): Tactic {
  return p.isHuman ? effectiveTactic(p) : (p.combatant.tactic ?? "BALANCED");
}

/** Tek maçı çözer: o anki yorgunluk + taktik kaynağıyla, maç tohumundan deterministik. */
export function resolveLiveMatch(
  m: LiveMatchRow,
  a: LivePlayerState,
  b: LivePlayerState,
  ctx: LiveContext,
): ResolvedLiveMatch {
  const tacticA = tacticOf(a);
  const tacticB = tacticOf(b);
  const ca: Combatant = { ...a.combatant, fatigue: a.fatigue, tactic: tacticA };
  const cb: Combatant = { ...b.combatant, fatigue: b.fatigue, tactic: tacticB };
  const r =
    m.phase === "POOL"
      ? simulateMatch(ca, cb, createRng(m.seed), MATCH_FORMATS.POOL, ctx.locale)
      : simulateBoutByPeriods(ca, cb, createRng(m.seed), {
          touches: ctx.deFormat.touches,
          periods: ctx.deFormat.periods,
          locale: ctx.locale,
        });
  return {
    scoreA: r.scoreA,
    scoreB: r.scoreB,
    winnerId: r.winnerId,
    loserId: r.loserId,
    log: r.log,
    tacticA,
    tacticB,
    fatigueGain: r.fatigueGain,
  };
}

/** Havuz istatistikleri (GDD 17.44, 22.28). */
export interface PoolStat {
  playerId: number;
  poolNumber: number;
  matches: number;
  wins: number;
  losses: number;
  touchesScored: number;
  touchesReceived: number;
  indicator: number;
}

export function computePoolStats(
  players: ReadonlyMap<number, Pick<LivePlayerState, "poolNumber">>,
  poolResults: readonly { aId: number; bId: number; scoreA: number; scoreB: number; winnerId: number }[],
): PoolStat[] {
  const stat = new Map<number, PoolStat>();
  for (const [playerId, p] of players) {
    stat.set(playerId, {
      playerId,
      poolNumber: p.poolNumber,
      matches: 0,
      wins: 0,
      losses: 0,
      touchesScored: 0,
      touchesReceived: 0,
      indicator: 0,
    });
  }
  for (const r of poolResults) {
    const sa = stat.get(r.aId);
    const sb = stat.get(r.bId);
    if (!sa || !sb) continue;
    sa.matches++;
    sb.matches++;
    sa.touchesScored += r.scoreA;
    sa.touchesReceived += r.scoreB;
    sb.touchesScored += r.scoreB;
    sb.touchesReceived += r.scoreA;
    if (r.winnerId === r.aId) {
      sa.wins++;
      sb.losses++;
    } else {
      sb.wins++;
      sa.losses++;
    }
  }
  for (const s of stat.values()) s.indicator = s.touchesScored - s.touchesReceived;
  return [...stat.values()].sort((x, y) => x.playerId - y.playerId);
}

/** Havuz sonrası Turnuva Ranking (FIE tie-break, GDD 17.44–17.50); son eşitlik turnuva tohumlu kura. */
export function rankAfterPools(stats: readonly PoolStat[], seedKey: string): { playerId: number; seedRank: number }[] {
  const rng = createRng(`${seedKey}:rank`);
  const lot = new Map([...stats].sort((x, y) => x.playerId - y.playerId).map((s) => [s.playerId, rng.next()]));
  const ranked = [...stats].sort((a, b) => {
    const va = a.matches ? a.wins / a.matches : 0;
    const vb = b.matches ? b.wins / b.matches : 0;
    if (vb !== va) return vb - va;
    if (b.indicator !== a.indicator) return b.indicator - a.indicator;
    if (b.touchesScored !== a.touchesScored) return b.touchesScored - a.touchesScored;
    return lot.get(a.playerId)! - lot.get(b.playerId)!;
  });
  return ranked.map((r, i) => ({ playerId: r.playerId, seedRank: i + 1 }));
}

/** Eleme tablosu: boyut, tur sayısı ve tüm DE satırları (1. tur gerçek maçlar + sonraki turlar boş yer). */
export interface DeBracket {
  size: number;
  rounds: number;
  matches: LiveMatchRow[];
}

/** Kazananın bir sonraki turdaki yeri: (slot/2), çift slot A tarafı, tek slot B tarafı. */
export function deAdvance(slot: number): { slot: number; side: "A" | "B" } {
  return { slot: Math.floor(slot / 2), side: slot % 2 === 0 ? "A" : "B" };
}

export function deRoundLabel(size: number, roundNo: number): string {
  return roundLabel(size >> (roundNo - 1));
}

/** `roundNo` turunda elenen oyuncunun derecesi (aynı turda elenenler paylaşır, GDD 17.66). */
export function deLoserPosition(size: number, roundNo: number): number {
  return (size >> (roundNo - 1)) / 2 + 1;
}

/**
 * Seed'li + bay'lı eleme tablosu (GDD 17.57–17.62). Havuzdan kesme yok; fazlalık üst seed'lere bay
 * olur ve bay geçen 2. turdaki yerine doğrudan yazılır (1. turda onun için maç satırı yok).
 */
export function buildDeBracket(ranking: readonly { playerId: number; seedRank: number }[], seedKey: string): DeBracket {
  const n = ranking.length;
  const size = bracketSize(n);
  const rounds = Math.log2(size);
  const bySeed = [...ranking].sort((a, b) => a.seedRank - b.seedRank).map((r) => r.playerId);
  const slots = bracketSeedOrder(size).map((seedNo) => (seedNo <= n ? bySeed[seedNo - 1] : null));

  const later = new Map<string, LiveMatchRow>();
  for (let r = 2; r <= rounds; r++) {
    for (let slot = 0; slot < size >> r; slot++) {
      later.set(`${r}:${slot}`, {
        phase: "DE",
        roundNo: r,
        slot,
        poolNo: null,
        aId: null,
        bId: null,
        seed: deMatchSeed(seedKey, r, slot),
      });
    }
  }

  const first: LiveMatchRow[] = [];
  for (let i = 0; i < size / 2; i++) {
    const x = slots[2 * i];
    const y = slots[2 * i + 1];
    if (x != null && y != null) {
      first.push({ phase: "DE", roundNo: 1, slot: i, poolNo: null, aId: x, bId: y, seed: deMatchSeed(seedKey, 1, i) });
      continue;
    }
    const advancing = x ?? y; // seed sırası iki bay yan yana gelmesini engeller (n > size/2)
    if (advancing == null) continue;
    const to = deAdvance(i);
    const row = later.get(`2:${to.slot}`)!;
    if (to.side === "A") row.aId = advancing;
    else row.bId = advancing;
  }

  return { size, rounds, matches: [...first, ...later.values()] };
}

/** Bir adımın sonucu — sunucu bunu DB'ye yazar, saf simülasyon kendi durumuna uygular. */
export interface LiveStepOutcome {
  step: number;
  resolved: { seed: string; result: ResolvedLiveMatch }[];
  players: { playerId: number; fatigue: number; lastTactic: Tactic | null }[]; // maç yapanlar (bekleyen taktik tüketilir)
  created: LiveMatchRow[]; // sonuç adımında: eleme tablosu satırları
  filled: { seed: string; aId: number | null; bId: number | null }[]; // eleme: sonraki turun dolan yerleri
  poolStats: PoolStat[] | null;
  ranking: { playerId: number; seedRank: number }[] | null;
  standings: { playerId: number; position: number }[] | null; // yalnız son adımda
  finished: boolean;
}

/**
 * `step` adımını çözer. Durumu değiştirmez; yalnız sonucu döndürür. Adımlar sırayla uygulanmalıdır
 * (sunucu bunu kilit + koşullu güncelleme ile garanti eder).
 */
export function applyLiveStep(
  step: number,
  players: ReadonlyMap<number, LivePlayerState>,
  matches: readonly LiveMatchState[],
  ctx: LiveContext,
): LiveStepOutcome {
  const out: LiveStepOutcome = {
    step,
    resolved: [],
    players: [],
    created: [],
    filled: [],
    poolStats: null,
    ranking: null,
    standings: null,
    finished: false,
  };
  const s = liveStep(step);

  if (s.kind === "RESULTS") {
    const poolResults = matches
      .filter((m) => m.phase === "POOL" && m.result && m.aId != null && m.bId != null)
      .map((m) => ({ aId: m.aId!, bId: m.bId!, scoreA: m.result!.scoreA, scoreB: m.result!.scoreB, winnerId: m.result!.winnerId }));
    out.poolStats = computePoolStats(players, poolResults);
    out.ranking = rankAfterPools(out.poolStats, ctx.seedKey);
    out.created = buildDeBracket(out.ranking, ctx.seedKey).matches;
    return out;
  }

  const phase: LivePhase = s.kind === "POOL" ? "POOL" : "DE";
  const due = matches.filter(
    (m) => m.phase === phase && m.roundNo === s.roundNo && m.status === "PENDING" && m.aId != null && m.bId != null,
  );
  // Bir oyuncu bir turda en çok bir maç yapar → turun maçları birbirinden bağımsız çözülür.
  for (const m of due) {
    const a = players.get(m.aId!);
    const b = players.get(m.bId!);
    if (!a || !b) throw new Error(`Maç oyuncusu bulunamadı: ${m.seed}`);
    const result = resolveLiveMatch(m, a, b, ctx);
    out.resolved.push({ seed: m.seed, result });
    out.players.push({ playerId: m.aId!, fatigue: a.fatigue + result.fatigueGain, lastTactic: result.tacticA });
    out.players.push({ playerId: m.bId!, fatigue: b.fatigue + result.fatigueGain, lastTactic: result.tacticB });
  }

  if (phase === "POOL") return out;

  const size = bracketSize(players.size);
  const rounds = Math.log2(size);
  if (s.roundNo < rounds) {
    const next = new Map(
      matches
        .filter((m) => m.phase === "DE" && m.roundNo === s.roundNo + 1)
        .map((m) => [m.slot, { seed: m.seed, aId: m.aId, bId: m.bId }]),
    );
    const touched = new Set<number>();
    for (const r of out.resolved) {
      const m = due.find((d) => d.seed === r.seed)!;
      const to = deAdvance(m.slot);
      const row = next.get(to.slot);
      if (!row) throw new Error(`Eleme tablosunda yer yok: tur ${s.roundNo + 1}, yer ${to.slot}`);
      if (to.side === "A") row.aId = r.result.winnerId;
      else row.bId = r.result.winnerId;
      touched.add(to.slot);
    }
    out.filled = [...touched].sort((x, y) => x - y).map((slot) => next.get(slot)!);
    return out;
  }

  // Final çözüldü → dereceler: her elemede kaybeden turuna göre, kazanan şampiyon.
  out.finished = true;
  const all = [...matches.filter((m) => m.phase === "DE" && m.result), ...due.map((m) => ({ ...m, result: null }))];
  const resultBySeed = new Map(out.resolved.map((r) => [r.seed, r.result]));
  const standings: { playerId: number; position: number }[] = [];
  let championId: number | null = null;
  for (const m of all) {
    const res = m.result ?? resultBySeed.get(m.seed);
    if (!res) continue;
    standings.push({ playerId: res.loserId, position: deLoserPosition(size, m.roundNo) });
    if (m.roundNo === rounds) championId = res.winnerId;
  }
  if (championId == null) throw new Error("Final sonucu yok");
  standings.push({ playerId: championId, position: 1 });
  out.standings = standings.sort((a, b) => a.position - b.position || a.playerId - b.playerId);
  return out;
}

/** Bir adım sonucunu saf duruma uygular (başsız simülasyon ve testler için; sunucu DB'ye yazar). */
export function commitLiveStep(
  players: Map<number, LivePlayerState>,
  matches: LiveMatchState[],
  out: LiveStepOutcome,
): void {
  const bySeed = new Map(matches.map((m) => [m.seed, m]));
  for (const r of out.resolved) {
    const m = bySeed.get(r.seed)!;
    m.status = "RESOLVED";
    m.result = r.result;
  }
  for (const u of out.players) {
    const p = players.get(u.playerId)!;
    p.fatigue = u.fatigue;
    p.lastTactic = u.lastTactic;
    p.pendingTactic = null;
  }
  for (const row of out.created) matches.push({ ...row, status: "PENDING", result: null });
  for (const f of out.filled) {
    const m = bySeed.get(f.seed) ?? matches.find((x) => x.seed === f.seed)!;
    m.aId = f.aId;
    m.bId = f.bId;
  }
}

export interface LiveSimulation {
  matches: LiveMatchState[];
  ranking: { playerId: number; seedRank: number }[];
  standings: { playerId: number; position: number }[];
  championId: number;
  steps: number;
}

/**
 * Turnuvayı baştan sona saf olarak koşturur (başsız test / denge). `tacticAt(step, playerId)` o adımın
 * maçı için gönderilen taktiği verir (yoksa null → yedek kaynak). Sunucuyla aynı adım fonksiyonu.
 */
export function simulateLiveTournament(
  input: ReadonlyMap<number, Omit<LivePlayerState, "poolNumber" | "pendingTactic" | "lastTactic">>,
  ctx: LiveContext,
  tacticAt?: (step: number, playerId: number) => Tactic | null,
): LiveSimulation {
  const draw = drawLivePools([...input.keys()], ctx.seedKey);
  const players = new Map<number, LivePlayerState>();
  draw.pools.forEach((pool, pi) => {
    for (const id of pool) {
      players.set(id, { ...input.get(id)!, poolNumber: pi + 1, pendingTactic: null, lastTactic: null });
    }
  });
  const matches: LiveMatchState[] = draw.poolMatches.map((m) => ({ ...m, status: "PENDING", result: null }));
  let ranking: { playerId: number; seedRank: number }[] = [];
  for (let step = 1; step < 1000; step++) {
    if (tacticAt) {
      for (const [id, p] of players) if (p.isHuman) p.pendingTactic = tacticAt(step, id);
    }
    const out = applyLiveStep(step, players, matches, ctx);
    commitLiveStep(players, matches, out);
    if (out.ranking) ranking = out.ranking;
    if (out.finished) {
      return {
        matches,
        ranking,
        standings: out.standings!,
        championId: out.standings!.find((st) => st.position === 1)!.playerId,
        steps: step,
      };
    }
  }
  throw new Error("Turnuva bitmedi");
}
