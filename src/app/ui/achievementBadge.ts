/**
 * Başarı rozeti dili — kupa vitrini, kariyer zaman çizgisi ve Bugün'deki "Son başarılar" şeridi aynı ikon + disk
 * rengini kullanır (docs/GORSEL_ETKILESIM.md §7/§8). Metal renkleri sinyal değil, tema değiştirmez; milli takım
 * vurgusu tek prestij rengi --prio.
 */
import type { IconName } from "./Icon";

export const METAL_GOLD = "bg-metal-gold text-metal-gold-ink";
export const METAL_SILVER = "bg-metal-silver text-metal-silver-ink";
export const METAL_BRONZE = "bg-metal-bronze text-metal-bronze-ink";
export const PRIO_RING = "border-2 border-prio bg-arena-0 text-prio";
export const NEUTRAL_DISC = "bg-arena-2 text-ink";

/** Başarı türü → ikon. */
export const ACH_ICON: Record<string, IconName> = {
  FIRST_TOURNAMENT: "tournament",
  FIRST_MEDAL: "medal",
  FIRST_CHAMPIONSHIP: "trophy",
  CHAMPIONSHIP: "trophy",
  INTERNATIONAL_MEDAL: "medal",
  NATIONAL_TEAM: "flag",
  RANKING_TOP3: "ranking",
  RANKING_NUMBER_ONE: "crown",
};

/** Başarı türü → disk rengi. Başarı kaydı dereceyi tutmadığı için madalya başarıları nötr metal (gümüş). */
export const ACH_TONE: Record<string, string> = {
  FIRST_TOURNAMENT: NEUTRAL_DISC,
  FIRST_MEDAL: METAL_SILVER,
  FIRST_CHAMPIONSHIP: METAL_GOLD,
  CHAMPIONSHIP: METAL_GOLD,
  INTERNATIONAL_MEDAL: METAL_SILVER,
  NATIONAL_TEAM: PRIO_RING,
  RANKING_TOP3: METAL_BRONZE,
  RANKING_NUMBER_ONE: METAL_GOLD,
};
