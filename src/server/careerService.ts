/**
 * Career Service — Data Service katmanı (GDD 22.64: Engine → Data Service → Database).
 *
 * Saf engine'leri (src/engine/*) veritabanına bağlar: veriyi yükler, engine fonksiyonunu
 * düz veriyle çağırır, sonucu kalıcılaştırır. Kritik hesap sunucuda (güvenlik). M1 dikey
 * dilim akışı: kariyer oluştur → gün/antrenman → turnuva → ranking.
 */
import { prisma } from "@/db";
import {
  ageToCategory,
  clamp,
  computeAge,
  formatPlayerCode,
  makeCategoryId,
  roundSkill,
  TOURNAMENT_LABEL_TR,
  TR_CITIES,
  type AgeCategory,
  type Gender,
  type SkillCategory,
  type TournamentLevel,
  type Weapon,
} from "@/engine/domain";
import { createRng } from "@/engine/probability";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import {
  SKILLS,
  generateStartingSkills,
  growSkill,
  skillAgeCeiling,
  overall,
  type PlayerSkills,
  type SkillValue,
} from "@/engine/skill";
import { applyTraining, TRAINING_TYPES, type TrainingType } from "@/engine/training";
import { createPlayerSchema, deriveIdentity, generateAiOpponents } from "@/engine/player";
import {
  MATCH_FORMATS,
  PERIOD_SECONDS,
  deFormat,
  simulateMatch,
  simulatePeriod,
  simulateLaBelle,
  type Combatant,
  type Tactic,
} from "@/engine/combat";
import {
  bracketSeedOrder,
  bracketSize,
  computePoolSizes,
  roundLabel,
  type PoolPlayerResult,
  type TournamentMatch,
  type TournamentOutcome,
} from "@/engine/tournament";
import { rankEntries, rankingPointsForPosition } from "@/engine/ranking";
import {
  DAYS_PER_MONTH,
  DAYS_PER_QUARTER,
  MONTHS_PER_QUARTER,
  activityForDay,
  dayOfWeek,
  monthOfQuarter,
  qualificationLabel,
  qualifies,
  quarterOf,
} from "@/engine/season";

/** Kalıcı TR tur adını (Match.round) aktif dile çevirir. */
function localizeRound(locale: Locale, round: string): string {
  if (round === "Final") return t(locale, "round.final");
  if (round === "Yarı Final") return t(locale, "round.semi");
  if (round === "Çeyrek Final") return t(locale, "round.quarter");
  const last = /^Son (\d+)$/.exec(round);
  if (last) return t(locale, "round.last", { n: last[1] });
  const pool = /^Pul (\d+)$/.exec(round);
  if (pool) return t(locale, "round.pool", { n: pool[1] });
  return round;
}

/** Turnuva görünen adını dile göre kurar (kalıcı TR ada bağlı kalmaz). */
function tournamentDisplayName(locale: Locale, ageCategory: string, level: TournamentLevel): string {
  return `${ageCategory} ${t(locale, `tournament.${level}`)}`;
}
import {
  COMPETITION_SHARPNESS_GAIN,
  applySharpness,
  rollInjury,
  sessionSharpnessDelta,
} from "@/engine/conditioning";
import {
  generateTraits,
  traitCombatModifier,
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
import {
  computePhysique,
  generateGenetics,
  speedTrainingMultiplier,
  type Genetics,
} from "@/engine/physique";

/** Oyun başlangıç tarihi (deterministik referans). */
const GAME_START = new Date("2026-01-01T00:00:00.000Z");
const AI_DAILY_RECOVERY = 4; // AI günlük yorgunluk toparlanması (gün-bazlı)
const AI_COUNT = 23; // kategoriyi dolduran AI havuzu → insanla birlikte 24 kişilik alan
const POOL_SIZE = 6;
// Varsayılan haftalık plan: 4 antrenman günü (Pazartesi / Çarşamba / Cuma / Pazar).
const DEFAULT_PLAN = "TECHNICAL,PHYSICAL,TACTICAL,REST";

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

function geneticsData(g: Genetics) {
  return {
    adultHeightCm: g.adultHeightCm,
    reachBiasCm: g.reachBiasCm,
    buildFactor: g.buildFactor,
    leftHanded: g.leftHanded,
  };
}

function geneticsOf(p: {
  adultHeightCm: number;
  reachBiasCm: number;
  buildFactor: number;
  leftHanded: boolean;
}): Genetics {
  return {
    adultHeightCm: p.adultHeightCm,
    reachBiasCm: p.reachBiasCm,
    buildFactor: p.buildFactor,
    leftHanded: p.leftHanded,
  };
}

/** Oyuncunun o quarter'daki yaşı (1 quarter = 1 oyun yılı, GDD 17.5). */
function currentAge(birthDate: Date, quarter: number): number {
  return computeAge(birthDate, GAME_START) + (quarter - 1);
}

async function ensureCountry(code: string, name: string): Promise<number> {
  const existing = await prisma.country.findUnique({ where: { code } });
  if (existing) return existing.id;
  const created = await prisma.country.create({ data: { code, name } });
  return created.id;
}

/**
 * Oyuncunun O ANKİ kimliği: yaş kategorisi quarter (oyun yılı) ilerledikçe değişir
 * (U10→U12→…→Senior, GDD 7.9/19.8). AI kadrosu aynı yaşta üretildiği için birlikte atlar → saha
 * dolu kalır. Kategori değişince ranking yeni kategoride sıfırdan başlar (GDD 19.8).
 */
function currentIdentity(
  human: { gender: string; weapon: string; birthDate: Date },
  quarter: number,
): { age: number; ageCategory: AgeCategory; categoryId: string } {
  const age = currentAge(human.birthDate, quarter);
  const ageCategory = ageToCategory(age);
  return {
    age,
    ageCategory,
    categoryId: makeCategoryId(ageCategory, human.gender as Gender, human.weapon as Weapon),
  };
}

// ---------- DTO'lar ----------

/** Sezon takviminde bir turnuva (gün-bazlı program, gösterim). */
export interface SeasonEventDTO {
  level: TournamentLevel;
  label: string;
  month: number; // h1..h12
  dayName: string; // Salı / Perşembe / Cumartesi / Pazar
  qualified: boolean;
  requirement: string;
}

/** Bugünün etkinliği (gün-bazlı akış: antrenman ya da turnuva). */
export interface TodayDTO {
  dayName: string;
  kind: "TRAINING" | "TOURNAMENT";
  trainingLabel?: string; // antrenman günü: o seansın etiketi
  level?: TournamentLevel; // turnuva günü
  label?: string;
  qualified?: boolean;
  requirement?: string;
}

/** Klasman satırı (sıralama tablosu). */
export interface RankingRowDTO {
  playerId: number;
  name: string;
  clubName: string;
  points: number;
  position: number;
  isHuman: boolean;
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
  injuryDaysRemaining: number;
  currentDate: string;
  quarter: number; // oyun yılı
  month: number; // h1..h12 (oyun ayı)
  dayName: string; // Pazartesi..Pazar
  nationalTeam: boolean; // kategori sıralaması ilk 4 (GDD 17.32)
  overall: number;
  // Gelişim çevresi (M6)
  traits: string[]; // Türkçe etiketler
  psychology: { morale: number; motivation: number; confidence: number; stress: number };
  club: {
    name: string;
    city: string;
    facility: number;
    coachName: string;
    coachSkill: number;
    coachSpecialty: string;
    coach2Name: string;
    coach2Specialty: string;
  } | null;
  equipmentLevel: number;
  balance: number;
  equipmentUpgradeCost: number;
  canUpgradeEquipment: boolean;
  liveTournamentActive: boolean; // devam eden canlı turnuva var mı → ekrana yönlendir
  trainingPlan: string[]; // haftalık plan: 4 antrenman günü (Pzt/Çrş/Cuma/Pazar)
  physique: { heightCm: number; reachCm: number; legLengthCm: number; weightKg: number; leftHanded: boolean };
  skills: { key: string; label: string; category: string; current: number; potential: number }[];
  ranking: RankingRowDTO[];
  today: TodayDTO; // bugünün etkinliği (İlerle/Katıl/Geç için)
  seasonCalendar: SeasonEventDTO[]; // bu yılın turnuva takvimi (h1..h12)
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
    age: identity.age, // oyuncuyla aynı yaş → kategoriyi birlikte atlar (saha hep dolu)
  });

  // Trait + kulüp/koç (GDD 10, 12, 13) + fiziksel genetik (GDD 2.7) — deterministik.
  const traits = generateTraits(createRng(`${seed}:traits`), 2);
  const humanGenetics = generateGenetics(createRng(`${seed}:phys:human`), data.gender);
  const clubRng = createRng(`${seed}:club`);
  const SPECIALTIES: SkillCategory[] = ["TECHNICAL", "PHYSICAL", "MENTAL", "TACTICAL"];
  const COACH_NAMES = ["Ahmet", "Kemal", "Selim", "Hasan", "Murat", "Emre", "Cem", "Okan", "Tuna", "Barış"];
  // Bir kulüp: 2 antrenör (eşit yetenek). Her hocaya 4 antrenman türünden 2'si düşer → ikisi
  // birlikte 4 türü de kapsar (dengeli kulüp portresi, GDD 13). Uzmanlıklar CSV saklanır.
  const makeClubData = (city: string) => {
    const specs = clubRng.shuffle(SPECIALTIES); // 4 türü karıştır, 2+2 böl
    const skill = clubRng.int(45, 85);
    return {
      name: `${city} Eskrim Kulübü`,
      city,
      facility: clubRng.int(45, 85),
      coachName: `${clubRng.pick(COACH_NAMES)} Hoca`,
      coachSkill: skill,
      coachSpecialty: `${specs[0]},${specs[1]}`,
      coach2Name: `${clubRng.pick(COACH_NAMES)} Hoca`,
      coach2Specialty: `${specs[2]},${specs[3]}`,
    };
  };
  // Kulüp havuzu: oyuncunun şehri + birkaç farklı şehir (AI'lar bunlara dağıtılır → klasmanda kulüp).
  const otherCities = clubRng.shuffle(TR_CITIES.filter((c) => c !== data.city)).slice(0, 5);
  const clubCities = [data.city, ...otherCities];

  const humanPlayerId = await prisma.$transaction(async (tx) => {
    // Kulüp havuzunu oluştur; oyuncu kendi şehrinin kulübüne bağlanır, AI'lar rastgele dağılır.
    const clubIds: number[] = [];
    let humanClubId = 0;
    for (const city of clubCities) {
      const cl = await tx.club.create({ data: makeClubData(city) });
      clubIds.push(cl.id);
      if (city === data.city) humanClubId = cl.id;
    }
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
        clubId: humanClubId,
        ...geneticsData(humanGenetics),
        skills: { create: skillCreateData(humanSkills) },
      },
    });
    // Player ID kodunu gerçek id'den üret (GDD 7.4).
    await tx.player.update({
      where: { id: human.id },
      data: { code: formatPlayerCode(human.id) },
    });

    for (let i = 0; i < aiSpecs.length; i++) {
      const spec = aiSpecs[i];
      const aiGenetics = generateGenetics(createRng(`${seed}:phys:ai:${i}`), spec.gender);
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
          clubId: clubRng.pick(clubIds),
          ...geneticsData(aiGenetics),
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

/** AI'nın maç taktiğini karakterinden türetir (GDD 18.63: AI stile sahip olabilir). */
function tacticFromTraits(traits: readonly TraitKey[]): Tactic {
  if (traits.includes("AGGRESSIVE")) return "OFFENSIVE";
  if (traits.includes("CALM")) return "DEFENSIVE";
  return "BALANCED";
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
  const locale = await getLocale();

  const skills = rowsToSkills(human.skills);
  const quarter = quarterOf(gs.dayIndex);
  const month = monthOfQuarter(gs.dayIndex);
  const cur = currentIdentity(human, quarter); // yaş kategorisi yıllara göre ilerler
  const categoryId = cur.categoryId;
  const age = cur.age;

  const ranking = await buildRankingView(categoryId, quarter, human.id);
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  const nationalTeam = humanRank != null && humanRank <= 4;
  const injured = human.injuryDaysRemaining > 0;
  const planArr = (gs.trainingPlan || DEFAULT_PLAN).split(",").filter(Boolean);

  // Bugünün etkinliği (gün-bazlı program).
  const act = activityForDay(gs.dayIndex);
  const dayLabel = t(locale, `day.${dayOfWeek(gs.dayIndex)}`);
  const today: TodayDTO =
    act.kind === "TRAINING"
      ? {
          dayName: dayLabel,
          kind: "TRAINING",
          trainingLabel: t(locale, `training.${(planArr[act.slot] ?? "REST") as TrainingType}`),
        }
      : {
          dayName: dayLabel,
          kind: "TOURNAMENT",
          level: act.level,
          label: t(locale, `tournament.${act.level}`),
          qualified: !injured && qualifies(act.qualification, humanRank),
          requirement: t(locale, `qual.${act.qualification}`),
        };

  // Bu yılın turnuva takvimi: haftalık (her ay) + uluslararası (yılda 1). GDD 17.7.
  const yearStart = Math.floor(gs.dayIndex / DAYS_PER_QUARTER) * DAYS_PER_QUARTER;
  const seasonCalendar: SeasonEventDTO[] = [];
  for (const dow of [1, 3, 5]) {
    const a = activityForDay(yearStart + dow);
    if (a.kind === "TOURNAMENT") {
      seasonCalendar.push({
        level: a.level,
        label: t(locale, `tournament.${a.level}`),
        month: 0, // 0 = her ay
        dayName: t(locale, `day.${dayOfWeek(yearStart + dow)}`),
        qualified: qualifies(a.qualification, humanRank),
        requirement: t(locale, `qual.${a.qualification}`),
      });
    }
  }
  for (let m = 1; m <= MONTHS_PER_QUARTER; m++) {
    const a = activityForDay(yearStart + (m - 1) * DAYS_PER_MONTH + 6); // ayın Pazar'ı
    if (a.kind === "TOURNAMENT") {
      seasonCalendar.push({
        level: a.level,
        label: t(locale, `tournament.${a.level}`),
        month: m,
        dayName: t(locale, "day.6"),
        qualified: qualifies(a.qualification, humanRank),
        requirement: t(locale, `qual.${a.qualification}`),
      });
    }
  }

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
    injuryDaysRemaining: human.injuryDaysRemaining,
    currentDate: gs.currentDate.toISOString(),
    quarter,
    month,
    dayName: dayLabel,
    nationalTeam,
    overall: roundSkill(overall(skills)),
    traits: parseTraits(human.traits), // trait ANAHTARLARI; UI dile göre çevirir

    psychology: {
      morale: roundSkill(human.morale),
      motivation: roundSkill(human.motivation),
      confidence: roundSkill(human.confidence),
      stress: roundSkill(human.stress),
    },
    club: human.club
      ? {
          name: `${human.club.city} ${t(locale, "club.suffix")}`,
          city: human.club.city,
          facility: human.club.facility,
          coachName: human.club.coachName,
          coachSkill: human.club.coachSkill,
          coachSpecialty: human.club.coachSpecialty,
          coach2Name: human.club.coach2Name,
          coach2Specialty: human.club.coach2Specialty,
        }
      : null,
    equipmentLevel: human.equipmentLevel,
    balance: roundSkill(human.balance),
    equipmentUpgradeCost: equipmentUpgradeCost(human.equipmentLevel),
    canUpgradeEquipment:
      human.equipmentLevel < MAX_EQUIPMENT_LEVEL &&
      human.balance >= equipmentUpgradeCost(human.equipmentLevel),
    liveTournamentActive: gs.liveTournament != null,
    trainingPlan: (gs.trainingPlan || DEFAULT_PLAN).split(","),
    physique: (() => {
      const p = computePhysique(geneticsOf(human), age);
      return {
        heightCm: p.heightCm,
        reachCm: p.reachCm,
        legLengthCm: p.legLengthCm,
        weightKg: p.weightKg,
        leftHanded: human.leftHanded,
      };
    })(),
    skills: SKILLS.map((def) => ({
      key: def.key,
      label: t(locale, `skill.${def.key}`),
      category: def.category,
      current: roundSkill(skills[def.key].current),
      potential: roundSkill(skills[def.key].potential),
    })),
    ranking,
    today,
    seasonCalendar,
  };
}

