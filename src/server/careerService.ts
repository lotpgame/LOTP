/**
 * Career Service — Data Service katmanı (GDD 22.64: Engine → Data Service → Database).
 *
 * Saf engine'leri (src/engine/*) veritabanına bağlar: veriyi yükler, engine fonksiyonunu
 * düz veriyle çağırır, sonucu kalıcılaştırır. Kritik hesap sunucuda (güvenlik). M1 dikey
 * dilim akışı: kariyer oluştur → gün/antrenman → turnuva → ranking.
 */
import { cookies } from "next/headers";
import { COUNTRIES, continentOfCountry, countryByCode, citiesForCountry, clubNameFor } from "@/engine/geo";
import { serverEventDay, serverEventStartMs, serverWorldDay, worldClockConfig } from "./world";
import {
  createLiveTournament,
  getLiveView,
  submitLiveTactic,
  tickLiveTournament,
  type LiveEntrant,
  type LiveViewDTO,
  type TacticSubmitResult,
} from "./liveTournament";
import { applyTraitEvolution } from "./traitEvolution";
import { MAX_FIELD, deRoundLabel } from "@/engine/tournament/live";
import { LIVE_POOL_STEPS, LIVE_RESULTS_STEP, liveStepAtMs } from "@/engine/schedule";
import { MS_PER_GAME_DAY, worldDayStartMs, worldEventStartMs } from "@/engine/worldclock";
import { prisma } from "@/db";
import {
  ageToCategory,
  clamp,
  computeAge,
  formatPlayerCode,
  makeCategoryId,
  roundSkill,
  TOURNAMENT_LABEL_TR,
  type AgeCategory,
  type Gender,
  type SkillCategory,
  type TournamentLevel,
  type Weapon,
} from "@/engine/domain";
import { createRng } from "@/engine/probability";
import { pickAvatar } from "@/engine/avatars";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import {
  SKILLS,
  generateStartingSkills,
  growSkill,
  skillAgeCeiling,
  overall,
  type PlayerSkills,
  type SkillKey,
  type SkillValue,
} from "@/engine/skill";
import { applyTraining, TRAINING_TYPES, type TrainingType } from "@/engine/training";
import { parseSkillQuarterBase, rollSkillQuarterBase } from "@/engine/skill/quarterBase";
import { START_AGE, createPlayerSchema, deriveIdentity, generateAiOpponents } from "@/engine/player";
import { firstNamesFor, lastNamesFor } from "@/engine/player/names";
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
import {
  TRAINING_XP,
  experienceCombatModifier,
  experienceForTournament,
  rankEntries,
  rankingPointsForPosition,
  levelGivesRankingPoints,
  rankingScopeForLevel,
} from "@/engine/ranking";
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
/** Turnuva ev sahibi şehri: İl = oyuncunun KENDİ şehri; Ulusal/Open = oyuncunun ÜLKESİNİN bir şehri (o güne göre
 * deterministik, herkes aynı görür); Satellite/GP = dünya şehri; Kıta/Dünya Kupası = şimdilik şehirsiz. */
/** scopeKey'in coğrafi parçası (İl "TR#Kocaeli"; Türkiye/Open "TR"; uluslararası "WORLD"/kıta) — Ranking scope için. */
function geoFromScopeKey(scopeKey: string | null): string {
  return scopeKey?.split(":")[1] ?? "";
}

/** scopeKey'deki coğrafi kapsamdan ülke kodunu çıkarır (İl "TR#Şehir" → "TR"; Türkiye/Open "TR"; uluslararası "WORLD"). */
function countryCodeFromScopeKey(scopeKey: string | null): string | null {
  const geo = scopeKey?.split(":")[1] ?? "";
  if (!geo || geo === "WORLD") return null;
  return geo.split("#")[0] || null;
}

function tournamentHostCity(
  level: TournamentLevel,
  worldDay: number,
  playerCity: string,
  countryCode: string | null,
): string | null {
  if (level === "IL") return playerCity || null; // İl = oyuncunun kendi şehri (şehir-kapsamlı)
  if (level === "TURKIYE" || level === "OPEN") {
    // Ulusal/Open = oyuncunun kendi ÜLKESİNİN şehirlerinden (ev sahibi), o güne göre deterministik.
    const cities = countryCode ? citiesForCountry(countryCode) : [];
    const pool = cities.length > 0 ? [...cities] : [playerCity || countryCode || "?"];
    return createRng(`host:${level}:${countryCode ?? "?"}:${worldDay}`).pick(pool);
  }
  if (level === "SATELLITE" || level === "GRAND_PRIX") {
    // Uluslararası = dünya şehri (tüm ülkelerden), deterministik.
    const all = COUNTRIES.flatMap((c) => [...c.cities]);
    return createRng(`host:${level}:${worldDay}`).pick(all);
  }
  return null; // EUROPEAN / WORLD_CUP — şimdilik şehirsiz
}

/** scopeKey'den (İl'de "IL:TR#Şehir:…") + worldDay'den ev sahibi şehir — sonuç/geçmiş sayfaları için (oyuncunun
 * şehrini ayrıca sorgulamadan). İl'de scopeKey'deki şehir, diğerlerinde ülke/deterministik. */
function tournamentHostFrom(level: TournamentLevel, worldDay: number, scopeKey: string | null): string | null {
  if (level === "IL") {
    const geo = scopeKey?.split(":")[1] ?? "";
    return geo.includes("#") ? geo.split("#")[1] : null;
  }
  return tournamentHostCity(level, worldDay, "", countryCodeFromScopeKey(scopeKey));
}

/** Turnuva görünen adı: İl'de şehir adı "İl"in YERİNE geçer ("U10 Kocaeli Şampiyonası"); ULUSAL'da oyuncunun
 * ÜLKE adı ("U10 Almanya Şampiyonası · Berlin"); Open/uluslararasında seviye adı; hepsinde varsa "· ev sahibi". */
function tournamentDisplayName(
  locale: Locale,
  ageCategory: string,
  level: TournamentLevel,
  host: string | null = null,
  countryCode: string | null = null,
): string {
  if (level === "IL" && host) return `${ageCategory} ${host} ${t(locale, "tournament.cityChamp")}`;
  if (level === "TURKIYE") {
    // Ulusal şampiyona = oyuncunun kendi ülkesi (adı izleyicinin dilinde). cityChamp = "Şampiyonası"/"Championship"/…
    const cname = t(locale, `country.${countryCode ?? "TR"}`);
    const base = `${ageCategory} ${cname} ${t(locale, "tournament.cityChamp")}`;
    return host ? `${base} · ${host}` : base;
  }
  if (level === "EUROPEAN") {
    // Kıta Şampiyonası = oyuncunun kıtası ("U17 Avrupa/Asya-Okyanusya/Amerika/Afrika Şampiyonası").
    // countryCode ülke ise kıtasını bul; scopeKey'den gelen kıta kodu (EU/AS/AM/AF) ise doğrudan kullan.
    const cont = CONTINENT_CODES.includes(countryCode ?? "") ? countryCode : continentOfCountry(countryCode ?? "TR");
    const cname = cont ? t(locale, `continent.${cont}`) : t(locale, "tournament.EUROPEAN");
    const base = `${ageCategory} ${cname} ${t(locale, "tournament.cityChamp")}`;
    return host ? `${base} · ${host}` : base;
  }
  const base = `${ageCategory} ${t(locale, `tournament.${level}`)}`;
  return host ? `${base} · ${host}` : base;
}
import {
  COMPETITION_SHARPNESS_GAIN,
  applySharpness,
  dailyMood,
  matchFatigueMultiplier,
  rollInjury,
  sessionSharpnessDelta,
} from "@/engine/conditioning";
import {
  activeTraitKeys,
  encodeTraitPlan,
  generateTraitPlan,
  parseTraitPlan,
  reputationAfterEvent,
  traitCombatModifier,
  traitTrainingMultiplier,
  type TraitKey,
  type TraitEventNote,
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
  clubMonthlyDues,
  entryFee,
  equipmentUpgradeCost,
  prizeFor,
} from "@/engine/economy";
import {
  clubTrainingMultiplier,
  coachTrainingMultiplier,
  equipmentCombatModifier,
  equipmentTrainingMultiplier,
} from "@/engine/environment";
import { applyKitPurchase, applyMatchWear, applyRestAging, damageActive, discardKitItem, encodeKit, encodeOwned, equipmentCombatBonus, itemById, itemsInSlot, MAX_PER_SLOT, parseOwned, requiredSize, resolveKit, starterKit, validateKit, type EquipmentSlot, type KitItemState } from "@/engine/equipment";
import { applyEventsToPsych, discountedPrice, LIFE_EVENTS, offerActive, rollOffer, rollWeeklyEvents, rollWeeklyMaterial, type GearOffer, type MaterialEvent } from "@/engine/lifeEvents";
import { AD_DAILY_CAP, AD_REWARD, adsLeftToday, canWatchAd, watchAd, type AdState } from "@/engine/ads";
import { appendLedger, encodeLedger, entriesForWeek, parseLedger, totals as ledgerTotals, type LedgerEntry } from "@/engine/ledger";

/** Kumbaram: mevcut ledger JSON'una yeni kayıt(lar) ekleyip güncel JSON string döndürür (saf). */
function nextLedgerJson(currentJson: string | null | undefined, ...newEntries: LedgerEntry[]): string {
  let next = parseLedger(currentJson);
  for (const e of newEntries) next = appendLedger(next, e);
  return encodeLedger(next);
}
import { detectAchievements, type AchievementType } from "@/engine/memory";
import {
  computePhysique,
  generateGenetics,
  speedTrainingMultiplier,
  type Genetics,
} from "@/engine/physique";

/** Oyun başlangıç tarihi (deterministik referans). */
const GAME_START = new Date("2026-01-01T00:00:00.000Z");
// Herkes START_AGE yaşında başlar → sabit doğum tarihi (GAME_START yılından START_AGE yıl önce).
const START_BIRTHDATE = new Date(Date.UTC(GAME_START.getUTCFullYear() - START_AGE, 0, 1));
const AI_DAILY_RECOVERY = 4; // AI günlük yorgunluk toparlanması (gün-bazlı)
const POOL_SIZE = 6;

/**
 * Kullanıcıya gösterilebilir "soft" hata (ör. kayıt kapandı, sakatsın). `code` i18n anahtarıdır
 * (err.<code>) → action yakalar, kullanıcıya o dildeki mesajı gösterir (generic çökme sayfası yerine).
 * Türkçe `message` yalnız geliştirici/log içindir.
 */
export class GameError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "GameError";
  }
}
/**
 * Uluslararası turnuvalar + dünya/kıta klasmanları için YABANCI AI havuzu (eskrim gücüne göre ağırlıklı).
 * Yerel turnuvalar (İl/Türkiye/Open) ev ülkesinden seçilir; uluslararası sahalar bu havuzdan karışık gelir.
 */
const FOREIGN_AI_POOL: readonly string[] = [
  "IT", "IT", "IT", "FR", "FR", "FR", "RU", "RU", "RU", "HU", "HU", "DE", "DE", "PL", "PL",
  "UA", "ES", "ES", "GB", "GB", "US", "US", "JP", "KR", "KR", "CN", "CN", "AU", "EG", "BR", "TN",
];
const FOREIGN_AI_COUNT = 32; // uluslararası sahayı (24) rahat dolduracak çok-uluslu havuz

/**
 * Turnuva sahasını dolduracak AI'ları seçer (RETIRED botlar hariç — emekli bot sahaya girmez).
 * KAPSAM (18 ülke modeli): İl → oyuncunun ŞEHRİNDEKİ aynı ülkeden botlar (kendi bölgesi);
 * TÜRKİYE/OPEN → aynı ÜLKEDEN (ülke geneli); ULUSLARARASI → tüm havuzdan çok-uluslu karışık
 * (scope anahtarıyla deterministik karıştırma → kapsam-içi herkes AYNI sahayı görür). Her AI'ın
 * adı kendi ülkesinin havuzundan geldiği için isim↔uyruk hep tutarlıdır.
 */
async function selectFieldAi(
  level: TournamentLevel,
  homeCode: string,
  city: string,
  mixSeed: string,
  gender: string,
  weapon: string,
  take: number,
) {
  if (take <= 0) return [];
  const active = { isAI: true, status: { not: "RETIRED" }, gender, weapon } as const;
  // Kıta Şampiyonası (EUROPEAN) = oyuncunun KITASINDAKİ ülkelerden karışık (Avrupa'lı → Avrupa ülkeleri).
  if (level === "EUROPEAN") {
    const cont = continentOfCountry(homeCode);
    const codes = COUNTRIES.filter((c) => c.continent === cont).map((c) => c.code);
    const all = await prisma.player.findMany({
      where: { ...active, nationality: { code: { in: codes } } },
      include: { skills: true },
      orderBy: { id: "asc" },
    });
    return createRng(mixSeed).shuffle(all).slice(0, take);
  }
  // Satellite / Grand Prix / Dünya Kupası = TÜM DÜNYA (çok-uluslu karışık).
  if (INTERNATIONAL_LEVELS.includes(level)) {
    const all = await prisma.player.findMany({
      where: { ...active },
      include: { skills: true },
      orderBy: { id: "asc" },
    });
    return createRng(mixSeed).shuffle(all).slice(0, take);
  }
  // İl = oyuncunun şehri (bölge); Türkiye/Open = ülke geneli.
  const where =
    level === "IL"
      ? { ...active, nationality: { code: homeCode }, club: { city } }
      : { ...active, nationality: { code: homeCode } };
  return prisma.player.findMany({
    where,
    include: { skills: true },
    orderBy: { id: "asc" }, // sırasız take() riskli — kapsam-içi herkes aynı kümeyi seçsin
    take,
  });
}

/** Uluslararası turnuva seviyeleri (yalnız U17+; FIE: kıdemli devreler + Kadet/Junior şampiyonaları). */
const INTERNATIONAL_LEVELS: readonly TournamentLevel[] = ["SATELLITE", "EUROPEAN", "GRAND_PRIX", "WORLD_CUP"];
/** Uluslararası turnuvalar yalnız U17 ve üstü kategorilerde (M11.3b: oyun sahibi + FIE). */
function levelAllowedForCategory(level: TournamentLevel, ageCategory: AgeCategory): boolean {
  if (!INTERNATIONAL_LEVELS.includes(level)) return true;
  return ageCategory === "U17" || ageCategory === "U21" || ageCategory === "SENIOR";
}
// Varsayılan haftalık plan: 4 antrenman günü (Pazartesi / Çarşamba / Cuma / Pazar).
// 7 günlük plan (Pzt=0 … Paz=6). Turnuva günlerinin (Sal/Prş/Cmt) planı yalnız o turnuvaya
// KATILMAZSAN uygulanır. Varsayılan dinlenmeli/dengeli — her gün antrenman şart değil.
const DEFAULT_PLAN = "TECHNICAL,MENTAL,PHYSICAL,MENTAL,TACTICAL,REST,REST";
const PLAN_DAYS = 7;

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

/**
 * Kariyerin "yaş quarter'ı" (M10): dünya günü gerçek zamandan gelir; yaş, kariyerin AÇILIŞINDAKİ
 * dünya quarter'ından bu yana geçen quarter kadar ilerler. Böylece dünyaya sonradan katılan biri
 * doğru yaşta başlar. Açılışta (dayIndex == careerStartDay) sonuç 1'dir → başlangıç yaşı.
 */
function careerQuarter(dayIndex: number, careerStartDay: number): number {
  return 1 + quarterOf(dayIndex) - quarterOf(careerStartDay);
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
  avatar: string | null; // avatar seti (yaşa göre portre); null → harf rozeti
  age: number; // portre kademesi için (8/12/16/20)
}

/** Milli takım kadrosu = kategori Quarter Ranking ilk N'i (GDD 17.32). Tek kaynak → davet/rozet/kadro tutarlı. */
export const NATIONAL_TEAM_SIZE = 4;

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
  dateLabel: string; // GERÇEK takvim tarihi, TR
  seasonNo: number; // kariyer sezonu
  countryCode: string; // oyuncunun ülkesi (doğduğu/oluşturduğu ülke) — bayrak için
  nationalTeam: boolean; // kategori sıralaması ilk 4 (GDD 17.32)
  overall: number;
  experience: number; // birikmiş tecrübe (XP) — #28
  // Gelişim çevresi (M6)
  traits: string[]; // Türkçe etiketler
  psychology: { morale: number; motivation: number; confidence: number; stress: number; reputation: number };
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
  ownedEquipment: string[]; // sahip olunan Gladius ürün id'leri
  kit: KitItemState[]; // Malzeme çantası: her parçanın beden/dayanıklılık/kırık durumu (Dilim 1)
  offer: { itemId: string; discountPct: number; daysLeft: number } | null; // Dilim 3-3: markette aktif fırsat
  balance: number;
  adsLeftToday: number; // bugün kalan ödüllü reklam hakkı (Market "Denar" köşesi)
  adReward: number; // 1 reklam → kaç Denar
  adDailyCap: number; // günlük reklam tavanı
  ledgerWeek: LedgerEntry[]; // Kumbaram: bu oyun-haftasının Denar hareketleri (eski→yeni)
  ledgerWeekTotals: { income: number; expense: number; net: number }; // bu haftanın gelir/gider/net
  equipmentUpgradeCost: number;
  canUpgradeEquipment: boolean;
  liveTournamentActive: boolean; // devam eden canlı turnuva var mı → ekrana yönlendir
  trainingPlan: string[]; // 7 günlük plan (Pzt..Paz); turnuva günleri yalnız katılmazsan uygulanır
  physique: { heightCm: number; reachCm: number; legLengthCm: number; weightKg: number; leftHanded: boolean };
  skills: { key: string; label: string; category: string; current: number; potential: number }[];
  // Bugün radarı: çeyrek başında dondurulan değerler ("geçen çeyrek" kesikli çizgisi); henüz yoksa null.
  skillBase: { quarter: number; values: Record<string, number> } | null;
  ranking: RankingRowDTO[];
  today: TodayDTO; // bugünün etkinliği (İlerle/Katıl/Geç için)
  seasonCalendar: SeasonEventDTO[]; // bu yılın turnuva takvimi (h1..h12)
}

// ---------- işlemler ----------

// ——— Kullanıcı kimliği (M9): çerez tabanlı anonim hesap. Ortak dünyada her kişi ayrı User;
// AI oyuncuların kullanıcısı yoktur (Player.userId null). E-posta/şifre girişi M9.2'de.
const USER_COOKIE = "engarde_user";

/** Çerezdeki token'dan mevcut kullanıcı id'sini çözer (yoksa null). Yalnız OKUR (çerez set etmez). */
async function currentUserId(): Promise<number | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  return (await prisma.user.findUnique({ where: { token }, select: { id: true } }))?.id ?? null;
}

/** Mevcut kullanıcıyı döndürür; yoksa oluşturur + çerezi set eder. YALNIZ server action/route'ta çağrılır. */
async function ensureUserId(): Promise<number> {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (token) {
    const existing = await prisma.user.findUnique({ where: { token }, select: { id: true } });
    if (existing) return existing.id;
  }
  const newToken = globalThis.crypto.randomUUID();
  jar.set(USER_COOKIE, newToken, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5, // 5 yıl
    httpOnly: true,
    sameSite: "lax",
  });
  return (await prisma.user.create({ data: { token: newToken } })).id;
}

