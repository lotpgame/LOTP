/**
 * Kupa vitrini + kariyer zaman çizgisi (docs/GORSEL_ETKILESIM.md §7) — yalnız OKUR: başarılar (Memory) ve turnuva
 * dereceleri; yeni başarı üretmez. Saf (I/O yok) → testli. Tarih etiketi sayfada `dateMs`'ten (dünya gününün GMT
 * başlangıcı) basılır; `dateMs` yoksa (eski kayıt) çeyreğe (Q) düşülür.
 */

export interface ShowcaseAchievement {
  type: string; // AchievementType
  detail: string;
  dateMs: number | null; // kazanıldığı dünya gününün GMT başlangıcı; eski kayıtta null
  quarter: number;
  order: number; // kronolojik sıra anahtarı (kayıt tarihi)
}

export interface ShowcaseResult {
  position: number; // turnuva derecesi (1 = şampiyon)
  level: string; // TournamentLevel
  dateMs: number | null;
  quarter: number;
  order: number;
}

export type BadgeKey = "champion" | "gold" | "silver" | "bronze" | "national" | "rankingOne" | "european" | "worldCup" | "olympics";

export interface Badge {
  key: BadgeKey;
  count: number;
  last: { dateMs: number | null; quarter: number } | null; // son kazanım
  locked: boolean; // üst kademe hedefi, henüz kazanılmadı
}

const MEDAL_MAX = 3;
/** Üst kademe hedefleri: o seviyede madalya (ilk 3) kazanılınca açılır. Olimpiyat oyunda henüz yok → hep kilitli. */
const GOAL_LEVELS: { key: BadgeKey; level: string | null }[] = [
  { key: "european", level: "EUROPEAN" },
  { key: "worldCup", level: "WORLD_CUP" },
  { key: "olympics", level: null },
];

function summarize(key: BadgeKey, items: { dateMs: number | null; quarter: number; order: number }[], locked = false): Badge {
  const last = items.reduce<(typeof items)[number] | null>((best, x) => (best == null || x.order > best.order ? x : best), null);
  return { key, count: items.length, last: last ? { dateMs: last.dateMs, quarter: last.quarter } : null, locked };
}

export function buildShowcase(achievements: ShowcaseAchievement[], results: ShowcaseResult[]): Badge[] {
  const at = (pos: number) => results.filter((r) => r.position === pos);
  const ach = (type: string) => achievements.filter((a) => a.type === type);
  const regular: Badge[] = [
    summarize("champion", at(1)),
    summarize("gold", at(1)),
    summarize("silver", at(2)),
    summarize("bronze", at(3)),
    summarize("national", ach("NATIONAL_TEAM")),
    summarize("rankingOne", ach("RANKING_NUMBER_ONE")),
  ];
  const goals = GOAL_LEVELS.map(({ key, level }) => {
    const podiums = results.filter((r) => level != null && r.level === level && r.position >= 1 && r.position <= MEDAL_MAX);
    return summarize(key, podiums, podiums.length === 0);
  });
  return [...regular, ...goals];
}

export interface TimelineNode extends ShowcaseAchievement {
  milestone: boolean; // büyük dönüm noktası → vurgulu etiket
}

/** Büyük dönüm noktaları: ilk şampiyonluk, milli takım daveti, klasman 1.liği (hepsi kariyerde bir kez). */
const MILESTONES = new Set(["FIRST_CHAMPIONSHIP", "NATIONAL_TEAM", "RANKING_NUMBER_ONE"]);

/**
 * Kronolojik (eskiden yeniye) başarı düğümleri. İlk şampiyonluk hem "İlk Şampiyonluk" hem "Şampiyonluk" kaydı
 * üretir (motor) → aynı turnuvanın "Şampiyonluk" düğümü gösterilmez (tek olay, tek düğüm).
 */
export function buildTimeline<T extends ShowcaseAchievement>(achievements: T[]): (T & TimelineNode)[] {
  const firstTitle = achievements.find((a) => a.type === "FIRST_CHAMPIONSHIP");
  return [...achievements]
    .sort((a, b) => a.order - b.order)
    .filter((a) => !(firstTitle && a.type === "CHAMPIONSHIP" && a.order === firstTitle.order && a.detail === firstTitle.detail))
    .map((a) => ({ ...a, milestone: MILESTONES.has(a.type) }));
}

export type GoalKey =
  | "FIRST_TOURNAMENT"
  | "FIRST_MEDAL"
  | "FIRST_CHAMPIONSHIP"
  | "NATIONAL_TEAM"
  | "RANKING_NUMBER_ONE"
  | "european"
  | "worldCup"
  | "olympics";

const GOAL_ORDER: GoalKey[] = [
  "FIRST_TOURNAMENT",
  "FIRST_MEDAL",
  "FIRST_CHAMPIONSHIP",
  "NATIONAL_TEAM",
  "RANKING_NUMBER_ONE",
  "european",
  "worldCup",
  "olympics",
];

/** Zaman çizgisinin sonundaki "Sırada…" düğümü: kariyer basamaklarında henüz ulaşılmamış ilk hedef. */
export function nextGoal(achievements: ShowcaseAchievement[], badges: Badge[]): GoalKey {
  const earned = new Set(achievements.map((a) => a.type));
  const unlocked = new Set(badges.filter((b) => !b.locked && b.count > 0).map((b) => b.key));
  return GOAL_ORDER.find((g) => !(earned.has(g) || unlocked.has(g as BadgeKey))) ?? "olympics";
}