/** Menü/başlık + sabit "İlerle" çubuğu için hafif durum (tüm kariyer sayfalarında ortak). */
export interface TrainingReport {
  days: number; // kaç gün ilerledi
  gains: { label: string; delta: number }[]; // skill kazanımları (delta>0)
  conditionDelta: number; // kondisyon değişimi (+ toparladı, − yoruldu)
  sharpnessDelta: number; // keskinlik değişimi
  injured: boolean; // bu ilerlemede sakatlandı mı
}

export interface CareerHeaderDTO {
  name: string;
  code: string;
  gender: string;
  weapon: string;
  age: number;
  categoryId: string;
  liveTournamentActive: boolean;
  quarter: number;
  month: number; // h1..h12
  dayName: string; // Pazartesi..Pazar
  injured: boolean;
  injuryDaysRemaining: number;
  today: TodayDTO; // bugünün etkinliği (çubuk İlerle/Katıl/Geç için)
  report: TrainingReport | null; // son "İlerle" antrenman haberi (varsa)
}

export async function getCareerHeader(): Promise<CareerHeaderDTO | null> {
  const state = await loadState();
  if (!state) return null;
  const { gs, human } = state;
  const locale = await getLocale();
  const quarter = quarterOf(gs.dayIndex);
  const cur = currentIdentity(human, quarter);
  const injured = human.injuryDaysRemaining > 0;
  const act = activityForDay(gs.dayIndex);
  const dayLabel = t(locale, `day.${dayOfWeek(gs.dayIndex)}`);

  let today: TodayDTO;
  if (act.kind === "TRAINING") {
    const planArr = (gs.trainingPlan || DEFAULT_PLAN).split(",").filter(Boolean);
    today = {
      dayName: dayLabel,
      kind: "TRAINING",
      trainingLabel: t(locale, `training.${(planArr[act.slot] ?? "REST") as TrainingType}`),
    };
  } else {
    const ranking = await buildRankingView(cur.categoryId, quarter, human.id);
    const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
    today = {
      dayName: dayLabel,
      kind: "TOURNAMENT",
      level: act.level,
      label: t(locale, `tournament.${act.level}`),
      qualified: !injured && qualifies(act.qualification, humanRank),
      requirement: t(locale, `qual.${act.qualification}`),
    };
  }

  return {
    name: `${human.firstName} ${human.lastName}`,
    code: human.code,
    gender: human.gender,
    weapon: human.weapon,
    age: cur.age,
    categoryId: cur.categoryId,
    liveTournamentActive: gs.liveTournament != null,
    quarter,
    month: monthOfQuarter(gs.dayIndex),
    dayName: dayLabel,
    injured,
    injuryDaysRemaining: human.injuryDaysRemaining,
    today,
    report: gs.lastReport ? (JSON.parse(gs.lastReport) as TrainingReport) : null,
  };
}

/** Haftalık antrenman planını kaydeder (sabit "İlerle" çubuğu bunu uygular). */
export async function setTrainingPlan(slots: TrainingType[]): Promise<void> {
  const gs = await prisma.gameState.findFirst();
  if (!gs) throw new Error("Aktif kariyer yok.");
  const valid = slots.filter((s) => TRAINING_TYPES.includes(s));
  if (valid.length === 0) throw new Error("En az bir seans seç.");
  await prisma.gameState.update({ where: { id: gs.id }, data: { trainingPlan: valid.join(",") } });
}

async function buildRankingView(categoryId: string, quarter: number, humanId: number) {
  const rows = await prisma.ranking.findMany({
    where: { categoryId, quarter },
    orderBy: [{ points: "desc" }, { playerId: "asc" }],
  });
  const players = await prisma.player.findMany({
    where: { id: { in: rows.map((r) => r.playerId) } },
    include: { club: true },
  });
  const byId = new Map(players.map((p) => [p.id, p]));
  return rows.map((r, i) => {
    const p = byId.get(r.playerId);
    return {
      playerId: r.playerId,
      name: p ? `${p.firstName} ${p.lastName}` : formatPlayerCode(r.playerId),
      clubName: p?.club?.name ?? "",
      points: roundSkill(r.points),
      position: r.position ?? i + 1,
      isHuman: r.playerId === humanId,
    };
  });
}

/** Herhangi bir kategorinin bu quarter'daki sıralaması (Klasman filtresi). */
export async function getCategoryRanking(categoryId: string): Promise<RankingRowDTO[]> {
  const state = await loadState();
  if (!state) return [];
  const { gs, human } = state;
  return buildRankingView(categoryId, quarterOf(gs.dayIndex), human.id);
}

