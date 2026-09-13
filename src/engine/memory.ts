/**
 * Memory Engine — anlamlı kariyer olaylarını ve başarıları belirler (GDD 21, 22.37).
 * Olaylar sistemlerin etkileşiminden doğal olarak doğar (GDD 2.15); bu engine turnuva
 * sonucundan hangi başarıların "açıldığını" saf ve test edilebilir şekilde üretir.
 *
 * M7: turnuva bazlı achievement tespiti + önem derecesi. Rakiplik (rivalry) istatistiği
 * maç geçmişinden orkestrasyon katmanında hesaplanır.
 */
import type { TournamentLevel } from "./domain";

export type AchievementType =
  | "FIRST_TOURNAMENT"
  | "FIRST_MEDAL"
  | "FIRST_CHAMPIONSHIP"
  | "CHAMPIONSHIP"
  | "INTERNATIONAL_MEDAL"
  | "NATIONAL_TEAM"
  | "RANKING_TOP3"
  | "RANKING_NUMBER_ONE";

export interface AchievementDef {
  label: string;
  importance: number; // 1–5, gösterim önceliği
  unique: boolean; // kariyerde bir kez mi kazanılır
}

export const ACHIEVEMENTS: Record<AchievementType, AchievementDef> = {
  FIRST_TOURNAMENT: { label: "İlk Turnuva", importance: 1, unique: true },
  FIRST_MEDAL: { label: "İlk Madalya", importance: 3, unique: true },
  FIRST_CHAMPIONSHIP: { label: "İlk Şampiyonluk", importance: 4, unique: true },
  CHAMPIONSHIP: { label: "Şampiyonluk", importance: 3, unique: false },
  INTERNATIONAL_MEDAL: { label: "Uluslararası Madalya", importance: 4, unique: false },
  NATIONAL_TEAM: { label: "Milli Takıma Seçildi", importance: 4, unique: true },
  RANKING_TOP3: { label: "Quarter Ranking İlk 3", importance: 3, unique: true },
  RANKING_NUMBER_ONE: { label: "Quarter Ranking 1 Numara", importance: 5, unique: true },
};

const INTERNATIONAL: readonly TournamentLevel[] = [
  "SATELLITE",
  "GRAND_PRIX",
  "EUROPEAN",
  "WORLD_CUP",
];

export interface AchievementRecord {
  type: AchievementType;
  label: string;
  detail: string;
  importance: number;
}

export interface AchievementContext {
  level: TournamentLevel;
  tournamentName: string;
  position: number; // turnuva derecesi (1 = şampiyon)
  postRank: number | null; // turnuva sonrası Quarter Ranking sırası
  earnedUnique: ReadonlySet<AchievementType>; // daha önce kazanılmış tekil başarılar
}

/**
 * Bir turnuva sonucundan yeni açılan başarıları üretir. Tekil (unique) başarılar yalnız ilk
 * kez; tekrarlı olanlar (şampiyonluk, uluslararası madalya) her seferinde.
 */
export function detectAchievements(ctx: AchievementContext): AchievementRecord[] {
  const out: AchievementRecord[] = [];
  const add = (type: AchievementType, detail: string) => {
    const def = ACHIEVEMENTS[type];
    if (def.unique && ctx.earnedUnique.has(type)) return;
    out.push({ type, label: def.label, detail, importance: def.importance });
  };

  add("FIRST_TOURNAMENT", ctx.tournamentName);
  if (ctx.position <= 3) add("FIRST_MEDAL", ctx.tournamentName);
  if (ctx.position === 1) {
    add("FIRST_CHAMPIONSHIP", ctx.tournamentName);
    add("CHAMPIONSHIP", ctx.tournamentName);
  }
  if (ctx.position <= 3 && INTERNATIONAL.includes(ctx.level)) {
    add("INTERNATIONAL_MEDAL", ctx.tournamentName);
  }
  if (ctx.postRank != null) {
    if (ctx.postRank <= 4) add("NATIONAL_TEAM", `${ctx.postRank}. sıra`);
    if (ctx.postRank <= 3) add("RANKING_TOP3", `${ctx.postRank}. sıra`);
    if (ctx.postRank === 1) add("RANKING_NUMBER_ONE", "Quarter Ranking lideri");
  }
  return out;
}