/** Aktif kariyer var mı? (mevcut kullanıcı için) */
export async function hasCareer(): Promise<boolean> {
  const uid = await currentUserId();
  if (uid == null) return false;
  return (await prisma.gameState.count({ where: { userId: uid } })) > 0;
}

/** Mevcut kullanıcının GameState'i (yoksa null). findFirst yerine kullanıcı-bazlı erişim. */
async function currentGameState() {
  const uid = await currentUserId();
  if (uid == null) return null;
  return prisma.gameState.findUnique({ where: { userId: uid } });
}

const USER_COOKIE_OPTS = { path: "/", maxAge: 60 * 60 * 24 * 365 * 5, httpOnly: true, sameSite: "lax" as const };

/** Oturumu kapatır (çerezi siler). Hesap/veri silinmez; tekrar Google ile girilebilir. */
export async function signOut(): Promise<void> {
  (await cookies()).set(USER_COOKIE, "", { path: "/", maxAge: 0 });
}

/** Mevcut kullanıcı (id + email) — email doluysa Google ile giriş yapılmış demektir. Yoksa null. */
export async function currentUser(): Promise<{ id: number; email: string | null } | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  return (await prisma.user.findUnique({ where: { token }, select: { id: true, email: true } })) ?? null;
}

/**
 * Google ile girişi tamamlar (callback route'tan çağrılır). E-posta = kimlik:
 * kayıtlıysa o hesaba giriş; yoksa mevcut anonim kullanıcıya bağla (kariyer korunur); o da yoksa yeni hesap.
 */
export async function completeGoogleSignIn(email: string): Promise<void> {
  const jar = await cookies();
  const byEmail = await prisma.user.findUnique({ where: { email }, select: { token: true } });
  if (byEmail) {
    jar.set(USER_COOKIE, byEmail.token, USER_COOKIE_OPTS); // bu e-postanın hesabına giriş
    return;
  }
  const curToken = jar.get(USER_COOKIE)?.value;
  if (curToken) {
    const cur = await prisma.user.findUnique({ where: { token: curToken }, select: { id: true, email: true } });
    if (cur && !cur.email) {
      await prisma.user.update({ where: { id: cur.id }, data: { email } }); // mevcut anonim kariyeri Google'a bağla
      return;
    }
  }
  const token = globalThis.crypto.randomUUID();
  jar.set(USER_COOKIE, token, USER_COOKIE_OPTS);
  await prisma.user.create({ data: { token, email } });
}

// ---------- kulüp + bölge bot nüfusu (18 ülke launch modeli) ----------

const CLUB_SPECIALTIES: SkillCategory[] = ["TECHNICAL", "PHYSICAL", "MENTAL", "TACTICAL"];

/** Bir kulübün verisi (2 antrenör, 4 türü 2+2 kapsar — GDD 13). Ad + koç adları ülkenin kendi dilinde. rng deterministik. */
function makeClubData(city: string, rng: ReturnType<typeof createRng>, countryCode: string) {
  const specs = rng.shuffle(CLUB_SPECIALTIES);
  const skill = rng.int(45, 85);
  // Koç adları da kulübün ülkesinden (Berlin Fechtclub → Alman koç). Cinsiyet rastgele.
  const coachFullName = () =>
    `${rng.pick([...firstNamesFor(rng.pick(["MALE", "FEMALE"]), countryCode)])} ${rng.pick([...lastNamesFor(countryCode)])}`;
  return {
    name: clubNameFor(city, countryCode),
    city,
    facility: rng.int(45, 85),
    coachName: coachFullName(),
    coachSkill: skill,
    coachSpecialty: `${specs[0]},${specs[1]}`,
    coach2Name: coachFullName(),
    coach2Specialty: `${specs[2]},${specs[3]}`,
  };
}

/**
 * Bölge sahası hedefi: bir (ülke+şehir+cinsiyet+silah) bölgesinde İl sahası bu kadar kişiye dolar.
 * Bot sayısı = hedef − o bölgedeki gerçek oyuncu. Gerçek oyuncuya limit YOK (17. oyuncu botları bitse de kaydolur).
 */
const LOCAL_FIELD_TARGET = 16;

/**
 * Bir (ülke, şehir, cinsiyet, silah) bölgesinde aktif bot sayısını (hedef − gerçek oyuncu)'a getirir:
 * eksikse o şehirde kulüple + o ülkeden isimle + oyuncularla aynı yaş kohortunda bot ÜRETİR;
 * fazlaysa (gerçek oyuncu katıldıkça) en yeni botları RETIRED yapar (veri korunur, sahaya girmezler).
 * Böylece her bölge hep ~16 kişiye dolu kalır; gerçek oyuncu geldikçe bot çekilir. İnsan sayısına limit yok.
 */
async function ensureBucketBots(
  countryCode: string,
  city: string,
  gender: Gender,
  weapon: Weapon,
  ageCategory: AgeCategory,
  age: number,
  seedBase: string,
): Promise<void> {
  const bucket = { gender, weapon, nationality: { code: countryCode }, club: { city }, status: { not: "RETIRED" } };
  const humanCount = await prisma.player.count({ where: { ...bucket, isAI: false } });
  const activeBots = await prisma.player.findMany({
    where: { ...bucket, isAI: true },
    orderBy: { id: "desc" }, // fazla varsa en YENİ botlar emekli olur (eski/kökleşmiş kalsın)
    select: { id: true },
  });
  const desiredBots = Math.max(0, LOCAL_FIELD_TARGET - humanCount);
  if (activeBots.length > desiredBots) {
    const retire = activeBots.slice(0, activeBots.length - desiredBots).map((b) => b.id);
    await prisma.player.updateMany({ where: { id: { in: retire } }, data: { status: "RETIRED" } });
    return;
  }
  const need = desiredBots - activeBots.length;
  if (need <= 0) return;

  const rng = createRng(`${seedBase}:bots:${countryCode}:${city}:${gender}:${weapon}:${age}`);
  const cc = countryByCode(countryCode);
  const countryId = await ensureCountry(countryCode, cc?.name ?? countryCode);
  const existingClub = await prisma.club.findFirst({ where: { city } });
  const clubId = existingClub ? existingClub.id : (await prisma.club.create({ data: makeClubData(city, rng, countryCode) })).id;
  const specs = generateAiOpponents(rng, { count: need, gender, weapon, ageCategory, gameDate: GAME_START, age, countries: [countryCode] });
  const aiStartMonth = Math.floor(serverEventDay() / DAYS_PER_MONTH);
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const g = generateGenetics(createRng(`${seedBase}:bots:phys:${countryCode}:${city}:${i}`), spec.gender);
    const ai = await prisma.player.create({
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
        clubId,
        traits: encodeTraitPlan(generateTraitPlan(createRng(`${seedBase}:botstraits:${countryCode}:${city}:${i}`))),
        aiDevMonth: aiStartMonth,
        ...geneticsData(g),
        avatar: pickAvatar(spec.gender, `${seedBase}:av:${city}:${i}`),
        skills: { create: skillCreateData(spec.skills) },
      },
    });
    await prisma.player.update({ where: { id: ai.id }, data: { code: formatPlayerCode(ai.id) } });
  }
}

/**
 * Yeni kariyer oluşturur: insan oyuncu + skill'leri + kategoriyi dolduran AI havuzu + GameState.
 * Girdi Zod ile doğrulanır (GDD 7.27). Tümü tek transaction (GDD 22.50).
 */
export async function createCareer(input: unknown): Promise<{ humanPlayerId: number }> {
  const data = createPlayerSchema.parse(input); // geçersizse fırlatır
  // Ülke + şehir doğrulaması (sunucu): ülke desteklenmeli, şehir o ülkenin listesinden olmalı.
  const homeCountry = countryByCode(data.country);
  if (!homeCountry) throw new GameError("bad_country", "Desteklenmeyen ülke.");
  if (!citiesForCountry(data.country).includes(data.city)) throw new GameError("bad_city", "Şehir bu ülkeye ait değil.");
  const identity = deriveIdentity({ gender: data.gender, weapon: data.weapon, birthDate: START_BIRTHDATE }, GAME_START);
  const seed = globalThis.crypto.randomUUID();
  const countryId = await ensureCountry(homeCountry.code, homeCountry.name);

  const humanSkills = generateStartingSkills(createRng(`${seed}:human`), {
    age: identity.age,
    profile: data.profile,
  });

  // Ev (yerel) AI'lar artık ülke/şehir bazında ensureBucketBots ile üretilir (18 ülke launch modeli):
  // her oyuncu kendi bölgesine (şehir) yerleşir, o bölge 16'ya bot ile tamamlanır (aşağıda, tx sonrası).

  // Çok-ülkeli dünya: yabancı AI havuzu (uluslararası turnuvalar + dünya/kıta klasmanları için).
  const foreignSpecs = generateAiOpponents(createRng(`${seed}:worldfx`), {
    count: FOREIGN_AI_COUNT,
    gender: data.gender,
    weapon: data.weapon,
    ageCategory: identity.ageCategory,
    gameDate: GAME_START,
    age: identity.age,
    countries: FOREIGN_AI_POOL,
  });
  // Yabancı ülkeleri DB'de garanti et (kod → id), ev ülkesi dâhil.
  const countryIdByCode = new Map<string, number>([["TR", countryId]]);
  for (const code of [...new Set(foreignSpecs.map((s) => s.countryCode))]) {
    const c = COUNTRIES.find((x) => x.code === code);
    countryIdByCode.set(code, await ensureCountry(code, c?.name ?? code));
  }

  // Trait + fiziksel genetik (GDD 10, 2.7) — deterministik. Kulüp verisi modül-seviyesi makeClubData ile.
  const traitPlan = generateTraitPlan(createRng(`${seed}:traits`));
  const humanGenetics = generateGenetics(createRng(`${seed}:phys:human`), data.gender);
  const clubRng = createRng(`${seed}:club`);

  const userId = await ensureUserId(); // çerez + kullanıcı (yoksa oluştur, çerezi set eder)
  const worldDay = serverWorldDay(); // M10: kariyer "şu anki" dünya gününde başlar (yaş çıpası)

  const humanPlayerId = await prisma.$transaction(async (tx) => {
    // AI havuzu ORTAK (ortak dünya hedefi): yalnız ilk kariyer üretiminde oluşturulur; sonraki
    // kullanıcılar aynı AI'lara karşı oynar. (Tek dünya saati/paylaşılan turnuvalar → M10/M11.)
    const aiExists = (await tx.player.count({ where: { isAI: true } })) > 0;

    // Oyuncunun kulübü: şehrinde kulüp varsa ona bağlan (ortak), yoksa oluştur.
    const cityClub = await tx.club.findFirst({ where: { city: data.city } });
    const humanClubId = cityClub ? cityClub.id : (await tx.club.create({ data: makeClubData(data.city, clubRng, data.country) })).id;

    const human = await tx.player.create({
      data: {
        code: "P-TEMP",
        userId, // sahiplik (M9): insan oyuncu bu kullanıcıya bağlı
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        birthDate: START_BIRTHDATE,
        weapon: data.weapon,
        profile: data.profile,
        nationalityId: countryId,
        isAI: false,
        careerStartDate: GAME_START,
        traits: encodeTraitPlan(traitPlan),
        balance: STARTING_BALANCE,
        // Bedava başlangıç takımı (Yusuf): 8 yaşında tam Gladius takımı — herkes maça girebilir (paywall değil).
        ownedEquipment: encodeOwned(starterKit(data.weapon as Weapon).map((k) => k.itemId)),
        equipmentState: encodeKit(starterKit(data.weapon as Weapon)),
        clubId: humanClubId,
        ...geneticsData(humanGenetics),
        avatar: pickAvatar(data.gender, `${seed}:av:human`),
        skills: { create: skillCreateData(humanSkills) },
      },
    });
    // Player ID kodunu gerçek id'den üret (GDD 7.4).
    await tx.player.update({
      where: { id: human.id },
      data: { code: formatPlayerCode(human.id) },
    });

    if (!aiExists) {
      // Yeni AI'lar mevcut ayı "işlenmiş" başlatır — aksi halde ilk gün ilerletmede o ana kadarki TÜM
      // ayları birden telafi edip aşırı gelişim sıçraması yaparlardı (bkz. worldAdvanceTx, M11.5).
      const aiStartMonth = Math.floor(serverEventDay() / DAYS_PER_MONTH);
      // Yabancı AI'lar: kendi ülkelerinin bir şehrinde kulübe bağlı (uluslararası + dünya klasmanı için).
      // (Yerel/İl AI'lar artık bölge bazında ensureBucketBots ile üretilir — tx sonrası.)
      const foreignClubByCity = new Map<string, number>();
      for (let j = 0; j < foreignSpecs.length; j++) {
        const spec = foreignSpecs[j];
        const cc = COUNTRIES.find((x) => x.code === spec.countryCode);
        const city = cc && cc.cities.length > 0 ? clubRng.pick([...cc.cities]) : spec.countryCode;
        const cityKey = `${spec.countryCode}#${city}`;
        let fClubId = foreignClubByCity.get(cityKey);
        if (fClubId == null) {
          fClubId = (await tx.club.create({ data: makeClubData(city, clubRng, spec.countryCode) })).id;
          foreignClubByCity.set(cityKey, fClubId);
        }
        const fGenetics = generateGenetics(createRng(`${seed}:phys:fx:${j}`), spec.gender);
        const fAi = await tx.player.create({
          data: {
            code: "P-TEMP",
            firstName: spec.firstName,
            lastName: spec.lastName,
            gender: spec.gender,
            birthDate: spec.birthDate,
            weapon: spec.weapon,
            profile: spec.profile,
            nationalityId: countryIdByCode.get(spec.countryCode) ?? countryId,
            isAI: true,
            careerStartDate: GAME_START,
            clubId: fClubId,
            traits: encodeTraitPlan(generateTraitPlan(createRng(`${seed}:fxtraits:${j}`))),
            aiDevMonth: aiStartMonth,
            ...geneticsData(fGenetics),
            avatar: pickAvatar(spec.gender, `${seed}:av:fx:${j}`),
            skills: { create: skillCreateData(spec.skills) },
          },
        });
        await tx.player.update({ where: { id: fAi.id }, data: { code: formatPlayerCode(fAi.id) } });
      }
    }

    await tx.gameState.create({
      data: { humanPlayerId: human.id, userId, seed, currentDate: dayDate(worldDay), careerStartDay: worldDay, dayIndex: worldDay },
    });
    return human.id;
  });

  // Oyuncunun bölgesini (şehir) hedefe tamamla: eksikse bot üret, insan katıldığı için fazlaysa 1 bot emekli.
  // (tx dışında — idempotent; hata olursa oyuncu yine oluşturulmuş olur, saha yalnız seyrek kalır.)
  await ensureBucketBots(data.country, data.city, data.gender, data.weapon, identity.ageCategory, identity.age, seed);

  return { humanPlayerId };
}

async function loadState() {
  const uid = await currentUserId();
  if (uid == null) return null;
  const gs = await prisma.gameState.findUnique({ where: { userId: uid } });
  if (!gs) return null;
  const human = await prisma.player.findUnique({
    where: { id: gs.humanPlayerId },
    include: { skills: true, club: true, nationality: true }, // nationality.code: ulusal turnuva adı/ev sahibi ülke için
  });
  if (!human) return null;
  return { gs, human };
}

/** Kalıcı trait planından, oyuncunun O YAŞTA aktif trait anahtarları (kademeli açılım). */
function activeTraitsOf(csv: string, age: number): TraitKey[] {
  return activeTraitKeys(parseTraitPlan(csv), age);
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
  const cur = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay)); // yaş kariyer çıpasına göre
  const categoryId = cur.categoryId;
  const age = cur.age;

  // Yurt-içi (ülke) klasman sırası — milli takım + uluslararası uygunluk buradan (uluslararası puan karışmaz).
  const ranking = await buildRankingView(categoryId, quarter, human.id, { country: human.nationality?.code ?? "TR" });
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  const nationalTeam = humanRank != null && humanRank <= NATIONAL_TEAM_SIZE;
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
          trainingLabel: t(locale, `training.${(planArr[dayOfWeek(gs.dayIndex)] ?? "REST") as TrainingType}`),
        }
      : {
          dayName: dayLabel,
          kind: "TOURNAMENT",
          level: act.level,
          label: tournamentDisplayName(locale, cur.ageCategory, act.level, tournamentHostCity(act.level, gs.dayIndex, human.club?.city ?? "", human.nationality?.code ?? "TR"), human.nationality?.code ?? "TR"),
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
        label: tournamentDisplayName(locale, cur.ageCategory, a.level, null, human.nationality?.code ?? "TR"),
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
        label: tournamentDisplayName(locale, cur.ageCategory, a.level, null, human.nationality?.code ?? "TR"),
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
    dateLabel: new Date(worldDayStartMs(gs.dayIndex, worldClockConfig())).toLocaleDateString("tr-TR", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    }),
    seasonNo: careerQuarter(gs.dayIndex, gs.careerStartDay),
    countryCode: human.nationality?.code ?? "TR",
    nationalTeam,
    overall: roundSkill(overall(skills)),
    experience: human.experience,
    traits: activeTraitsOf(human.traits, age), // o yaşta aktif trait ANAHTARLARI; UI dile göre çevirir

    psychology: {
      morale: roundSkill(human.morale),
      motivation: roundSkill(human.motivation),
      confidence: roundSkill(human.confidence),
      stress: roundSkill(human.stress),
      reputation: roundSkill(human.reputation),
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
    ownedEquipment: parseOwned(human.ownedEquipment),
    kit: resolveKit(human.equipmentState, human.weapon as Weapon),
    offer: (() => {
      const o = gs.pendingOffer ? (JSON.parse(gs.pendingOffer) as GearOffer) : null;
      const today = serverWorldDay();
      return offerActive(o, today) ? { itemId: o.itemId, discountPct: o.discountPct, daysLeft: o.expiresDay - today + 1 } : null;
    })(),
    balance: roundSkill(human.balance),
    adsLeftToday: adsLeftToday({ lastAdDay: human.lastAdDay, adsToday: human.adsToday }, serverWorldDay()),
    adReward: AD_REWARD,
    adDailyCap: AD_DAILY_CAP,
    ...(() => {
      const week = entriesForWeek(parseLedger(gs.ledger), serverWorldDay());
      return { ledgerWeek: week, ledgerWeekTotals: ledgerTotals(week) };
    })(),
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
    skillBase: (() => {
      const b = parseSkillQuarterBase(gs.skillQuarterBase);
      return b ? { quarter: b.q, values: b.v } : null;
    })(),
    ranking,
    today,
    seasonCalendar,
  };
}