// Kondisyon modeli: her AKTİF günde doğal toparlanma (uyku/beslenme) uygulanır; antrenman bunun
// üzerine yük biner. Böylece normal bir haftalık program kondisyonu hafif toparlar, ağır turnuvalar
// düşürür. (Önceden doğal toparlanma yoktu → kondisyon çok hızlı tükeniyordu.)
const DAY_BASE_RECOVERY = 10; // her aktif günde doğal günlük toparlanma
const REST_EXTRA_RECOVERY = 8; // REST seansının ek toparlanması (doğal toparlanmaya eklenir)
const INJURY_REST_RECOVERY = 10; // sakatlık gününde toparlanma
const INJURY_DAYS_PER_WEEK = 3; // rollInjury hafta → OYUN günü (3–9 gün; birkaç turnuva kaçırır)

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** GAME_START + N gün. */
function dayDate(dayIndex: number): Date {
  return addDays(GAME_START, dayIndex);
}

/**
 * Canlı dünyayı `toDay` gününe taşır (GDD 2.17–2.18): AI'lar geçen gün kadar pasif toparlanır ve
 * geçilen her AY'da hafifçe gelişir (özerk antrenman). Deterministik (seed). tx içinde.
 */
async function worldAdvanceTx(
  tx: Tx,
  gs: { id: number; dayIndex: number },
  toDay: number,
  seed: string,
) {
  const days = Math.max(0, toDay - gs.dayIndex);
  if (days > 0) {
    await tx.player.updateMany({
      where: { isAI: true, fatigue: { gt: 0 } },
      data: { fatigue: { decrement: AI_DAILY_RECOVERY * days } },
    });
    await tx.player.updateMany({ where: { isAI: true, fatigue: { lt: 0 } }, data: { fatigue: 0 } });
  }
  const fromMonth = Math.floor(gs.dayIndex / DAYS_PER_MONTH);
  const monthsCrossed = Math.floor(toDay / DAYS_PER_MONTH) - fromMonth;
  if (monthsCrossed > 0) {
    const ais = await tx.player.findMany({ where: { isAI: true }, include: { skills: true } });
    const devQuarter = quarterOf(toDay);
    for (const ai of ais) {
      if (ai.skills.length === 0) continue;
      const aiAge = currentAge(ai.birthDate, devQuarter); // yaşa uygun gelişim tavanı için
      for (let m = 0; m < monthsCrossed; m++) {
        const rng = createRng(`${seed}:aidev:${ai.id}:${fromMonth + m}`);
        const row = rng.pick(ai.skills);
        const grown = growSkill(
          { current: row.current, potential: row.potential, floor: row.floor, ceiling: row.ceiling },
          0.4,
          1,
          skillAgeCeiling(row.potential, row.floor, aiAge),
        );
        if (grown.current !== row.current) {
          row.current = grown.current; // aynı AI'da sonraki ay için tutarlı
          await tx.playerSkill.update({
            where: { playerId_key: { playerId: ai.id, key: row.key } },
            data: { current: grown.current },
          });
        }
      }
    }
  }
  await tx.gameState.update({
    where: { id: gs.id },
    data: { dayIndex: toDay, currentDate: dayDate(toDay) },
  });
}

/**
 * "İlerle / Geç" — gün-bazlı zaman sürücüsü (GDD 6 + kullanıcı takvimi). Bir sonraki
 * KATILABİLECEĞİN turnuva gününe kadar ilerler; antrenman günlerini kayıtlı plana göre uygular,
 * dinlenme/sakatlık günlerinde toparlanır ve turnuva gününde DURUR (Katıl/Geç için). Antrenmanda
 * sakatlanırsa orada durur. Online'da bu akış sunucu saatiyle otomatik olur.
 */
export async function advanceDay(): Promise<AdvanceResult> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;
  if (gs.liveTournament) return { live: true };

  const startQuarter = quarterOf(gs.dayIndex);
  const cur = currentIdentity(human, startQuarter);
  const age = cur.age;
  const ranking = await buildRankingView(cur.categoryId, startQuarter, human.id);
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  const planArr = (gs.trainingPlan || DEFAULT_PLAN).split(",").filter(Boolean) as TrainingType[];

  // Çevre çarpanları (GDD 14.60): trait × psikoloji × kulüp × ekipman.
  const psych = psychologyOf(human);
  const envMult =
    traitTrainingMultiplier(parseTraits(human.traits)) *
    psychologyTrainingMultiplier(psych) *
    (human.club ? clubTrainingMultiplier(human.club.facility) : 1) *
    equipmentTrainingMultiplier(human.equipmentLevel);
  const speedMult = speedTrainingMultiplier(human.buildFactor);

  let skills = rowsToSkills(human.skills);
  let fatigue = human.fatigue;
  let sharpness = human.sharpness;
  let injuryDays = human.injuryDaysRemaining;
  let d = gs.dayIndex;
  let restSessions = 0;
  let injuredNow = false;

  // Antrenman haberi (özet) için başlangıç değerleri.
  const beforeSkills: Record<string, number> = {};
  for (const def of SKILLS) beforeSkills[def.key] = skills[def.key].current;
  const fatigueBefore = fatigue;
  const sharpnessBefore = sharpness;
  const startDay = gs.dayIndex;

  // Bir antrenman seansı uygular; sakatlanırsa true döner. (Sakatlık advance başına en çok bir kez.)
  // general=true: turnuvaya girmeyip evde kalınca yapılan HAFİF GENEL antrenman — tüm becerilere az
  // katkı, düşük yorgunluk; turnuvaya girenlerle gelişim farkı açmaz (kullanıcı isteği).
  const applySession = (type: TrainingType, general = false): boolean => {
    // Doğal günlük toparlanma her aktif günde (antrenman + geçilen turnuva günü) uygulanır.
    fatigue = clamp(fatigue - DAY_BASE_RECOVERY, 0, 100);
    if (general) {
      for (const def of SKILLS) {
        const ageCap = skillAgeCeiling(skills[def.key].potential, skills[def.key].floor, age);
        skills[def.key] = growSkill(skills[def.key], 0.18 * envMult, 1, ageCap);
      }
      fatigue = clamp(fatigue + 8, 0, 100); // hafif yük
    } else if (type === "REST") {
      fatigue = clamp(fatigue - REST_EXTRA_RECOVERY, 0, 100);
      restSessions++;
    } else {
      // İki antrenörün uzmanlıkları (her biri 2 tür) birlikte 4 türü kapsar → bu türde uzman
      // hoca varsa bonus uygulanır (yoksa temel koçluk).
      const clubSpecs = human.club
        ? `${human.club.coachSpecialty},${human.club.coach2Specialty}`.split(",")
        : [];
      const coachSpec = clubSpecs.includes(type) ? (type as SkillCategory) : null;
      const coachMult = human.club
        ? coachTrainingMultiplier(human.club.coachSkill, coachSpec, type)
        : 1;
      const res = applyTraining(skills, {
        type,
        age,
        currentFatigue: fatigue,
        efficiencyMultiplier: envMult * coachMult,
        skillMultipliers: { speed: speedMult },
      });
      skills = res.skills;
      fatigue = clamp(fatigue + res.fatigueDelta, 0, 100);
    }
    sharpness = applySharpness(sharpness, sessionSharpnessDelta(type));
    if (type !== "REST" && !injuredNow) {
      const inj = rollInjury(createRng(`${gs.seed}:injury:${d}`), fatigue, age);
      if (inj.injured) {
        injuryDays = inj.weeks * INJURY_DAYS_PER_WEEK;
        injuredNow = true;
        return true;
      }
    }
    return false;
  };

  // Sonraki KATILABİLİR turnuva gününe kadar ilerle. İlk gün turnuvaysa "Geç" demektir → o gün
  // antrenman yapılmış sayılır (turnuvaya girmedin ama boş geçmedin). Sonraki uygun turnuvada durur.
  let firstDay = true;
  for (let guard = 0; guard < DAYS_PER_QUARTER * 2; guard++) {
    if (injuryDays > 0) {
      fatigue = clamp(fatigue - INJURY_REST_RECOVERY, 0, 100);
      injuryDays--;
      d++;
      firstDay = false;
      continue;
    }
    const act = activityForDay(d);
    if (act.kind === "TOURNAMENT") {
      const eligible = qualifies(act.qualification, humanRank);
      if (eligible && !firstDay) break; // yeni bir uygun turnuva günü → dur (Katıl/Geç)
      // İlk gün turnuvası (Geç) ya da uygun olmayan turnuva → katılmıyorsun, o gün HAFİF GENEL antrenman.
      const injured = applySession("TECHNICAL", true);
      d++;
      firstDay = false;
      if (injured) break;
      continue;
    }
    // Antrenman günü (plan seansı)
    const injured = applySession(planArr[act.slot] ?? "REST");
    d++;
    firstDay = false;
    if (injured) break;
  }

  const nextPsych = psychAfterTrainingWeek(psych, restSessions);

  // Antrenman haberi: skill kazanımları + kondisyon/keskinlik değişimi (kullanıcıya "+2 Atak, -20 kondisyon").
  const days = d - startDay;
  const gains = SKILLS.map((def) => ({
    label: def.label,
    delta: Math.round((skills[def.key].current - beforeSkills[def.key]) * 10) / 10,
  }))
    .filter((g) => g.delta >= 0.1)
    .sort((a, b) => b.delta - a.delta);
  const report =
    days > 0
      ? JSON.stringify({
          days,
          gains,
          conditionDelta: Math.round(fatigueBefore - fatigue), // + toparladı, − yoruldu
          sharpnessDelta: Math.round(sharpness - sharpnessBefore),
          injured: injuryDays > 0 && injuredNow,
        })
      : null;

  await prisma.$transaction(async (tx) => {
    for (const def of SKILLS) {
      await tx.playerSkill.update({
        where: { playerId_key: { playerId: human.id, key: def.key } },
        data: { current: skills[def.key].current },
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
        status: injuryDays > 0 ? "INJURED" : "ACTIVE",
        injuryDaysRemaining: injuryDays,
      },
    });
    await worldAdvanceTx(tx, gs, d, gs.seed);
    await tx.gameState.update({ where: { id: gs.id }, data: { lastReport: report } });
  });

  return {};
}

/** Antrenman haber kartını temizler (kullanıcı "✕" ile kapatınca). */
export async function clearReport(): Promise<void> {
  const gs = await prisma.gameState.findFirst();
  if (!gs) return;
  await prisma.gameState.update({ where: { id: gs.id }, data: { lastReport: null } });
}

