/**
 * B Faz 2-4 — canlı turnuvanın SUNUCU tarafı (docs/DEVIR.md "B Faz 2-4 şartnamesi",
 * docs/TURNUVA_MULTIPLAYER.md). Turnuva TUR TUR çözülür: kilitli çizelgedeki her adım zamanı gelince
 * sunucuda BİR KEZ çözülür (lazy catch-up: turnuvaya dokunan her istek "şimdi"ye kadar ilerletir).
 * Durum tamamen DB'de (Tournament / TournamentParticipant / Match) → herkes aynı satırları okur.
 * Saf adım mantığı `engine/tournament/live.ts`'te; burada yalnız okuma/yazma + kilit + doğrulama var.
 *
 * Eşzamanlılık: her adım tek işlemde, turnuva başına Postgres advisory lock altında, `step` beklenen
 * değerdeyse çözülür; maç satırları da yalnız PENDING iken güncellenir → iki istek aynı anda gelse de
 * bir adım bir kez çözülür (GDD 23.57, şartname Faz 4). Taktik gönderimi aynı kilidi alır → çözümle yarışmaz.
 */
import { prisma } from "@/db";
import { TACTICS, deFormat, type Combatant, type DeBoutState, type Tactic } from "@/engine/combat";
import { clamp, type TournamentLevel } from "@/engine/domain";
import { createRng } from "@/engine/probability";
import { LIVE_RESULTS_STEP, liveStep, liveStepAtMs, liveStepWindowCloseMs } from "@/engine/schedule";
import { bracketSize } from "@/engine/tournament";
import {
  applyLiveStep,
  deRoundLabel,
  drawLivePools,
  effectiveTactic,
  liveMatchStep,
  type LiveMatchState,
  type LivePlayerState,
  type LiveStepOutcome,
} from "@/engine/tournament/live";
import { prizeFor } from "@/engine/economy";
import { afterTournament as psychAfterTournament } from "@/engine/psychology";
import { COMPETITION_SHARPNESS_GAIN, applySharpness, rollInjury } from "@/engine/conditioning";
import { experienceForTournament, rankEntries, rankingPointsForPosition, rankingScopeForLevel } from "@/engine/ranking";
import { detectAchievements, type AchievementType } from "@/engine/memory";
import { MS_PER_GAME_DAY } from "@/engine/worldclock";
import type { Locale } from "@/i18n";
import { worldClockConfig } from "./world";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Advisory lock ad alanı (canlı turnuva) — ikinci anahtar turnuva id'si. */
const LOCK_NS = 7302;
/** Taktik istek sınırı (GDD 23.58): bir oyuncu, bir turnuvada, 60 sn'de en çok bu kadar gönderim. */
export const TACTIC_RATE_LIMIT = 10;
const TX_OPTS = { timeout: 60_000, maxWait: 15_000 };

/** Turnuvanın paylaşılan tohum anahtarı (oyuncudan değil turnuva örneğinden, TURNUVA_MULTIPLAYER §1.2). */
export function liveSeedKey(scopeKey: string): string {
  return `tour:${scopeKey}`;
}

/** Postgres advisory lock yalnız Postgres'te var. Yerel SQLite'ta (better-sqlite3 tek bağlantıyı
 * serialize eder) kilit gereksiz ve `pg_advisory_xact_lock` sözdizimi SQLite'ta hata verir → atla. */
