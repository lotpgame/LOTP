import { describe, expect, it } from "vitest";
import { SKILL_KEYS, type PlayerSkills, type SkillValue } from "@/engine/skill";
import type { Combatant, Tactic } from "@/engine/combat";
import {
  LIVE_RESULTS_STEP,
  liveStep,
  liveStepAtMs,
  liveStepMinute,
  liveTotalSteps,
} from "@/engine/schedule";
import {
  MAX_FIELD,
  MAX_POOL_SIZE,
  applyLiveStep,
  buildDeBracket,
  drawLivePools,
  effectiveTactic,
  livePoolSizes,
  resolveLiveMatch,
  roundRobinRounds,
  simulateLiveTournament,
  type LivePlayerState,
} from "@/engine/tournament/live";

function flatSkills(current: number): PlayerSkills {
  const v: SkillValue = { current, potential: 100, floor: 0, ceiling: 100 };
  return Object.fromEntries(SKILL_KEYS.map((k) => [k, { ...v }])) as PlayerSkills;
}

function combatant(id: number): Combatant {
  return { id, name: `P${id}`, weapon: "EPEE", skills: flatSkills(45 + (id % 20) * 2), fatigue: 0 };
}

type Input = Omit<LivePlayerState, "poolNumber" | "pendingTactic" | "lastTactic">;

/** `humans` id'leri insan (kayıt taktiğiyle), geri kalanı AI. */
function field(n: number, humans: Record<number, Tactic | null> = {}): Map<number, Input> {
  const m = new Map<number, Input>();
  for (let id = 1; id <= n; id++) {
    const isHuman = id in humans;
    m.set(id, {
      combatant: { ...combatant(id), tactic: isHuman ? undefined : "BALANCED" },
      isHuman,
      registeredTactic: isHuman ? humans[id] : null,
      fatigue: 0,
    });
  }
  return m;
}

const CTX = { seedKey: "IL:TR#İstanbul:U10-M-EPE:15", deFormat: { touches: 10, periods: 2 } };

describe("canlı turnuva çizelgesi (kilitli kadans)", () => {
  it("adımlar: havuz T+5..T+13 (2 dk), sonuç T+17, eleme T+20'den 10 dk'da bir", () => {
    expect([1, 2, 3, 4, 5].map(liveStepMinute)).toEqual([5, 7, 9, 11, 13]);
    expect(liveStepMinute(LIVE_RESULTS_STEP)).toBe(17);
    expect([7, 8, 9, 10].map(liveStepMinute)).toEqual([20, 30, 40, 50]);
    expect(liveStep(6)).toEqual({ kind: "RESULTS" });
    expect(liveStep(8)).toEqual({ kind: "DE", roundNo: 2 });
    expect(liveTotalSteps(5)).toBe(11);
  });

  it("gerçek an: üretimde birebir dakika, kısaltılmış günde orantılı", () => {
    const T = Date.UTC(2026, 9, 6, 18, 0, 0);
    expect(liveStepAtMs(T, 1)).toBe(T + 5 * 60_000);
    expect(liveStepAtMs(T, 7)).toBe(T + 20 * 60_000);
    expect(liveStepAtMs(T, 7, 86_400_000 / 2)).toBe(T + 10 * 60_000);
  });
});

describe("havuzlar (max 6 kişi) + round-robin", () => {
  it("havuz boyutları en çok 6, dengeli, toplam korunur", () => {
    for (const n of [2, 3, 6, 7, 13, 24, 25, 37, 256]) {
      const sizes = livePoolSizes(n);
      expect(Math.max(...sizes)).toBeLessThanOrEqual(MAX_POOL_SIZE);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(n);
    }
    expect(livePoolSizes(24)).toEqual([6, 6, 6, 6]);
    expect(livePoolSizes(7)).toEqual([4, 3]);
  });

  it("round-robin: her çift bir kez, turda kimse iki maç yapmaz, en çok 5 tur", () => {
    for (let size = 2; size <= MAX_POOL_SIZE; size++) {
      const rounds = roundRobinRounds(size);
      expect(rounds.length).toBeLessThanOrEqual(5);
      const seen = new Set<string>();
      for (const pairs of rounds) {
        const inRound = pairs.flat();
        expect(new Set(inRound).size).toBe(inRound.length);
        for (const [a, b] of pairs) seen.add(`${a}-${b}`);
      }
      expect(seen.size).toBe((size * (size - 1)) / 2);
    }
    expect(roundRobinRounds(6).map((r) => r.length)).toEqual([3, 3, 3, 3, 3]);
    expect(roundRobinRounds(5).map((r) => r.length)).toEqual([2, 2, 2, 2, 2]);
  });

  it("çekim deterministik: girdi sırası önemsiz, aynı anahtar aynı havuzlar", () => {
    const ids = Array.from({ length: 24 }, (_, i) => i + 1);
    const a = drawLivePools(ids, "k1");
    const b = drawLivePools([...ids].reverse(), "k1");
    expect(b).toEqual(a);
    expect(drawLivePools(ids, "k2").pools).not.toEqual(a.pools);
  });
});