/**
 * Bugünkü turnuvaya KATILIR: canlı turnuvayı başlatır (maç-maç oynanır). Uygunluk + sakatlık
 * kontrolü burada. Turnuva bitince (finalizeLive) bir gün ilerler.
 */
export async function attendTournament(): Promise<AdvanceResult> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;
  if (gs.liveTournament) return { live: true };
  if (human.injuryDaysRemaining > 0) throw new Error("Sakatsın — turnuvaya giremezsin (GDD 8.19).");
  const act = activityForDay(gs.dayIndex);
  if (act.kind !== "TOURNAMENT") throw new Error("Bugün turnuva yok.");
  const ranking = await buildRankingView(currentIdentity(human, quarterOf(gs.dayIndex)).categoryId, quarterOf(gs.dayIndex), human.id);
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  if (!qualifies(act.qualification, humanRank)) {
    throw new Error(`Katılım hakkın yok — ${qualificationLabel(act.qualification)}.`);
  }
  await startLiveTournament(gs, human, act.level);
  return { live: true };
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
  tournaments: {
    id: number;
    name: string;
    level: string;
    categoryId: string;
    date: string;
    position: number;
  }[];
}

/** Kariyer geçmişi: başarılar, istatistikler ve rakiplikler (GDD 21, 22.36–22.37). */
export async function getCareerHistory(): Promise<CareerHistoryDTO | null> {
  const gs = await prisma.gameState.findFirst();
  if (!gs) return null;
  const human = await prisma.player.findUnique({ where: { id: gs.humanPlayerId } });
  if (!human) return null;
  const hid = human.id;
  const locale = await getLocale();

  const [achievements, entries, matches] = await Promise.all([
    prisma.achievement.findMany({
      where: { playerId: hid },
      orderBy: [{ importance: "desc" }, { date: "desc" }],
      take: 40,
    }),
    prisma.tournamentParticipant.findMany({
      where: { playerId: hid },
      include: { tournament: true },
    }),
    prisma.match.findMany({ where: { OR: [{ playerAId: hid }, { playerBId: hid }] } }),
  ]);

  const championships = entries.filter((e) => e.finalPosition === 1).length;
  const medals = entries.filter((e) => e.finalPosition != null && e.finalPosition <= 3).length;
  const finals = entries.filter((e) => e.finalPosition != null && e.finalPosition <= 2).length;
  const matchWins = matches.filter((m) => m.winnerId === hid).length;

  // Oynanan turnuvalar (yeniden izlenebilir): en yeni önce.
  const tournaments = [...entries]
    .sort((a, b) => b.tournament.date.getTime() - a.tournament.date.getTime())
    .map((e) => ({
      id: e.tournamentId,
      name: tournamentDisplayName(locale, e.tournament.categoryId.split("-")[0], e.tournament.level as TournamentLevel),
      level: t(locale, `tournament.${e.tournament.level}`),
      categoryId: e.tournament.categoryId,
      date: e.tournament.date.toISOString(),
      position: e.finalPosition ?? 0,
    }));

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
    tournaments,
  };
}