/** Menü/başlık + sabit "İlerle" çubuğu için hafif durum (tüm kariyer sayfalarında ortak). */
export interface TrainingReport {
  days: number; // kaç gün ilerledi
  // Yeni yazımlar yalnız `key` içerir (i18n `skill.<key>` ile dile göre çevrilir). Eski kayıtlarda
  // (bu alan eklenmeden önce DB'ye yazılmış, henüz okunmamış raporlar) yalnız sabit TR `label` olabilir
  // — canlı veri kaybı olmasın diye geriye dönük okunur (bkz. page.tsx).
  gains: { key?: SkillKey; label?: string; delta: number }[]; // skill kazanımları (delta>0)
  conditionDelta: number; // kondisyon değişimi (+ toparladı, − yoruldu)
  sharpnessDelta: number; // keskinlik değişimi
  injured: boolean; // bu ilerlemede sakatlandı mı
  events?: string[]; // Dilim 3-1: hayat olayları anahtarları (event.<key>) — opsiyonel (eski raporlar taşımaz)
}

/** M11.4: "yokken neler oldu" — offline'ken otomatik oynanan bir turnuvanın özeti. */
export interface AwayTournamentEntry {
  tournamentId: number;
  name: string; // "U21 İl Şampiyonası"
  categoryId: string;
  position: number; // senin derecen
  fieldSize: number; // katılımcı sayısı
  points: number; // kazanılan ranking puanı
  newRank: number | null; // turnuva sonrası Quarter Ranking sıran
  dateLabel: string; // "Q1 · H3"
}

export interface CareerHeaderDTO {
  name: string;
  code: string;
  gender: string;
  weapon: string;
  age: number;
  categoryId: string;
  ageCategory: string; // "U21" (rozet)
  city: string; // kulübün şehri (rozet)
  countryCode: string; // oyuncunun ülkesi (bayrak rozeti)
  nationalTeam: boolean; // kategori sıralaması ilk 4 → milli takım rozeti
  avatar: string | null; // seçilen avatar seti (yaşa göre portre); null → harf rozeti
  liveTournamentActive: boolean;
  year: number; // oyun-içi takvim yılı (ör. 2026)
  quarter: number;
  month: number; // h1..h12
  dayName: string; // Pazartesi..Pazar
  dateLabel: string; // GERÇEK takvim tarihi, TR ("27 Eylül 2026 Pazar") — Q/H yerine ana gösterim
  seasonNo: number; // kariyer sezonu (yaş/klasman için; 1'den başlar)
  injured: boolean;
  injuryDaysRemaining: number;
  today: TodayDTO; // bugünün etkinliği (çubuk Katıl/Geç için)
  report: TrainingReport | null; // son "dünyaya yetiş" antrenman haberi (varsa)
  awayTournaments: AwayTournamentEntry[]; // M11.4: yokken otomatik oynanan turnuvalar (varsa)
  traitEvents: TraitEventNote[]; // Katman 2 Dilim 3: trait evrimi bildirimleri (varsa)
  // M10 dünya saati: canAttend = bugünkü uygun turnuva "geldi" (Katıl/Geç); needsSync = işlenecek
  // gün var (otomatik dünyaya yetiş); caughtUp = dünyaya yetişildi, sonraki gün gerçek zamanda gelecek.
  canAttend: boolean;
  needsSync: boolean;
  caughtUp: boolean;
  nextTournament: NextTournamentDTO | null; // sıradaki turnuva + gerçek başlama anı (bilgi/geri sayım)
}

/** Sıradaki turnuva bilgisi (gösterim + canlı geri sayım). `startMs` = gerçek zamanda gün geçiş anı. */
export interface NextTournamentDTO {
  level: TournamentLevel;
  label: string; // "U10 İl Şampiyonası"
  dayName: string; // haftanın günü (oyun takvimi)
  startMs: number; // turnuva gününün gerçek zamanda başladığı/başlayacağı an (her akşam gün geçişi)
  daysUntil: number; // kaç oyun günü sonra (0 = bugün)
  isToday: boolean;
  worldDay: number; // turnuvanın dünya günü (kayıt listesiyle eşleştirmek için)
  qualified: boolean; // katılım hakkı (yaş/uygunluk/sakatlık)
  requirement: string; // uygun değilse şart metni
}

/**
 * Bugünden itibaren ilk (yaş kategorisine uygun) turnuvayı ve gerçek başlama anını bulur.
 * Saf: ranking pozisyonu (humanRank) dışarıdan verilir (tekrar sorgu yok).
 */
function findNextTournament(
  worldDay: number,
  careerStartDay: number,
  human: { gender: string; weapon: string; birthDate: Date },
  humanRank: number | null,
  injured: boolean,
  locale: Locale,
  city: string,
  countryCode: string,
): NextTournamentDTO | null {
  const cfg = worldClockConfig();
  for (let d = worldDay; d <= worldDay + 14; d++) {
    const act = activityForDay(d);
    if (act.kind !== "TOURNAMENT") continue;
    const id = currentIdentity(human, careerQuarter(d, careerStartDay));
    if (!levelAllowedForCategory(act.level, id.ageCategory)) continue; // uluslararası yalnız U17+
    return {
      level: act.level,
      label: tournamentDisplayName(locale, id.ageCategory, act.level, tournamentHostCity(act.level, d, city, countryCode), countryCode),
      dayName: t(locale, `day.${dayOfWeek(d)}`),
      startMs: worldEventStartMs(d, cfg), // turnuva o günün 18:00 GMT'sinde başlar
      daysUntil: d - worldDay,
      isToday: d === worldDay,
      worldDay: d,
      qualified: !injured && qualifies(act.qualification, humanRank),
      requirement: t(locale, `qual.${act.qualification}`),
    };
  }
  return null;
}

/**
 * Bir turnuvanın CANLI (katılınabilir/izlenebilir) penceresi açık mı. Pencere = 18:00 GMT + en büyük saha
 * süresi (~94 dk) + tampon. Pencere KAPANINCA turnuva bitmiş sayılır → offline dönen oyuncuya "CANLI/gir"
 * gösterilmez; kayıtlıysa otomatik oynanıp sonucu "sen yokken" raporuna düşer (kullanıcı kararı 07.10).
 * Dev'de gün kısalırsa (WORLD_MS_PER_DAY) pencere de orantılı kısalır.
 */
const TOURNAMENT_LIVE_MINUTES = 110;
function tournamentStillLive(eventDay: number, nowMs: number = Date.now()): boolean {
  const cfg = worldClockConfig();
  return nowMs < serverEventStartMs(eventDay) + TOURNAMENT_LIVE_MINUTES * 60_000 * ((cfg.msPerDay ?? MS_PER_GAME_DAY) / MS_PER_GAME_DAY);
}

export async function getCareerHeader(): Promise<CareerHeaderDTO | null> {
  const state = await loadState();
  if (!state) return null;
  const { gs, human } = state;
  const locale = await getLocale();
  const quarter = quarterOf(gs.dayIndex);
  const cur = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  const injured = human.injuryDaysRemaining > 0;
  const act = activityForDay(gs.dayIndex);
  const dayLabel = t(locale, `day.${dayOfWeek(gs.dayIndex)}`);

  // Yurt-içi (ülke) klasman sırası — milli takım rozeti + turnuva uygunluğu buradan (uluslararası puan karışmaz).
  const ranking = await buildRankingView(cur.categoryId, quarter, human.id, { country: human.nationality?.code ?? "TR" });
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  const nationalTeam = humanRank != null && humanRank <= NATIONAL_TEAM_SIZE;

  let today: TodayDTO;
  if (act.kind === "TRAINING") {
    const planArr = (gs.trainingPlan || DEFAULT_PLAN).split(",").filter(Boolean);
    today = {
      dayName: dayLabel,
      kind: "TRAINING",
      trainingLabel: t(locale, `training.${(planArr[dayOfWeek(gs.dayIndex)] ?? "REST") as TrainingType}`),
    };
  } else {
    today = {
      dayName: dayLabel,
      kind: "TOURNAMENT",
      level: act.level,
      label: tournamentDisplayName(locale, cur.ageCategory, act.level, tournamentHostCity(act.level, gs.dayIndex, human.club?.city ?? "", human.nationality?.code ?? "TR"), human.nationality?.code ?? "TR"),
      qualified: !injured && qualifies(act.qualification, humanRank) && levelAllowedForCategory(act.level, cur.ageCategory),
      requirement: t(locale, `qual.${act.qualification}`),
    };
  }

  const worldDay = serverWorldDay(); // 00:00 bugün — sıradaki turnuva/tarih için
  const eventDay = serverEventDay(); // etkinliği (19:00) gelmiş en son gün — işleme/canlı-katıl için
  const arrived = gs.dayIndex <= eventDay; // bu günün etkinliği (18:00 GMT) geldi mi → işlenecek
  // Canlı "Katıl/İzle" yalnız etkinliği yeni gelen VE canlı penceresi henüz kapanmamış turnuvada. Pencere
  // kapandıysa (turnuva bitti; ör. GMT gece yarısı sonrası dönen offline oyuncu) → "sen yokken" yoluna düşer.
  const isLive = gs.dayIndex === eventDay && tournamentStillLive(eventDay);
  const canAttend = isLive && today.kind === "TOURNAMENT" && today.qualified === true;
  // Geçmiş turnuva (kayıtlıysa offline oynanır, değilse kaçırılır) + antrenman/iyileşme → otomatik işlenir.
  const needsSync = arrived && !canAttend;
  return {
    name: `${human.firstName} ${human.lastName}`,
    code: human.code,
    gender: human.gender,
    weapon: human.weapon,
    age: cur.age,
    categoryId: cur.categoryId,
    ageCategory: cur.ageCategory,
    city: human.club?.city ?? "",
    countryCode: human.nationality?.code ?? "TR",
    nationalTeam,
    avatar: human.avatar ?? null,
    liveTournamentActive: gs.liveTournament != null,
    year: gs.currentDate.getFullYear(),
    quarter,
    month: monthOfQuarter(gs.dayIndex),
    dayName: dayLabel,
    dateLabel: new Date(worldDayStartMs(gs.dayIndex, worldClockConfig())).toLocaleDateString("tr-TR", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    }),
    seasonNo: careerQuarter(gs.dayIndex, gs.careerStartDay),
    injured,
    injuryDaysRemaining: human.injuryDaysRemaining,
    today,
    report: gs.lastReport ? (JSON.parse(gs.lastReport) as TrainingReport) : null,
    awayTournaments: gs.awayReport ? (JSON.parse(gs.awayReport) as AwayTournamentEntry[]) : [],
    traitEvents: gs.traitReport ? (JSON.parse(gs.traitReport) as TraitEventNote[]) : [],
    canAttend,
    needsSync,
    caughtUp: !arrived,
    nextTournament: findNextTournament(worldDay, gs.careerStartDay, human, humanRank, injured, locale, human.club?.city ?? "", human.nationality?.code ?? "TR"),
  };
}

/** Sıradaki turnuva + gerçek başlama anı (Turnuvalar sayfası kartı için). */
export async function getNextTournament(): Promise<NextTournamentDTO | null> {
  const state = await loadState();
  if (!state) return null;
  const { gs, human } = state;
  const locale = await getLocale();
  const curId = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  const ranking = await buildRankingView(curId.categoryId, quarterOf(gs.dayIndex), human.id, { country: human.nationality?.code ?? "TR" });
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  return findNextTournament(serverWorldDay(), gs.careerStartDay, human, humanRank, human.injuryDaysRemaining > 0, locale, human.club?.city ?? "", human.nationality?.code ?? "TR");
}

/** Haftalık antrenman planını kaydeder (sabit "İlerle" çubuğu bunu uygular). */
export async function setTrainingPlan(slots: TrainingType[]): Promise<void> {
  const gs = await currentGameState();
  if (!gs) throw new Error("Aktif kariyer yok.");
  // 7 günlük plan (Pzt..Paz); geçersiz/eksik günler REST'e düşer.
  const valid = Array.from({ length: PLAN_DAYS }, (_, i) =>
    TRAINING_TYPES.includes(slots[i]) ? slots[i] : "REST",
  );
  await prisma.gameState.update({ where: { id: gs.id }, data: { trainingPlan: valid.join(",") } });
}

// ——— M10.2: Turnuva kaydı + önceden taktik (ortak dünya; turnuva sunucuca otomatik oynanır) ———

const REGISTER_LOOKAHEAD_DAYS = 28; // önümüzdeki ~4 oyun-haftası kaydedilebilir

export interface UpcomingTournamentDTO {
  worldDay: number;
  level: TournamentLevel;
  label: string; // yerelleştirilmiş turnuva adı (yaş kategorisiyle)
  categoryId: string;
  dayName: string; // haftanın günü
  dateLabel: string; // GERÇEK tarih + 18:00 GMT saati
  quarter: number;
  month: number; // h1..h12
  qualified: boolean; // katılım hakkı (uluslararası ilk16/ilk4)
  requirement: string;
  registered: boolean;
  tactic: string; // önceden verilen taktik (kayıtlıysa) ya da varsayılan
  isToday: boolean; // bugünün turnuvası (başlamadan önce listede: yeni kayıt kapalı, taktik 18:00 GMT'ye kadar değişir)
  registrationOpen: boolean; // yeni kayıt mümkün mü (turnuva gününün 00:00'ında kapanır)
}