describe("eleme tablosu (seed + bay)", () => {
  it("24 kişi → 32'lik tablo: 8 gerçek 1. tur maçı, 8 bay 2. tura yazılır", () => {
    const ranking = Array.from({ length: 24 }, (_, i) => ({ playerId: 100 + i, seedRank: i + 1 }));
    const b = buildDeBracket(ranking, "k");
    expect(b.size).toBe(32);
    expect(b.rounds).toBe(5);
    const first = b.matches.filter((m) => m.roundNo === 1);
    expect(first).toHaveLength(8);
    const r2 = b.matches.filter((m) => m.roundNo === 2);
    const prefilled = r2.flatMap((m) => [m.aId, m.bId]).filter((x) => x != null);
    expect(prefilled.sort()).toEqual(ranking.slice(0, 8).map((r) => r.playerId).sort()); // ilk 8 seed bay
    expect(b.matches).toHaveLength(8 + 8 + 4 + 2 + 1);
  });
});

describe("taktik kaynağı (şartname)", () => {
  it("gönderilen → kayıtlı → son kullanılan → BALANCED", () => {
    expect(effectiveTactic({ pendingTactic: "OFFENSIVE", registeredTactic: "DEFENSIVE", lastTactic: "BALANCED" })).toBe("OFFENSIVE");
    expect(effectiveTactic({ pendingTactic: null, registeredTactic: "DEFENSIVE", lastTactic: "OFFENSIVE" })).toBe("DEFENSIVE");
    expect(effectiveTactic({ pendingTactic: null, registeredTactic: null, lastTactic: "OFFENSIVE" })).toBe("OFFENSIVE");
    expect(effectiveTactic({ pendingTactic: null, registeredTactic: null, lastTactic: null })).toBe("BALANCED");
  });

  it("gönderilen taktikle çözülür (sabit tohum): aynı taktik aynı sonuç, taktik maça yazılır", () => {
    const m = { phase: "POOL" as const, roundNo: 1, slot: 0, poolNo: 1, aId: 1, bId: 2, seed: "sabit-tohum" };
    const p = (id: number, pending: Tactic | null): LivePlayerState => ({
      combatant: combatant(id),
      isHuman: true,
      poolNumber: 1,
      registeredTactic: "BALANCED",
      pendingTactic: pending,
      lastTactic: null,
      fatigue: 0,
    });
    const off1 = resolveLiveMatch(m, p(1, "OFFENSIVE"), p(2, null), CTX);
    const off2 = resolveLiveMatch(m, p(1, "OFFENSIVE"), p(2, null), CTX);
    const def = resolveLiveMatch(m, p(1, "DEFENSIVE"), p(2, null), CTX);
    expect(off2).toEqual(off1);
    expect(off1.tacticA).toBe("OFFENSIVE");
    expect(off1.tacticB).toBe("BALANCED"); // göndermedi → kayıtlı taktik
    expect(def.tacticA).toBe("DEFENSIVE");
    expect(def.log).not.toEqual(off1.log); // farklı taktik maçı gerçekten değiştirir
  });
});

function invariants(n: number, sim: ReturnType<typeof simulateLiveTournament>) {
  expect(sim.standings).toHaveLength(n);
  expect(new Set(sim.standings.map((s) => s.playerId)).size).toBe(n);
  expect(sim.standings.filter((s) => s.position === 1)).toHaveLength(1);
  expect(sim.matches.every((m) => m.status === "RESOLVED")).toBe(true);
  expect(sim.ranking).toHaveLength(n);
  expect(sim.steps).toBe(liveTotalSteps(Math.log2(nextPow2(n))));
}

function nextPow2(n: number) {
  let s = 1;
  while (s < n) s *= 2;
  return s;
}