const IS_SQLITE = (process.env.DATABASE_URL ?? "").startsWith("file:");
async function lockTournament(tx: Tx, tournamentId: number): Promise<void> {
  if (IS_SQLITE) return;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_NS}::int, ${tournamentId}::int)`;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

function asTactic(v: string | null | undefined): Tactic | null {
  return v != null && (TACTICS as readonly string[]).includes(v) ? (v as Tactic) : null;
}

function msPerDay(): number {
  return worldClockConfig().msPerDay ?? MS_PER_GAME_DAY;
}

/** Turnuvanın eleme periyot sayısı (kategoriye göre: U10 → 2, diğer → 3). Adım↔zaman eşlemesi buna bağlı. */
function dePeriodsOf(categoryId: string): number {
  return deFormat(categoryId.split("-")[0]).periods;
}

/** Adımın gerçek-zaman çözüm anı. */
function stepAt(startsAt: Date, step: number, dePeriods: number): Date {
  return new Date(liveStepAtMs(startsAt.getTime(), step, dePeriods, msPerDay()));
}

/** Adımın taktik penceresi kapanış anı (eleme periyodunun oynanmaya başladığı an; havuzda çözüm anı). */
function windowCloseAt(startsAt: Date, step: number, dePeriods: number): Date {
  return new Date(liveStepWindowCloseMs(startsAt.getTime(), step, dePeriods, msPerDay()));
}

/** Bir maçın SIRADAKİ çözüm adımı: havuz tek adım; eleme için oynanmış periyot sayısına göre bir sonraki periyot. */
function matchNextStep(m: { phase: string; roundNo: number | null; deState: string | null }, dePeriods: number): number {
  if (m.phase === "POOL") return m.roundNo!;
  const periodsPlayed = m.deState ? (JSON.parse(m.deState) as DeBoutState).periodsPlayed : 0;
  return LIVE_RESULTS_STEP + (m.roundNo! - 1) * dePeriods + periodsPlayed + 1;
}

// ——— Çekim (T+0) ———

export interface LiveEntrant {
  playerId: number;
  isHuman: boolean;
  combatant: Combatant; // turnuva başı anlık görüntü (AI'da tactic = stil)
  registeredTactic: Tactic | null;
}

export interface CreateLiveArgs {
  scopeKey: string;
  name: string;
  categoryId: string;
  level: TournamentLevel;
  quarter: number;
  week: number;
  date: Date;
  worldDay: number;
  startsAt: Date;
  entrants: LiveEntrant[];
}

/**
 * T+0 çekimi: turnuva + katılımcılar (anlık görüntüyle) + havuz maç çizelgesi tek işlemde. Aynı kapsam
 * için iki istek yarışırsa `scopeKey` tekilliği ikinciyi düşürür → o, mevcut turnuvayı döndürür.
 */
export async function createLiveTournament(args: CreateLiveArgs): Promise<number> {
  const seedKey = liveSeedKey(args.scopeKey);
  const dePeriods = dePeriodsOf(args.categoryId);
  const draw = drawLivePools(
    args.entrants.map((e) => e.playerId),
    seedKey,
  );
  const poolOf = new Map<number, number>();
  draw.pools.forEach((pool, pi) => pool.forEach((id) => poolOf.set(id, pi + 1)));
  try {
    return await prisma.$transaction(async (tx) => {
      const t = await tx.tournament.create({
        data: {
          name: args.name,
          categoryId: args.categoryId,
          level: args.level,
          quarter: args.quarter,
          week: args.week,
          date: args.date,
          status: "RUNNING",
          scopeKey: args.scopeKey,
          startsAt: args.startsAt,
          worldDay: args.worldDay,
          step: 0,
        },
      });
      await tx.tournamentParticipant.createMany({
        data: args.entrants.map((e) => ({
          tournamentId: t.id,
          playerId: e.playerId,
          seed: 0,
          poolNumber: poolOf.get(e.playerId)!,
          snapshot: JSON.stringify({ c: e.combatant, human: e.isHuman }),
          fatigue: Math.round(e.combatant.fatigue),
          registeredTactic: e.registeredTactic,
        })),
      });
      await tx.match.createMany({
        data: draw.poolMatches.map((m, i) => ({
          tournamentId: t.id,
          phase: "POOL",
          round: `Pul ${m.poolNo}`,
          orderIndex: i,
          status: "PENDING",
          scheduledAt: stepAt(args.startsAt, liveMatchStep(m, dePeriods), dePeriods),
          playerAId: m.aId,
          playerBId: m.bId,
          seed: m.seed,
          roundNo: m.roundNo,
          slot: m.slot,
        })),
      });
      await tx.tournamentEvent.create({
        data: { tournamentId: t.id, type: "DRAW", step: 0, detail: `${args.entrants.length} katılımcı · ${draw.pools.length} havuz` },
      });
      return t.id;
    }, TX_OPTS);
  } catch (e) {
    if (isUniqueViolation(e)) {
      const existing = await prisma.tournament.findUnique({ where: { scopeKey: args.scopeKey }, select: { id: true } });
      if (existing) return existing.id;
    }
    throw e;
  }
}

// ——— Tur çözümü (sunucu-tik) ———

/**
 * Turnuvayı "şimdi"ye kadar ilerletir: zamanı gelmiş her adımı sırayla, birer işlemde çözer. Çözülecek
 * bir şey yoksa yalnız tek bir okuma yapar (her sayfa yoklamasında çağrılabilir).
 */
export async function tickLiveTournament(tournamentId: number, opts: { locale?: Locale; nowMs?: number } = {}): Promise<void> {
  for (let guard = 0; guard < 128; guard++) {
    const t = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true, step: true, startsAt: true, categoryId: true },
    });
    if (!t || t.status !== "RUNNING" || !t.startsAt) return;
    if (stepAt(t.startsAt, t.step + 1, dePeriodsOf(t.categoryId)).getTime() > (opts.nowMs ?? Date.now())) return;
    await prisma.$transaction((tx) => resolveNextStepTx(tx, tournamentId, t.step, opts.locale), TX_OPTS);
  }
}

interface ParticipantRow {
  id: number;
  playerId: number;
  poolNumber: number | null;
  snapshot: string | null;
  fatigue: number | null;
  registeredTactic: string | null;
  pendingTactic: string | null;
  lastTactic: string | null;
}

function toLivePlayer(p: ParticipantRow): LivePlayerState {
  const snap = JSON.parse(p.snapshot ?? "null") as { c: Combatant; human: boolean } | null;
  if (!snap) throw new Error(`Katılımcı anlık görüntüsü yok: ${p.playerId}`);
  return {
    combatant: snap.c,
    isHuman: snap.human,
    poolNumber: p.poolNumber ?? 0,
    registeredTactic: asTactic(p.registeredTactic),
    pendingTactic: asTactic(p.pendingTactic),
    lastTactic: asTactic(p.lastTactic),
    fatigue: p.fatigue ?? snap.c.fatigue,
  };
}

interface MatchRow {
  phase: string;
  roundNo: number | null;
  slot: number | null;
  round: string;
  status: string;
  playerAId: number | null;
  playerBId: number | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: number | null;
  log: string | null;
  tacticA: string | null;
  tacticB: string | null;
  seed: string;
  deState: string | null;
}

function toLiveMatch(m: MatchRow): LiveMatchState {
  const resolved = m.status === "RESOLVED" && m.winnerId != null && m.playerAId != null && m.playerBId != null;
  const pool = /^Pul (\d+)$/.exec(m.round);
  return {
    phase: m.phase === "POOL" ? "POOL" : "DE",
    roundNo: m.roundNo ?? 0,
    slot: m.slot ?? 0,
    poolNo: pool ? Number(pool[1]) : null,
    aId: m.playerAId,
    bId: m.playerBId,
    seed: m.seed,
    status: resolved ? "RESOLVED" : "PENDING",
    de: !resolved && m.deState ? (JSON.parse(m.deState) as DeBoutState) : null, // devam eden eleme maçının birikmiş durumu
    result: resolved
      ? {
          scoreA: m.scoreA ?? 0,
          scoreB: m.scoreB ?? 0,
          winnerId: m.winnerId!,
          loserId: m.winnerId === m.playerAId ? m.playerBId! : m.playerAId!,
          log: m.log ? m.log.split("\n") : [],
          tacticA: asTactic(m.tacticA) ?? "BALANCED",
          tacticB: asTactic(m.tacticB) ?? "BALANCED",
          fatigueGain: 0, // geçmiş maçın yorgunluk katkısı zaten katılımcının `fatigue`ine yazıldı
        }
      : null,
  };
}

/** Kilit altında: `expectedStep` hâlâ geçerliyse bir sonraki adımı çözer ve yazar. Değilse (başka istek çözdü) dokunmaz. */
async function resolveNextStepTx(tx: Tx, tournamentId: number, expectedStep: number, locale?: Locale): Promise<boolean> {
  await lockTournament(tx, tournamentId);
  const t = await tx.tournament.findUnique({ where: { id: tournamentId } });
  if (!t || t.status !== "RUNNING" || !t.startsAt || !t.scopeKey || t.step !== expectedStep) return false;
  const step = t.step + 1;
  const dePeriods = dePeriodsOf(t.categoryId);

  const parts = await tx.tournamentParticipant.findMany({ where: { tournamentId } });
  const players = new Map(parts.map((p) => [p.playerId, toLivePlayer(p)]));
  const matchRows = await tx.match.findMany({ where: { tournamentId }, orderBy: { orderIndex: "asc" } });
  const matches = matchRows.map(toLiveMatch);
  const seedKey = liveSeedKey(t.scopeKey);
  const out = applyLiveStep(step, players, matches, {
    seedKey,
    deFormat: deFormat(t.categoryId.split("-")[0]),
    locale,
  });

  await writeStepOutcome(tx, t, out, matchRows.length, dePeriods);

  const moved = await tx.tournament.updateMany({
    where: { id: tournamentId, step: expectedStep, status: "RUNNING" },
    data: { step, ...(out.finished ? { status: "FINISHED" } : {}) },
  });
  if (moved.count !== 1) throw new Error("Turnuva adımı eşzamanlı değişti — işlem geri alındı");

  await tx.tournamentEvent.create({
    data: { tournamentId, type: "STEP", step, detail: stepSummary(out, dePeriods) },
  });
  if (out.finished && out.standings) {
    await applyLiveEffectsTx(tx, { ...t, seedKey }, out.standings);
    const champ = out.standings.find((s) => s.position === 1)?.playerId;
    await tx.tournamentEvent.create({ data: { tournamentId, type: "FINISH", step, detail: `şampiyon ${champ}` } });
  }
  return true;
}

function stepSummary(out: LiveStepOutcome, dePeriods: number): string {
  const s = liveStep(out.step, dePeriods);
  if (s.kind === "RESULTS") return `havuz sonuçları + eleme tablosu (${out.created.length} satır)`;
  if (s.kind === "POOL") return `havuz turu ${s.roundNo}: ${out.resolved.length} maç`;
  const played = out.resolved.length + out.periodUpdates.length;
  return `eleme turu ${s.roundNo} · periyot ${s.periodNo}: ${played} maç (${out.resolved.length} bitti)${out.finished ? " · final" : ""}`;
}

async function writeStepOutcome(
  tx: Tx,
  t: { id: number; startsAt: Date | null },
  out: LiveStepOutcome,
  existingMatchCount: number,
  dePeriods: number,
): Promise<void> {
  const tid = t.id;
  // NOT: Eskiden toplu `UPDATE ... FROM (VALUES ...)` ham SQL'di (Postgres'e özel: ::cast, v(...) kolon
  // adı, NOW()). Her canlı adımda yalnız birkaç satır değişir → Prisma tipli update'lere çevrildi:
  // tek kod yolu hem Postgres (prod) hem SQLite (yerel offline test) çalışır, performans farkı ihmal edilebilir.
  if (out.resolved.length) {
    for (const r of out.resolved) {
      await tx.match.updateMany({
        where: { tournamentId: tid, seed: r.seed, status: "PENDING" },
        data: {
          status: "RESOLVED",
          scoreA: r.result.scoreA,
          scoreB: r.result.scoreB,
          winnerId: r.result.winnerId,
          log: r.result.log.join("\n"),
          tacticA: r.result.tacticA,
          tacticB: r.result.tacticB,
          deState: null,
        },
      });
    }
  }
  if (out.periodUpdates.length) {
    // Eleme maçı sürüyor: birikmiş durum (deState) + o ana dek skor/log yazılır (status PENDING kalır → UI canlı akıtır).
    for (const u of out.periodUpdates) {
      await tx.match.updateMany({
        where: { tournamentId: tid, seed: u.seed, status: "PENDING" },
        data: { scoreA: u.de.scoreA, scoreB: u.de.scoreB, log: u.de.log.join("\n"), deState: JSON.stringify(u.de) },
      });
    }
  }
  if (out.players.length) {
    for (const p of out.players) {
      await tx.tournamentParticipant.updateMany({
        where: { tournamentId: tid, playerId: p.playerId },
        data: { fatigue: Math.round(p.fatigue), lastTactic: p.lastTactic, pendingTactic: null },
      });
    }
  }
  if (out.periodPlayers.length) {
    // Bir periyot oynadı ama maçı sürüyor: yorgunluk maç bitince; şimdilik yalnız bekleyen taktik tüketilir.
    for (const p of out.periodPlayers) {
      await tx.tournamentParticipant.updateMany({
        where: { tournamentId: tid, playerId: p.playerId },
        data: { lastTactic: p.lastTactic, pendingTactic: null },
      });
    }
  }
  if (out.poolStats && out.ranking) {
    const rankOf = new Map(out.ranking.map((r) => [r.playerId, r.seedRank]));
    for (const s of out.poolStats) {
      const sr = rankOf.get(s.playerId) ?? 0;
      await tx.tournamentParticipant.updateMany({
        where: { tournamentId: tid, playerId: s.playerId },
        data: {
          wins: s.wins,
          losses: s.losses,
          touchesScored: s.touchesScored,
          touchesReceived: s.touchesReceived,
          indicator: s.indicator,
          seedRank: sr,
          seed: sr,
        },
      });
    }
  }
  if (out.created.length && t.startsAt) {
    const size = 2 ** Math.max(...out.created.map((m) => m.roundNo)); // tur sayısı → tablo boyutu
    await tx.match.createMany({
      data: out.created.map((m, i) => ({
        tournamentId: tid,
        phase: "DE",
        round: deRoundLabel(size, m.roundNo),
        orderIndex: existingMatchCount + i,
        status: "PENDING",
        scheduledAt: stepAt(t.startsAt!, liveMatchStep(m, dePeriods), dePeriods),
        playerAId: m.aId,
        playerBId: m.bId,
        seed: m.seed,
        roundNo: m.roundNo,
        slot: m.slot,
      })),
    });
  }
  if (out.filled.length) {
    for (const f of out.filled) {
      await tx.match.updateMany({
        where: { tournamentId: tid, seed: f.seed, status: "PENDING" },
        data: { playerAId: f.aId, playerBId: f.bId },
      });
    }
  }
  if (out.standings) {
    for (const s of out.standings) {
      await tx.tournamentParticipant.updateMany({
        where: { tournamentId: tid, playerId: s.playerId },
        data: { finalPosition: s.position },
      });
    }
  }
}

// ——— Sonuç etkileri (finalde bir kez) ———

/**
 * Son adımda bir kez: herkesin turnuva yorgunluğu kalıcılaşır; insanlara ödül/keskinlik/psikoloji/
 * sakatlık/tecrübe, dereceye göre klasman puanı (tüm katılımcılar), kariyer en iyi sırası + başarılar.
 * (Eski `finalizeTournament`'ın etki kısmı — gün ilerletmez: her oyuncunun günü kendi akışında ilerler.)
 */
async function applyLiveEffectsTx(
  tx: Tx,
  t: { id: number; level: string; categoryId: string; quarter: number; name: string; date: Date; worldDay: number | null; seedKey: string; scopeKey: string | null },
  standings: { playerId: number; position: number }[],
): Promise<void> {
  const level = t.level as TournamentLevel;
  const fieldSize = standings.length;
  const parts = await tx.tournamentParticipant.findMany({ where: { tournamentId: t.id } });
  const posOf = new Map(standings.map((s) => [s.playerId, s.position]));

  for (const p of parts) {
    await tx.player.update({
      where: { id: p.playerId },
      data: { fatigue: clamp(p.fatigue ?? 0, 0, 100), updatedAt: new Date() },
    });
  }

  const humanParts = parts.filter((p) => (JSON.parse(p.snapshot ?? "{}") as { human?: boolean }).human);
  const humans = await tx.player.findMany({ where: { id: { in: humanParts.map((p) => p.playerId) } } });
  for (const h of humans) {
    const part = humanParts.find((p) => p.playerId === h.id)!;
    const snap = JSON.parse(part.snapshot ?? "{}") as { c?: Combatant };
    const position = posOf.get(h.id) ?? fieldSize;
    const finalFatigue = clamp(part.fatigue ?? h.fatigue, 0, 100);
    const injury = rollInjury(createRng(`${t.seedKey}:injury:${h.id}`), finalFatigue, snap.c?.age ?? 16);
    const post = psychAfterTournament(
      { morale: h.morale, motivation: h.motivation, confidence: h.confidence, stress: h.stress },
      position,
      fieldSize,
    );
    await tx.player.update({
      where: { id: h.id },
      data: {
        sharpness: applySharpness(h.sharpness, COMPETITION_SHARPNESS_GAIN),
        balance: { increment: prizeFor(level, position) },
        experience: { increment: experienceForTournament(position, level) },
        morale: post.morale,
        motivation: post.motivation,
        confidence: post.confidence,
        stress: post.stress,
        status: injury.injured ? "INJURED" : h.status,
        injuryDaysRemaining: injury.injured ? injury.days : 0,
      },
    });
  }

  // Ranking puanı → DOĞRU KAPSAMA: İl → ŞEHİR (CITY:<geo>), Ulusal → DOMESTIC, uluslararası → WORLD, Open → yok.
  // geo = scopeKey'in coğrafi parçası (İl'de "TR#Kocaeli"). Her kapsam KENDİ içinde sıralanır (ayrı scope satırı).
  const scope = rankingScopeForLevel(level, (t.scopeKey ?? "").split(":")[1] ?? "");
  let newRankById = new Map<number, number>();
  if (scope) {
    for (const s of standings) {
      const pts = rankingPointsForPosition(s.position, level);
      if (pts <= 0) continue; // puansız derece klasmanı şişirmesin
      await tx.ranking.upsert({
        where: { playerId_categoryId_quarter_scope: { playerId: s.playerId, categoryId: t.categoryId, quarter: t.quarter, scope } },
        create: { playerId: s.playerId, categoryId: t.categoryId, quarter: t.quarter, scope, points: pts },
        update: { points: { increment: pts } },
      });
    }
    const rankRows = await tx.ranking.findMany({ where: { categoryId: t.categoryId, quarter: t.quarter, scope } });
    const ranked = rankEntries(rankRows.map((r) => ({ playerId: r.playerId, points: r.points })));
    for (const r of ranked) {
      await tx.ranking.updateMany({
        where: { playerId: r.playerId, categoryId: t.categoryId, quarter: t.quarter, scope },
        data: { position: r.position, updatedAt: new Date() },
      });
    }
    newRankById = new Map(ranked.map((r) => [r.playerId, r.position]));
  }

  for (const h of humans) {
    const position = posOf.get(h.id) ?? fieldSize;
    const newRank = newRankById.get(h.id) ?? null;
    if (newRank != null && (h.careerBestRank == null || newRank < h.careerBestRank)) {
      await tx.player.update({ where: { id: h.id }, data: { careerBestRank: newRank } });
    }
    const earned = await tx.achievement.findMany({ where: { playerId: h.id }, select: { type: true } });
    const earnedUnique = new Set(earned.map((a) => a.type as AchievementType));
    for (const a of detectAchievements({ level, tournamentName: t.name, position, postRank: newRank, earnedUnique })) {
      await tx.achievement.create({
        data: {
          playerId: h.id,
          type: a.type,
          label: a.label,
          detail: a.detail,
          importance: a.importance,
          quarter: t.quarter,
          date: t.date,
          worldDay: t.worldDay, // kupa vitrini / zaman çizgisi tam tarihi (GORSEL §7)
        },
      });
    }
  }
}

// ——— Taktik gönderimi (Faz 2 + Faz 4 doğrulama/istek sınırı/kayıt) ———

export type TacticRejectReason = "invalid" | "not_participant" | "not_running" | "no_match" | "window_closed" | "rate_limited";
export type TacticSubmitResult = { ok: true; tactic: Tactic } | { ok: false; reason: TacticRejectReason };

/**
 * Oyuncunun SIRADAKİ maçı için taktik kaydeder (pencere = önceki adımın çözümünden bu adımın çözümüne
 * kadar). Doğrulama (GDD 23.57): geçerli taktik + turnuvanın katılımcısı + turnuva sürüyor + sıradaki
 * adımda kendi maçı var + pencere açık. İstek sınırı (23.58) ve her deneme olay kaydına (23.59) yazılır.
 */
export async function submitLiveTactic(
  tournamentId: number,
  playerId: number,
  tactic: string,
  nowMs: number = Date.now(),
): Promise<TacticSubmitResult> {
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) return { ok: false, reason: "invalid" };
  const valid = asTactic(tactic);
  // Önce "şimdi"ye kadar ilerlet: zamanı gelmiş tur henüz kimse bakmadığı için çözülmediyse, gönderim
  // kapanmış pencereye değil yeni açılan pencereye (sıradaki maça) değerlendirilsin.
  await tickLiveTournament(tournamentId, { nowMs });
  return prisma.$transaction(async (tx) => {
    await lockTournament(tx, tournamentId);
    const t = await tx.tournament.findUnique({ where: { id: tournamentId }, select: { status: true, step: true, startsAt: true, categoryId: true } });
    if (!t || !t.startsAt) return { ok: false as const, reason: "invalid" as const };
    const dePeriods = dePeriodsOf(t.categoryId);
    const reject = async (reason: TacticRejectReason, step: number | null = null) => {
      await tx.tournamentEvent.create({ data: { tournamentId, playerId, type: "TACTIC_REJECTED", step, detail: reason } });
      return { ok: false as const, reason };
    };
    const recent = await tx.tournamentEvent.count({
      where: { tournamentId, playerId, type: { in: ["TACTIC", "TACTIC_REJECTED"] }, createdAt: { gte: new Date(nowMs - 60_000) } },
    });
    if (recent >= TACTIC_RATE_LIMIT) return { ok: false as const, reason: "rate_limited" as const };
    if (!valid) return reject("invalid");
    const part = await tx.tournamentParticipant.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId } },
      select: { id: true },
    });
    if (!part) return reject("not_participant");
    if (t.status !== "RUNNING") return reject("not_running");
    const next = t.step + 1;
    // Pencere, adımın ÇÖZÜMÜNDE değil, (elemede) periyodun OYNANMAYA başladığı an kapanır — periyot arası taktik.
    if (windowCloseAt(t.startsAt, next, dePeriods).getTime() <= nowMs) return reject("window_closed", next);
    const s = liveStep(next, dePeriods);
    if (s.kind === "RESULTS") return reject("no_match", next);
    // Sıradaki adım bu oyuncunun maçının (bu turdaki, henüz bitmemiş) periyodu mu? PENDING = maç sürüyor.
    const match = await tx.match.findFirst({
      where: {
        tournamentId,
        status: "PENDING",
        phase: s.kind,
        roundNo: s.roundNo,
        OR: [{ playerAId: playerId }, { playerBId: playerId }],
      },
      select: { id: true },
    });
    if (!match) return reject("no_match", next);
    await tx.tournamentParticipant.update({ where: { id: part.id }, data: { pendingTactic: valid } });
    await tx.tournamentEvent.create({ data: { tournamentId, playerId, type: "TACTIC", step: next, detail: valid } });
    return { ok: true as const, tactic: valid };
  }, TX_OPTS);
}

// ——— Canlı görünüm (sayfa için) ———

export interface LiveYouDTO {
  eliminated: boolean;
  nextMatch: { opponentId: number | null; round: string; phase: "POOL" | "DE"; step: number; at: string; periodNo: number | null } | null;
  windowOpen: boolean; // sıradaki adımda kendi maçın/periyodun var ve pencere kapanmadı
  windowClosesAt: string | null;
  windowPeriodNo: number | null; // elemede: pencerenin ait olduğu periyot (1 = maç başı taktiği)
  effectiveTactic: Tactic; // şu an bırakırsan bu taktikle oynarsın
  pendingSet: boolean;
  registeredTactic: Tactic | null;
}

export interface LiveViewDTO {
  status: "RUNNING" | "FINISHED";
  step: number;
  totalSteps: number | null; // eleme tablosu belli olunca (sonuç adımından sonra)
  next: { step: number; kind: "POOL" | "RESULTS" | "DE"; roundNo: number | null; periodNo: number | null; at: string } | null;
  startsAt: string;
  serverNow: string;
  you: LiveYouDTO | null;
}

/** Sayfanın canlı paneli için durum. `viewerPlayerId` katılımcı değilse `you` null (izleyici). */
export async function getLiveView(tournamentId: number, viewerPlayerId: number | null, nowMs: number = Date.now()): Promise<LiveViewDTO | null> {
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true, step: true, startsAt: true, categoryId: true, _count: { select: { participants: true } } },
  });
  if (!t || !t.startsAt) return null;
  const dePeriods = dePeriodsOf(t.categoryId);
  const running = t.status === "RUNNING";
  const deRounds = t.step >= LIVE_RESULTS_STEP ? Math.log2(bracketSize(t._count.participants)) : null;
  const nextStep = t.step + 1;
  const ns = running ? liveStep(nextStep, dePeriods) : null;
  const view: LiveViewDTO = {
    status: running ? "RUNNING" : "FINISHED",
    step: t.step,
    totalSteps: deRounds != null ? LIVE_RESULTS_STEP + deRounds * dePeriods : null,
    next: ns
      ? {
          step: nextStep,
          kind: ns.kind,
          roundNo: ns.kind === "RESULTS" ? null : ns.roundNo,
          periodNo: ns.kind === "DE" ? ns.periodNo : null,
          at: stepAt(t.startsAt, nextStep, dePeriods).toISOString(),
        }
      : null,
    startsAt: t.startsAt.toISOString(),
    serverNow: new Date(nowMs).toISOString(),
    you: null,
  };
  if (viewerPlayerId == null) return view;
  const part = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_playerId: { tournamentId, playerId: viewerPlayerId } },
  });
  if (!part) return view;

  const myMatches = await prisma.match.findMany({
    where: { tournamentId, OR: [{ playerAId: viewerPlayerId }, { playerBId: viewerPlayerId }] },
    orderBy: { orderIndex: "asc" },
  });
  // Sıradaki maç/periyot: her bekleyen maç için BİR SONRAKİ periyot adımı; en erkeni oyuncunun sırası.
  const pending = myMatches
    .filter((m) => m.status === "PENDING" && m.roundNo != null)
    .map((m) => ({ m, step: matchNextStep(m, dePeriods) }))
    .sort((a, b) => a.step - b.step)[0];
  const lostDe = myMatches.some((m) => m.phase === "DE" && m.status === "RESOLVED" && m.winnerId != null && m.winnerId !== viewerPlayerId);
  const live = toLivePlayer(part);
  // Pencere açık = sıradaki tur adımı tam da oyuncunun bekleyen periyodu ve o periyot henüz oynanmaya başlamadı.
  const windowOpen = running && pending != null && pending.step === nextStep && windowCloseAt(t.startsAt, nextStep, dePeriods).getTime() > nowMs;
  const periodNoOf = (st: number) => {
    const s = liveStep(st, dePeriods);
    return s.kind === "DE" ? s.periodNo : null;
  };
  view.you = {
    eliminated: lostDe,
    nextMatch: pending
      ? {
          opponentId: pending.m.playerAId === viewerPlayerId ? pending.m.playerBId : pending.m.playerAId,
          round: pending.m.round,
          phase: pending.m.phase === "POOL" ? "POOL" : "DE",
          step: pending.step,
          at: stepAt(t.startsAt, pending.step, dePeriods).toISOString(),
          periodNo: periodNoOf(pending.step),
        }
      : null,
    windowOpen,
    windowClosesAt: windowOpen ? windowCloseAt(t.startsAt, nextStep, dePeriods).toISOString() : null,
    windowPeriodNo: windowOpen ? periodNoOf(nextStep) : null,
    effectiveTactic: effectiveTactic(live),
    pendingSet: live.pendingTactic != null,
    registeredTactic: live.registeredTactic,
  };
  return view;
}