/** Önümüzdeki turnuvalar + kayıt durumu (mevcut kullanıcının insanı için). */
export async function getUpcomingTournaments(): Promise<UpcomingTournamentDTO[]> {
  const state = await loadState();
  if (!state) return [];
  const { gs, human } = state;
  const locale = await getLocale();
  const today = serverWorldDay();

  // Uygunluk için mevcut kategori sıralaması (uluslararası kapıları).
  const curId = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  const ranking = await buildRankingView(curId.categoryId, quarterOf(gs.dayIndex), human.id, { country: human.nationality?.code ?? "TR" });
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;

  const regs = await prisma.registration.findMany({
    where: { playerId: gs.humanPlayerId, worldDay: { gte: today, lte: today + REGISTER_LOOKAHEAD_DAYS } },
  });
  const regBy = new Map(regs.map((r) => [`${r.worldDay}:${r.level}`, r]));

  const cfg = worldClockConfig();
  const out: UpcomingTournamentDTO[] = [];
  // Yeni kayıt turnuva gününün 00:00'ında kapanır (yalnız gelecek günler); 06.10 kuralı: bugünün turnuvası
  // başlayana kadar (18:00 GMT) listede kalır → kayıtlı oyuncu taktiğini değiştirebilir.
  const firstDay = Date.now() < serverEventStartMs(today) ? today : today + 1;
  for (let d = firstDay; d <= today + REGISTER_LOOKAHEAD_DAYS; d++) {
    const act = activityForDay(d);
    if (act.kind !== "TOURNAMENT") continue;
    const id = currentIdentity(human, careerQuarter(d, gs.careerStartDay)); // o günkü yaş kategorisi
    if (!levelAllowedForCategory(act.level, id.ageCategory)) continue; // uluslararası yalnız U17+
    const reg = regBy.get(`${d}:${act.level}`);
    out.push({
      worldDay: d,
      level: act.level,
      label: tournamentDisplayName(locale, id.ageCategory, act.level, tournamentHostCity(act.level, d, human.club?.city ?? "", human.nationality?.code ?? "TR"), human.nationality?.code ?? "TR"),
      categoryId: id.categoryId,
      dayName: t(locale, `day.${dayOfWeek(d)}`),
      dateLabel: new Date(worldEventStartMs(d, cfg)).toLocaleString("tr-TR", {
        timeZone: "UTC",
        day: "numeric",
        month: "long",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
      quarter: quarterOf(d),
      month: monthOfQuarter(d),
      qualified: !human.injuryDaysRemaining && qualifies(act.qualification, humanRank),
      requirement: t(locale, `qual.${act.qualification}`),
      registered: reg != null,
      tactic: reg?.tactic ?? human.tactic,
      isToday: d === today,
      registrationOpen: d > today,
    });
  }
  return out;
}

/** Bir turnuvaya kaydolur (önceden taktikle). Uygun değilse hata. */
export async function registerTournament(worldDay: number, level: TournamentLevel, tactic: Tactic): Promise<void> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;
  const today = serverWorldDay();
  if (worldDay < today) throw new GameError("day_passed", "Bu turnuvanın günü geçti.");
  if (worldDay === today) {
    // 06.10 kuralı: YENİ kayıt turnuva gününün 00:00'ında kapanır; mevcut kayıtlı oyuncu taktiğini turnuva
    // başlayana (18:00 GMT) kadar değiştirebilir. Sonrasında taktik tur aralarında turnuva ekranından verilir.
    const reg = await prisma.registration.findUnique({
      where: { playerId_worldDay_level: { playerId: gs.humanPlayerId, worldDay, level } },
    });
    if (!reg) throw new GameError("reg_closed", "Bu turnuvaya kayıt kapandı (turnuva günü). Bir gün öncesine kadar kaydolabilirsin.");
    if (Date.now() >= serverEventStartMs(worldDay)) {
      throw new GameError("already_started", "Turnuva başladı — taktiğini artık tur aralarında turnuva ekranından verebilirsin.");
    }
    await prisma.registration.update({ where: { id: reg.id }, data: { tactic } });
    return;
  }
  const act = activityForDay(worldDay);
  if (act.kind !== "TOURNAMENT" || act.level !== level) throw new GameError("no_tournament", "O gün bu turnuva yok.");
  const id = currentIdentity(human, careerQuarter(worldDay, gs.careerStartDay));
  if (!levelAllowedForCategory(level, id.ageCategory)) throw new GameError("u17_only", "Uluslararası turnuvalar yalnız U17 ve üstü içindir.");
  const ranking = await buildRankingView(id.categoryId, quarterOf(worldDay), human.id, { country: human.nationality?.code ?? "TR" });
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  if (!qualifies(act.qualification, humanRank)) throw new Error(`Katılım hakkın yok — ${qualificationLabel(act.qualification)}.`);

  // Zaten kayıtlıysa yalnız taktik güncellenir (ücret/kit kontrolü yok — bir kez ödendi).
  const existing = await prisma.registration.findUnique({
    where: { playerId_worldDay_level: { playerId: gs.humanPlayerId, worldDay, level } },
  });
  if (existing) {
    await prisma.registration.update({ where: { id: existing.id }, data: { tactic, categoryId: id.categoryId } });
    return;
  }

  // YENİ kayıt: maça katılım kuralı (tam + doğru beden + kırık değil) + katılım ücreti (Dilim 2B).
  const kitProblem = validateKit(resolveKit(human.equipmentState, human.weapon as Weapon), human.weapon as Weapon, id.age, id.ageCategory);
  if (kitProblem) throw new GameError(kitProblem, "Ekipmanın maça hazır değil — Ekipman sayfasından kontrol et.");
  const fee = entryFee(level);
  if (fee > 0 && human.balance < fee) throw new GameError("entry_fee", `Katılım ücreti için ${fee} Denar gerekir.`);
  await prisma.$transaction(async (tx) => {
    if (fee > 0) {
      await tx.player.update({ where: { id: human.id }, data: { balance: { decrement: fee } } });
      await tx.gameState.update({ where: { id: gs.id }, data: { ledger: nextLedgerJson(gs.ledger, { day: today, key: "entry", amount: -fee, arg: level }) } });
    }
    await tx.registration.create({ data: { playerId: gs.humanPlayerId, worldDay, level, categoryId: id.categoryId, tactic } });
  });
}

/** Turnuva kaydını iptal eder. */
export async function unregisterTournament(worldDay: number, level: TournamentLevel): Promise<void> {
  const gs = await currentGameState();
  if (!gs) throw new Error("Aktif kariyer yok.");
  const del = await prisma.registration.deleteMany({ where: { playerId: gs.humanPlayerId, worldDay, level } });
  // Katılım ücreti iade (kayıt vardıysa; İl ücretsiz → 0, no-op).
  const fee = entryFee(level);
  if (del.count > 0 && fee > 0) {
    await prisma.player.update({ where: { id: gs.humanPlayerId }, data: { balance: { increment: fee } } });
    await prisma.gameState.update({ where: { id: gs.id }, data: { ledger: nextLedgerJson(gs.ledger, { day: serverWorldDay(), key: "refund", amount: fee, arg: level }) } });
  }
}

/** Klasman kapsamı: Şehir (İl) / Ülke (ulusal) / Kıta / Dünya (M-UI). */
interface RankingScope {
  continent?: string; // kıta kodu (EU/AS/AM/AF)
  country?: string; // ülke kodu (TR…)
  city?: string; // şehir (İl klasmanı — country ile birlikte verilir)
}

async function buildRankingView(categoryId: string, quarter: number, humanId: number, scope: RankingScope = {}) {
  // Kapsam → scope satırı: Şehir → CITY:<ülke>#<şehir> (İl klasmanı); Ülke → DOMESTIC (ulusal, yalnız Türkiye şamp.);
  // Kıta/Dünya → WORLD (uluslararası). İl artık ulusala karışmaz (kullanıcı 27.10).
  const scopeStr =
    scope.city && scope.country
      ? `CITY:${scope.country}#${scope.city}`
      : scope.country && !scope.continent
        ? "DOMESTIC"
        : "WORLD";
  const rows = await prisma.ranking.findMany({
    where: { categoryId, quarter, scope: scopeStr },
    orderBy: [{ points: "desc" }, { playerId: "asc" }],
  });
  const players = await prisma.player.findMany({
    where: { id: { in: rows.map((r) => r.playerId) } },
    include: { club: true, nationality: true },
  });
  const byId = new Map(players.map((p) => [p.id, p]));
  // Şehir satırları zaten o şehre ait (ek süzme yok). Ülke → o ülke; kıta → o kıta. Kapsam-içi 1..N sırası.
  const narrowByNat = (!!scope.country && !scope.city) || !!scope.continent;
  const narrowed = !!(scope.city || scope.country || scope.continent);
  const scoped = narrowByNat
    ? rows.filter((r) => {
        const code = byId.get(r.playerId)?.nationality.code;
        if (!code) return false;
        if (scope.country) return code === scope.country;
        return continentOfCountry(code) === scope.continent;
      })
    : rows;
  const gameDate = new Date(worldDayStartMs(serverWorldDay(), worldClockConfig()));
  return scoped.map((r, i) => {
    const p = byId.get(r.playerId);
    return {
      playerId: r.playerId,
      name: p ? `${p.firstName} ${p.lastName}` : formatPlayerCode(r.playerId),
      clubName: p?.club?.name ?? "",
      points: roundSkill(r.points),
      position: narrowed ? i + 1 : (r.position ?? i + 1),
      isHuman: r.playerId === humanId,
      avatar: p?.avatar ?? null,
      age: p ? computeAge(p.birthDate, gameDate) : 8,
    };
  });
}

/** Herhangi bir kategorinin bu quarter'daki sıralaması (Klasman filtresi). */
export async function getCategoryRanking(
  categoryId: string,
  scope: { continent?: string; country?: string; city?: string } = {},
): Promise<RankingRowDTO[]> {
  const state = await loadState();
  if (!state) return [];
  const { gs, human } = state;
  return buildRankingView(categoryId, quarterOf(gs.dayIndex), human.id, scope);
}

export interface NationalTeamMemberDTO {
  playerId: number;
  name: string;
  rating: number; // overall reyting (milli takımda rakipleri yakından tanımak için)
  position: number; // kategori sıralamasındaki yeri (1..N)
  isHuman: boolean;
  avatar: string | null; // avatar seti; null → harf rozeti
  age: number; // portre kademesi için
}

/**
 * Bir kategorinin MİLLİ TAKIMI = o kategori Quarter Ranking ilk NATIONAL_TEAM_SIZE'ı, overall reytingleriyle.
 * (Tek ülke/TR fazı: kategori sıralamasının ilk N'i. Çok-ülke fazında ülke filtresi eklenir.)
 */
export async function getNationalTeam(categoryId: string): Promise<NationalTeamMemberDTO[]> {
  const state = await loadState();
  if (!state) return [];
  const { gs, human } = state;
  // Milli takım = oyuncunun KENDİ ÜLKESİNİN o kategorideki YURT-İÇİ (DOMESTIC) klasman ilk 4'ü
  // (uluslararası puanlar KARIŞMAZ → milli takım saf yurt-içi performans; Alman'ın milli takımı Almanlar).
  const myCountry = human.nationality?.code ?? "TR";
  const rows = await prisma.ranking.findMany({
    where: { categoryId, quarter: quarterOf(gs.dayIndex), scope: "DOMESTIC", player: { nationality: { code: myCountry } } },
    orderBy: [{ points: "desc" }, { playerId: "asc" }],
    take: NATIONAL_TEAM_SIZE,
  });
  const players = await prisma.player.findMany({
    where: { id: { in: rows.map((r) => r.playerId) } },
    include: { skills: true },
  });
  const byId = new Map(players.map((p) => [p.id, p]));
  const gameDate = new Date(worldDayStartMs(serverWorldDay(), worldClockConfig()));
  return rows.map((r, i) => {
    const p = byId.get(r.playerId);
    return {
      playerId: r.playerId,
      name: p ? `${p.firstName} ${p.lastName}` : formatPlayerCode(r.playerId),
      rating: p ? roundSkill(overall(rowsToSkills(p.skills))) : 0,
      position: r.position ?? i + 1,
      isHuman: r.playerId === human.id,
      avatar: p?.avatar ?? null,
      age: p ? computeAge(p.birthDate, gameDate) : 8,
    };
  });
}

// Kondisyon modeli (A, #35, kullanıcı 29.09): GECE TAM TOPARLANMA — her sabah ~%99 kondisyonla başlanır.
// O günkü antrenman/maç akşam yorar, uyku ertesi sabah toparlar. Yorgunluk günler arası BİRİKMEZ
// (antrenman aşırı-yük sakatlığı pratikte kalkar; maç-içi/turnuva-günü yorgunluğu ve sakatlığı KALIR).
const INJURY_REST_RECOVERY = 10; // sakatlık gününde toparlanma

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
) {
  const days = Math.max(0, toDay - gs.dayIndex);
  if (days > 0) {
    await tx.player.updateMany({
      where: { isAI: true, fatigue: { gt: 0 } },
      data: { fatigue: { decrement: AI_DAILY_RECOVERY * days } },
    });
    await tx.player.updateMany({ where: { isAI: true, fatigue: { lt: 0 } }, data: { fatigue: 0 } });
  }
  // M11.5 düzeltmesi: AI havuzu ORTAK (bkz. resetCareer yorumu) — birden fazla insanın kendi gün
  // ilerletmesi AYNI ayı geçebiliyordu, ve önceden burada "bu ay zaten işlendi mi?" kontrolü yoktu:
  // her geçiş TÜM AI'ların o ayki gelişimini yeniden zar atıp uyguluyordu → aynı ay birkaç kez üst üste
  // işlenip AI'lar tasarlanandan hızlı/tutarsız gelişebiliyordu. Artık her AI kendi `aiDevMonth`'unu
  // (en son işlenen ay) taşıyor; bir ay yalnız BİR KERE, ATOMİK bir "hak ediş" (updateMany + koşullu
  // WHERE) ile işleniyor — aynı anda iki insan aynı AI'yı aynı ay için işlemeye çalışırsa yalnız biri
  // kazanır, kaybeden `count===0` görüp atlar (Postgres satır kilidi bunu güvenli yapar). Tohum da artık
  // çözen kişiye değil, sabit `ai.id + ay`'a bağlı — kim kazanırsa kazansın sonuç aynı. Bkz. DEVIR.md.
  const toMonth = Math.floor(toDay / DAYS_PER_MONTH);
  if (toMonth > 0) {
    const ais = await tx.player.findMany({
      where: { isAI: true, status: { not: "RETIRED" }, aiDevMonth: { lt: toMonth } }, // emekli bot gelişmez
      include: { skills: true },
    });
    const devQuarter = quarterOf(toDay);
    for (const ai of ais) {
      if (ai.skills.length === 0) continue;
      const aiAge = currentAge(ai.birthDate, devQuarter); // yaşa uygun gelişim tavanı için
      for (let month = ai.aiDevMonth + 1; month < toMonth; month++) {
        const claim = await tx.player.updateMany({
          where: { id: ai.id, aiDevMonth: { lt: month } },
          data: { aiDevMonth: month },
        });
        if (claim.count === 0) continue; // başka bir insan bu ayı bu AI için zaten işledi/işliyor
        const rng = createRng(`world:aidev:${ai.id}:${month}`);
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
export async function advanceDay(skipFirst = false): Promise<AdvanceResult> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;
  if (gs.liveTournament) return { live: true };

  const startQuarter = quarterOf(gs.dayIndex);
  const cur = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  const age = cur.age;
  const ranking = await buildRankingView(cur.categoryId, startQuarter, human.id, { country: human.nationality?.code ?? "TR" });
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  // Etkinliği (19:00) gerçekleşmiş EN SON güne kadar işle: gün 00:00'da döner ama o günün turnuvası/
  // antrenmanı 19:00'da olur → 19:00'dan önce o gün işlenmez (kullanıcı bekler, sıradaki turnuva sayaçta).
  const eventDay = serverEventDay();
  const planArr = (gs.trainingPlan || DEFAULT_PLAN).split(",").filter(Boolean) as TrainingType[];

  // M11.2: bu ilerlemede geçilecek turnuvalara önceden kayıt (offline otomatik oynatma için).
  const regRows = await prisma.registration.findMany({
    where: { playerId: human.id, worldDay: { gte: gs.dayIndex, lte: eventDay } },
  });
  const regByDay = new Map<string, unknown>(regRows.map((r) => [`${r.worldDay}:${r.level}`, r]));
  // B Faz 2: kayıtsız girip sahada oynadığı (tetikleyen) turnuva günleri de kayıtlı gibi kapanır —
  // yoksa o gün "kaçırıldı" sayılıp ayrıca antrenman uygulanır ve "yokken" özeti yazılmazdı.
  const played = await prisma.tournamentParticipant.findMany({
    where: { playerId: human.id, tournament: { worldDay: { gte: gs.dayIndex, lte: eventDay } } },
    select: { tournament: { select: { worldDay: true, level: true } } },
  });
  for (const p of played) {
    const key = `${p.tournament.worldDay}:${p.tournament.level}`;
    if (!regByDay.has(key)) regByDay.set(key, p);
  }

  // Çevre çarpanları (GDD 14.60): trait × psikoloji × kulüp × ekipman.
  const psych = psychologyOf(human);
  const envMult =
    traitTrainingMultiplier(activeTraitsOf(human.traits, age)) *
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
  let xpGained = 0; // #28: antrenman tecrübesi (turnuvanın ~1/10'u/seans)
  // M11.2: geçmiş bir turnuvaya kayıtlıysak, döngü orada durur ve bunu doldururuz (persist sonrası oynatılır).
  let pendingAuto: { level: TournamentLevel } | null = null;

  // Antrenman haberi (özet) için başlangıç değerleri.
  const beforeSkills: Record<string, number> = {};
  for (const def of SKILLS) beforeSkills[def.key] = skills[def.key].current;
  const fatigueBefore = fatigue;
  const sharpnessBefore = sharpness;
  const startDay = gs.dayIndex;
  // Bugün radarı (GORSEL §8): her çeyreğin ilk işlenen gününde, antrenmandan ÖNCE yetenekler dondurulur.
  let skillBase = parseSkillQuarterBase(gs.skillQuarterBase);
  const markQuarterStart = () => {
    skillBase = rollSkillQuarterBase(skillBase, quarterOf(d), Object.fromEntries(SKILLS.map((s) => [s.key, skills[s.key].current])));
  };

  // Bir antrenman/dinlenme seansı uygular; sakatlanırsa true döner. (Sakatlık advance başına en çok
  // bir kez.) Turnuvaya katılmadığın gün de PLANINDAKİ seans uygulanır (Dinlenme koyabilirsin).
  const applySession = (type: TrainingType): boolean => {
    // A (#35, kullanıcı 29.09): GECE TAM TOPARLANMA — her yeni gün ~%99 kondisyonla başlar (yorgunluk
    // tabanı 1; kondisyon en çok %99, kimse tam %100 taze değil). O günkü antrenman/maç akşam yorar,
    // ertesi sabah uyku toparlar. (Dayanıklılık artık maç-İÇİ yorgunlukta önemli — matchFatigueMultiplier.)
    fatigue = 1;
    if (type === "REST") {
      restSessions++;
    } else {
      xpGained += TRAINING_XP; // #28: her antrenman seansı küçük tecrübe verir
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
        injuryDays = inj.days;
        injuredNow = true;
        return true;
      }
    }
    return false;
  };

  // M10: dünya gününe (gerçek zaman) kadar otomatik ilerle. Uygun turnuva günlerinde DUR (Katıl/Geç).
  // skipFirst=true (Geç): baştaki turnuvayı antrenmanla geçip sonraki turnuvaya kadar ilerle.
  let firstDay = true;
  for (let guard = 0; guard < DAYS_PER_QUARTER * 2; guard++) {
    markQuarterStart(); // çeyrek sınırı bu gündeyse değerler tam sınırda dondurulur
    if (d > eventDay) break; // etkinliği (19:00) gelmemiş günü işleme — bekle (sıradaki turnuva sayaçta)
    if (injuryDays > 0) {
      fatigue = clamp(fatigue - INJURY_REST_RECOVERY, 1, 100);
      injuryDays--;
      d++;
      firstDay = false;
      continue;
    }
    const act = activityForDay(d);
    if (act.kind === "TOURNAMENT") {
      const eligible =
        qualifies(act.qualification, humanRank) && levelAllowedForCategory(act.level, cur.ageCategory);
      // Canlı oynanabilir = etkinliği en son gelen gün VE canlı penceresi hâlâ açık. Pencere kapandıysa
      // turnuva bitti → aşağıda kayıtlıysa otomatik oynanır (sen yokken), değilse kaçırılır — "CANLI" yok.
      const isLive = d === eventDay && tournamentStillLive(eventDay);
      if (eligible && isLive && !(firstDay && skipFirst)) break; // canlı turnuvada dur (Katıl/Geç)
      // M11.2: geçmiş (d < eventDay) + kayıtlı + uygun → offline otomatik oynat (önceden taktikle).
      const reg = regByDay.get(`${d}:${act.level}`);
      if (eligible && !isLive && reg) {
        pendingAuto = { level: act.level }; // taktikler kayıtlardan okunur (ortak çözüm)
        break; // döngüden çık; antrenmanı persist et, sonra turnuvayı oynat
      }
      // Uygun değil / geçmiş-kayıtsız (kaçırdın) / (Geç ile) bugünkü ilk gün → o gün PLANINDAKİ seans.
      const injured = applySession(planArr[dayOfWeek(d)] ?? "REST");
      d++;
      firstDay = false;
      if (injured) break;
      continue;
    }
    // Antrenman günü (plan seansı — güne göre)
    const injured = applySession(planArr[dayOfWeek(d)] ?? "REST");
    d++;
    firstDay = false;
    if (injured) break;
  }

  // A (#35): sabah — bugünün 19:00 etkinliği henüz gelmemiş yeni gündeysek, gece toparlanması olmuştur →
  // kondisyon taze (~%99). (Akşam antrenman sonrası aynı gün düşük kalır; ertesi sabah bu satır tazeler.)
  if (serverWorldDay() > eventDay && injuryDays === 0) fatigue = 1;

  const nextPsych = psychAfterTrainingWeek(psych, restSessions);

  // Dilim 3-1: hayat olayları — geçilen her oyun-haftasında ~2 olay (psikoloji). Uzun boşlukta son 8 hafta ile
  // sınırla (sel olmasın). Deterministik (oyuncu+hafta tohumu). Psikolojiye uygulanır + "Sen yokken"de bildirilir.
  const fromWeek = Math.floor(startDay / DAYS_PER_MONTH);
  const toWeek = Math.floor(d / DAYS_PER_MONTH);
  const weekEvents: { key: string }[] = [];
  const matEvents: MaterialEvent[] = [];
  for (let w = Math.max(fromWeek, toWeek - 8); w < toWeek; w++) {
    for (const ev of rollWeeklyEvents(createRng(`events:${human.id}:${w}`), cur.age)) weekEvents.push({ key: ev.key });
    for (const mv of rollWeeklyMaterial(createRng(`matev:${human.id}:${w}`))) matEvents.push(mv); // 3-2: nadir malzeme olayı
  }
  const eventDefs = weekEvents.map((e) => LIFE_EVENTS.find((d2) => d2.key === e.key)!).filter(Boolean);
  const finalPsych = applyEventsToPsych(nextPsych, eventDefs);
  // 3-2: malzeme olayları → kit (paslanma üstüne hasar: kırılma/yıpranma) + harçlık (Denar).
  let eventKit = applyRestAging(resolveKit(human.equipmentState, human.weapon as Weapon), startDay, d);
  for (const mv of matEvents) {
    if (mv.effect === "breakWeapon") eventKit = damageActive(eventKit, "WEAPON", cur.age, cur.ageCategory, { break: true });
    else if (mv.effect === "wearWeapon") eventKit = damageActive(eventKit, "WEAPON", cur.age, cur.ageCategory, { hit: mv.durabilityHit });
  }
  const harclik = matEvents.reduce((s, e) => s + (e.denar ?? 0), 0);
  const allEventKeys = [...weekEvents.map((e) => e.key), ...matEvents.map((e) => e.key)];
  // 3-3: markette süreli fırsat/indirim. Mevcut teklif süresi geçtiyse düşer; yoksa son hafta için yeni teklif denenir.
  let offer: GearOffer | null = gs.pendingOffer ? (JSON.parse(gs.pendingOffer) as GearOffer) : null;
  if (offer && d > offer.expiresDay) offer = null;
  if (!offer && toWeek > fromWeek) offer = rollOffer(createRng(`offer:${human.id}:${toWeek - 1}`), human.weapon as Weapon, d);

  // Antrenman haberi: skill kazanımları + kondisyon/keskinlik değişimi (kullanıcıya "+2 Atak, -20 kondisyon").
  // `key` yazılır, etiket dile göre `page.tsx`'te `t(locale, "skill." + key)` ile çevrilir.
  const days = d - startDay;
  const gains = SKILLS.map((def) => ({
    key: def.key,
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
          events: allEventKeys, // Dilim 3: hayat + malzeme olayları (Sen yokken'de gösterilir)
        })
      : null;

  await prisma.$transaction(async (tx) => {
    for (const def of SKILLS) {
      await tx.playerSkill.update({
        where: { playerId_key: { playerId: human.id, key: def.key } },
        data: { current: skills[def.key].current },
      });
    }
    // Kulüp aidatı (Dilim 2B-3): geçilen her oyun-ayında (7 gün) küçük Denar; kulüp kalitesine bağlı.
    // Yumuşak: bakiyeyi 0'ın altına indirmez (ödeyemezse elindeki kadar öder, ceza yok).
    const monthsCrossed = Math.floor(d / DAYS_PER_MONTH) - Math.floor(startDay / DAYS_PER_MONTH);
    const clubDues = Math.min(human.balance, clubMonthlyDues(human.club?.coachSkill ?? 60) * Math.max(0, monthsCrossed));
    await tx.player.update({
      where: { id: human.id },
      data: {
        fatigue,
        sharpness,
        experience: { increment: xpGained }, // #28: antrenman tecrübesi
        balance: { increment: harclik - clubDues }, // 3-2 harçlık/hediye − kulüp aidatı (net; bakiye 0 altına inmez)
        // 2C-3 paslanma + 3-2 malzeme olayı hasarı uygulanmış kit.
        equipmentState: encodeKit(eventKit),
        morale: finalPsych.morale,
        motivation: finalPsych.motivation,
        confidence: finalPsych.confidence,
        stress: finalPsych.stress,
        status: injuryDays > 0 ? "INJURED" : "ACTIVE",
        injuryDaysRemaining: injuryDays,
      },
    });
    await worldAdvanceTx(tx, gs, d);
    // Kumbaram: bu ilerlemenin Denar hareketleri (harçlık/hediye + kulüp aidatı) işlem kaydına.
    const ledgerEntries: LedgerEntry[] = [];
    if (harclik > 0) ledgerEntries.push({ day: d, key: "allowance", amount: harclik });
    if (clubDues > 0) ledgerEntries.push({ day: d, key: "dues", amount: -clubDues });
    await tx.gameState.update({
      where: { id: gs.id },
      data: { lastReport: report, skillQuarterBase: JSON.stringify(skillBase), pendingOffer: offer ? JSON.stringify(offer) : null, ledger: nextLedgerJson(gs.ledger, ...ledgerEntries) },
    });
  });

  // M11.2: geçmiş bir turnuvaya kayıtlıysak, güncel durumu tazeleyip offline oynat.
  // (finalizeTournament dünyayı turnuva gününden bir sonraki güne ilerletir; AutoAdvance
  // kalan günler için tekrar tetiklenir → sıradaki turnuva/antrenman.)
  if (pendingAuto) {
    const fresh = await loadState();
    if (fresh && !fresh.gs.liveTournament) {
      await autoResolveTournament(fresh.gs, fresh.human, pendingAuto.level);
    }
  }

  return {};
}

/** Antrenman haber kartını temizler (kullanıcı "✕" ile kapatınca). */
export async function clearReport(): Promise<void> {
  const gs = await currentGameState();
  if (!gs) return;
  await prisma.gameState.update({ where: { id: gs.id }, data: { lastReport: null } });
}

/** M11.4: "yokken neler oldu" kartını temizler. */
export async function clearAwayReport(): Promise<void> {
  const gs = await currentGameState();
  if (!gs) return;
  await prisma.gameState.update({ where: { id: gs.id }, data: { awayReport: null } });
}

/** Katman 2 Dilim 3: trait evrimi bildirimlerini temizler (görülünce). */
export async function clearTraitReport(): Promise<void> {
  const gs = await currentGameState();
  if (!gs) return;
  await prisma.gameState.update({ where: { id: gs.id }, data: { traitReport: null } });
}

/** Geri bildirim / hata bildirimi kaydeder (test haftası). Giriş yoksa da çalışır (playerName null). */
export async function submitFeedback(input: { message: string; page?: string; kind?: string }): Promise<void> {
  const message = (input.message ?? "").trim().slice(0, 2000);
  if (!message) return;
  const kind = input.kind === "error" ? "error" : "feedback";
  let userToken: string | null = null;
  let playerName: string | null = null;
  try {
    userToken = (await cookies()).get(USER_COOKIE)?.value ?? null;
    const state = await loadState();
    if (state) playerName = `${state.human.firstName} ${state.human.lastName}`;
  } catch {
    // giriş/kariyer yoksa sorun değil — anonim de bildirebilir
  }
  await prisma.feedback.create({
    data: { kind, message, page: input.page?.slice(0, 200) || null, playerName, userToken },
  });
}

/** Sahibi için: son geri bildirimler (en yeni önce). */
export async function getFeedback(limit = 200) {
  return prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

/** M11.4: offline oynanan bir turnuvayı "yokken neler oldu" özetine ekler (birikimli JSON dizi). */
async function appendAwayReport(gsId: number, entry: AwayTournamentEntry): Promise<void> {
  const cur = await prisma.gameState.findUnique({ where: { id: gsId }, select: { awayReport: true } });
  const list: AwayTournamentEntry[] = cur?.awayReport ? JSON.parse(cur.awayReport) : [];
  list.push(entry);
  // Uzun süre yokken şişmesin: son 30 turnuvayı tut.
  const trimmed = list.slice(-30);
  await prisma.gameState.update({ where: { id: gsId }, data: { awayReport: JSON.stringify(trimmed) } });
}

/**
 * Bugünkü turnuvaya GİRER. B Faz 2: turnuva 18:00 GMT'de bir kez çekilir ve kilitli çizelgeyle TUR TUR
 * sunucuda çözülür; bu çağrı turnuvayı getirir (gerekirse çeker), "şimdi"ye kadar ilerletir ve canlı
 * sayfaya yönlendirir. Turnuva sürerken oyuncu turnuva gününde kalır (izler, tur aralarında taktik
 * verir); turnuva bittiyse gün tamamlanmıştır → gün ilerler.
 */
export async function attendTournament(): Promise<AdvanceResult> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;
  if (gs.liveTournament) return { live: true }; // eski (B öncesi) canlı oturum — bitene kadar aynen çalışır
  if (human.injuryDaysRemaining > 0) throw new GameError("injured", "Sakatsın — turnuvaya giremezsin (GDD 8.19).");
  const act = activityForDay(gs.dayIndex);
  if (act.kind !== "TOURNAMENT") throw new GameError("no_tournament", "Bugün turnuva yok.");
  if (gs.dayIndex > serverEventDay()) throw new GameError("not_time", "Turnuva saati henüz gelmedi — bugün 18:00 GMT'de başlar.");
  const attendId = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  if (!levelAllowedForCategory(act.level, attendId.ageCategory)) {
    throw new GameError("u17_only", "Uluslararası turnuvalar yalnız U17 ve üstü içindir.");
  }
  const ranking = await buildRankingView(attendId.categoryId, quarterOf(gs.dayIndex), human.id, { country: human.nationality?.code ?? "TR" });
  const humanRank = ranking.find((r) => r.isHuman)?.position ?? null;
  if (!qualifies(act.qualification, humanRank)) {
    throw new Error(`Katılım hakkın yok — ${qualificationLabel(act.qualification)}.`);
  }
  const id = await ensureLiveTournament(gs, human, act.level, { attendee: true });
  if (id == null) throw new GameError("no_opponents", "Turnuva için yeterli rakip yok."); // günü SESSİZCE harcama — görünür hata
  await tickLiveTournament(id, { locale: await getLocale() });
  const t = await prisma.tournament.findUnique({ where: { id }, select: { status: true } });
  if (t?.status === "FINISHED") await prisma.$transaction((tx) => worldAdvanceTx(tx, gs, gs.dayIndex + 1));
  return { live: true, tournamentId: id };
}

/** Canlı turnuvada sıradaki maç için taktik gönderir (pencere/doğrulama/istek sınırı sunucuda). */
export async function submitTournamentTactic(tournamentId: number, tactic: string): Promise<TacticSubmitResult> {
  const state = await loadState();
  if (!state) return { ok: false, reason: "not_participant" };
  return submitLiveTactic(tournamentId, state.human.id, tactic);
}

/**
 * Canlı turnuva sayfasından kariyere dönüş. Turnuva BİTTİYSE ve oyuncunun bugünkü turnuvasıysa (aynı
 * kapsam + gün) o gün tamamlanmıştır → gün ilerler. Sürüyorsa ya da başka bir turnuvaya bakıyorsa dokunmaz.
 */
export async function leaveTournament(tournamentId: number): Promise<void> {
  const state = await loadState();
  if (!state) return;
  const { gs, human } = state;
  if (gs.liveTournament) {
    await leaveLiveTournament(); // B-öncesi oturum
    return;
  }
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true, worldDay: true, scopeKey: true },
  });
  if (!t || t.status !== "FINISHED" || t.worldDay !== gs.dayIndex || !t.scopeKey) return;
  const act = activityForDay(gs.dayIndex);
  if (act.kind !== "TOURNAMENT") return;
  const id = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  const country = await prisma.country.findUnique({ where: { id: human.nationalityId } });
  const mine = tournamentScopeKey(act.level, country?.code ?? "??", human.club?.city ?? "", id.categoryId, gs.dayIndex);
  if (mine !== t.scopeKey) return;
  await prisma.$transaction((tx) => worldAdvanceTx(tx, gs, gs.dayIndex + 1));
}