/** Kaydedilmiş bir turnuvayı id ile yükler (sonuç ekranı için). */
export async function getTournament(id: number): Promise<TournamentResultDTO | null> {
  const tourn = await prisma.tournament.findUnique({
    where: { id },
    include: {
      participants: { include: { player: true } },
      matches: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!tourn) return null;
  const gs = await prisma.gameState.findFirst();
  const humanId = gs?.humanPlayerId ?? -1;
  const fieldSize = tourn.participants.length;
  const locale = await getLocale();

  const nameById = new Map(
    tourn.participants.map((p) => [p.playerId, `${p.player.firstName} ${p.player.lastName}`]),
  );
  const sortedParticipants = [...tourn.participants].sort(
    (a, b) => (a.finalPosition ?? 999) - (b.finalPosition ?? 999),
  );
  const champion = sortedParticipants.find((p) => p.finalPosition === 1);
  const you = tourn.participants.find((p) => p.playerId === humanId);

  return {
    tournamentId: tourn.id,
    name: tournamentDisplayName(locale, tourn.categoryId.split("-")[0], tourn.level as TournamentLevel),
    level: t(locale, `tournament.${tourn.level}`),
    categoryId: tourn.categoryId,
    yourPosition: you?.finalPosition ?? fieldSize,
    yourSeedRank: you?.seedRank ?? null,
    championName: champion ? (nameById.get(champion.playerId) ?? "?") : "?",
    pools: buildPoolsView(tourn.participants, nameById, humanId),
    poolSheets: buildPoolSheets(
      tourn.matches
        .filter((m) => m.phase === "POOL")
        .map((m) => ({ aId: m.playerAId, bId: m.playerBId, scoreA: m.scoreA, scoreB: m.scoreB })),
      new Map(tourn.participants.filter((p) => p.poolNumber != null).map((p) => [p.playerId, p.poolNumber as number])),
      nameById,
      humanId,
    ),
    standings: sortedParticipants.map((p) => ({
      position: p.finalPosition ?? fieldSize,
      name: nameById.get(p.playerId) ?? formatPlayerCode(p.playerId),
      isHuman: p.playerId === humanId,
    })),
    matches: tourn.matches.map((m) => ({
      phase: m.phase,
      round: localizeRound(locale, m.round),
      aName: nameById.get(m.playerAId) ?? formatPlayerCode(m.playerAId),
      bName: nameById.get(m.playerBId) ?? formatPlayerCode(m.playerBId),
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      log: m.log.split("\n"),
      aIsHuman: m.playerAId === humanId,
      bIsHuman: m.playerBId === humanId,
    })),
    currentDate: (gs?.currentDate ?? tourn.date).toISOString(),
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
  poolSheets: PoolSheetDTO[];
  standings: { position: number; name: string; isHuman: boolean }[];
  matches: {
    phase: string;
    round: string;
    aName: string;
    bName: string;
    scoreA: number;
    scoreB: number;
    log: string[];
    aIsHuman: boolean;
    bIsHuman: boolean;
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

/** Klasik FIE pul kağıdı (poule): NxN sonuç ızgarası + V/TS/TR/Ind/Sıra. */
export interface PoolSheetDTO {
  poolNumber: number;
  players: { name: string; isHuman: boolean; v: number; ts: number; tr: number; ind: number; place: number }[];
  // cells[i][j]: i satırının j sütununa karşı sonucu (i'nin attığı tuş + kazandı mı); köşegen (i===j) null.
  cells: ({ scored: number; won: boolean } | null)[][];
}

function buildPoolSheets(
  poolMatches: readonly { aId: number; bId: number; scoreA: number; scoreB: number }[],
  membership: ReadonlyMap<number, number>, // playerId -> poolNumber
  nameById: Map<number, string>,
  humanId: number,
): PoolSheetDTO[] {
  const byPool = new Map<number, number[]>();
  for (const [pid, pool] of membership) {
    if (!byPool.has(pool)) byPool.set(pool, []);
    byPool.get(pool)!.push(pid);
  }
  const result = new Map<string, { sa: number; sb: number }>();
  for (const m of poolMatches) result.set(`${m.aId}-${m.bId}`, { sa: m.scoreA, sb: m.scoreB });
  const cell = (i: number, j: number): { scored: number; won: boolean } | null => {
    const dir = result.get(`${i}-${j}`);
    if (dir) return { scored: dir.sa, won: dir.sa > dir.sb };
    const rev = result.get(`${j}-${i}`);
    if (rev) return { scored: rev.sb, won: rev.sb > rev.sa };
    return null;
  };

  const sheets: PoolSheetDTO[] = [];
  for (const [poolNumber, ids] of [...byPool.entries()].sort((a, b) => a[0] - b[0])) {
    const stat = new Map<number, { v: number; ts: number; tr: number }>();
    for (const id of ids) stat.set(id, { v: 0, ts: 0, tr: 0 });
    for (const i of ids)
      for (const j of ids) {
        if (i === j) continue;
        const c = cell(i, j);
        if (!c) continue;
        const s = stat.get(i)!;
        s.ts += c.scored;
        const back = cell(j, i);
        s.tr += back ? back.scored : 0;
        if (c.won) s.v += 1;
      }
    const ordered = [...ids].sort((a, b) => {
      const sa = stat.get(a)!;
      const sb = stat.get(b)!;
      return sb.v - sa.v || sb.ts - sb.tr - (sa.ts - sa.tr) || sb.ts - sa.ts;
    });
    const players = ordered.map((id, idx) => {
      const s = stat.get(id)!;
      return {
        name: nameById.get(id) ?? formatPlayerCode(id),
        isHuman: id === humanId,
        v: s.v,
        ts: s.ts,
        tr: s.tr,
        ind: s.ts - s.tr,
        place: idx + 1,
      };
    });
    const cells = ordered.map((ri) => ordered.map((cj) => (ri === cj ? null : cell(ri, cj))));
    sheets.push({ poolNumber, players, cells });
  }
  return sheets;
}

// ===================== CANLI TURNUVA (maç-maç, her maçın kendi taktiği, GDD 18.54) =====================
// Turnuva ekranında gerçek zamanlı akış: pul maçları sırayla açılır, her maç öncesi taktik seçilir;
// eleme pul bitince, tur tur açılır. Kariyer/hafta saati turnuva boyunca DURUR; yalnız turnuva bitince
// (finalizeTournament → advanceWeekTx) ilerler. İlerleme JSON blob'unda (GameState.liveTournament) tutulur
// → sayfa yenilense de devam. AI maçları toplu simüle edilir (kullanıcı yalnız kendi maçlarını izler).

const BYE = -1;
const POOL_TOUCHES = MATCH_FORMATS.POOL;

interface LiveCombatant {
  id: number;
  name: string;
  weapon: string;
  skills: Record<string, number>; // yalnız current
  sharpness: number;
  reachCm: number;
  legLengthCm: number;
  buildFactor: number;
  leftHanded: boolean;
  traits: string[];
  isHuman: boolean;
  aiTactic: Tactic;
  conditionBonus?: number; // yalnız insan
}

interface LivePlayedMatch {
  phase: "POOL" | "DE";
  round: string;
  aId: number;
  bId: number;
  aName: string;
  bName: string;
  scoreA: number;
  scoreB: number;
  winnerId: number;
  loserId: number;
  log: string[];
  involvesHuman: boolean;
  humanTactic?: Tactic;
  timeOffsetMin?: number; // insan maçları için turnuva-içi saat (14:00'dan dakika)
}

interface LiveDeRound {
  label: string;
  slots: number[];
  winners: (number | null)[]; // pair başına kazanan; null = insanın maçı (bekliyor)
  humanPairIndex: number;
  oppId: number;
  roundSize: number;
}

/**
 * Turnuva UI aşaması — ekran her seferinde TEK aşama gösterir (kullanıcı adım adım ilerler).
 * WAIT_*: maç bitince 10 sn geri sayım (sonuç/çatal hemen fırlamasın).
 */
type LiveStage =
  | "POOL_INTRO" // pul kuraları (maçlar başlamadan)
  | "POOL" // pul maçları oynanıyor
  | "WAIT_POOL" // son pul maçı bitti → 10 sn → pul sonucu
  | "POOL_RESULT" // pul kağıdı (poule)
  | "STANDINGS" // turnuva klasmanı (seeding)
  | "KO_DRAW" // eleme kurası (o turun eşleşmeleri)
  | "DE" // eleme maçı (sadece senin maçın)
  | "WAIT_DE" // eleme maçı bitti → 10 sn → sonraki çatal / sonuç
  | "DONE"; // turnuva sonucu

interface LiveState {
  version: 1;
  stage?: LiveStage;
  level: TournamentLevel;
  categoryId: string;
  ageCategory: string;
  quarter: number;
  week: number;
  seedKey: string;
  startTimeMs: number;
  humanId: number;
  combatants: LiveCombatant[];
  fatigue: Record<number, number>;
  pools: number[][];
  humanPoolOppOrder: number[];
  humanPoolIndex: number;
  poolEndOffsetMin: number;
  matches: LivePlayedMatch[];
  phase: "POOL" | "POOL_DONE" | "DE" | "DONE";
  ranking?: { playerId: number; seedRank: number }[];
  poolResults?: PoolPlayerResult[];
  deSlots?: number[];
  deRound?: LiveDeRound;
  deStep: number;
  byes: { round: string; timeOffsetMin: number }[];
  standings: { playerId: number; position: number }[];
  championId?: number;
  finalTournamentId?: number;
  earnedPoints?: number; // bu turnuvadan kazanılan ranking puanı
  newRank?: number | null; // turnuva sonrası Quarter Ranking sırası
  liveMatch?: LiveMatchProgress; // devam eden insan eleme maçı (periyot periyot)
  // Son kullanıcı aksiyonu: "play" ise ekranda izlenecek taze bir maç var → sıradaki aksiyon
  // (taktik/sonuç) o maç bitene kadar gizlenir. "reveal"/"enter" sonrası hemen gösterilir.
  lastAction?: "play" | "reveal" | "enter";
}

/** İnsanın canlı eleme maçının periyotlar arası durumu (devre arası taktik değişimi için). */
interface LiveMatchProgress {
  oppId: number;
  round: string;
  roundSize: number;
  humanPairIndex: number;
  periodsPlayed: number; // oynanan periyot sayısı; sıradaki = periodsPlayed + 1
  scoreHuman: number; // insan A tarafında (simulateOne'da humanId=aId)
  scoreOpp: number;
  clockSec: number; // birikmiş süre
  log: string[]; // birikmiş anlatım (periyot başlıkları dahil)
  prevLen: number; // önceki periyotların bittiği log uzunluğu (canlı akışta yalnız yeni periyot animasyonu)
  timeOffsetMin: number;
}

async function loadLive(): Promise<{
  gs: NonNullable<Awaited<ReturnType<typeof loadState>>>["gs"];
  human: NonNullable<Awaited<ReturnType<typeof loadState>>>["human"];
  ls: LiveState;
} | null> {
  const state = await loadState();
  if (!state || !state.gs.liveTournament) return null;
  return { gs: state.gs, human: state.human, ls: JSON.parse(state.gs.liveTournament) as LiveState };
}

async function saveLive(gsId: number, ls: LiveState): Promise<void> {
  await prisma.gameState.update({ where: { id: gsId }, data: { liveTournament: JSON.stringify(ls) } });
}

function nameOf(ls: LiveState, id: number): string {
  return ls.combatants.find((c) => c.id === id)?.name ?? formatPlayerCode(id);
}

function humanPoolNumber(ls: LiveState): number {
  return ls.pools.findIndex((p) => p.includes(ls.humanId)) + 1;
}

/** Snapshot'tan Combatant kurar (combat için; skills yalnız current kullanılır). */
function liveCombatant(ls: LiveState, id: number, tacticOverride?: Tactic): Combatant {
  const lc = ls.combatants.find((c) => c.id === id)!;
  const skills = {} as PlayerSkills;
  for (const def of SKILLS) {
    const cur = lc.skills[def.key] ?? 50;
    skills[def.key] = { current: cur, potential: cur, floor: 0, ceiling: 100 };
  }
  return {
    id: lc.id,
    name: lc.name,
    weapon: lc.weapon as Weapon,
    skills,
    fatigue: ls.fatigue[id] ?? 0,
    sharpness: lc.sharpness,
    conditionBonus: lc.conditionBonus,
    physical: { reachCm: lc.reachCm, legLengthCm: lc.legLengthCm, buildFactor: lc.buildFactor, leftHanded: lc.leftHanded },
    ageCategory: ls.ageCategory as Combatant["ageCategory"],
    traits: lc.traits as Combatant["traits"],
    tactic: tacticOverride ?? (lc.isHuman ? "BALANCED" : lc.aiTactic),
  };
}

/** Tek maçı simüle eder + state'i günceller (yorgunluk birikimi + maç kaydı). Deterministik tohum. */
function simulateOne(
  ls: LiveState,
  aId: number,
  bId: number,
  touches: number,
  phase: "POOL" | "DE",
  round: string,
  locale: Locale,
  humanTactic?: Tactic,
  timeOffsetMin?: number,
) {
  const involvesHuman = aId === ls.humanId || bId === ls.humanId;
  const a = liveCombatant(ls, aId, aId === ls.humanId ? humanTactic : undefined);
  const b = liveCombatant(ls, bId, bId === ls.humanId ? humanTactic : undefined);
  const tag = `${ls.seedKey}:${phase === "POOL" ? "pool" : "de"}:${round}:${Math.min(aId, bId)}-${Math.max(aId, bId)}`;
  const r = simulateMatch(a, b, createRng(tag), touches, locale);
  ls.fatigue[aId] = clamp((ls.fatigue[aId] ?? 0) + r.fatigueGain, 0, 100);
  ls.fatigue[bId] = clamp((ls.fatigue[bId] ?? 0) + r.fatigueGain, 0, 100);
  ls.matches.push({
    phase,
    round,
    aId,
    bId,
    aName: a.name,
    bName: b.name,
    scoreA: r.scoreA,
    scoreB: r.scoreB,
    winnerId: r.winnerId,
    loserId: r.loserId,
    log: r.log,
    involvesHuman,
    humanTactic: involvesHuman ? humanTactic : undefined,
    timeOffsetMin: involvesHuman ? timeOffsetMin : undefined,
  });
  return r;
}

function setChampion(ls: LiveState, id: number): void {
  ls.championId = id;
  if (!ls.standings.some((s) => s.position === 1)) ls.standings.push({ playerId: id, position: 1 });
  ls.phase = "DONE";
}

/** Pul biterken: kalan tüm pul maçlarını toplu simüle et → istatistik + FIE sıralaması (GDD 17.44). */
function finishPool(ls: LiveState, locale: Locale): void {
  const played = new Set(
    ls.matches.filter((m) => m.phase === "POOL").map((m) => `${Math.min(m.aId, m.bId)}-${Math.max(m.aId, m.bId)}`),
  );
  ls.pools.forEach((pool, pi) => {
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const key = `${Math.min(pool[i], pool[j])}-${Math.max(pool[i], pool[j])}`;
        if (!played.has(key)) simulateOne(ls, pool[i], pool[j], POOL_TOUCHES, "POOL", `Pul ${pi + 1}`, locale);
      }
    }
  });
  const stat = new Map<number, PoolPlayerResult>();
  ls.pools.forEach((pool, pi) => {
    for (const id of pool)
      stat.set(id, {
        playerId: id,
        name: nameOf(ls, id),
        poolNumber: pi + 1,
        matches: 0,
        wins: 0,
        losses: 0,
        touchesScored: 0,
        touchesReceived: 0,
        indicator: 0,
      });
  });
  for (const m of ls.matches) {
    if (m.phase !== "POOL") continue;
    const sa = stat.get(m.aId)!;
    const sb = stat.get(m.bId)!;
    sa.matches++;
    sb.matches++;
    sa.touchesScored += m.scoreA;
    sa.touchesReceived += m.scoreB;
    sb.touchesScored += m.scoreB;
    sb.touchesReceived += m.scoreA;
    if (m.winnerId === m.aId) {
      sa.wins++;
      sb.losses++;
    } else {
      sb.wins++;
      sa.losses++;
    }
  }
  const poolResults: PoolPlayerResult[] = [];
  for (const s of stat.values()) {
    s.indicator = s.touchesScored - s.touchesReceived;
    poolResults.push(s);
  }
  const tb = new Map(poolResults.map((r) => [r.playerId, createRng(`${ls.seedKey}:tiebreak:${r.playerId}`).next()]));
  const ranked = [...poolResults].sort((a, b) => {
    const va = a.matches ? a.wins / a.matches : 0;
    const vb = b.matches ? b.wins / b.matches : 0;
    if (vb !== va) return vb - va;
    if (b.indicator !== a.indicator) return b.indicator - a.indicator;
    if (b.touchesScored !== a.touchesScored) return b.touchesScored - a.touchesScored;
    return tb.get(a.playerId)! - tb.get(b.playerId)!;
  });
  ls.poolResults = poolResults;
  ls.ranking = ranked.map((r, i) => ({ playerId: r.playerId, seedRank: i + 1 }));
  ls.phase = "POOL_DONE";
}

/** Eleme turunu açar: insan-dışı maçları toplu oynar, insanın maçını "bekliyor" bırakır; bay'ları zincirler. */
function openDeRound(ls: LiveState, locale: Locale): void {
  for (;;) {
    const slots = ls.deSlots!;
    if (slots.length <= 1) {
      setChampion(ls, slots[0]);
      ls.deRound = undefined;
      return;
    }
    const label = roundLabel(slots.length);
    const winners: (number | null)[] = [];
    let humanPair = -1;
    let oppId = -1;
    for (let i = 0; i < slots.length; i += 2) {
      const x = slots[i];
      const y = slots[i + 1];
      const pair = i / 2;
      if (x === BYE && y === BYE) {
        winners[pair] = BYE;
        continue;
      }
      if (x === BYE) {
        winners[pair] = y;
        continue;
      }
      if (y === BYE) {
        winners[pair] = x;
        continue;
      }
      if (x === ls.humanId || y === ls.humanId) {
        humanPair = pair;
        oppId = x === ls.humanId ? y : x;
        winners[pair] = null; // insan oynayınca dolacak
        continue;
      }
      const r = simulateOne(ls, x, y, deFormat(ls.ageCategory).touches, "DE", label, locale);
      winners[pair] = r.winnerId;
      ls.standings.push({ playerId: r.loserId, position: slots.length / 2 + 1 });
    }
    if (humanPair >= 0) {
      ls.deRound = { label, slots, winners, humanPairIndex: humanPair, oppId, roundSize: slots.length };
      return;
    }
    // İnsan bu turda bay geçti → sonraki tura taşı, döngü devam.
    if (slots.includes(ls.humanId)) {
      ls.byes.push({ round: label, timeOffsetMin: ls.poolEndOffsetMin + ls.deStep * 5 });
      ls.deStep++;
    }
    ls.deSlots = winners.filter((w): w is number => w !== null && w !== BYE);
  }
}

/** İnsan elendikten sonra tablonun kalanını (yalnız AI) toplu tamamlar → şampiyon + dereceler. */
function finishBracketBulk(ls: LiveState, locale: Locale): void {
  let slots = ls.deSlots!;
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
      const r = simulateOne(ls, x, y, deFormat(ls.ageCategory).touches, "DE", label, locale);
      ls.standings.push({ playerId: r.loserId, position: slots.length / 2 + 1 });
      winners.push(r.winnerId);
    }
    slots = winners;
  }
  ls.deSlots = slots;
  setChampion(ls, slots[0]);
}

/**
 * Canlı turnuvayı başlatır: combatant snapshot'ları + pul çekimi. Hiçbir maç oynanmaz; ekranda
 * sırayla oynanır. Kayıt tüketilir; hafta turnuva bitince ilerler (finalize).
 */
export async function startLiveTournament(
  gs: { id: number; seed: string; currentDate: Date; dayIndex: number },
  human: NonNullable<Awaited<ReturnType<typeof loadState>>>["human"],
  level: TournamentLevel,
): Promise<void> {
  const quarter = quarterOf(gs.dayIndex);
  const week = monthOfQuarter(gs.dayIndex); // "hafta" alanı artık ayı (h1..h12) saklar
  const base = currentIdentity(human, quarter); // o anki yaş kategorisi

  const aiPlayers = await prisma.player.findMany({
    where: { isAI: true, gender: human.gender, weapon: human.weapon },
    include: { skills: true },
    take: AI_COUNT,
  });

  const humanPsych = psychologyOf(human);
  const humanConditionBonus =
    psychologyCombatModifier(humanPsych) +
    traitCombatModifier(parseTraits(human.traits)) +
    equipmentCombatModifier(human.equipmentLevel);

  const snapshot = (
    p: {
      id: number;
      firstName: string;
      lastName: string;
      weapon: string;
      sharpness: number;
      birthDate: Date;
      adultHeightCm: number;
      reachBiasCm: number;
      buildFactor: number;
      leftHanded: boolean;
      traits: string;
      skills: SkillRow[];
    },
    isHuman: boolean,
  ): LiveCombatant => {
    const ph = computePhysique(geneticsOf(p), currentAge(p.birthDate, quarter));
    const sk = rowsToSkills(p.skills);
    const skills: Record<string, number> = {};
    for (const def of SKILLS) skills[def.key] = sk[def.key].current;
    const traits = parseTraits(p.traits);
    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      weapon: p.weapon,
      skills,
      sharpness: p.sharpness,
      reachCm: ph.reachCm,
      legLengthCm: ph.legLengthCm,
      buildFactor: p.buildFactor,
      leftHanded: p.leftHanded,
      traits,
      isHuman,
      aiTactic: tacticFromTraits(traits),
      conditionBonus: isHuman ? humanConditionBonus : undefined,
    };
  };

  const combatants: LiveCombatant[] = [snapshot(human, true), ...aiPlayers.map((p) => snapshot(p, false))];
  if (combatants.length < 2) throw new Error("Turnuva için yeterli rakip yok.");

  const dateKey = gs.currentDate.toISOString().slice(0, 10);
  const seedKey = `${gs.seed}:tournament:${level}:${dateKey}`;

  // Pul çekimi (deterministik, GDD 17.41).
  const drawRng = createRng(`${seedKey}:draw`);
  const shuffled = drawRng.shuffle(combatants.map((c) => c.id));
  const sizes = computePoolSizes(shuffled.length, POOL_SIZE);
  const pools: number[][] = [];
  let cursor = 0;
  for (const s of sizes) {
    pools.push(shuffled.slice(cursor, cursor + s));
    cursor += s;
  }
  const humanPool = pools.find((p) => p.includes(human.id))!;
  const humanPoolOppOrder = humanPool.filter((id) => id !== human.id);

  const fatigue: Record<number, number> = {};
  fatigue[human.id] = human.fatigue;
  for (const p of aiPlayers) fatigue[p.id] = p.fatigue;

  const startTime = new Date(gs.currentDate);
  startTime.setUTCHours(14, 0, 0, 0); // turnuva 14:00 başlar (immersion)

  const ls: LiveState = {
    version: 1,
    level,
    categoryId: base.categoryId,
    ageCategory: base.ageCategory,
    quarter,
    week,
    seedKey,
    startTimeMs: startTime.getTime(),
    humanId: human.id,
    combatants,
    fatigue,
    pools,
    humanPoolOppOrder,
    humanPoolIndex: 0,
    poolEndOffsetMin: humanPoolOppOrder.length * 2 + 5,
    matches: [],
    phase: "POOL",
    stage: "POOL_INTRO", // önce pul kuraları görünür, sonra maçlar
    deStep: 0,
    byes: [],
    standings: [],
  };

  await prisma.gameState.update({
    where: { id: gs.id },
    data: { liveTournament: JSON.stringify(ls) },
  });
}