describe("uçtan uca (saf) — sunucuyla aynı adım fonksiyonu", () => {
  it("24 kişilik turnuva tutarlı biter; herkes havuzunda (boyut−1) maç yapar", () => {
    const sim = simulateLiveTournament(field(24, { 3: "OFFENSIVE", 7: null }), CTX);
    invariants(24, sim);
    const poolCount = new Map<number, number>();
    for (const m of sim.matches.filter((x) => x.phase === "POOL")) {
      poolCount.set(m.aId!, (poolCount.get(m.aId!) ?? 0) + 1);
      poolCount.set(m.bId!, (poolCount.get(m.bId!) ?? 0) + 1);
    }
    expect([...poolCount.values()].every((c) => c === 5)).toBe(true); // 4 havuz × 6 kişi
  });

  it(`saha hedefi (${MAX_FIELD}) kadar katılımcıyla da tutarlı tamamlanır`, () => {
    const sim = simulateLiveTournament(field(MAX_FIELD, { 1: "DEFENSIVE", 2: null }), CTX);
    invariants(MAX_FIELD, sim);
    expect(sim.steps).toBe(liveTotalSteps(8)); // 256'lık tablo = 8 eleme turu
  }, 20_000);

  it("deterministik: aynı girdi birebir aynı sonuç (iki tarayıcı aynıyı görür)", () => {
    const a = simulateLiveTournament(field(13, { 5: "OFFENSIVE" }), CTX);
    const reversed = new Map([...field(13, { 5: "OFFENSIVE" })].reverse());
    const b = simulateLiveTournament(reversed, CTX);
    expect(b).toEqual(a);
  });

  it("gönderilen taktik o maça uygulanır, göndermeyen yedek kaynakla oynar", () => {
    const sim = simulateLiveTournament(field(6, { 1: "DEFENSIVE", 2: null }), CTX, (step, id) =>
      id === 1 && step === 2 ? "OFFENSIVE" : null,
    );
    const m1 = sim.matches.filter((m) => m.phase === "POOL" && (m.aId === 1 || m.bId === 1));
    const tacticOf1 = (m: (typeof m1)[number]) => (m.aId === 1 ? m.result!.tacticA : m.result!.tacticB);
    expect(tacticOf1(m1.find((m) => m.roundNo === 2)!)).toBe("OFFENSIVE");
    expect(m1.filter((m) => m.roundNo !== 2).every((m) => tacticOf1(m) === "DEFENSIVE")).toBe(true); // kayıtlı
    const m2 = sim.matches.filter((m) => m.phase === "POOL" && (m.aId === 2 || m.bId === 2));
    expect(m2.every((m) => (m.aId === 2 ? m.result!.tacticA : m.result!.tacticB) === "BALANCED")).toBe(true);
  });

  it("paralel turnuvalar birbirini etkilemez (adımlar karışık sırayla çözülse de)", () => {
    const ctxB = { ...CTX, seedKey: "IL:TR#Ankara:U10-M-EPE:15" };
    const aloneA = simulateLiveTournament(field(10), CTX);
    const aloneB = simulateLiveTournament(field(9), ctxB);
    // Aynı iki turnuvayı adım adım iç içe koştur: A1, B1, A2, B2, …
    const run = (input: Map<number, Input>, ctx: typeof CTX) => {
      const draw = drawLivePools([...input.keys()], ctx.seedKey);
      const players = new Map<number, LivePlayerState>();
      draw.pools.forEach((pool, pi) =>
        pool.forEach((id) => players.set(id, { ...input.get(id)!, poolNumber: pi + 1, pendingTactic: null, lastTactic: null })),
      );
      const matches = draw.poolMatches.map((m) => ({ ...m, status: "PENDING" as const, result: null }));
      return { players, matches, ctx, done: false, standings: [] as { playerId: number; position: number }[] };
    };
    const A = run(field(10), CTX);
    const B = run(field(9), ctxB);
    for (let step = 1; !(A.done && B.done); step++) {
      for (const T of [A, B]) {
        if (T.done) continue;
        const out = applyLiveStep(step, T.players, T.matches, T.ctx);
        for (const r of out.resolved) {
          const m = T.matches.find((x) => x.seed === r.seed)!;
          Object.assign(m, { status: "RESOLVED", result: r.result });
        }
        for (const u of out.players) Object.assign(T.players.get(u.playerId)!, { fatigue: u.fatigue, lastTactic: u.lastTactic, pendingTactic: null });
        for (const c of out.created) T.matches.push({ ...c, status: "PENDING", result: null });
        for (const f of out.filled) Object.assign(T.matches.find((x) => x.seed === f.seed)!, { aId: f.aId, bId: f.bId });
        if (out.finished) {
          T.done = true;
          T.standings = out.standings!;
        }
      }
    }
    expect(A.standings).toEqual(aloneA.standings);
    expect(B.standings).toEqual(aloneB.standings);
  });

  it("aynı adımı tekrar hesaplamak aynı sonucu verir (idempotent yeniden çözüm)", () => {
    const input = field(8, { 2: "OFFENSIVE" });
    const draw = drawLivePools([...input.keys()], CTX.seedKey);
    const players = new Map<number, LivePlayerState>();
    draw.pools.forEach((pool, pi) =>
      pool.forEach((id) => players.set(id, { ...input.get(id)!, poolNumber: pi + 1, pendingTactic: null, lastTactic: null })),
    );
    const matches = draw.poolMatches.map((m) => ({ ...m, status: "PENDING" as const, result: null }));
    expect(applyLiveStep(1, players, matches, CTX)).toEqual(applyLiveStep(1, players, matches, CTX));
  });
});
