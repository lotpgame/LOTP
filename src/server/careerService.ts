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
  type SkillCategory,
  type TournamentLevel,
  type Weapon,
} from "@/engine/domain";
import { createRng } from "@/engine/probability";
import {
  SKILLS,
  generateStartingSkills,
  growSkill,
  overall,
  type PlayerSkills,
  type SkillKey,
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
import {
  COMPETITION_SHARPNESS_GAIN,
  applySharpness,
  rollInjury,
  sessionSharpnessDelta,
} from "@/engine/conditioning";
import {
  generateTraits,
  traitCombatModifier,
  traitLabels,
  traitTrainingMultiplier,
  type TraitKey,
} from "@/engine/trait";
import {
  afterTournament as psychAfterTournament,
  afterTrainingWeek as psychAfterTrainingWeek,
  psychologyCombatModifier,
  psychologyTrainingMultiplier,
  type Psychology,
} from "@/engine/psychology";
import {
  MAX_EQUIPMENT_LEVEL,
  STARTING_BALANCE,
  equipmentUpgradeCost,
  prizeFor,
} from "@/engine/economy";
import {
  clubTrainingMultiplier,
  coachTrainingMultiplier,
  equipmentCombatModifier,
  equipmentTrainingMultiplier,
} from "@/engine/environment";
import { detectAchievements, type AchievementType } from "@/engine/memory";

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
  sharpness: number;
  injured: boolean;
  injuryWeeksRemaining: number;
  currentDate: string;
  quarter: number;
  week: number; // quarter içindeki hafta (1..12)
  nationalTeam: boolean; // Quarter Ranking ilk 4 (GDD 17.32)
  overall: number;
  // Gelişim çevresi (M6)
  traits: string[]; // Türkçe etiketler
  psychology: { morale: number; motivation: number; confidence: number; stress: number };
  club: { name: string; city: string; facility: number; coachName: string; coachSkill: number; coachSpecialty: string } | null;
  equipmentLevel: number;
  balance: number;
  equipmentUpgradeCost: number;
  canUpgradeEquipment: boolean;
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

  // Trait + kulüp/koç (GDD 10, 12, 13) — deterministik.
  const traits = generateTraits(createRng(`${seed}:traits`), 2);
  const clubRng = createRng(`${seed}:club`);
  const cities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"];
  const specialties: SkillCategory[] = ["TECHNICAL", "PHYSICAL", "MENTAL", "TACTICAL"];
  const city = clubRng.pick(cities);
  const clubData = {
    name: `${city} Eskrim Kulübü`,
    city,
    facility: clubRng.int(45, 85),
    coachName: `${clubRng.pick(["Ahmet", "Kemal", "Selim", "Hasan", "Murat"])} Hoca`,
    coachSkill: clubRng.int(45, 85),
    coachSpecialty: clubRng.pick(specialties),
  };

  const humanPlayerId = await prisma.$transaction(async (tx) => {
    const club = await tx.club.create({ data: clubData });
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
        traits: traits.join(","),
        balance: STARTING_BALANCE,
        clubId: club.id,
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
    include: { skills: true, club: true },
  });
  if (!human) return null;
  return { gs, human };
}

function parseTraits(csv: string): TraitKey[] {
  return csv ? (csv.split(",").filter(Boolean) as TraitKey[]) : [];
}

