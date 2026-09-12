/**
 * Career Service — Data Service katmanı (GDD 22.64: Engine → Data Service → Database).
 *
 * Saf engine'leri (src/engine/*) veritabanına bağlar: veriyi yükler, engine fonksiyonunu
 * düz veriyle çağırır, sonucu kalıcılaştırır. Kritik hesap sunucuda (güvenlik). M1 dikey
 * dilim akışı: kariyer oluştur → gün/antrenman → turnuva → ranking.
 */
import { prisma } from "@/db";
import {
  clamp,
  formatPlayerCode,
  roundSkill,
  TOURNAMENT_LABEL_TR,
  type Gender,
  type TournamentLevel,
  type Weapon,
} from "@/engine/domain";
import { createRng } from "@/engine/probability";
import {
  SKILLS,
  generateStartingSkills,
  overall,
  type PlayerSkills,
  type SkillValue,
} from "@/engine/skill";
import {
  applyTraining,
  TRAINING_LABEL_TR,
  type TrainingType,
} from "@/engine/training";
import { createPlayerSchema, deriveIdentity, generateAiOpponents } from "@/engine/player";
import type { Combatant } from "@/engine/combat";
import { simulateTournament } from "@/engine/tournament";
import { rankEntries, rankingPointsForPosition } from "@/engine/ranking";
import {
  eventsForWeek,
  qualificationLabel,
  qualifies,
  quarterOf,
  weekInQuarter,
} from "@/engine/season";

/** Oyun başlangıç tarihi (deterministik referans). */
const GAME_START = new Date("2026-01-01T00:00:00.000Z");
const AI_DAILY_RECOVERY = 12;
const AI_COUNT = 23; // kategoriyi dolduran AI havuzu → insanla birlikte 24 kişilik alan
const POOL_SIZE = 6;

// ---------- yardımcılar ----------

interface SkillRow {
  key: string;
  current: number;
  potential: number;
  floor: number;
  ceiling: number;
}

function rowsToSkills(rows: readonly SkillRow[]): PlayerSkills {
  const map = {} as PlayerSkills;
  for (const r of rows) {
    (map as Record<string, SkillValue>)[r.key] = {
      current: r.current,
      potential: r.potential,
      floor: r.floor,
      ceiling: r.ceiling,
    };
  }
  return map;
}