/** Sıradaki insan maçını seçilen taktikle oynar (pul veya eleme). Faz sonu geçişlerini yönetir. */
export async function playLiveMatch(tactic: Tactic): Promise<void> {
  const live = await loadLive();
  if (!live) throw new Error("Aktif turnuva yok.");
  const { gs, human, ls } = live;
  const locale = await getLocale();

  if (ls.phase === "POOL") {
    const oppId = ls.humanPoolOppOrder[ls.humanPoolIndex];
    if (oppId == null) throw new Error("Sıradaki pul maçı yok.");
    simulateOne(ls, ls.humanId, oppId, POOL_TOUCHES, "POOL", `Pul ${humanPoolNumber(ls)}`, locale, tactic, (ls.humanPoolIndex + 1) * 2);
    ls.humanPoolIndex++;
    ls.lastAction = "play"; // taze maç → izlenmeden sıradaki taktik açılmaz
    // Son pul maçıysa: WAIT_POOL (maç izlenir → 10 sn → pul sonucu). Böylece son maç bitmeden
    // pul aşaması sonucu ekrana düşmez. Değilse pul maçları devam eder.
    ls.stage = ls.humanPoolIndex >= ls.humanPoolOppOrder.length ? "WAIT_POOL" : "POOL";
    await saveLive(gs.id, ls);
    return;
  }

  if (ls.phase === "DE") {
    // Eleme maçı periyot periyot oynanır (GDD 18.8: 3×3 dk). Devre arası taktik değişebilir.
    let prog = ls.liveMatch;
    if (!prog) {
      const rc = ls.deRound;
      if (!rc) throw new Error("Sıradaki eleme maçı yok.");
      prog = {
        oppId: rc.oppId,
        round: rc.label,
        roundSize: rc.roundSize,
        humanPairIndex: rc.humanPairIndex,
        periodsPlayed: 0,
        scoreHuman: 0,
        scoreOpp: 0,
        clockSec: 0,
        log: [],
        prevLen: 0,
        timeOffsetMin: ls.poolEndOffsetMin + ls.deStep * 5,
      };
    }

    const fmt = deFormat(ls.ageCategory); // U10: 10 tuş/2 periyot, üstü: 15 tuş/3 periyot
    const periodNo = prog.periodsPlayed + 1;
    const a = liveCombatant(ls, ls.humanId, tactic); // bu periyodun taktiği
    const b = liveCombatant(ls, prog.oppId);
    const oppTactic = ls.combatants.find((c) => c.id === prog!.oppId)?.aiTactic ?? "BALANCED";
    const base = `${ls.seedKey}:de:${prog.round}:${Math.min(ls.humanId, prog.oppId)}-${Math.max(ls.humanId, prog.oppId)}`;

    prog.prevLen = prog.log.length;
    // U10'da 1. periyot 5 tuşta biter (FIE gençler); diğer periyotlarda tavan = maç hedefi.
    const periodCap = fmt.touches === 10 && periodNo === 1 ? 5 : fmt.touches;
    const pr = simulatePeriod(a, b, createRng(`${base}:p${periodNo}`), {
      target: fmt.touches,
      startA: prog.scoreHuman,
      startB: prog.scoreOpp,
      startClockSec: prog.clockSec,
      periodEndSec: periodNo * PERIOD_SECONDS,
      includeHeader: periodNo === 1,
      periodCap,
      locale,
    });
    // Periyot başlığı + tuşlar.
    if (periodNo === 1 && pr.log.length > 0) prog.log.push(pr.log[0]); // "Maç gücü …"
    const periodHead =
      locale === "en"
        ? `▸ Period ${periodNo} — you: ${t(locale, `tactic.${tactic}`)}, opp: ${t(locale, `tactic.${oppTactic}`)}`
        : `▸ ${periodNo}. Periyot — sen: ${t(locale, `tactic.${tactic}`)}, rakip: ${t(locale, `tactic.${oppTactic}`)}`;
    prog.log.push(periodHead);
    prog.log.push(...pr.log.slice(periodNo === 1 ? 1 : 0));
    prog.scoreHuman = pr.scoreA;
    prog.scoreOpp = pr.scoreB;
    prog.clockSec = pr.clockSec;
    prog.periodsPlayed = periodNo;

    let decided = pr.decided;
    let winnerId = pr.winnerId;
    if (!decided && periodNo >= fmt.periods) {
      // 3 periyot bitti: skor farklıysa yüksek kazanır, eşitse altın tuş (la belle).
      if (pr.scoreA !== pr.scoreB) {
        winnerId = pr.scoreA > pr.scoreB ? ls.humanId : prog.oppId;
        prog.log.push(
          locale === "en"
            ? `⏱ Time up — ${nameOf(ls, winnerId)} finished ahead ${prog.scoreHuman}-${prog.scoreOpp}.`
            : `⏱ Süre doldu — ${nameOf(ls, winnerId)} ${prog.scoreHuman}-${prog.scoreOpp} önde bitirdi.`,
        );
      } else {
        const lb = simulateLaBelle(a, b, createRng(`${base}:belle`), { startA: pr.scoreA, startB: pr.scoreB, locale });
        prog.log.push(...lb.log);
        prog.scoreHuman = lb.scoreA;
        prog.scoreOpp = lb.scoreB;
        winnerId = lb.winnerId;
      }
      decided = true;
    }

    if (!decided) {
      // Devre arası — sonraki periyot için taktik seçilecek (periyot izlenmeden açılmaz).
      ls.liveMatch = prog;
      ls.lastAction = "play";
      ls.stage = "DE"; // maç sürüyor (devre arası) — henüz WAIT_DE değil
      await saveLive(gs.id, ls);
      return;
    }

    // Maç bitti → kalıcı maç kaydına yaz + tabloyu ilerlet.
    const loserId = winnerId === ls.humanId ? prog.oppId : ls.humanId;
    prog.log.push(
      locale === "en"
        ? `🏁 ${nameOf(ls, winnerId!)} won the match ${prog.scoreHuman}-${prog.scoreOpp}.`
        : `🏁 ${nameOf(ls, winnerId!)} maçı ${prog.scoreHuman}-${prog.scoreOpp} kazandı.`,
    );
    const gain = Math.max(3, Math.round(fmt.touches * 0.55));
    ls.fatigue[ls.humanId] = clamp((ls.fatigue[ls.humanId] ?? 0) + gain, 0, 100);
    ls.fatigue[prog.oppId] = clamp((ls.fatigue[prog.oppId] ?? 0) + gain, 0, 100);
    ls.matches.push({
      phase: "DE",
      round: prog.round,
      aId: ls.humanId,
      bId: prog.oppId,
      aName: nameOf(ls, ls.humanId),
      bName: nameOf(ls, prog.oppId),
      scoreA: prog.scoreHuman,
      scoreB: prog.scoreOpp,
      winnerId: winnerId!,
      loserId,
      log: prog.log,
      involvesHuman: true,
      humanTactic: tactic,
      timeOffsetMin: prog.timeOffsetMin,
    });

    const rc = ls.deRound!;
    rc.winners[rc.humanPairIndex] = winnerId!;
    ls.standings.push({ playerId: loserId, position: rc.roundSize / 2 + 1 });
    ls.deStep++;
    const next = rc.winners.filter((w): w is number => w !== null && w !== BYE);
    ls.deRound = undefined;
    ls.liveMatch = undefined;
    if (winnerId !== ls.humanId) {
      ls.deSlots = next;
      if (next.length <= 1) setChampion(ls, next[0]);
      else finishBracketBulk(ls, locale);
    } else if (next.length <= 1) {
      setChampion(ls, ls.humanId);
    } else {
      ls.deSlots = next;
      openDeRound(ls, locale);
    }
    ls.lastAction = "play"; // biten maç izlenmeden sonraki tur/sonuç açılmaz
    ls.stage = "WAIT_DE"; // maç izlenir → 10 sn → sonraki çatal / turnuva sonucu
    if (ls.championId != null) await finalizeLive(gs, human, ls); // şampiyon set ⇔ turnuva bitti
    await saveLive(gs.id, ls);
    return;
  }

  throw new Error("Şu an oynanacak maç yok.");
}