function psychologyOf(p: {
  morale: number;
  motivation: number;
  confidence: number;
  stress: number;
}): Psychology {
  return { morale: p.morale, motivation: p.motivation, confidence: p.confidence, stress: p.stress };
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
  const injured = human.injuryWeeksRemaining > 0;
  const weekEvents = eventsForWeek(week).map(
    (e): WeekEventDTO => ({
      level: e.level,
      label: TOURNAMENT_LABEL_TR[e.level],
      qualified: !injured && qualifies(e.qualification, humanRank),
      requirement: injured ? "Sakat — dinlen" : qualificationLabel(e.qualification),
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
    sharpness: roundSkill(human.sharpness),
    injured,
    injuryWeeksRemaining: human.injuryWeeksRemaining,
    currentDate: gs.currentDate.toISOString(),
    quarter,
    week,
    nationalTeam,
    overall: roundSkill(overall(skills)),
    traits: traitLabels(parseTraits(human.traits)),
    psychology: {
      morale: roundSkill(human.morale),
      motivation: roundSkill(human.motivation),
      confidence: roundSkill(human.confidence),
      stress: roundSkill(human.stress),
    },
    club: human.club
      ? {
          name: human.club.name,
          city: human.club.city,
          facility: human.club.facility,
          coachName: human.club.coachName,
          coachSkill: human.club.coachSkill,
          coachSpecialty: human.club.coachSpecialty,
        }
      : null,
    equipmentLevel: human.equipmentLevel,
    balance: roundSkill(human.balance),
    equipmentUpgradeCost: equipmentUpgradeCost(human.equipmentLevel),
    canUpgradeEquipment:
      human.equipmentLevel < MAX_EQUIPMENT_LEVEL &&
      human.balance >= equipmentUpgradeCost(human.equipmentLevel),
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

export interface WeekSummaryDTO {
  sessions: string[]; // seansların etiketleri
  gains: { label: string; delta: number }[];
  fatigue: number;
  sharpness: number;
  injured: boolean;
  injuryWeeksRemaining: number;
  currentDate: string;
}

const REST_RECOVERY = 30; // dinlenme haftası yorgunluk azalışı

/** AI dünyasını + günü ilerleten ortak hafta-sonu işlemleri (tx içinde). */
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Hafta ilerletme + canlı dünya (GDD 2.17–2.18): AI oyuncular pasif toparlanır ve her hafta
 * hafifçe gelişir (özerk antrenman) → rekabet zamanla sertleşir. Deterministik (seed).
 */
async function advanceWeekTx(tx: Tx, gs: { id: number; currentDate: Date; weekIndex: number }, seed: string) {
  await tx.player.updateMany({
    where: { isAI: true, fatigue: { gt: 0 } },
    data: { fatigue: { decrement: AI_DAILY_RECOVERY } },
  });
  await tx.player.updateMany({ where: { isAI: true, fatigue: { lt: 0 } }, data: { fatigue: 0 } });

  // AI dünyası gelişir: her AI'nın rastgele bir skill'i azalan verimle biraz artar.
  const ais = await tx.player.findMany({ where: { isAI: true }, include: { skills: true } });
  for (const ai of ais) {
    if (ai.skills.length === 0) continue;
    const rng = createRng(`${seed}:aidev:${ai.id}:${gs.weekIndex}`);
    const row = rng.pick(ai.skills);
    const grown = growSkill(
      { current: row.current, potential: row.potential, floor: row.floor, ceiling: row.ceiling },
      0.4,
      1,
    );
    if (grown.current !== row.current) {
      await tx.playerSkill.update({
        where: { playerId_key: { playerId: ai.id, key: row.key } },
        data: { current: grown.current },
      });
    }
  }

  await tx.gameState.update({
    where: { id: gs.id },
    data: { currentDate: addDays(gs.currentDate, 7), weekIndex: gs.weekIndex + 1 },
  });
}

/**
 * Haftalık antrenman planını uygular (GDD 6: sabah/öğlen/akşam → haftalık 3 seans). Seanslar
 * sırayla işlenir; yorgunluk biriktikçe verim düşer (GDD 14.33). Keskinlik güncellenir, hafta
 * sonunda sakatlık kontrolü yapılır (GDD 14.37). Sakat oyuncu antrenman yapamaz (restWeek).
 */
export async function playWeek(slots: TrainingType[]): Promise<WeekSummaryDTO> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;
  if (human.injuryWeeksRemaining > 0) throw new Error("Sakatsın — bu hafta dinlenmelisin.");
  if (slots.length === 0) throw new Error("En az bir seans seç.");

  const quarter = quarterOf(gs.weekIndex);
  const age = baseIdentity(human).age + (quarter - 1);

  // Çevre çarpanları (GDD 14.60): trait × psikoloji × kulüp × ekipman (koç seansa özel).
  const psych = psychologyOf(human);
  const envMult =
    traitTrainingMultiplier(parseTraits(human.traits)) *
    psychologyTrainingMultiplier(psych) *
    (human.club ? clubTrainingMultiplier(human.club.facility) : 1) *
    equipmentTrainingMultiplier(human.equipmentLevel);

  let skills = rowsToSkills(human.skills);
  let fatigue = human.fatigue;
  let sharpness = human.sharpness;
  let restSessions = 0;
  const totalGains: Partial<Record<SkillKey, number>> = {};
  const sessions: string[] = [];

  for (const type of slots) {
    const coachMult = human.club
      ? coachTrainingMultiplier(
          human.club.coachSkill,
          human.club.coachSpecialty as SkillCategory,
          type,
        )
      : 1;
    const res = applyTraining(skills, {
      type,
      age,
      currentFatigue: fatigue,
      efficiencyMultiplier: envMult * coachMult,
    });
    skills = res.skills;
    fatigue = clamp(fatigue + res.fatigueDelta, 0, 100);
    sharpness = applySharpness(sharpness, sessionSharpnessDelta(type));
    if (type === "REST") restSessions++;
    sessions.push(TRAINING_LABEL_TR[type]);
    for (const [k, d] of Object.entries(res.gains)) {
      totalGains[k as SkillKey] = (totalGains[k as SkillKey] ?? 0) + (d ?? 0);
    }
  }

  // Psikoloji haftalık güncelleme (GDD 6.13).
  const nextPsych = psychAfterTrainingWeek(psych, restSessions);

  // Hafta sonu sakatlık kontrolü (deterministik: seed + hafta).
  const injuryRng = createRng(`${gs.seed}:injury:${gs.weekIndex}`);
  const injury = rollInjury(injuryRng, fatigue, age);

  const labelByKey = new Map<string, string>(SKILLS.map((s) => [s.key, s.label]));

  await prisma.$transaction(async (tx) => {
    for (const key of Object.keys(totalGains)) {
      await tx.playerSkill.update({
        where: { playerId_key: { playerId: human.id, key } },
        data: { current: skills[key as SkillKey].current },
      });
    }
    await tx.player.update({
      where: { id: human.id },
      data: {
        fatigue,
        sharpness,
        morale: nextPsych.morale,
        motivation: nextPsych.motivation,
        confidence: nextPsych.confidence,
        stress: nextPsych.stress,
        status: injury.injured ? "INJURED" : human.status,
        injuryWeeksRemaining: injury.injured ? injury.weeks : 0,
      },
    });
    await advanceWeekTx(tx, gs, gs.seed);
  });

  return {
    sessions,
    gains: Object.entries(totalGains).map(([key, delta]) => ({
      label: labelByKey.get(key) ?? key,
      delta: Math.round((delta ?? 0) * 100) / 100,
    })),
    fatigue: roundSkill(fatigue),
    sharpness: roundSkill(sharpness),
    injured: injury.injured,
    injuryWeeksRemaining: injury.injured ? injury.weeks : 0,
    currentDate: addDays(gs.currentDate, 7).toISOString(),
  };
}

/**
 * Bir hafta dinlenir: yorgunluk azalır, keskinlik biraz düşer (detraining, GDD 14.81),
 * sakatlık varsa bir hafta iyileşir. Her durumda hafta ilerler.
 */
export async function restWeek(): Promise<WeekSummaryDTO> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;

  const fatigue = clamp(human.fatigue - REST_RECOVERY, 0, 100);
  const sharpness = applySharpness(human.sharpness, -3);
  const injuryWeeksRemaining = Math.max(0, human.injuryWeeksRemaining - 1);
  const status = injuryWeeksRemaining > 0 ? "INJURED" : "ACTIVE";

  await prisma.$transaction(async (tx) => {
    await tx.player.update({
      where: { id: human.id },
      data: { fatigue, sharpness, status, injuryWeeksRemaining },
    });
    await advanceWeekTx(tx, gs, gs.seed);
  });

  return {
    sessions: ["Dinlenme"],
    gains: [],
    fatigue: roundSkill(fatigue),
    sharpness: roundSkill(sharpness),
    injured: injuryWeeksRemaining > 0,
    injuryWeeksRemaining,
    currentDate: addDays(gs.currentDate, 7).toISOString(),
  };
}

/** Ekipmanı bir seviye yükseltir (Economy: parayla, GDD 15/16). Hafta ilerletmez. */
export async function upgradeEquipment(): Promise<void> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { human } = state;
  if (human.equipmentLevel >= MAX_EQUIPMENT_LEVEL) throw new Error("Ekipman zaten en üst seviyede.");
  const cost = equipmentUpgradeCost(human.equipmentLevel);
  if (human.balance < cost) throw new Error("Yeterli paran yok.");
  await prisma.player.update({
    where: { id: human.id },
    data: { equipmentLevel: human.equipmentLevel + 1, balance: { decrement: cost } },
  });
}

export interface CareerHistoryDTO {
  name: string;
  achievements: { type: string; label: string; detail: string; importance: number; date: string }[];
  stats: {
    totalTournaments: number;
    championships: number;
    medals: number;
    finals: number;
    matchesPlayed: number;
    matchWins: number;
    careerBestRank: number | null;
  };
  rivals: { name: string; matches: number; wins: number; losses: number }[];
}

/** Kariyer geçmişi: başarılar, istatistikler ve rakiplikler (GDD 21, 22.36–22.37). */
export async function getCareerHistory(): Promise<CareerHistoryDTO | null> {
  const gs = await prisma.gameState.findFirst();
  if (!gs) return null;
  const human = await prisma.player.findUnique({ where: { id: gs.humanPlayerId } });
  if (!human) return null;
  const hid = human.id;

  const [achievements, entries, matches] = await Promise.all([
    prisma.achievement.findMany({
      where: { playerId: hid },
      orderBy: [{ importance: "desc" }, { date: "desc" }],
      take: 40,
    }),
    prisma.tournamentParticipant.findMany({ where: { playerId: hid } }),
    prisma.match.findMany({ where: { OR: [{ playerAId: hid }, { playerBId: hid }] } }),
  ]);

  const championships = entries.filter((e) => e.finalPosition === 1).length;
  const medals = entries.filter((e) => e.finalPosition != null && e.finalPosition <= 3).length;
  const finals = entries.filter((e) => e.finalPosition != null && e.finalPosition <= 2).length;
  const matchWins = matches.filter((m) => m.winnerId === hid).length;

  // Rakiplikler: en çok karşılaşılan rakipler (GDD 22.36).
  const byOpponent = new Map<number, { matches: number; wins: number; losses: number }>();
  for (const m of matches) {
    const oppId = m.playerAId === hid ? m.playerBId : m.playerAId;
    const r = byOpponent.get(oppId) ?? { matches: 0, wins: 0, losses: 0 };
    r.matches++;
    if (m.winnerId === hid) r.wins++;
    else r.losses++;
    byOpponent.set(oppId, r);
  }
  const topOppIds = [...byOpponent.entries()]
    .sort((a, b) => b[1].matches - a[1].matches || a[0] - b[0])
    .slice(0, 5);
  const oppPlayers = await prisma.player.findMany({
    where: { id: { in: topOppIds.map(([id]) => id) } },
  });
  const oppName = new Map(oppPlayers.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  const rivals = topOppIds.map(([id, r]) => ({
    name: oppName.get(id) ?? formatPlayerCode(id),
    matches: r.matches,
    wins: r.wins,
    losses: r.losses,
  }));

  return {
    name: `${human.firstName} ${human.lastName}`,
    achievements: achievements.map((a) => ({
      type: a.type,
      label: a.label,
      detail: a.detail,
      importance: a.importance,
      date: a.date.toISOString(),
    })),
    stats: {
      totalTournaments: entries.length,
      championships,
      medals,
      finals,
      matchesPlayed: matches.length,
      matchWins,
      careerBestRank: human.careerBestRank ?? null,
    },
    rivals,
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
    prisma.achievement.deleteMany(),
    prisma.match.deleteMany(),
    prisma.tournamentParticipant.deleteMany(),
    prisma.tournament.deleteMany(),
    prisma.ranking.deleteMany(),
    prisma.playerSkill.deleteMany(),
    prisma.gameState.deleteMany(),
    prisma.player.deleteMany(),
    prisma.club.deleteMany(),
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
  if (human.injuryWeeksRemaining > 0) throw new Error("Sakatsın — turnuvaya giremezsin (GDD 8.19).");

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
    sharpness: number;
    skills: SkillRow[];
  }): Combatant => {
    const name = `${p.firstName} ${p.lastName}`;
    nameById.set(p.id, name);
    return {
      id: p.id,
      name,
      weapon: p.weapon as Weapon,
      skills: rowsToSkills(p.skills),
      fatigue: p.fatigue,
      sharpness: p.sharpness,
    };
  };

  // İnsan oyuncunun combat kondisyonu = psikoloji + trait + ekipman (GDD 20.10). AI nötr.
  const humanPsych = psychologyOf(human);
  const humanConditionBonus =
    psychologyCombatModifier(humanPsych) +
    traitCombatModifier(parseTraits(human.traits)) +
    equipmentCombatModifier(human.equipmentLevel);
  const humanCombatant: Combatant = {
    ...toCombatant(human),
    conditionBonus: humanConditionBonus,
  };

  const combatants: Combatant[] = [humanCombatant, ...aiPlayers.map(toCombatant)];
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

  // İnsan oyuncu: yarışma keskinlik kazancı (GDD 14.80) + hafta sonu sakatlık kontrolü.
  const humanFinalFatigue = clamp(outcome.finalFatigue[human.id] ?? human.fatigue, 0, 100);
  const humanSharpness = applySharpness(human.sharpness, COMPETITION_SHARPNESS_GAIN);
  const injury = rollInjury(createRng(`${seedKey}:injury`), humanFinalFatigue, base.age + (quarter - 1));

  // Ödül (Economy, GDD 5.14) + turnuva sonrası psikoloji (GDD 18.59).
  const humanPosition = positionByPlayer.get(human.id) ?? combatants.length;
  const prize = prizeFor(level, humanPosition);
  const postPsych = psychAfterTournament(humanPsych, humanPosition, combatants.length);

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
    // İnsan oyuncu: keskinlik + ödül + psikoloji + sakatlık durumu.
    await tx.player.update({
      where: { id: human.id },
      data: {
        sharpness: humanSharpness,
        balance: { increment: prize },
        morale: postPsych.morale,
        motivation: postPsych.motivation,
        confidence: postPsych.confidence,
        stress: postPsych.stress,
        status: injury.injured ? "INJURED" : human.status,
        injuryWeeksRemaining: injury.injured ? injury.weeks : 0,
      },
    });

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
    const humanNewRank = ranked.find((r) => r.playerId === human.id)?.position ?? null;

    // Kariyer en iyi ranking (GDD 19.36).
    if (humanNewRank != null && (human.careerBestRank == null || humanNewRank < human.careerBestRank)) {
      await tx.player.update({ where: { id: human.id }, data: { careerBestRank: humanNewRank } });
    }

    // Başarılar (Memory Engine, GDD 21/22.37).
    const earnedRows = await tx.achievement.findMany({
      where: { playerId: human.id },
      select: { type: true },
    });
    const earnedUnique = new Set(earnedRows.map((a) => a.type as AchievementType));
    for (const a of detectAchievements({
      level,
      tournamentName,
      position: humanPosition,
      postRank: humanNewRank,
      earnedUnique,
    })) {
      await tx.achievement.create({
        data: {
          playerId: human.id,
          type: a.type,
          label: a.label,
          detail: a.detail,
          importance: a.importance,
          quarter,
          date: gs.currentDate,
        },
      });
    }

    await advanceWeekTx(tx, gs, gs.seed);
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
