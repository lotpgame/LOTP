/**
 * Katman 2: turnuva sonrası trait evrimi (GDD 10.31–10.37). careerService + liveTournament ortak kullanır
 * (dairesel import olmasın diye ayrı modül). Olay → Memory (başarılar) → Trait zinciri burada bağlanır:
 * kariyer sinyalleri okunur, `evolveTraits` karar verir, değişim olursa plan + `lastTraitEventDay` yazılır.
 * Cooldown'da ERKEN çıkar → sinyal sorgusu yapılmaz (turnuva başına maliyet ~0).
 */
import { prisma } from "@/db";
import { createRng } from "@/engine/probability";
import type { TournamentLevel } from "@/engine/domain";
import {
  activeTraitKeys,
  applyTraitChange,
  encodeTraitPlan,
  evolveTraits,
  parseTraitPlan,
  TRAIT_CHANGE_COOLDOWN_DAYS,
  type TraitChange,
  type TraitSignals,
} from "@/engine/trait";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// "Büyük olay" = ulusal şampiyona + tüm uluslararası seviyeler (final kaybı/erken eleme buralarda sarsar).
const BIG_EVENT_LEVELS = new Set<TournamentLevel>(["TURKIYE", "SATELLITE", "EUROPEAN", "GRAND_PRIX", "WORLD_CUP"]);

export interface TraitEvolutionCtx {
  age: number;
  level: TournamentLevel;
  position: number; // turnuvadaki final sırası (1 = şampiyon)
  fieldSize: number; // katılımcı sayısı
  dayIndex: number; // şu anki dünya günü
}

/**
 * Bir oyuncuya (insan) turnuva sonrası trait evrimi uygular. Değişim olduysa TraitChange döner (bildirim
 * için), yoksa null. İçeride plana + lastTraitEventDay'e yazar (aynı tx). Deterministik (seeded).
 */
export async function applyTraitEvolution(
  tx: Tx,
  player: { id: number; traits: string; lastTraitEventDay: number; clubId: number | null },
  ctx: TraitEvolutionCtx,
): Promise<TraitChange | null> {
  const daysSince = ctx.dayIndex - player.lastTraitEventDay;
  if (daysSince < TRAIT_CHANGE_COOLDOWN_DAYS) return null; // çok yakın — sinyal sorgusu bile yapma

  const plan = parseTraitPlan(player.traits);
  const active = activeTraitKeys(plan, ctx.age);

  const [achRows, tournamentsPlayed, club] = await Promise.all([
    tx.achievement.findMany({ where: { playerId: player.id }, select: { type: true } }),
    tx.tournamentParticipant.count({ where: { playerId: player.id } }),
    player.clubId ? tx.club.findUnique({ where: { id: player.clubId }, select: { coachSkill: true } }) : Promise.resolve(null),
  ]);
  const types = new Set(achRows.map((a) => a.type));
  const countOf = (...t: string[]) => achRows.filter((a) => t.includes(a.type)).length;

  const signals: TraitSignals = {
    age: ctx.age,
    championships: countOf("FIRST_CHAMPIONSHIP", "CHAMPIONSHIP"),
    medals: countOf("FIRST_MEDAL", "INTERNATIONAL_MEDAL"),
    nationalTeam: types.has("NATIONAL_TEAM"),
    coachQuality: (club?.coachSkill ?? 60) / 100,
    tournamentsPlayed,
    // Büyük düşüş: büyük etkinlikte final kaybı (2.) veya alt çeyrekte elenme (son %25).
    recentSetback: BIG_EVENT_LEVELS.has(ctx.level) && (ctx.position === 2 || ctx.position > ctx.fieldSize * 0.75),
    daysSinceLastChange: daysSince,
  };

  const change = evolveTraits(active, signals, createRng(`${player.id}:traitEvo:${ctx.dayIndex}`));
  if (!change) return null;

  const nextPlan = applyTraitChange(plan, change, Math.floor(ctx.age));
  await tx.player.update({
    where: { id: player.id },
    data: { traits: encodeTraitPlan(nextPlan), lastTraitEventDay: ctx.dayIndex },
  });
  return change;
}