function skillCreateData(skills: PlayerSkills) {
  return SKILLS.map((def) => ({
    key: def.key,
    category: def.category,
    current: skills[def.key].current,
    potential: skills[def.key].potential,
    floor: skills[def.key].floor,
    ceiling: skills[def.key].ceiling,
  }));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function ensureCountry(code: string, name: string): Promise<number> {
  const existing = await prisma.country.findUnique({ where: { code } });
  if (existing) return existing.id;
  const created = await prisma.country.create({ data: { code, name } });
  return created.id;
}

/**
 * Kariyerin sabit kimliği (yaş kategorisi + categoryId), başlangıç anına göre.
 * M4 basitleştirmesi: kategori quarter geçişiyle değişmez (U17→U21 ilerlemesi + dünya
 * yeniden-üretimi M7'de). Yaş her quarter +1 gösterilir ama rekabet kategorisi sabit kalır.
 */
function baseIdentity(human: { gender: string; weapon: string; birthDate: Date }) {
  return deriveIdentity(
    { gender: human.gender as Gender, weapon: human.weapon as Weapon, birthDate: human.birthDate },
    GAME_START,
  );
}

// ---------- DTO'lar ----------

export interface WeekEventDTO {
  level: TournamentLevel;
  label: string;
  qualified: boolean;
  requirement: string; // katılım kuralı (kilit sebebi)
}

export interface CareerDTO {
  humanPlayerId: number;
  code: string;
  name: string;
  gender: string;
  weapon: string;
  age: number;
  categoryId: string;
  status: string;
  fatigue: number;
  currentDate: string;
  quarter: number;
  week: number; // quarter içindeki hafta (1..12)
  nationalTeam: boolean; // Quarter Ranking ilk 4 (GDD 17.32)
  overall: number;
  skills: { key: string; label: string; category: string; current: number; potential: number }[];
  ranking: { playerId: number; name: string; points: number; position: number; isHuman: boolean }[];
  weekEvents: WeekEventDTO[];
}

// ---------- işlemler ----------

/** Aktif kariyer var mı? (M1: tek kariyer) */
export async function hasCareer(): Promise<boolean> {
  return (await prisma.gameState.count()) > 0;
}

/**
 * Yeni kariyer oluşturur: insan oyuncu + skill'leri + kategoriyi dolduran AI havuzu + GameState.
 * Girdi Zod ile doğrulanır (GDD 7.27). Tümü tek transaction (GDD 22.50).
 */
export async function createCareer(input: unknown): Promise<{ humanPlayerId: number }> {
  const data = createPlayerSchema.parse(input); // geçersizse fırlatır
  const identity = deriveIdentity(data, GAME_START);
  const seed = globalThis.crypto.randomUUID();
  const countryId = await ensureCountry("TR", "Türkiye");

  const humanSkills = generateStartingSkills(createRng(`${seed}:human`), {
    age: identity.age,
    profile: data.profile,
  });

  const aiSpecs = generateAiOpponents(createRng(`${seed}:world`), {
    count: AI_COUNT,
    gender: data.gender,
    weapon: data.weapon,
    ageCategory: identity.ageCategory,
    gameDate: GAME_START,
  });

  const humanPlayerId = await prisma.$transaction(async (tx) => {
    const human = await tx.player.create({
      data: {
        code: "P-TEMP",
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        birthDate: data.birthDate,
        weapon: data.weapon,
        profile: data.profile,
        nationalityId: countryId,
        isAI: false,
        careerStartDate: GAME_START,
        skills: { create: skillCreateData(humanSkills) },
      },
    });
    // Player ID kodunu gerçek id'den üret (GDD 7.4).
    await tx.player.update({
      where: { id: human.id },
      data: { code: formatPlayerCode(human.id) },
    });

    for (const spec of aiSpecs) {
      const ai = await tx.player.create({
        data: {
          code: "P-TEMP",
          firstName: spec.firstName,
          lastName: spec.lastName,
          gender: spec.gender,
          birthDate: spec.birthDate,
          weapon: spec.weapon,
          profile: spec.profile,
          nationalityId: countryId,
          isAI: true,
          careerStartDate: GAME_START,
          skills: { create: skillCreateData(spec.skills) },
        },
      });
      await tx.player.update({
        where: { id: ai.id },
        data: { code: formatPlayerCode(ai.id) },
      });
    }

    await tx.gameState.create({
      data: { humanPlayerId: human.id, seed, currentDate: GAME_START },
    });
    return human.id;
  });

  return { humanPlayerId };
}

async function loadState() {
  const gs = await prisma.gameState.findFirst();
  if (!gs) return null;
  const human = await prisma.player.findUnique({
    where: { id: gs.humanPlayerId },
    include: { skills: true },
  });
  if (!human) return null;
  return { gs, human };
}

/** Aktif kariyerin tam durumunu döndürür (UI için). */
export async function getCareer(): Promise<CareerDTO | null> {
  const state = await loadState();
  if (!state) return null;
  const { gs, human } = state;

  const skills = rowsToSkills(human.skills);
  const quarter = quarterOf(gs.weekIndex);
  const week = weekInQuarter(gs.weekIndex);
  const base = baseIdentity(human);
  const categoryId = base.categoryId;
  const age = base.age + (quarter - 1); // 1 quarter = 1 oyun yılı (GDD 17.5)

  const ranking = await buildRankingView(categoryId, quarter, human.id);
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  const nationalTeam = humanRank != null && humanRank <= 4;
  const weekEvents = eventsForWeek(week).map(
    (e): WeekEventDTO => ({
      level: e.level,
      label: TOURNAMENT_LABEL_TR[e.level],
      qualified: qualifies(e.qualification, humanRank),
      requirement: qualificationLabel(e.qualification),
    }),
  );

  return {
    humanPlayerId: human.id,
    code: human.code,
    name: `${human.firstName} ${human.lastName}`,
    gender: human.gender,
    weapon: human.weapon,
    age,
    categoryId,
    status: human.status,
    fatigue: roundSkill(human.fatigue),
    currentDate: gs.currentDate.toISOString(),
    quarter,
    week,
    nationalTeam,
    overall: roundSkill(overall(skills)),
    skills: SKILLS.map((def) => ({
      key: def.key,
      label: def.label,
      category: def.category,
      current: roundSkill(skills[def.key].current),
      potential: roundSkill(skills[def.key].potential),
    })),
    ranking,
    weekEvents,
  };
}

async function buildRankingView(categoryId: string, quarter: number, humanId: number) {
  const rows = await prisma.ranking.findMany({
    where: { categoryId, quarter },
    orderBy: [{ points: "desc" }, { playerId: "asc" }],
  });
  const players = await prisma.player.findMany({
    where: { id: { in: rows.map((r) => r.playerId) } },
  });
  const nameById = new Map(players.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  return rows.map((r, i) => ({
    playerId: r.playerId,
    name: nameById.get(r.playerId) ?? formatPlayerCode(r.playerId),
    points: roundSkill(r.points),
    position: r.position ?? i + 1,
    isHuman: r.playerId === humanId,
  }));
}

export interface TrainingSummaryDTO {
  type: TrainingType;
  label: string;
  gains: { label: string; delta: number }[];
  fatigue: number;
  currentDate: string;
}

/** Bir haftalık antrenman uygular ve haftayı ilerletir (GDD 17: hafta temelli zaman). */
export async function trainWeek(type: TrainingType): Promise<TrainingSummaryDTO> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;

  const quarter = quarterOf(gs.weekIndex);
  const skills = rowsToSkills(human.skills);
  const age = baseIdentity(human).age + (quarter - 1);
  const result = applyTraining(skills, { type, age, currentFatigue: human.fatigue });
  const newFatigue = clamp(human.fatigue + result.fatigueDelta, 0, 100);
  const nextDate = addDays(gs.currentDate, 7);

  const labelByKey = new Map<string, string>(SKILLS.map((s) => [s.key, s.label]));

  await prisma.$transaction(async (tx) => {
    for (const key of Object.keys(result.gains)) {
      await tx.playerSkill.update({
        where: { playerId_key: { playerId: human.id, key } },
        data: { current: result.skills[key as keyof PlayerSkills].current },
      });
    }
    await tx.player.update({ where: { id: human.id }, data: { fatigue: newFatigue } });
    // AI dünyası pasif toparlanır (tam dünya simülasyonu M7).
    await tx.player.updateMany({
      where: { isAI: true, fatigue: { gt: 0 } },
      data: { fatigue: { decrement: AI_DAILY_RECOVERY } },
    });
    await tx.player.updateMany({ where: { isAI: true, fatigue: { lt: 0 } }, data: { fatigue: 0 } });
    await tx.gameState.update({
      where: { id: gs.id },
      data: { currentDate: nextDate, weekIndex: gs.weekIndex + 1 },
    });
  });

  return {
    type,
    label: TRAINING_LABEL_TR[type],
    gains: Object.entries(result.gains).map(([key, delta]) => ({
      label: labelByKey.get(key) ?? key,
      delta: delta ?? 0,
    })),
    fatigue: roundSkill(newFatigue),
    currentDate: nextDate.toISOString(),
  };
}

/** Kaydedilmiş bir turnuvayı id ile yükler (sonuç ekranı için). */
export async function getTournament(id: number): Promise<TournamentResultDTO | null> {
  const t = await prisma.tournament.findUnique({
    where: { id },
    include: {
      participants: { include: { player: true } },
      matches: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!t) return null;
  const gs = await prisma.gameState.findFirst();
  const humanId = gs?.humanPlayerId ?? -1;
  const fieldSize = t.participants.length;

  const nameById = new Map(
    t.participants.map((p) => [p.playerId, `${p.player.firstName} ${p.player.lastName}`]),
  );
  const sortedParticipants = [...t.participants].sort(
    (a, b) => (a.finalPosition ?? 999) - (b.finalPosition ?? 999),
  );
  const champion = sortedParticipants.find((p) => p.finalPosition === 1);
  const you = t.participants.find((p) => p.playerId === humanId);

  return {
    tournamentId: t.id,
    name: t.name,
    level: t.level,
    categoryId: t.categoryId,
    yourPosition: you?.finalPosition ?? fieldSize,
    yourSeedRank: you?.seedRank ?? null,
    championName: champion ? (nameById.get(champion.playerId) ?? "?") : "?",
    pools: buildPoolsView(t.participants, nameById, humanId),
    standings: sortedParticipants.map((p) => ({
      position: p.finalPosition ?? fieldSize,
      name: nameById.get(p.playerId) ?? formatPlayerCode(p.playerId),
      isHuman: p.playerId === humanId,
    })),
    matches: t.matches.map((m) => ({
      phase: m.phase,
      round: m.round,
      aName: nameById.get(m.playerAId) ?? formatPlayerCode(m.playerAId),
      bName: nameById.get(m.playerBId) ?? formatPlayerCode(m.playerBId),
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      log: m.log.split("\n"),
    })),
    currentDate: (gs?.currentDate ?? t.date).toISOString(),
  };
}

/** Mevcut kariyeri ve tüm dünya verisini siler (yeni kariyer için). M1: tek kariyer. */
export async function resetCareer(): Promise<void> {
  await prisma.$transaction([
    prisma.match.deleteMany(),
    prisma.tournamentParticipant.deleteMany(),
    prisma.tournament.deleteMany(),
    prisma.ranking.deleteMany(),
    prisma.playerSkill.deleteMany(),
    prisma.gameState.deleteMany(),
    prisma.player.deleteMany(),
  ]);
}

export interface PoolViewDTO {
  poolNumber: number;
  players: { name: string; wins: number; losses: number; indicator: number; isHuman: boolean }[];
}

export interface TournamentResultDTO {
  tournamentId: number;
  name: string;
  level: string;
  categoryId: string;
  yourPosition: number;
  yourSeedRank: number | null;
  championName: string;
  pools: PoolViewDTO[];
  standings: { position: number; name: string; isHuman: boolean }[];
  matches: {
    phase: string;
    round: string;
    aName: string;
    bName: string;
    scoreA: number;
    scoreB: number;
    log: string[];
  }[];
  currentDate: string;
}

/** Katılımcı satırlarından havuz görünümü kurar (id ile yükleme ve canlı sonuç ortak kullanır). */
function buildPoolsView(
  participants: readonly {
    playerId: number;
    poolNumber: number | null;
    wins: number | null;
    losses: number | null;
    indicator: number | null;
  }[],
  nameById: Map<number, string>,
  humanId: number,
): PoolViewDTO[] {
  const byPool = new Map<number, PoolViewDTO>();
  for (const p of participants) {
    if (p.poolNumber == null) continue;
    if (!byPool.has(p.poolNumber)) byPool.set(p.poolNumber, { poolNumber: p.poolNumber, players: [] });
    byPool.get(p.poolNumber)!.players.push({
      name: nameById.get(p.playerId) ?? formatPlayerCode(p.playerId),
      wins: p.wins ?? 0,
      losses: p.losses ?? 0,
      indicator: p.indicator ?? 0,
      isHuman: p.playerId === humanId,
    });
  }
  const pools = [...byPool.values()].sort((a, b) => a.poolNumber - b.poolNumber);
  for (const pool of pools) {
    pool.players.sort((a, b) => b.wins - a.wins || b.indicator - a.indicator);
  }
  return pools;
}

/**
 * Kategori turnuvasını çalıştırır (havuz + eleme), sonuçları ve ranking'i kalıcılaştırır.
 * `level`: İl/Open/Türkiye — puan tablosunu ve prestiji belirler (GDD 17.80–17.88).
 */
export async function runTournament(
  level: TournamentLevel = "OPEN",
): Promise<TournamentResultDTO> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;

  const quarter = quarterOf(gs.weekIndex);
  const week = weekInQuarter(gs.weekIndex);
  const base = baseIdentity(human);
  const categoryId = base.categoryId;

  // Takvim + uygunluk kapısı (GDD 17.19–17.34): bu hafta düzenleniyor mu, hakkın var mı?
  const scheduled = eventsForWeek(week).find((e) => e.level === level);
  if (!scheduled) throw new Error("Bu hafta bu turnuva düzenlenmiyor.");
  const preRanking = await buildRankingView(categoryId, quarter, human.id);
  const humanRank = preRanking.find((r) => r.isHuman)?.position ?? null;
  if (!qualifies(scheduled.qualification, humanRank)) {
    throw new Error(`Katılım hakkın yok — ${qualificationLabel(scheduled.qualification)}.`);
  }

  const aiPlayers = await prisma.player.findMany({
    where: { isAI: true, gender: human.gender, weapon: human.weapon },
    include: { skills: true },
    take: AI_COUNT,
  });

  const nameById = new Map<number, string>();
  const toCombatant = (p: {
    id: number;
    firstName: string;
    lastName: string;
    weapon: string;
    fatigue: number;
    skills: SkillRow[];
  }): Combatant => {
    const name = `${p.firstName} ${p.lastName}`;
    nameById.set(p.id, name);
    return { id: p.id, name, weapon: p.weapon as Weapon, skills: rowsToSkills(p.skills), fatigue: p.fatigue };
  };

  const combatants: Combatant[] = [toCombatant(human), ...aiPlayers.map(toCombatant)];
  if (combatants.length < 2) throw new Error("Turnuva için yeterli rakip yok.");

  const dateKey = gs.currentDate.toISOString().slice(0, 10);
  const seedKey = `${gs.seed}:tournament:${level}:${dateKey}`;
  const rng = createRng(seedKey);
  const outcome = simulateTournament(combatants, rng, { poolSize: POOL_SIZE });

  const positionByPlayer = new Map(outcome.standings.map((s) => [s.playerId, s.position]));
  const seedByPlayer = new Map(outcome.ranking.map((r) => [r.playerId, r.seedRank]));
  const poolByPlayer = new Map(outcome.pools.map((p) => [p.playerId, p]));
  const nextDate = addDays(gs.currentDate, 7);
  const tournamentName = `${base.ageCategory} ${TOURNAMENT_LABEL_TR[level]}`;

  const tournamentId = await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({
      data: { name: tournamentName, categoryId, level, quarter, week, date: gs.currentDate, status: "FINISHED" },
    });

    for (const c of combatants) {
      const pool = poolByPlayer.get(c.id);
      await tx.tournamentParticipant.create({
        data: {
          tournamentId: tournament.id,
          playerId: c.id,
          seed: seedByPlayer.get(c.id) ?? 0,
          seedRank: seedByPlayer.get(c.id) ?? null,
          finalPosition: positionByPlayer.get(c.id) ?? null,
          poolNumber: pool?.poolNumber ?? null,
          wins: pool?.wins ?? null,
          losses: pool?.losses ?? null,
          touchesScored: pool?.touchesScored ?? null,
          touchesReceived: pool?.touchesReceived ?? null,
          indicator: pool?.indicator ?? null,
        },
      });
    }

    for (let i = 0; i < outcome.matches.length; i++) {
      const m = outcome.matches[i];
      await tx.match.create({
        data: {
          tournamentId: tournament.id,
          phase: m.phase,
          round: m.round,
          orderIndex: i,
          playerAId: m.aId,
          playerBId: m.bId,
          scoreA: m.scoreA,
          scoreB: m.scoreB,
          winnerId: m.winnerId,
          seed: seedKey,
          log: m.log.join("\n"),
        },
      });
    }

    // Yorgunlukları kalıcılaştır (turlar arası birikim, GDD 18.37).
    for (const c of combatants) {
      await tx.player.update({
        where: { id: c.id },
        data: { fatigue: clamp(outcome.finalFatigue[c.id] ?? c.fatigue, 0, 100) },
      });
    }

    // Ranking puanı (seviyeye göre) ekle ve pozisyonları yeniden hesapla (GDD 19.29).
    for (const s of outcome.standings) {
      const pts = rankingPointsForPosition(s.position, level);
      if (pts <= 0) continue; // puansız derece Ranking'i şişirmesin
      await tx.ranking.upsert({
        where: { playerId_categoryId_quarter: { playerId: s.playerId, categoryId, quarter } },
        create: { playerId: s.playerId, categoryId, quarter, points: pts },
        update: { points: { increment: pts } },
      });
    }
    const rankRows = await tx.ranking.findMany({ where: { categoryId, quarter } });
    const ranked = rankEntries(rankRows.map((r) => ({ playerId: r.playerId, points: r.points })));
    for (const r of ranked) {
      await tx.ranking.update({
        where: { playerId_categoryId_quarter: { playerId: r.playerId, categoryId, quarter } },
        data: { position: r.position },
      });
    }

    await tx.gameState.update({
      where: { id: gs.id },
      data: { currentDate: nextDate, weekIndex: gs.weekIndex + 1 },
    });
    return tournament.id;
  });

  return {
    tournamentId,
    name: tournamentName,
    level,
    categoryId,
    yourPosition: positionByPlayer.get(human.id) ?? combatants.length,
    yourSeedRank: seedByPlayer.get(human.id) ?? null,
    championName: nameById.get(outcome.championId) ?? "?",
    pools: buildPoolsView(
      outcome.pools.map((p) => ({
        playerId: p.playerId,
        poolNumber: p.poolNumber,
        wins: p.wins,
        losses: p.losses,
        indicator: p.indicator,
      })),
      nameById,
      human.id,
    ),
    standings: outcome.standings.map((s) => ({
      position: s.position,
      name: nameById.get(s.playerId) ?? formatPlayerCode(s.playerId),
      isHuman: s.playerId === human.id,
    })),
    matches: outcome.matches.map((m) => ({
      phase: m.phase,
      round: m.round,
      aName: m.aName,
      bName: m.bName,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      log: m.log,
    })),
    currentDate: nextDate.toISOString(),
  };
}