/** Gladius mağazasından bir ürün satın alır (Denar ile). Zaten sahipse/parası yoksa uygun hata. */
export async function buyEquipment(itemId: string): Promise<void> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;
  const item = itemById(itemId);
  if (!item) throw new GameError("item_not_found", "Ürün bulunamadı.");
  const owned = parseOwned(human.ownedEquipment);
  const curKit = resolveKit(human.equipmentState, human.weapon as Weapon);
  // Her parçadan 3'e kadar (yedek). Slot doluysa alma (çöp at'la yer aç).
  if (itemsInSlot(curKit, item.slot).length >= MAX_PER_SLOT) throw new GameError("slot_full", "Bu parçadan en fazla 3 tanesine sahip olabilirsin.");
  // 3-3: bu ürün için aktif fırsat varsa indirimli fiyat; satın alınca teklif tükenir.
  const offer = gs.pendingOffer ? (JSON.parse(gs.pendingOffer) as GearOffer) : null;
  const onOffer = offerActive(offer, serverWorldDay()) && offer!.itemId === item.id;
  const price = onOffer ? discountedPrice(item.denar, offer!.discountPct) : item.denar;
  if (human.balance < price) throw new Error("Yeterli Denar yok.");
  // Çantayı güncelle: parça yeni ürünle, oyuncunun YAŞINA uygun bedenle (silah→kategori, kıyafet→gövde). Silah → yedek ekler.
  const ident = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  const kit = applyKitPurchase(curKit, item, requiredSize(item.slot, ident.age, ident.ageCategory));
  await prisma.player.update({
    where: { id: human.id },
    data: {
      balance: { decrement: price },
      ownedEquipment: encodeOwned([...owned, item.id]),
      equipmentState: encodeKit(kit),
    },
  });
  // Kumbaram kaydı (malzeme gideri) + fırsat kullanıldıysa teklifi temizle (tek update).
  await prisma.gameState.update({
    where: { id: gs.id },
    data: { ledger: nextLedgerJson(gs.ledger, { day: serverWorldDay(), key: "equipment", amount: -price, arg: item.id }), ...(onOffer ? { pendingOffer: null } : {}) },
  });
}

/** Bir ekipman parçasını ÇÖP ATAR (slot + o slottaki sıra). İade yok. owned combat için çantadan tazelenir. */
export async function discardEquipment(slot: string, index: number): Promise<void> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { human } = state;
  const kit = discardKitItem(resolveKit(human.equipmentState, human.weapon as Weapon), slot as EquipmentSlot, index);
  await prisma.player.update({
    where: { id: human.id },
    data: { equipmentState: encodeKit(kit), ownedEquipment: encodeOwned(kit.map((k) => k.itemId)) },
  });
}

/**
 * Ödüllü reklam izlendi → +AD_REWARD Denar (günde en çok AD_DAILY_CAP). İSTENMEDEN açılmaz; oyuncu
 * Market'teki "Denar" köşesinde isteyerek çağırır. Sayaç günlük sıfırlanır (serverWorldDay). Kota
 * dolmuşsa hata. Gerçek reklam ağı entegrasyonu lansmanta; bu fonksiyon yalnız ödülü verir.
 */
export async function watchRewardedAd(): Promise<{ balance: number; adsLeft: number }> {
  const state = await loadState();
  if (!state) throw new Error("Aktif kariyer yok.");
  const { gs, human } = state;
  const day = serverWorldDay();
  const adState: AdState = { lastAdDay: human.lastAdDay, adsToday: human.adsToday };
  if (!canWatchAd(adState, day)) throw new GameError("ad_cap", "Bugünkü reklam hakkın doldu.");
  const { state: next, reward } = watchAd(adState, day);
  const updated = await prisma.player.update({
    where: { id: human.id },
    data: { lastAdDay: next.lastAdDay, adsToday: next.adsToday, balance: { increment: reward } },
    select: { balance: true },
  });
  await prisma.gameState.update({ where: { id: gs.id }, data: { ledger: nextLedgerJson(gs.ledger, { day, key: "ad", amount: reward }) } });
  return { balance: roundSkill(updated.balance), adsLeft: adsLeftToday(next, day) };
}

export interface CareerHistoryDTO {
  name: string;
  // Kronolojik (eskiden yeniye). dateMs = kazanıldığı dünya gününün GMT başlangıcı (eski kayıtta null → Q);
  // order = sıra anahtarı (kayıt tarihi). Vitrin/zaman çizgisi bunlardan kurulur (src/app/ui/showcase.ts).
  achievements: {
    type: string;
    label: string;
    detail: string;
    importance: number;
    date: string;
    dateMs: number | null;
    quarter: number;
    order: number;
  }[];
  stats: {
    totalTournaments: number;
    championships: number;
    medals: number;
    finals: number;
    matchesPlayed: number;
    matchWins: number;
    careerBestRank: number | null;
  };
  rivals: { name: string; matches: number; wins: number; losses: number; avatar: string | null; age: number }[];
  tournaments: {
    id: number;
    name: string;
    level: string;
    levelCode: string; // TournamentLevel (vitrinde üst kademe hedefleri için)
    categoryId: string;
    date: string;
    dateMs: number | null; // turnuvanın dünya günü (GMT başlangıcı); eski turnuvada null
    order: number;
    position: number;
    quarter: number; // oyun yılı (Q)
    month: number; // H1..H12
  }[];
}