/** Pul sıralamasına göre eleme tablosunu (deSlots) kurar ve ilk turu açar. Kaydetmez. */
function enterBracketCore(ls: LiveState, locale: Locale): void {
  const ranking = ls.ranking!;
  const order = bracketSeedOrder(bracketSize(ranking.length));
  ls.deSlots = order.map((seedNo) => (seedNo <= ranking.length ? ranking[seedNo - 1].playerId : BYE));
  ls.phase = "DE";
  ls.deStep = 0;
  openDeRound(ls, locale);
}

/**
 * Tek "İlerle/Devam" aksiyonu — aşamalar arasında geçiş (kullanıcı butonu veya 10 sn geri sayım).
 * Ekran her zaman TEK aşama gösterdiği için akış tümüyle bu imleçle sürer.
 */
export async function advanceLiveStage(): Promise<void> {
  const live = await loadLive();
  if (!live) throw new Error("Aktif turnuva yok.");
  const { gs, human, ls } = live;
  const locale = await getLocale();
  switch (ls.stage) {
    case "POOL_INTRO":
      ls.stage = "POOL"; // pul maçlarına başla
      break;
    case "WAIT_POOL":
      finishPool(ls, locale); // pul sonucu + FIE sıralaması hesaplanır (phase → POOL_DONE)
      ls.lastAction = "reveal";
      ls.stage = "POOL_RESULT";
      break;
    case "POOL_RESULT":
      ls.stage = "STANDINGS";
      break;
    case "STANDINGS":
      ls.stage = "KO_DRAW";
      break;
    case "KO_DRAW":
      if (ls.phase === "POOL_DONE") {
        enterBracketCore(ls, locale); // ilk tur tablosu + açılış
        ls.lastAction = "enter";
        ls.stage = ls.championId != null ? "WAIT_DE" : "DE";
        if (ls.championId != null) await finalizeLive(gs, human, ls); // tek kişilik tablo vb. uç durum
      } else {
        ls.lastAction = "enter"; // sıradaki eleme maçının taktiği hemen görünür
        ls.stage = "DE";
      }
      break;
    case "WAIT_DE":
      ls.stage = ls.phase === "DONE" ? "DONE" : "KO_DRAW";
      break;
    default:
      break; // POOL / DE gibi aşamalar maç aksiyonuyla ilerler
  }
  await saveLive(gs.id, ls);
}

/** Biten canlı turnuvayı temizler (kullanıcı kariyere döner). */
export async function leaveLiveTournament(): Promise<void> {
  const gs = await prisma.gameState.findFirst();
  if (!gs) return;
  await prisma.gameState.update({ where: { id: gs.id }, data: { liveTournament: null } });
}

/** Canlı turnuva bitince kalıcılaştırır (permanent tablolar + ekonomi/ranking/başarı + hafta ilerler). */
async function finalizeLive(
  gs: { id: number; seed: string; currentDate: Date; dayIndex: number },
  human: NonNullable<Awaited<ReturnType<typeof loadState>>>["human"],
  ls: LiveState,
): Promise<void> {
  const base = currentIdentity(human, quarterOf(gs.dayIndex)); // o anki kategori
  const outcome: TournamentOutcome = {
    pools: ls.poolResults ?? [],
    ranking: (ls.ranking ?? []).map((r) => ({ playerId: r.playerId, name: nameOf(ls, r.playerId), seedRank: r.seedRank })),
    matches: ls.matches.map(
      (m): TournamentMatch => ({
        phase: m.phase,
        round: m.round,
        aName: m.aName,
        bName: m.bName,
        aId: m.aId,
        bId: m.bId,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        winnerId: m.winnerId,
        loserId: m.loserId,
        log: m.log,
        fatigueGain: 0,
        analysis: { effA: 0, effB: 0, winProbA: 0, modsA: [], modsB: [] },
      }),
    ),
    standings: ls.standings,
    championId: ls.championId ?? ls.humanId,
    finalFatigue: ls.fatigue,
  };
  const fin = await finalizeTournament(gs, human, ls.level, base, outcome, ls.seedKey);
  ls.finalTournamentId = fin.id;
  ls.earnedPoints = fin.earnedPoints;
  ls.newRank = fin.newRank;
}

/** Canlı turnuva görünümü (etkileşimli ekran). */
export interface LiveMatchView {
  round: string;
  phase: "POOL" | "DE";
  aName: string;
  bName: string;
  scoreA: number;
  scoreB: number;
  aIsHuman: boolean;
  bIsHuman: boolean;
  log: string[];
  timeLabel: string;
}
export interface LiveTournamentDTO {
  name: string;
  categoryId: string;
  phase: LiveState["phase"];
  stage: LiveStage; // ekranın gösterdiği tek aşama
  poolIntro?: { poolNumber: number; members: { name: string; isHuman: boolean }[] } | null; // pul kuraları
  roundName?: string | null; // KO_DRAW: o turun adı (Son 32…)
  roundDraw?: { aName: string; bName: string; aIsHuman: boolean; bIsHuman: boolean }[]; // KO_DRAW: eşleşmeler
  poolPlayed: number;
  poolTotal: number;
  poolAwaitingResult: boolean; // tüm pul maçları oynandı, sonuç henüz açıklanmadı
  freshMatch: boolean; // son aksiyon maç oynamaktı → izlenecek taze maç var (sıradaki aksiyon gizli)
  player: { condition: number; sharpness: number; overall: number }; // üst bilgi çubuğu
  played: LiveMatchView[];
  byes: { round: string; timeLabel: string }[];
  pending: { round: string; phase: "POOL" | "DE"; oppName: string; timeLabel: string; matchNo?: number } | null;
  upcoming: { oppName: string; timeLabel: string }[];
  liveMatch?: {
    round: string;
    oppName: string;
    scoreHuman: number;
    scoreOpp: number;
    periodsPlayed: number;
    totalPeriods: number;
    nextPeriod: number;
    log: string[];
    prevLen: number; // canlı akışta yalnız son periyodu animasyonla göster
  } | null;
  pools?: PoolViewDTO[];
  poolSheets?: PoolSheetDTO[]; // pul kağıdı (poule) — pul bitince
  seedRank?: number | null;
  seeding?: { name: string; seedRank: number; isHuman: boolean }[]; // pul sonrası klasman (seeding)
  standings?: { name: string; position: number; isHuman: boolean }[];
  championName?: string;
  finalPosition?: number;
  finalTournamentId?: number;
  earnedPoints?: number; // kazanılan ranking puanı (klasman)
  newRank?: number | null; // turnuva sonrası Quarter Ranking sırası
}

function clockLabel(ls: LiveState, offsetMin: number): string {
  const d = new Date(ls.startTimeMs + offsetMin * 60000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export async function getLiveTournament(): Promise<LiveTournamentDTO | null> {
  const live = await loadLive();
  if (!live) return null;
  const ls = live.ls;
  const locale = await getLocale();
  const humanFatigue = ls.fatigue[ls.humanId] ?? live.human.fatigue; // turnuva-içi güncel yorgunluk
  const playerStats = {
    condition: Math.round(100 - clamp(humanFatigue, 0, 100)),
    sharpness: Math.round(live.human.sharpness),
    overall: roundSkill(overall(rowsToSkills(live.human.skills))),
  };
  const played: LiveMatchView[] = ls.matches
    .filter((m) => m.involvesHuman)
    .map((m) => ({
      round: localizeRound(locale, m.round),
      phase: m.phase,
      aName: m.aName,
      bName: m.bName,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      aIsHuman: m.aId === ls.humanId,
      bIsHuman: m.bId === ls.humanId,
      log: m.log,
      timeLabel: clockLabel(ls, m.timeOffsetMin ?? 0),
    }));
  const byes = ls.byes.map((b) => ({ round: localizeRound(locale, b.round), timeLabel: clockLabel(ls, b.timeOffsetMin) }));

  let pending: LiveTournamentDTO["pending"] = null;
  const upcoming: { oppName: string; timeLabel: string }[] = [];
  if (ls.phase === "POOL" && ls.humanPoolIndex < ls.humanPoolOppOrder.length) {
    const idx = ls.humanPoolIndex;
    pending = {
      round: t(locale, "round.pool", { n: humanPoolNumber(ls) }),
      phase: "POOL",
      oppName: nameOf(ls, ls.humanPoolOppOrder[idx]),
      timeLabel: clockLabel(ls, (idx + 1) * 2),
      matchNo: idx + 1,
    };
    for (let k = idx + 1; k < ls.humanPoolOppOrder.length; k++) {
      upcoming.push({ oppName: nameOf(ls, ls.humanPoolOppOrder[k]), timeLabel: clockLabel(ls, (k + 1) * 2) });
    }
  } else if (ls.phase === "DE" && ls.deRound && !ls.liveMatch) {
    pending = {
      round: localizeRound(locale, ls.deRound.label),
      phase: "DE",
      oppName: nameOf(ls, ls.deRound.oppId),
      timeLabel: clockLabel(ls, ls.poolEndOffsetMin + ls.deStep * 5),
    };
  }

  const dto: LiveTournamentDTO = {
    name: tournamentDisplayName(locale, ls.ageCategory, ls.level),
    categoryId: ls.categoryId,
    phase: ls.phase,
    stage: ls.stage ?? (ls.phase === "DONE" ? "DONE" : ls.phase === "DE" ? "DE" : "POOL"),
    poolPlayed: ls.humanPoolIndex,
    poolAwaitingResult: ls.phase === "POOL" && ls.humanPoolIndex >= ls.humanPoolOppOrder.length,
    freshMatch: ls.lastAction === "play",
    poolTotal: ls.humanPoolOppOrder.length,
    player: playerStats,
    played,
    byes,
    pending,
    upcoming,
    liveMatch: ls.liveMatch
      ? {
          round: localizeRound(locale, ls.liveMatch.round),
          oppName: nameOf(ls, ls.liveMatch.oppId),
          scoreHuman: ls.liveMatch.scoreHuman,
          scoreOpp: ls.liveMatch.scoreOpp,
          periodsPlayed: ls.liveMatch.periodsPlayed,
          totalPeriods: deFormat(ls.ageCategory).periods,
          nextPeriod: ls.liveMatch.periodsPlayed + 1,
          log: ls.liveMatch.log,
          prevLen: ls.liveMatch.prevLen,
        }
      : null,
  };

  if (ls.phase !== "POOL") {
    dto.pools = buildPoolsView(
      (ls.poolResults ?? []).map((p) => ({
        playerId: p.playerId,
        poolNumber: p.poolNumber,
        wins: p.wins,
        losses: p.losses,
        indicator: p.indicator,
      })),
      new Map(ls.combatants.map((c) => [c.id, c.name])),
      ls.humanId,
    );
    const membership = new Map<number, number>();
    ls.pools.forEach((pool, pi) => pool.forEach((id) => membership.set(id, pi + 1)));
    dto.poolSheets = buildPoolSheets(
      ls.matches.filter((m) => m.phase === "POOL").map((m) => ({ aId: m.aId, bId: m.bId, scoreA: m.scoreA, scoreB: m.scoreB })),
      membership,
      new Map(ls.combatants.map((c) => [c.id, c.name])),
      ls.humanId,
    );
    dto.seedRank = ls.ranking?.find((r) => r.playerId === ls.humanId)?.seedRank ?? null;

    // Pul sonrası klasman (seeding) — sıralı liste (1..N).
    if (ls.ranking) {
      dto.seeding = [...ls.ranking]
        .sort((a, b) => a.seedRank - b.seedRank)
        .map((r) => ({ name: nameOf(ls, r.playerId), seedRank: r.seedRank, isHuman: r.playerId === ls.humanId }));
    }

    // KO_DRAW aşaması: o an oynanacak turun eşleşmelerini (kurasını) göster.
    // İlk tur: pul sıralamasından (ranking). Sonraki turlar: açılmış deRound'dan.
    if (dto.stage === "KO_DRAW") {
      let slots: number[] = [];
      let roundLbl = "";
      if (ls.phase === "POOL_DONE" && ls.ranking) {
        const ranking = ls.ranking;
        const size = bracketSize(ranking.length);
        slots = bracketSeedOrder(size).map((s) => (s <= ranking.length ? ranking[s - 1].playerId : BYE));
        roundLbl = roundLabel(size);
      } else if (ls.deRound) {
        slots = ls.deRound.slots;
        roundLbl = ls.deRound.label;
      }
      const roundDraw: NonNullable<LiveTournamentDTO["roundDraw"]> = [];
      for (let i = 0; i < slots.length; i += 2) {
        const x = slots[i];
        const y = slots[i + 1];
        roundDraw.push({
          aName: x === BYE ? t(locale, "canli.bye") : nameOf(ls, x),
          bName: y === BYE ? t(locale, "canli.bye") : nameOf(ls, y),
          aIsHuman: x === ls.humanId,
          bIsHuman: y === ls.humanId,
        });
      }
      dto.roundDraw = roundDraw;
      dto.roundName = localizeRound(locale, roundLbl);
    }
  }

  // Pul kuraları (POOL_INTRO): insanın havuzu + üyeleri.
  if (dto.stage === "POOL_INTRO") {
    const pi = ls.pools.findIndex((p) => p.includes(ls.humanId));
    if (pi >= 0) {
      dto.poolIntro = {
        poolNumber: pi + 1,
        members: ls.pools[pi].map((id) => ({ name: nameOf(ls, id), isHuman: id === ls.humanId })),
      };
    }
  }
  if (ls.phase === "DONE") {
    dto.standings = [...ls.standings]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ name: nameOf(ls, s.playerId), position: s.position, isHuman: s.playerId === ls.humanId }));
    dto.championName = ls.championId != null ? nameOf(ls, ls.championId) : "?";
    dto.finalPosition = ls.standings.find((s) => s.playerId === ls.humanId)?.position;
    dto.finalTournamentId = ls.finalTournamentId;
    dto.earnedPoints = ls.earnedPoints;
    dto.newRank = ls.newRank;
  }
  return dto;
}

/** Canlı turnuva bitince kalıcılaştırır: permanent tablolar + ekonomi/ranking/başarı + hafta ilerler. */
async function finalizeTournament(
  gs: { id: number; seed: string; currentDate: Date; dayIndex: number },
  human: NonNullable<Awaited<ReturnType<typeof loadState>>>["human"],
  level: TournamentLevel,
  base: ReturnType<typeof currentIdentity>,
  outcome: TournamentOutcome,
  seedKey: string,
): Promise<{ id: number; earnedPoints: number; newRank: number | null }> {
  const quarter = quarterOf(gs.dayIndex);
  const week = monthOfQuarter(gs.dayIndex); // Tournament.week alanı artık ayı saklar
  const categoryId = base.categoryId;
  const tournamentName = `${base.ageCategory} ${TOURNAMENT_LABEL_TR[level]}`;
  const positionByPlayer = new Map(outcome.standings.map((s) => [s.playerId, s.position]));
  const seedByPlayer = new Map(outcome.ranking.map((r) => [r.playerId, r.seedRank]));
  const humanPsych = psychologyOf(human);

  // İnsan oyuncu: yarışma keskinlik kazancı (GDD 14.80) + hafta sonu sakatlık kontrolü.
  const humanFinalFatigue = clamp(outcome.finalFatigue[human.id] ?? human.fatigue, 0, 100);
  const humanSharpness = applySharpness(human.sharpness, COMPETITION_SHARPNESS_GAIN);
  const injury = rollInjury(createRng(`${seedKey}:injury`), humanFinalFatigue, base.age);

  // Ödül (Economy, GDD 5.14) + turnuva sonrası psikoloji (GDD 18.59).
  const humanPosition = positionByPlayer.get(human.id) ?? outcome.pools.length;
  const prize = prizeFor(level, humanPosition);
  const postPsych = psychAfterTournament(humanPsych, humanPosition, outcome.pools.length);

  const txResult = await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({
      data: { name: tournamentName, categoryId, level, quarter, week, date: gs.currentDate, status: "FINISHED" },
    });

    for (const c of outcome.pools) {
      await tx.tournamentParticipant.create({
        data: {
          tournamentId: tournament.id,
          playerId: c.playerId,
          seed: seedByPlayer.get(c.playerId) ?? 0,
          seedRank: seedByPlayer.get(c.playerId) ?? null,
          finalPosition: positionByPlayer.get(c.playerId) ?? null,
          poolNumber: c.poolNumber,
          wins: c.wins,
          losses: c.losses,
          touchesScored: c.touchesScored,
          touchesReceived: c.touchesReceived,
          indicator: c.indicator,
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
    for (const c of outcome.pools) {
      await tx.player.update({
        where: { id: c.playerId },
        data: { fatigue: clamp(outcome.finalFatigue[c.playerId] ?? 0, 0, 100) },
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
        injuryDaysRemaining: injury.injured ? injury.weeks * INJURY_DAYS_PER_WEEK : 0,
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

    // Turnuva gününden bir sonraki güne geç (dünya + gün ilerler).
    await worldAdvanceTx(tx, gs, gs.dayIndex + 1, gs.seed);
    return { id: tournament.id, humanNewRank };
  });

  return {
    id: txResult.id,
    earnedPoints: rankingPointsForPosition(humanPosition, level),
    newRank: txResult.humanNewRank,
  };
}

export interface AdvanceResult {
  live?: boolean; // canlı turnuva başladıysa → turnuva ekranına yönlendir
}