/** Kariyer geçmişi: başarılar, istatistikler ve rakiplikler (GDD 21, 22.36–22.37). */
export async function getCareerHistory(): Promise<CareerHistoryDTO | null> {
  const gs = await currentGameState();
  if (!gs) return null;
  const human = await prisma.player.findUnique({ where: { id: gs.humanPlayerId } });
  if (!human) return null;
  const hid = human.id;
  const locale = await getLocale();

  const cfg = worldClockConfig();
  const dayMs = (worldDay: number | null) => (worldDay != null ? worldDayStartMs(worldDay, cfg) : null);
  const [achievements, entries, matches] = await Promise.all([
    prisma.achievement.findMany({
      where: { playerId: hid },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    }),
    prisma.tournamentParticipant.findMany({
      where: { playerId: hid },
      include: { tournament: true },
    }),
    prisma.match.findMany({ where: { status: "RESOLVED", OR: [{ playerAId: hid }, { playerBId: hid }] } }),
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
      name: tournamentDisplayName(
        locale,
        e.tournament.categoryId.split("-")[0],
        e.tournament.level as TournamentLevel,
        tournamentHostFrom(e.tournament.level as TournamentLevel, e.tournament.worldDay ?? 0, e.tournament.scopeKey),
        countryCodeFromScopeKey(e.tournament.scopeKey),
      ),
      level: t(locale, `tournament.${e.tournament.level}`),
      levelCode: e.tournament.level,
      categoryId: e.tournament.categoryId,
      date: e.tournament.date.toISOString(),
      // GERÇEK tarih: dünya gününden (GMT); eski kayıtta worldDay yoksa oyun-içi `date`e düş (asla bare "Q" gösterme).
      dateMs: dayMs(e.tournament.worldDay) ?? e.tournament.date.getTime(),
      order: e.tournament.date.getTime(),
      position: e.finalPosition ?? 0,
      quarter: e.tournament.quarter,
      month: e.tournament.week, // week alanı ayı (h1..h12) saklar
    }));

  // Rakiplikler: en çok karşılaşılan rakipler (GDD 22.36).
  const byOpponent = new Map<number, { matches: number; wins: number; losses: number }>();
  for (const m of matches) {
    // RESOLVED filtresiyle sorgulandı → oyuncular kesin dolu (bkz. yukarıdaki findMany).
    const oppId = (m.playerAId === hid ? m.playerBId : m.playerAId)!;
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
  const rivalGameDate = new Date(worldDayStartMs(serverWorldDay(), worldClockConfig()));
  const oppInfo = new Map(
    oppPlayers.map((p) => [
      p.id,
      { name: `${p.firstName} ${p.lastName}`, avatar: p.avatar ?? null, age: computeAge(p.birthDate, rivalGameDate) },
    ]),
  );
  const rivals = topOppIds.map(([id, r]) => {
    const info = oppInfo.get(id);
    return {
      name: info?.name ?? formatPlayerCode(id),
      matches: r.matches,
      wins: r.wins,
      losses: r.losses,
      avatar: info?.avatar ?? null,
      age: info?.age ?? 8,
    };
  });

  return {
    name: `${human.firstName} ${human.lastName}`,
    achievements: achievements.map((a) => ({
      type: a.type,
      label: a.label,
      detail: a.detail,
      importance: a.importance,
      date: a.date.toISOString(),
      // GERÇEK tarih: dünya gününden (GMT); eski başarıda worldDay yoksa oyun-içi `date`e düş (asla bare "Q").
      dateMs: dayMs(a.worldDay) ?? a.date.getTime(),
      quarter: a.quarter,
      order: a.date.getTime(),
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

/**
 * Bir turnuvayı id ile yükler (sonuç/canlı-izleme ekranı — tek sayfa ikisini de kapsar, B Faz 1).
 * Önce sunucu-tiki çalıştırır (zamanı gelen maçları açar), sonra DB'den okur — herkes AYNI anı görür.
 * Tüm maçlar açılana kadar `isFullyRevealed=false`: şampiyon/klasman/pul kağıdı SPOILER olmasın diye
 * gizli kalır, henüz açılmamış maçlar isim/skor olmadan (`isPending`) döner.
 */
export async function getTournament(id: number): Promise<TournamentResultDTO | null> {
  const head = await prisma.tournament.findUnique({ where: { id }, select: { startsAt: true } });
  if (!head) return null;
  const locale = await getLocale();
  // B Faz 2 turnuvası (startsAt dolu) tur tur çözülür: önce "şimdi"ye kadar ilerletilir. Faz 1 turnuvaları
  // (anında çözülmüş) için yalnız zamanı gelen maçlar görünür yapılır.
  const liveModel = head.startsAt != null;
  if (liveModel) await tickLiveTournament(id, { locale });
  else await revealDueMatches(id);
  const tourn = await prisma.tournament.findUnique({
    where: { id },
    include: {
      participants: { include: { player: true } },
      matches: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!tourn) return null;
  const gs = await currentGameState();
  const humanId = gs?.humanPlayerId ?? -1;
  const fieldSize = tourn.participants.length;

  const nameById = new Map(
    tourn.participants.map((p) => [p.playerId, `${p.player.firstName} ${p.player.lastName}`]),
  );
  // Avatar: oyuncunun o turnuva günündeki yaşına göre portre (katılımcı player objesinden).
  const tourDate = new Date(tourn.worldDay != null ? worldDayStartMs(tourn.worldDay, worldClockConfig()) : tourn.date.getTime());
  const avatarById = new Map(
    tourn.participants.map((p) => [p.playerId, { avatar: p.player.avatar ?? null, age: computeAge(p.player.birthDate, tourDate) }]),
  );
  const sortedParticipants = [...tourn.participants].sort(
    (a, b) => (a.finalPosition ?? 999) - (b.finalPosition ?? 999),
  );
  const champion = sortedParticipants.find((p) => p.finalPosition === 1);
  const you = tourn.participants.find((p) => p.playerId === humanId);

  const pendingMatches = tourn.matches.filter((m) => m.status === "PENDING");
  // Faz 1: tüm maçlar açılınca biter. Canlı model: son adım çözülünce (status FINISHED).
  const isFullyRevealed = liveModel ? tourn.status === "FINISHED" : pendingMatches.length === 0;
  const nextRevealAt = pendingMatches
    .map((m) => m.scheduledAt)
    .filter((d): d is Date => d != null)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const resolvedPoolMatches = tourn.matches.filter((m) => m.phase === "POOL" && m.status === "RESOLVED");
  // Canlı modelde çözülen her şey gerçek zamanlıdır (önceden hesaplanmış sonuç yok) → spoiler yok, hemen
  // gösterilir; havuz tablosu (galibiyet/averaj) sonuç adımında yazılır.
  const showPoolSheets = isFullyRevealed || liveModel;
  const showPools = isFullyRevealed || (liveModel && tourn.step >= LIVE_RESULTS_STEP);
  // #43 aşamalı açılış (11.10 kullanıcı zamanlaması): pul sonuçları ~T+15 → KLASMAN T+16 (+1 dk) → ELEME ÇATALI
  // T+17 (+2 dk). O aralıkta oyuncu klasmanı/diğerlerini inceler. (Çatal sonuç adımında kuruluyor ama gizli tutulur.)
  const cfgMsPerDay = worldClockConfig().msPerDay ?? MS_PER_GAME_DAY;
  const scale = cfgMsPerDay / MS_PER_GAME_DAY;
  const resultsAtMs =
    liveModel && tourn.startsAt
      ? liveStepAtMs(tourn.startsAt.getTime(), LIVE_RESULTS_STEP, deFormat(tourn.categoryId.split("-")[0]).periods, cfgMsPerDay)
      : null;
  const showSeeding =
    isFullyRevealed || !liveModel || (resultsAtMs != null && Date.now() >= resultsAtMs + 60_000 * scale);
  const showBracket =
    isFullyRevealed || !liveModel || (resultsAtMs != null && Date.now() >= resultsAtMs + 120_000 * scale);
  // #44: pul sonrası TURNUVA KLASMANI (seeding sırası) — oyuncu kendi + diğerlerinin durumunu görsün (T+16'da).
  const seeding = showSeeding
    ? [...tourn.participants]
        .filter((p) => p.seedRank != null && p.seedRank > 0)
        .sort((a, b) => (a.seedRank as number) - (b.seedRank as number))
        .map((p) => ({
          position: p.seedRank as number,
          name: nameById.get(p.playerId) ?? formatPlayerCode(p.playerId),
          wins: p.wins ?? 0,
          losses: p.losses ?? 0,
          indicator: p.indicator ?? 0,
          isHuman: p.playerId === humanId,
          avatar: avatarById.get(p.playerId)?.avatar ?? null,
          age: avatarById.get(p.playerId)?.age ?? 8,
        }))
    : [];
  const live = liveModel ? await tournamentLiveDto(id, humanId, nameById, fieldSize, locale) : null;
  // #51: podyum maçının sunucu-zaman çapası. Podyum maçı = o an oynanan (devam eden) eleme maçın →
  // yoksa son çözülen eleme → yoksa son çözülen havuz maçın. Animasyon bu maçı üreten ADIMIN çözüm anından
  // (playStart) başlar, animMs kadar sürer → istemci now'dan senkron akıtır (replay/asılı/spoiler biter).
  if (live && live.status === "RUNNING" && tourn.startsAt) {
    const dePeriods = deFormat(tourn.categoryId.split("-")[0]).periods;
    const mine = tourn.matches.filter((m) => m.playerAId === humanId || m.playerBId === humanId);
    const deShown = mine.filter((m) => m.phase === "DE" && (m.status === "RESOLVED" || (m.status === "PENDING" && m.log != null)));
    const poolShown = mine.filter((m) => m.phase === "POOL" && m.status === "RESOLVED");
    const podiumRaw = deShown[deShown.length - 1] ?? poolShown[poolShown.length - 1] ?? null;
    if (podiumRaw) {
      let step: number;
      if (podiumRaw.phase === "DE") {
        // O ana dek açılan periyot sayısı = log'daki "▸" başlık satırı adedi; maçı üreten adım o periyodun adımı.
        const periodsShown = Math.max(1, (podiumRaw.log?.split("\n").filter((l) => l.startsWith("▸")).length) ?? 1);
        step = LIVE_RESULTS_STEP + ((podiumRaw.roundNo ?? 1) - 1) * dePeriods + periodsShown;
      } else {
        // Havuzun k. turu k. adımda çözülür; insanın çözülen havuz maçları orderIndex sırasıyla tur 1..k.
        step = poolShown.indexOf(podiumRaw) + 1;
      }
      const playStartMs = liveStepAtMs(tourn.startsAt.getTime(), step, dePeriods, cfgMsPerDay);
      // Bir "parça" (havuz maçı / bir periyot) TAM 1 oyun-dakikası oynanır (kullanıcı modeli 11.10). Kalan süre
      // "hazırlık" (sıradaki taktik): havuzda 1 dk (adım aralığı 2), elemede 30 sn (periyot aralığı 1.5).
      // Dünya saati kısaysa (dev) gerçek süre de orantılı kısalır.
      const animMs = 1 * 60_000 * scale;
      live.podium = { playStartAt: new Date(playStartMs).toISOString(), animMs };
    } else {
      live.podium = null;
    }
  }

  // Başlık altı: turnuvanın GERÇEK takvim tarihi (GMT). Saat podyumda zaten var → burada yalnız tarih (#başlık).
  const dateMs = tourn.worldDay != null ? worldDayStartMs(tourn.worldDay, worldClockConfig()) : tourn.date.getTime();
  const dateLabel = new Date(dateMs).toLocaleDateString("tr-TR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return {
    tournamentId: tourn.id,
    name: tournamentDisplayName(
      locale,
      tourn.categoryId.split("-")[0],
      tourn.level as TournamentLevel,
      tournamentHostFrom(tourn.level as TournamentLevel, tourn.worldDay ?? 0, tourn.scopeKey),
      countryCodeFromScopeKey(tourn.scopeKey),
    ),
    level: t(locale, `tournament.${tourn.level}`),
    categoryId: tourn.categoryId,
    dateLabel,
    isFullyRevealed,
    nextRevealAt: liveModel ? (live?.nextAt ?? null) : (nextRevealAt?.toISOString() ?? null),
    youParticipated: you != null,
    yourPosition: isFullyRevealed && you ? (you.finalPosition ?? fieldSize) : null,
    yourSeedRank: you?.seedRank ?? null, // seed pul aşamasından belli olur — spoiler değil
    championName: isFullyRevealed ? (champion ? (nameById.get(champion.playerId) ?? "?") : "?") : null,
    seeding, // #44: pul sonrası turnuva klasmanı (seed sırası)
    showBracket, // #43: eleme çatalı klasmandan ~30 sn sonra görünür
    pools: showPools ? buildPoolsView(tourn.participants, nameById, humanId) : [],
    poolSheets: showPoolSheets
      ? buildPoolSheets(
          resolvedPoolMatches.map((m) => ({ aId: m.playerAId!, bId: m.playerBId!, scoreA: m.scoreA!, scoreB: m.scoreB! })),
          new Map(tourn.participants.filter((p) => p.poolNumber != null).map((p) => [p.playerId, p.poolNumber as number])),
          nameById,
          humanId,
        )
      : [],
    standings: isFullyRevealed
      ? sortedParticipants.map((p) => ({
          position: p.finalPosition ?? fieldSize,
          name: nameById.get(p.playerId) ?? formatPlayerCode(p.playerId),
          isHuman: p.playerId === humanId,
          avatar: avatarById.get(p.playerId)?.avatar ?? null,
          age: avatarById.get(p.playerId)?.age ?? 8,
        }))
      : [],
    matches: tourn.matches.map((m) => {
      const isPending = m.status === "PENDING";
      // Faz 1'de açılmamış maç = gizli sonuç → isim de gizli. Canlı modelde bekleyen maçın eşleşmesi kamuya
      // açık çekim bilgisidir → isimler görünür (skor yok).
      const showNames = !isPending || (liveModel && m.playerAId != null && m.playerBId != null);
      // Aşama 2b: canlı eleme maçı periyot periyot çözülür; başladıysa (log birikti) o ana kadarki skor/log açılır.
      const inProgress = liveModel && isPending && m.phase === "DE" && m.log != null;
      const revealScore = !isPending || inProgress;
      const nameOf = (pid: number | null) => (pid == null ? null : (nameById.get(pid) ?? formatPlayerCode(pid)));
      return {
        phase: m.phase,
        round: localizeRound(locale, m.round),
        isPending,
        inProgress,
        aName: showNames ? nameOf(m.playerAId) : null,
        bName: showNames ? nameOf(m.playerBId) : null,
        scoreA: revealScore ? m.scoreA : null,
        scoreB: revealScore ? m.scoreB : null,
        log: revealScore && m.log != null ? m.log.split("\n") : null,
        aIsHuman: showNames && m.playerAId === humanId,
        bIsHuman: showNames && m.playerBId === humanId,
      };
    }),
    currentDate: (gs?.currentDate ?? tourn.date).toISOString(),
    live,
  };
}

/** Sıradaki çözüm adımının adı (canlı panel): "Havuz turu 3/5" · "Havuz sonuçları…" · "Eleme: Son 16". */
function liveStepLabel(
  locale: Locale,
  kind: "POOL" | "RESULTS" | "DE",
  roundNo: number | null,
  periodNo: number | null,
  fieldSize: number,
): string {
  if (kind === "POOL") return t(locale, "live.step.pool", { n: roundNo ?? 1, total: LIVE_POOL_STEPS });
  if (kind === "RESULTS") return t(locale, "live.step.results");
  const round = localizeRound(locale, deRoundLabel(bracketSize(fieldSize), roundNo ?? 1));
  // Eleme maçı periyot periyot oynanır → sıradaki adım hangi periyot (Aşama 2b).
  return periodNo != null
    ? t(locale, "live.step.dep", { round, p: periodNo })
    : t(locale, "live.step.de", { round });
}

/** Canlı panelin verisi: sıradaki adım + izleyen oyuncunun kendi durumu (katılımcı değilse `you` null). */
async function tournamentLiveDto(
  id: number,
  humanId: number,
  nameById: Map<number, string>,
  fieldSize: number,
  locale: Locale,
): Promise<TournamentLiveDTO | null> {
  const v: LiveViewDTO | null = await getLiveView(id, humanId >= 0 ? humanId : null);
  if (!v) return null;
  const nm = v.you?.nextMatch;
  return {
    status: v.status,
    podium: null, // getTournament doldurur (#51 podyum sunucu-zaman çapası)
    youName: humanId >= 0 ? (nameById.get(humanId) ?? null) : null,
    stepLabel: v.next ? liveStepLabel(locale, v.next.kind, v.next.roundNo, v.next.periodNo, fieldSize) : null,
    nextKind: v.next?.kind ?? null,
    nextAt: v.next?.at ?? null,
    serverNow: v.serverNow,
    you: v.you
      ? {
          eliminated: v.you.eliminated,
          nextMatch: nm
            ? {
                opponentName: nm.opponentId != null ? (nameById.get(nm.opponentId) ?? formatPlayerCode(nm.opponentId)) : null,
                round: localizeRound(locale, nm.round),
                phase: nm.phase,
                at: nm.at,
                periodNo: nm.periodNo,
                isNextStep: v.next != null && nm.step === v.next.step,
              }
            : null,
          windowOpen: v.you.windowOpen,
          windowClosesAt: v.you.windowClosesAt,
          windowPeriodNo: v.you.windowPeriodNo,
          effectiveTactic: v.you.effectiveTactic,
          pendingSet: v.you.pendingSet,
          registeredTactic: v.you.registeredTactic,
        }
      : null,
  };
}

/**
 * Mevcut KULLANICININ kariyerini siler (yeni kariyer için). Ortak dünya verisi (AI havuzu, kulüpler,
 * diğer kullanıcılar) KORUNUR — yalnız bu kullanıcının insan oyuncusu + durumu silinir. İnsan
 * oyuncuyu silmek skill/ranking/achievement/turnuva-kaydını cascade ile temizler (schema onDelete).
 */
/** Kariyeri silmenin/yeniden başlamanın Denar bedeli — sık reroll'u caydıran sink (tunable, GDD 16). */
export const CAREER_RESET_COST = 250;

export async function resetCareer(): Promise<void> {
  const uid = await currentUserId();
  if (uid == null) return;
  const gs = await prisma.gameState.findUnique({ where: { userId: uid }, select: { humanPlayerId: true } });
  if (gs) {
    const human = await prisma.player.findUnique({ where: { id: gs.humanPlayerId }, select: { balance: true } });
    // Denar kapısı: yeterli bakiye yoksa silinemez (kullanıcı kararı — kariyer silme Denar gerektirir).
    if (human && human.balance < CAREER_RESET_COST) {
      throw new Error(`Kariyeri silmek için en az ${CAREER_RESET_COST} Denar gerekir. Turnuvalardan Denar kazan.`);
    }
  }
  await prisma.$transaction([
    prisma.gameState.deleteMany({ where: { userId: uid } }),
    ...(gs ? [prisma.player.deleteMany({ where: { id: gs.humanPlayerId } })] : []),
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
  dateLabel: string; // turnuvanın GERÇEK takvim tarihi (GMT), başlık altında
  // B (docs/TURNUVA_MULTIPLAYER.md, Faz 1): sonuç anında kesinleşir ama GÖRÜNÜRLÜK tur tur açılır —
  // spoiler olmasın diye tüm maçlar açılana kadar şampiyon/klasman/pul kağıdı gizli kalır.
  isFullyRevealed: boolean;
  nextRevealAt: string | null; // ISO — bir sonraki maçın açılacağı an (henüz bitmediyse)
  youParticipated: boolean; // false → izleyici (turnuva sen girmeden kurulmuş ve sahada değilsin)
  yourPosition: number | null;
  yourSeedRank: number | null;
  championName: string | null;
  pools: PoolViewDTO[];
  poolSheets: PoolSheetDTO[];
  standings: { position: number; name: string; isHuman: boolean; avatar: string | null; age: number }[];
  seeding: { position: number; name: string; wins: number; losses: number; indicator: number; isHuman: boolean; avatar: string | null; age: number }[]; // #44: pul sonrası klasman (seed)
  showBracket: boolean; // #43: eleme çatalı klasmandan ~30 sn sonra açılır
  matches: {
    phase: string;
    round: string;
    isPending: boolean;
    aName: string | null;
    bName: string | null;
    scoreA: number | null;
    scoreB: number | null;
    log: string[] | null;
    aIsHuman: boolean;
    bIsHuman: boolean;
    inProgress: boolean; // canlı eleme maçı başladı ama bitmedi (periyotlar açılıyor; log/skor o ana kadarki)
  }[];
  currentDate: string;
  live: TournamentLiveDTO | null; // B Faz 2-3: tur-tur canlı turnuva paneli (eski turnuvalarda null)
}

/** Canlı turnuva paneli (B Faz 3): sıradaki adım + geri sayım + kendi sıradaki maçın ve taktik penceresi. */
export interface TournamentLiveDTO {
  status: "RUNNING" | "FINISHED";
  stepLabel: string | null;
  nextKind: "POOL" | "RESULTS" | "DE" | null;
  nextAt: string | null; // ISO — sıradaki adımın sunucuda çözüleceği an
  serverNow: string; // ISO — istemci saat farkını düzeltmek için
  youName: string | null; // izleyen insanın adı (hazırlık ScoreBug önizlemesi için)
  you: {
    eliminated: boolean;
    nextMatch: {
      opponentName: string | null; // eleme rakibi önceki tur bitince belli olur
      round: string;
      phase: "POOL" | "DE";
      at: string;
      periodNo: number | null; // elemede: sıradaki periyot (1 = maç başı); havuzda null
      isNextStep: boolean; // sıradaki adımda mı (değilse bu tur bay)
    } | null;
    windowOpen: boolean;
    windowClosesAt: string | null;
    windowPeriodNo: number | null; // elemede: taktik penceresinin ait olduğu periyot (1 = maç başı)
    effectiveTactic: Tactic; // şimdi bırakırsan bu taktikle oynarsın
    pendingSet: boolean;
    registeredTactic: Tactic | null;
  } | null;
  // #51: "podyum" maçının (o an oynanan/son çözülen senin maçın) SUNUCU-ZAMAN çapası. İstemci animasyonu
  // mount'tan değil bu çapadan sürer → tazeleme/remount baştan sardırmaz, biten maç yeniden oynamaz (replay/asılı
  // biter), sonuç oynama bitene kadar sızmaz. reveal = now'ın saf fonksiyonu: (now−playStart)/animMs.
  podium: { playStartAt: string; animMs: number } | null;
}

/**
 * B — "sunucu-tik" (docs/TURNUVA_MULTIPLAYER.md §2.2), lazy-catch-up: bu turnuvaya bakan HER istek
 * zamanı gelmiş PENDING maçları RESOLVED'a çevirir. Sonuç zaten hesaplı (finalizeTournament anında
 * yazdı) — bu yalnız GÖRÜNÜRLÜĞÜ "now"a kadar ilerletir. Saf bulk update, kimin tetiklediği önemsiz
 * (idempotent — iki istek aynı anda çalışsa da sonuç aynı).
 */
async function revealDueMatches(tournamentId: number): Promise<void> {
  await prisma.match.updateMany({
    where: { tournamentId, status: "PENDING", scheduledAt: { lte: new Date() } },
    data: { status: "RESOLVED" },
  });
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
  conditionBonus?: number; // form (psikoloji+trait+ekipman+günün hâli) — herkeste
  age?: number; // tam yaş (combat'ta ~30 sonrası gerileme)
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
  scopeKey?: string; // M11.3b-2: ortak turnuva örneği anahtarı (dedup)
  coHumanIds?: number[]; // M11.3b-2: sahadaki diğer kayıtlı gerçek oyuncular (bot gibi oynar, etki uygulanır)
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
  earnedXp?: number; // bu turnuvadan kazanılan tecrübe (#28)
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

/** Combatant snapshot'ından Dayanıklılık (endurance) — maç yorgunluğu direncinde kullanılır. */
function enduranceOf(ls: LiveState, id: number): number {
  return ls.combatants.find((c) => c.id === id)?.skills.endurance ?? 20;
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
    age: lc.age,
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
  // Maç yorgunluğu Dayanıklılık'a göre azalır (fit sporcu daha az yorulur).
  ls.fatigue[aId] = clamp((ls.fatigue[aId] ?? 0) + r.fatigueGain * matchFatigueMultiplier(enduranceOf(ls, aId)), 0, 100);
  ls.fatigue[bId] = clamp((ls.fatigue[bId] ?? 0) + r.fatigueGain * matchFatigueMultiplier(enduranceOf(ls, bId)), 0, 100);
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
  gs: { id: number; seed: string; currentDate: Date; dayIndex: number; careerStartDay: number },
  human: NonNullable<Awaited<ReturnType<typeof loadState>>>["human"],
  level: TournamentLevel,
): Promise<void> {
  const quarter = quarterOf(gs.dayIndex);
  const week = monthOfQuarter(gs.dayIndex); // "hafta" alanı artık ayı (h1..h12) saklar
  const base = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay)); // insanın yaş kategorisi

  // M11.3b-2: ortak turnuva örneği — kapsam anahtarı + kapsam-içi diğer kayıtlı gerçek oyuncular.
  const country = await prisma.country.findUnique({ where: { id: human.nationalityId } });
  const myCity = human.club?.city ?? "";
  const myScope = geoScopeForLevel(level, country?.code ?? "??", myCity);
  const scopeKey = tournamentScopeKey(level, country?.code ?? "??", myCity, base.categoryId, gs.dayIndex);

  const regs = await prisma.registration.findMany({ where: { worldDay: gs.dayIndex, level } });
  const coTactic = new Map(regs.map((r) => [r.playerId, r.tactic as Tactic]));
  const coCat = new Map(regs.map((r) => [r.playerId, r.categoryId]));
  const coRegPlayers = await prisma.player.findMany({
    where: { id: { in: regs.filter((r) => r.playerId !== human.id).map((r) => r.playerId) }, isAI: false },
    include: { skills: true, club: true, nationality: true },
  });
  // Kapsam-içi diğer gerçek oyuncular (aynı kategori + aynı coğrafi kapsam) → sahada BOT gibi (önceden-taktik).
  const coHumans = coRegPlayers.filter(
    (p) => coCat.get(p.id) === base.categoryId && geoScopeForLevel(level, p.nationality.code, p.club?.city ?? "") === myScope,
  );

  const aiNeeded = Math.max(0, FIELD_TARGET - 1 - coHumans.length);
  const aiPlayers = await selectFieldAi(level, country?.code ?? "TR", myCity, scopeKey, human.gender, human.weapon, aiNeeded);

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
      morale: number;
      motivation: number;
      confidence: number;
      stress: number;
      equipmentLevel: number;
      ownedEquipment: string;
      experience: number;
      skills: SkillRow[];
    },
    opts: { isHuman: boolean; tactic?: Tactic },
  ): LiveCombatant => {
    const age = currentAge(p.birthDate, quarter);
    const ph = computePhysique(geneticsOf(p), age);
    const sk = rowsToSkills(p.skills);
    const skills: Record<string, number> = {};
    for (const def of SKILLS) skills[def.key] = sk[def.key].current;
    const traits = activeTraitsOf(p.traits, age); // o yaşta aktif trait'ler (kademeli açılım)
    // Form HERKESTE (insan+AI): psikoloji + trait + ekipman + GÜNÜN HÂLİ (o güne özel).
    // M11.3b-2 düzeltmesi: gs.seed (çözen oyuncuya özel) DEĞİL, scopeKey (ortak turnuva kimliği) — aksi
    // halde aynı turnuvayı canlı oynayan iki gerçek oyuncu birbirinden farklı "gün hâli" görürdü.
    const mood = dailyMood(createRng(`${scopeKey}:mood:${p.id}`));
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
      isHuman: opts.isHuman,
      aiTactic: opts.tactic ?? tacticFromTraits(traits),
      age,
      conditionBonus:
        psychologyCombatModifier(psychologyOf(p)) +
        traitCombatModifier(traits) +
        equipmentCombatModifier(p.equipmentLevel) +
        equipmentCombatBonus(parseOwned(p.ownedEquipment)) + // Gladius ekipman (çok küçük)
        experienceCombatModifier(p.experience) + // #28: birikmiş tecrübe (küçük, tavanlı)
        mood,
    };
  };

  const combatants: LiveCombatant[] = [
    snapshot(human, { isHuman: true }),
    ...coHumans.map((p) => snapshot(p, { isHuman: false, tactic: coTactic.get(p.id) ?? "BALANCED" })),
    ...aiPlayers.map((p) => snapshot(p, { isHuman: false })),
  ];
  if (combatants.length < 2) throw new GameError("no_opponents", "Turnuva için yeterli rakip yok.");

  // M11.3b-2 düzeltmesi: tohum artık çözen oyuncunun KENDİ gs.seed'i değil, PAYLAŞILAN scopeKey'den
  // türetiliyor — aksi halde aynı ortak turnuvayı aynı anda canlı oynayan iki gerçek oyuncu, birbirinden
  // habersiz iki FARKLI paralel sonuç görüyordu (rakip isimleri, skorlar, hatta pul çekimi bile
  // uyuşmuyordu). Bkz. docs/DEVIR.md "Canlı turnuvada paralel-simülasyon çakışması".
  const seedKey = `tour:${scopeKey}`;

  // Pul çekimi (deterministik, GDD 17.41) — kapsam-içi herkes AYNI çekimi görsün diye karıştırılacak
  // liste id'ye göre sabit sıralanıyor (kim "ben", kim "kapsam-içi diğeri" olursa olsun aynı girdi).
  const drawRng = createRng(`${seedKey}:draw`);
  const orderedIds = [...combatants.map((c) => c.id)].sort((a, b) => a - b);
  const shuffled = drawRng.shuffle(orderedIds);
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
  for (const p of coHumans) fatigue[p.id] = p.fatigue;
  for (const p of aiPlayers) fatigue[p.id] = p.fatigue;

  const startTime = new Date(gs.currentDate);
  startTime.setUTCHours(19, 0, 0, 0); // turnuva 19:00 başlar (gün 00:00 döner, etkinlik akşam — #25)

  const ls: LiveState = {
    version: 1,
    level,
    categoryId: base.categoryId,
    ageCategory: base.ageCategory,
    quarter,
    week,
    seedKey,
    scopeKey,
    coHumanIds: coHumans.map((p) => p.id),
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
        : locale === "fr"
          ? `▸ Période ${periodNo} — toi : ${t(locale, `tactic.${tactic}`)}, adv. : ${t(locale, `tactic.${oppTactic}`)}`
          : locale === "de"
            ? `▸ Periode ${periodNo} — du: ${t(locale, `tactic.${tactic}`)}, Gegner: ${t(locale, `tactic.${oppTactic}`)}`
            : locale === "es"
              ? `▸ Periodo ${periodNo} — tú: ${t(locale, `tactic.${tactic}`)}, rival: ${t(locale, `tactic.${oppTactic}`)}`
              : locale === "it"
                ? `▸ Periodo ${periodNo} — tu: ${t(locale, `tactic.${tactic}`)}, avversario: ${t(locale, `tactic.${oppTactic}`)}`
                : locale === "ru"
                  ? `▸ Период ${periodNo} — вы: ${t(locale, `tactic.${tactic}`)}, соперник: ${t(locale, `tactic.${oppTactic}`)}`
                  : locale === "pt"
                    ? `▸ Período ${periodNo} — você: ${t(locale, `tactic.${tactic}`)}, adversário: ${t(locale, `tactic.${oppTactic}`)}`
                    : locale === "zh"
                      ? `▸ 第 ${periodNo} 局 — 你：${t(locale, `tactic.${tactic}`)}，对手：${t(locale, `tactic.${oppTactic}`)}`
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
            : locale === "fr"
              ? `⏱ Temps écoulé — ${nameOf(ls, winnerId)} a terminé en tête ${prog.scoreHuman}-${prog.scoreOpp}.`
              : locale === "de"
                ? `⏱ Zeit abgelaufen — ${nameOf(ls, winnerId)} beendete in Führung ${prog.scoreHuman}-${prog.scoreOpp}.`
                : locale === "es"
                  ? `⏱ Tiempo agotado — ${nameOf(ls, winnerId)} terminó por delante ${prog.scoreHuman}-${prog.scoreOpp}.`
                  : locale === "it"
                    ? `⏱ Tempo scaduto — ${nameOf(ls, winnerId)} ha chiuso in vantaggio ${prog.scoreHuman}-${prog.scoreOpp}.`
                    : locale === "ru"
                      ? `⏱ Время вышло — ${nameOf(ls, winnerId)} завершил впереди ${prog.scoreHuman}-${prog.scoreOpp}.`
                      : locale === "pt"
                        ? `⏱ Tempo esgotado — ${nameOf(ls, winnerId)} terminou à frente ${prog.scoreHuman}-${prog.scoreOpp}.`
                        : locale === "zh"
                          ? `⏱ 时间到 — ${nameOf(ls, winnerId)} 以 ${prog.scoreHuman}-${prog.scoreOpp} 领先结束。`
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
        : locale === "fr"
          ? `🏁 ${nameOf(ls, winnerId!)} a gagné le match ${prog.scoreHuman}-${prog.scoreOpp}.`
          : locale === "de"
            ? `🏁 ${nameOf(ls, winnerId!)} gewann das Gefecht ${prog.scoreHuman}-${prog.scoreOpp}.`
            : locale === "es"
              ? `🏁 ${nameOf(ls, winnerId!)} ganó el combate ${prog.scoreHuman}-${prog.scoreOpp}.`
              : locale === "it"
                ? `🏁 ${nameOf(ls, winnerId!)} ha vinto l'incontro ${prog.scoreHuman}-${prog.scoreOpp}.`
                : locale === "ru"
                  ? `🏁 ${nameOf(ls, winnerId!)} выиграл бой ${prog.scoreHuman}-${prog.scoreOpp}.`
                  : locale === "pt"
                    ? `🏁 ${nameOf(ls, winnerId!)} venceu o combate ${prog.scoreHuman}-${prog.scoreOpp}.`
                    : locale === "zh"
                      ? `🏁 ${nameOf(ls, winnerId!)} 以 ${prog.scoreHuman}-${prog.scoreOpp} 赢得比赛。`
                      : `🏁 ${nameOf(ls, winnerId!)} maçı ${prog.scoreHuman}-${prog.scoreOpp} kazandı.`,
    );
    const gain = Math.max(2, Math.round(fmt.touches * 0.45));
    // Dayanıklılık'a göre azaltılmış maç yorgunluğu (canlı eleme maçı).
    ls.fatigue[ls.humanId] = clamp((ls.fatigue[ls.humanId] ?? 0) + gain * matchFatigueMultiplier(enduranceOf(ls, ls.humanId)), 0, 100);
    ls.fatigue[prog.oppId] = clamp((ls.fatigue[prog.oppId] ?? 0) + gain * matchFatigueMultiplier(enduranceOf(ls, prog.oppId)), 0, 100);
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

  throw new GameError("no_match", "Şu an oynanacak maç yok.");
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
  const gs = await currentGameState();
  if (!gs) return;
  await prisma.gameState.update({ where: { id: gs.id }, data: { liveTournament: null } });
}

/** Canlı turnuva bitince kalıcılaştırır (permanent tablolar + ekonomi/ranking/başarı + hafta ilerler). */
async function finalizeLive(
  gs: { id: number; seed: string; currentDate: Date; dayIndex: number; careerStartDay: number },
  human: NonNullable<Awaited<ReturnType<typeof loadState>>>["human"],
  ls: LiveState,
): Promise<void> {
  const base = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay)); // insanın kategorisi
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
  // M11.3b-2: ortak örnek. Başka biri (eşzamanlı/offline) zaten çözmüşse çift oluşturma → mevcut sonucu kullan.
  const existing = ls.scopeKey ? await prisma.tournament.findUnique({ where: { scopeKey: ls.scopeKey } }) : null;
  if (existing) {
    await prisma.$transaction((tx) => worldAdvanceTx(tx, gs, gs.dayIndex + 1));
    const part = await prisma.tournamentParticipant.findFirst({
      where: { tournamentId: existing.id, playerId: human.id },
      select: { finalPosition: true },
    });
    const rankScope = rankingScopeForLevel(ls.level, geoFromScopeKey(ls.scopeKey ?? null));
    const rank = rankScope
      ? await prisma.ranking.findUnique({
          where: { playerId_categoryId_quarter_scope: { playerId: human.id, categoryId: base.categoryId, quarter: quarterOf(gs.dayIndex), scope: rankScope } },
          select: { position: true },
        })
      : null;
    ls.finalTournamentId = existing.id;
    ls.earnedPoints = rankingPointsForPosition(part?.finalPosition ?? outcome.pools.length, ls.level);
    // Turnuva başkası tarafından çözülmüş olsa da oyuncu katıldı → tecrübesini al (#28).
    const xp = experienceForTournament(part?.finalPosition ?? outcome.pools.length, ls.level);
    await prisma.player.update({ where: { id: human.id }, data: { experience: { increment: xp } } });
    ls.earnedXp = xp;
    ls.newRank = rank?.position ?? null;
    return;
  }
  // Kapsam-içi diğer gerçek oyuncular da etki alır (Model A); humans[0]=canlı oyuncu (günü ilerler).
  const coHumans = ls.coHumanIds?.length
    ? await prisma.player.findMany({ where: { id: { in: ls.coHumanIds } } })
    : [];
  const fin = await finalizeTournament(gs, [human, ...coHumans], ls.level, base, outcome, ls.seedKey, { scopeKey: ls.scopeKey });
  ls.finalTournamentId = fin.id;
  ls.earnedPoints = fin.earnedPoints;
  ls.earnedXp = fin.earnedXp;
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
  playerName: string; // insanın adı (eleme/periyot kartında "Sen" yerine)
  poolIntro?: { poolNumber: number; members: { name: string; isHuman: boolean }[] } | null; // pul kuraları
  poolFixtures?: { matchNo: number; oppName: string; done: boolean; scoreHuman: number; scoreOpp: number }[]; // tüm pul maçların (sabit liste)
  humanPoolNumber?: number; // insanın havuz numarası (pul kağıdında öne çıkarmak için)
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
  // pul sonrası klasman (seeding) — gerçek pul klasmanı gibi V (galibiyet)/maç, averaj (Ind), attığı tuş
  seeding?: {
    name: string;
    seedRank: number;
    isHuman: boolean;
    wins: number;
    matches: number;
    touchesScored: number;
    touchesReceived: number;
    indicator: number;
  }[];
  standings?: { name: string; position: number; isHuman: boolean }[];
  championName?: string;
  finalPosition?: number;
  finalTournamentId?: number;
  earnedPoints?: number; // kazanılan ranking puanı (klasman)
  earnedXp?: number; // kazanılan tecrübe (#28)
  givesRankingPoints?: boolean; // bu turnuva klasman puanı veriyor mu (Open vermez)
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
    name: tournamentDisplayName(
      locale,
      ls.ageCategory,
      ls.level,
      tournamentHostFrom(ls.level, Number(ls.scopeKey?.split(":").pop() ?? 0) || 0, ls.scopeKey ?? null),
      countryCodeFromScopeKey(ls.scopeKey ?? null),
    ),
    categoryId: ls.categoryId,
    phase: ls.phase,
    stage: ls.stage ?? (ls.phase === "DONE" ? "DONE" : ls.phase === "DE" ? "DE" : "POOL"),
    playerName: nameOf(ls, ls.humanId),
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

  // Pul kağıdı + insanın havuz no + maç listesi — pul aşamasında da (canlı dolar).
  dto.humanPoolNumber = humanPoolNumber(ls);
  const membership = new Map<number, number>();
  ls.pools.forEach((pool, pi) => pool.forEach((id) => membership.set(id, pi + 1)));
  dto.poolSheets = buildPoolSheets(
    ls.matches.filter((m) => m.phase === "POOL").map((m) => ({ aId: m.aId, bId: m.bId, scoreA: m.scoreA, scoreB: m.scoreB })),
    membership,
    new Map(ls.combatants.map((c) => [c.id, c.name])),
    ls.humanId,
  );
  // İnsanın tüm pul maçları — sabit sıralı liste (oynanan = skor, kalan = kilitli).
  const humanPoolPlayed = ls.matches.filter((m) => m.phase === "POOL" && m.aId === ls.humanId);
  dto.poolFixtures = ls.humanPoolOppOrder.map((oppId, i) => {
    const pm = humanPoolPlayed[i];
    return {
      matchNo: i + 1,
      oppName: nameOf(ls, oppId),
      done: i < ls.humanPoolIndex,
      scoreHuman: pm?.scoreA ?? 0,
      scoreOpp: pm?.scoreB ?? 0,
    };
  });

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
    dto.seedRank = ls.ranking?.find((r) => r.playerId === ls.humanId)?.seedRank ?? null;

    // Pul sonrası klasman (seeding) — sıralı liste + gerçek pul klasmanı istatistikleri.
    if (ls.ranking) {
      const stat = new Map((ls.poolResults ?? []).map((p) => [p.playerId, p]));
      dto.seeding = [...ls.ranking]
        .sort((a, b) => a.seedRank - b.seedRank)
        .map((r) => {
          const s = stat.get(r.playerId);
          return {
            name: nameOf(ls, r.playerId),
            seedRank: r.seedRank,
            isHuman: r.playerId === ls.humanId,
            wins: s?.wins ?? 0,
            matches: s?.matches ?? 0,
            touchesScored: s?.touchesScored ?? 0,
            touchesReceived: s?.touchesReceived ?? 0,
            indicator: s?.indicator ?? 0,
          };
        });
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
    dto.earnedXp = ls.earnedXp;
    dto.givesRankingPoints = levelGivesRankingPoints(ls.level);
    dto.newRank = ls.newRank;
  }
  return dto;
}

/** Canlı turnuva bitince kalıcılaştırır: permanent tablolar + ekonomi/ranking/başarı + hafta ilerler. */
/**
 * M11.2 — Bir turnuvayı OFFLINE (çizelgeye göre) otomatik oynatır. İnsan önceden verdiği
 * taktikle oynar (bot gibi, sabit); AI'lar kendi stilleriyle. Saha = insan + kategorideki
 * AI havuzu. Combat sunucuda tek-atış `simulateTournament` ile; sonuç + ortak Quarter
 * Ranking canlı yolla AYNI `finalizeTournament`'a yazılır (tek kaynak, GDD 5.36).
 *
 * Not: bu offline yol sonucu tek-atış üretir (dakika-bazlı canlı çizelge M11.3'te replay
 * için kullanılacak); sonuç deterministik (seed) ve canlı yolla aynı kategoriyi paylaşır.
 */
/** Turnuva alanı hedef boyutu (gerçek oyuncular + AI dolgu). */
const FIELD_TARGET = 24;

/**
 * Ortak turnuva örneğinin coğrafi kapsamı (M11.3b): İl = ülke+şehir; Türkiye/Open = ülke;
 * uluslararası = tüm dünya. Aynı kapsamdaki oyuncular aynı turnuvada oynar.
 */
/** Kıta kodları (geoScope'ta ülke kodlarıyla karışmasın diye ayırt edilir). */
const CONTINENT_CODES: readonly string[] = ["EU", "AS", "AM", "AF"];

function geoScopeForLevel(level: TournamentLevel, countryCode: string, city: string): string {
  if (level === "IL") return `${countryCode}#${city}`;
  if (level === "TURKIYE" || level === "OPEN") return countryCode;
  // Kıta Şampiyonası (EUROPEAN) = oyuncunun KITASI (Avrupa/Asya/Amerika/Afrika) — kıta-kapsamlı saha.
  if (level === "EUROPEAN") return continentOfCountry(countryCode) ?? "EU";
  return "WORLD"; // SATELLITE / GRAND_PRIX / WORLD_CUP — tüm dünya
}

/** Ortak turnuva örneğinin benzersiz anahtarı (dedup). Aynı anahtar = aynı turnuva. */
function tournamentScopeKey(
  level: TournamentLevel,
  countryCode: string,
  city: string,
  categoryId: string,
  worldDay: number,
): string {
  return `${level}:${geoScopeForLevel(level, countryCode, city)}:${categoryId}:${worldDay}`;
}

/** finalizeTournament'ın kişisel etki için ihtiyaç duyduğu asgari oyuncu alanları. */
interface EffectHuman {
  id: number;
  fatigue: number;
  sharpness: number;
  morale: number;
  motivation: number;
  confidence: number;
  stress: number;
  status: string;
  careerBestRank: number | null;
  traits: string;
  reputation: number;
  equipmentLevel: number;
  lastTraitEventDay: number;
  clubId: number | null;
  equipmentState: string | null;
  weapon: string;
}

/** Combatant kurmak için gereken oyuncu alanları (insan veya AI). */
interface CombatantRow {
  id: number;
  firstName: string;
  lastName: string;
  weapon: string;
  sharpness: number;
  fatigue: number;
  birthDate: Date;
  adultHeightCm: number;
  reachBiasCm: number;
  buildFactor: number;
  leftHanded: boolean;
  traits: string;
  morale: number;
  motivation: number;
  confidence: number;
  stress: number;
  equipmentLevel: number;
  ownedEquipment: string;
  experience: number;
  skills: SkillRow[];
}

/**
 * B Faz 2 — turnuva alanındaki bir oyuncunun TURNUVA BAŞI anlık görüntüsü (Combatant). Çekimde bir kez
 * alınıp DB'ye yazılır; turnuvanın bütün turları bundan çözülür (sonradan değişen skill/kondisyon sonucu
 * etkilemez → herkes aynı sonucu görür). Günün hâli oyuncudan değil turnuva anahtarından tohumlanır.
 */
function snapshotCombatant(
  p: CombatantRow,
  isHuman: boolean,
  quarter: number,
  ageCategory: AgeCategory,
  scopeKey: string,
): Combatant {
  const age = currentAge(p.birthDate, quarter);
  const ph = computePhysique(geneticsOf(p), age);
  const traits = activeTraitsOf(p.traits, age); // o yaşta aktif trait'ler (kademeli açılım)
  const mood = dailyMood(createRng(`${scopeKey}:mood:${p.id}`));
  const conditionBonus =
    psychologyCombatModifier(psychologyOf(p)) +
    traitCombatModifier(traits) +
    equipmentCombatModifier(p.equipmentLevel) +
    equipmentCombatBonus(parseOwned(p.ownedEquipment)) + // Gladius ekipman (çok küçük)
    experienceCombatModifier(p.experience) + // #28: birikmiş tecrübe (küçük, tavanlı)
    mood;
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    weapon: p.weapon as Weapon,
    skills: rowsToSkills(p.skills),
    fatigue: p.fatigue,
    sharpness: p.sharpness,
    conditionBonus,
    age,
    physical: { reachCm: ph.reachCm, legLengthCm: ph.legLengthCm, buildFactor: p.buildFactor, leftHanded: p.leftHanded },
    ageCategory,
    tactic: isHuman ? undefined : tacticFromTraits(traits), // insanın taktiği maç maç belirlenir
    traits,
  };
}

/**
 * B Faz 2 — kapsam turnuvasını döndürür; T+0 (18:00 GMT) geçtiyse ve henüz yoksa ÇEKER: kapsam-içi
 * kayıtlı gerçek oyuncular (kayıt sırasıyla, saha tavanı MAX_FIELD) + `attendee` ise "Turnuvaya Gir"e
 * basan oyuncu kayıtsız da olsa (02.10 kuralı) + saha FIELD_TARGET'ın altındaysa AI dolgu. Havuzlar ve
 * maç çizelgesi DB'ye yazılır; sonrakiler aynı turnuvayı okur. T+0 gelmediyse ya da alan kurulamıyorsa null.
 */
async function ensureLiveTournament(
  gs: { dayIndex: number; careerStartDay: number; currentDate: Date },
  human: NonNullable<Awaited<ReturnType<typeof loadState>>>["human"],
  level: TournamentLevel,
  opts: { attendee: boolean },
): Promise<number | null> {
  const quarter = quarterOf(gs.dayIndex);
  const base = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  const country = await prisma.country.findUnique({ where: { id: human.nationalityId } });
  const myCity = human.club?.city ?? "";
  const scopeKey = tournamentScopeKey(level, country?.code ?? "??", myCity, base.categoryId, gs.dayIndex);
  const existing = await prisma.tournament.findUnique({ where: { scopeKey }, select: { id: true } });
  if (existing) return existing.id;
  const startsAt = serverEventStartMs(gs.dayIndex);
  if (Date.now() < startsAt) return null;

  const myScope = geoScopeForLevel(level, country?.code ?? "??", myCity);
  const regs = await prisma.registration.findMany({ where: { worldDay: gs.dayIndex, level }, orderBy: { id: "asc" } });
  const regOrder = new Map(regs.map((r, i) => [r.playerId, i]));
  const regTactic = new Map(regs.map((r) => [r.playerId, r.tactic as Tactic]));
  const regCategory = new Map(regs.map((r) => [r.playerId, r.categoryId]));
  const regPlayers = await prisma.player.findMany({
    where: { id: { in: regs.map((r) => r.playerId) }, isAI: false },
    include: { skills: true, club: true, nationality: true },
  });
  const inScope = regPlayers
    .filter(
      (p) =>
        regCategory.get(p.id) === base.categoryId &&
        geoScopeForLevel(level, p.nationality.code, p.club?.city ?? "") === myScope,
    )
    .sort((a, b) => regOrder.get(a.id)! - regOrder.get(b.id)!);
  const humans: CombatantRow[] = [
    ...(opts.attendee && !inScope.some((p) => p.id === human.id) ? [human] : []),
    ...inScope,
  ].slice(0, MAX_FIELD);

  const aiNeeded = Math.max(0, FIELD_TARGET - humans.length);
  const aiPlayers = await selectFieldAi(level, country?.code ?? "TR", myCity, scopeKey, human.gender, human.weapon, aiNeeded);
  if (humans.length + aiPlayers.length < 2) return null;

  const ageCategory = base.ageCategory as AgeCategory;
  const entrants: LiveEntrant[] = [
    ...humans.map((p) => ({
      playerId: p.id,
      isHuman: true,
      combatant: snapshotCombatant(p, true, quarter, ageCategory, scopeKey),
      registeredTactic: regTactic.get(p.id) ?? null,
    })),
    ...aiPlayers.map((p) => ({
      playerId: p.id,
      isHuman: false,
      combatant: snapshotCombatant(p, false, quarter, ageCategory, scopeKey),
      registeredTactic: null,
    })),
  ];
  return createLiveTournament({
    scopeKey,
    name: `${base.ageCategory} ${TOURNAMENT_LABEL_TR[level]}`,
    categoryId: base.categoryId,
    level,
    quarter,
    week: monthOfQuarter(gs.dayIndex),
    date: gs.currentDate,
    worldDay: gs.dayIndex,
    startsAt: new Date(startsAt),
    entrants,
  });
}

/**
 * Geçmiş ve KAYITLI olunan bir turnuva gününü kapatır (oyuncu o gün yoktu): turnuva örneğini getirir
 * (gerekirse çeker), "şimdi"ye kadar çözer — gün geçtiği için tamamı çözülür — ve "yokken neler oldu"ya
 * yazar; sonra oyuncunun günü ilerler. Sonuç, turnuvayı canlı izleyenlerinkiyle birebir aynıdır.
 */
async function autoResolveTournament(
  gs: { id: number; seed: string; currentDate: Date; dayIndex: number; careerStartDay: number },
  human: NonNullable<Awaited<ReturnType<typeof loadState>>>["human"],
  level: TournamentLevel,
): Promise<void> {
  const quarter = quarterOf(gs.dayIndex);
  const locale = await getLocale();
  const base = currentIdentity(human, careerQuarter(gs.dayIndex, gs.careerStartDay));
  const id = await ensureLiveTournament(gs, human, level, { attendee: false });
  if (id != null) {
    await tickLiveTournament(id, { locale });
    const t = await prisma.tournament.findUnique({ where: { id }, select: { name: true, status: true, scopeKey: true } });
    const part = await prisma.tournamentParticipant.findFirst({
      where: { tournamentId: id, playerId: human.id },
      select: { finalPosition: true },
    });
    if (t?.status === "FINISHED" && part) {
      const rankScope = rankingScopeForLevel(level, geoFromScopeKey(t.scopeKey));
      const rank = rankScope
        ? await prisma.ranking.findUnique({
            where: { playerId_categoryId_quarter_scope: { playerId: human.id, categoryId: base.categoryId, quarter, scope: rankScope } },
            select: { position: true },
          })
        : null;
      const fieldSize = await prisma.tournamentParticipant.count({ where: { tournamentId: id } });
      await appendAwayReport(gs.id, {
        tournamentId: id,
        name: t.name,
        categoryId: base.categoryId,
        position: part.finalPosition ?? fieldSize,
        fieldSize,
        points: rankingPointsForPosition(part.finalPosition ?? fieldSize, level),
        newRank: rank?.position ?? null,
        // Turnuvanın GERÇEK tarihi (GMT), Q·H değil (NOTLAR #22: gösterim = gerçek takvim tarihi).
        dateLabel: new Date(worldDayStartMs(gs.dayIndex, worldClockConfig())).toLocaleDateString(
          locale === "en" ? "en-GB" : locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : locale === "it" ? "it-IT" : locale === "ru" ? "ru-RU" : locale === "pt" ? "pt-BR" : locale === "zh" ? "zh-CN" : "tr-TR",
          { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" },
        ),
      });
    }
  }
  await prisma.$transaction((tx) => worldAdvanceTx(tx, gs, gs.dayIndex + 1));
}

/**
 * Turnuva sonucunu + klasmanı + kişisel etkileri yazar. M11.3b: `humans` kapsam-içi tüm gerçek
 * oyuncular; humans[0] ÇÖZÜCÜ (yalnız onun günü ilerler). Kişisel etkiler (ödül/psikoloji/keskinlik/
 * sakatlık/başarı) her human'a uygulanır (Model A). `scopeKey` verilirse ortak örnek olarak dedup'lanır.
 * Yalnız B-öncesi canlı oturumların bitişinde kullanılır; yeni turnuvalar liveTournament.ts'te tur tur çözülür.
 */
async function finalizeTournament(
  gs: { id: number; seed: string; currentDate: Date; dayIndex: number },
  humans: readonly EffectHuman[],
  level: TournamentLevel,
  base: ReturnType<typeof currentIdentity>,
  outcome: TournamentOutcome,
  seedKey: string,
  opts: { scopeKey?: string } = {},
): Promise<{ id: number; earnedPoints: number; earnedXp: number; newRank: number | null }> {
  const quarter = quarterOf(gs.dayIndex);
  const week = monthOfQuarter(gs.dayIndex); // Tournament.week alanı artık ayı saklar
  const categoryId = base.categoryId;
  const tournamentName = `${base.ageCategory} ${TOURNAMENT_LABEL_TR[level]}`;
  const positionByPlayer = new Map(outcome.standings.map((s) => [s.playerId, s.position]));
  const seedByPlayer = new Map(outcome.ranking.map((r) => [r.playerId, r.seedRank]));
  const resolver = humans[0];

  // Her kapsam-içi oyuncunun kişisel etkilerini (tx dışı, saf) önceden hesapla.
  const perHuman = humans.map((h) => {
    const finalFatigue = clamp(outcome.finalFatigue[h.id] ?? h.fatigue, 0, 100);
    const position = positionByPlayer.get(h.id) ?? outcome.pools.length;
    return {
      h,
      position,
      sharpness: applySharpness(h.sharpness, COMPETITION_SHARPNESS_GAIN),
      injury: rollInjury(createRng(`${seedKey}:injury:${h.id}`), finalFatigue, base.age),
      prize: prizeFor(level, position),
      postPsych: psychAfterTournament(psychologyOf(h), position, outcome.pools.length),
      reputation: reputationAfterEvent(h.reputation, activeTraitsOf(h.traits, base.age)), // çirkef/hilekâr → düşer
      // 2C-2: maçta kullanılan aktif ekipman aşınır (0'da kırılır → yedek devreye girer).
      wornKit: encodeKit(applyMatchWear(resolveKit(h.equipmentState, h.weapon as Weapon), h.weapon as Weapon, base.age, base.ageCategory, gs.dayIndex)),
    };
  });

  const txResult = await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({
      data: { name: tournamentName, categoryId, level, quarter, week, date: gs.currentDate, status: "FINISHED", scopeKey: opts.scopeKey ?? null },
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

    // Yorgunlukları kalıcılaştır (turlar arası birikim, GDD 18.37) — tüm katılımcılar (AI + insan).
    for (const c of outcome.pools) {
      await tx.player.update({
        where: { id: c.playerId },
        data: { fatigue: clamp(outcome.finalFatigue[c.playerId] ?? 0, 0, 100) },
      });
    }
    // Her kapsam-içi oyuncu: keskinlik + ödül + psikoloji + sakatlık durumu.
    for (const ph of perHuman) {
      await tx.player.update({
        where: { id: ph.h.id },
        data: {
          sharpness: ph.sharpness,
          balance: { increment: ph.prize },
          experience: { increment: experienceForTournament(ph.position, level) }, // #28: turnuva tecrübesi
          morale: ph.postPsych.morale,
          motivation: ph.postPsych.motivation,
          confidence: ph.postPsych.confidence,
          stress: ph.postPsych.stress,
          reputation: ph.reputation,
          equipmentState: ph.wornKit, // 2C-2: maç aşınması
          status: ph.injury.injured ? "INJURED" : ph.h.status,
          injuryDaysRemaining: ph.injury.injured ? ph.injury.days : 0,
        },
      });
      // Kumbaram: turnuva ödülü (her insanın KENDİ işlem kaydına). Ödül 0 ise kayıt yok.
      if (ph.prize > 0) {
        const phGs = await tx.gameState.findUnique({ where: { humanPlayerId: ph.h.id }, select: { id: true, ledger: true } });
        if (phGs) await tx.gameState.update({ where: { id: phGs.id }, data: { ledger: nextLedgerJson(phGs.ledger, { day: gs.dayIndex, key: "prize", amount: ph.prize, arg: level }) } });
      }
    }

    // Ranking puanı → DOĞRU KAPSAMA: İl → ŞEHİR (CITY:<geo>), Ulusal → DOMESTIC, uluslararası → WORLD, Open → yok.
    // İl artık ulusala karışmaz (kullanıcı 27.10). Her kapsam KENDİ içinde sıralanır (ayrı scope satırı).
    const scope = rankingScopeForLevel(level, geoFromScopeKey(opts.scopeKey ?? null));
    let newRankById = new Map<number, number>();
    if (scope) {
      for (const s of outcome.standings) {
        const pts = rankingPointsForPosition(s.position, level);
        if (pts <= 0) continue; // puansız derece Ranking'i şişirmesin
        await tx.ranking.upsert({
          where: { playerId_categoryId_quarter_scope: { playerId: s.playerId, categoryId, quarter, scope } },
          create: { playerId: s.playerId, categoryId, quarter, scope, points: pts },
          update: { points: { increment: pts } },
        });
      }
      const rankRows = await tx.ranking.findMany({ where: { categoryId, quarter, scope } });
      const ranked = rankEntries(rankRows.map((r) => ({ playerId: r.playerId, points: r.points })));
      for (const r of ranked) {
        await tx.ranking.update({
          where: { playerId_categoryId_quarter_scope: { playerId: r.playerId, categoryId, quarter, scope } },
          data: { position: r.position },
        });
      }
      newRankById = new Map(ranked.map((r) => [r.playerId, r.position]));
    }

    // Her kapsam-içi oyuncu: kariyer en iyi ranking (GDD 19.36) + başarılar (Memory, GDD 21/22.37).
    for (const ph of perHuman) {
      const newRank = newRankById.get(ph.h.id) ?? null;
      if (newRank != null && (ph.h.careerBestRank == null || newRank < ph.h.careerBestRank)) {
        await tx.player.update({ where: { id: ph.h.id }, data: { careerBestRank: newRank } });
      }
      const earnedRows = await tx.achievement.findMany({ where: { playerId: ph.h.id }, select: { type: true } });
      const earnedUnique = new Set(earnedRows.map((a) => a.type as AchievementType));
      for (const a of detectAchievements({ level, tournamentName, position: ph.position, postRank: newRank, earnedUnique })) {
        await tx.achievement.create({
          data: {
            playerId: ph.h.id,
            type: a.type,
            label: a.label,
            detail: a.detail,
            importance: a.importance,
            quarter,
            date: gs.currentDate,
            worldDay: gs.dayIndex, // turnuva günü (gün aşağıda ilerler) — vitrin/zaman çizgisi tarihi
          },
        });
      }
    }

    // Katman 2: ÇÖZÜCÜ insanda trait evrimi (başarılar yazıldıktan sonra; GDD 10.37).
    await applyTraitEvolution(
      tx,
      { id: resolver.id, traits: resolver.traits, lastTraitEventDay: resolver.lastTraitEventDay, clubId: resolver.clubId },
      { age: base.age, level, position: positionByPlayer.get(resolver.id) ?? outcome.pools.length, fieldSize: outcome.pools.length, dayIndex: gs.dayIndex },
    );

    // Turnuva gününden bir sonraki güne geç — YALNIZ çözücünün günü ilerler.
    await worldAdvanceTx(tx, gs, gs.dayIndex + 1);
    return { id: tournament.id, resolverNewRank: newRankById.get(resolver.id) ?? null };
  });

  return {
    id: txResult.id,
    earnedPoints: rankingPointsForPosition(positionByPlayer.get(resolver.id) ?? outcome.pools.length, level),
    earnedXp: experienceForTournament(positionByPlayer.get(resolver.id) ?? outcome.pools.length, level),
    newRank: txResult.resolverNewRank,
  };
}

export interface AdvanceResult {
  live?: boolean; // canlı turnuva başladıysa/varsa → turnuva ekranına yönlendir
  tournamentId?: number; // B: hangi turnuvayı izleyeceği (/turnuva/[id]) — yoksa eski /turnuva/canli
}
