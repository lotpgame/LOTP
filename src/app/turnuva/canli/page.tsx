import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  enterBracketAction,
  leaveLiveTournamentAction,
  playLiveMatchAction,
  revealPoolAction,
} from "@/app/actions";
import { TACTICS } from "@/engine/combat";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getLiveTournament, type LiveTournamentDTO } from "@/server/careerService";
import { CanliMac } from "../[id]/CanliMac";
import { PulKagidi } from "../[id]/PulKagidi";
import { CanliPeriyot } from "./CanliPeriyot";

// Canlı turnuva: her istekte taze (DB durumuna bağlı).
export const dynamic = "force-dynamic";

function positionLabel(locale: Locale, pos: number | undefined): string {
  if (pos == null) return "—";
  switch (pos) {
    case 1:
      return t(locale, "pos.champion");
    case 2:
      return t(locale, "pos.finalist");
    case 3:
      return t(locale, "pos.semi");
    case 5:
      return t(locale, "pos.quarter");
    case 9:
      return t(locale, "round.last", { n: 16 });
    case 17:
      return t(locale, "round.last", { n: 32 });
    case 33:
      return t(locale, "round.last", { n: 64 });
    default:
      return t(locale, "pos.nth", { n: pos });
  }
}

/** Son periyot başlığının log indeksini bulur → biten eleme maçında yalnız son periyot animasyonla akar. */
function lastPeriodStart(log: string[]): number {
  for (let i = log.length - 1; i >= 0; i--) if (log[i].startsWith("▸")) return i;
  return 0;
}

/** Taktik seçim ızgarası (pul ilk maçı / eleme 1. periyot / devre arası). */
function TacticGrid({ locale }: { locale: Locale }) {
  return (
    <form action={playLiveMatchAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {TACTICS.map((tac) => (
        <button
          key={tac}
          name="tactic"
          value={tac}
          className="rounded-lg border border-black/15 p-3 text-left transition hover:border-emerald-500 hover:bg-emerald-500/10 dark:border-white/20"
        >
          <span className="text-sm font-medium">{t(locale, `tactic.${tac}`)}</span>
          <span className="mt-1 block text-xs opacity-70">{t(locale, `tacticDesc.${tac}`)}</span>
        </button>
      ))}
    </form>
  );
}

export default async function CanliTurnuvaPage() {
  const tour = await getLiveTournament();
  if (!tour) redirect("/kariyer"); // aktif turnuva yok
  const locale = await getLocale();

  const isPoolPhase = tour.phase === "POOL" || tour.phase === "POOL_DONE";
  const poolMatches = tour.played.filter((m) => m.phase === "POOL");
  const deMatches = tour.played.filter((m) => m.phase === "DE");
  const displayed = isPoolPhase ? poolMatches : deMatches;

  // freshMatch: son aksiyon maç oynamaktı → ekrandaki taze maç bitene kadar sıradaki aksiyon gizli.
  const gateNext = tour.freshMatch && !tour.liveMatch && displayed.length > 0;

  // Sıradaki aksiyon paneli (izlenecek maç bitince veya doğrudan gösterilir).
  const nextAction: ReactNode = tour.poolAwaitingResult ? (
    <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-4 text-center">
      <h2 className="text-base font-semibold">{t(locale, "canli.poolDone")}</h2>
      <p className="mt-1 text-sm opacity-80">{t(locale, "canli.poolDoneHint")}</p>
      <form action={revealPoolAction} className="mt-3">
        <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
          {t(locale, "canli.seePoolResults")}
        </button>
      </form>
    </div>
  ) : tour.phase === "POOL_DONE" ? (
    <div className="space-y-4">
      {/* Önce pul sonrası klasman (seeding) — sonra kura (draw) — sonra elemeye geç. */}
      {tour.seeding && tour.seeding.length > 0 && (
        <section className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h2 className="text-base font-semibold">{t(locale, "canli.seedingTitle")}</h2>
          <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
            {tour.seeding.map((s) => (
              <li
                key={s.seedRank}
                className={`flex items-center px-3 py-2 text-sm ${s.isHuman ? "bg-emerald-500/10 font-medium" : ""}`}
              >
                <span className="mr-2 w-6 tabular-nums opacity-50">{s.seedRank}.</span>
                <span>
                  {s.name}
                  {s.isHuman ? ` (${t(locale, "common.youShort")})` : ""}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {tour.draw && tour.draw.length > 0 && (
        <section className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h2 className="text-base font-semibold">{t(locale, "canli.drawTitle")}</h2>
          <p className="mt-1 text-xs opacity-60">{t(locale, "canli.drawNote")}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tour.draw.map((d, i) => {
              const mine = d.aIsHuman || d.bIsHuman;
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-2 text-xs ${
                    mine ? "border-emerald-500/50 bg-emerald-500/10" : "border-black/10 dark:border-white/15"
                  }`}
                >
                  <div className={`truncate ${d.aIsHuman ? "font-semibold" : ""}`}>{d.aName}</div>
                  <div className="my-0.5 text-center opacity-40">vs</div>
                  <div className={`truncate ${d.bIsHuman ? "font-semibold" : ""}`}>{d.bName}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4">
        <h2 className="text-lg font-semibold">{t(locale, "canli.poolPhaseDone")}</h2>
        <p className="mt-1 text-sm opacity-80">{t(locale, "canli.seedInfo", { n: tour.seedRank ?? "—" })}</p>
        <form action={enterBracketAction} className="mt-3">
          <button className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500">
            {t(locale, "canli.enterBracket")}
          </button>
        </form>
      </div>
    </div>
  ) : tour.phase === "DONE" ? (
    <DoneScreen tour={tour} locale={locale} />
  ) : tour.pending ? (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
      <div className="text-sm opacity-70">
        {tour.pending.timeLabel} ·{" "}
        {tour.pending.phase === "POOL"
          ? `${tour.pending.round}${tour.pending.matchNo ? ` · ${t(locale, "canli.matchN", { n: tour.pending.matchNo })}` : ""}`
          : `${t(locale, "canli.eleme")} · ${tour.pending.round}`}
      </div>
      <h2 className="mt-1 text-lg font-semibold">{t(locale, "canli.nextMatch", { opp: tour.pending.oppName })}</h2>
      <p className="mt-1 text-sm opacity-70">
        {tour.pending.phase === "DE" ? t(locale, "canli.tacticHintDE") : t(locale, "canli.tacticHintPool")}
      </p>
      <TacticGrid locale={locale} />
    </div>
  ) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tour.name}</h1>
          <p className="text-sm opacity-70">
            {tour.categoryId} · {t(locale, `phase.${tour.phase}`)}
          </p>
        </div>
        <div className="rounded-lg border border-black/10 px-3 py-1.5 text-sm tabular-nums dark:border-white/15">
          {isPoolPhase
            ? t(locale, "canli.poolCounter", { p: Math.min(tour.poolPlayed, tour.poolTotal), n: tour.poolTotal })
            : t(locale, "canli.eleme")}
        </div>
      </div>

      {/* Oyuncu durumu — turnuva boyunca güncel (kondisyon maçlarla düşer). */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">🔋 {t(locale, "profil.condition")}</div>
          <div className="font-semibold tabular-nums">%{tour.player.condition}</div>
        </div>
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">🎯 {t(locale, "profil.form")}</div>
          <div className="font-semibold tabular-nums">%{tour.player.sharpness}</div>
        </div>
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">⭐ {t(locale, "profil.overall")}</div>
          <div className="font-semibold tabular-nums">{tour.player.overall.toFixed(1)}</div>
        </div>
      </div>

      {/* Eleme çatalı (bracket) — TÜM eşleşmeler; senin animasyonu süren maçının skoru gizli */}
      {!isPoolPhase && (tour.bracket?.length ?? 0) > 0 && (
        <ElemeCatali
          bracket={tour.bracket!}
          hideRound={gateNext ? (tour.currentRound ?? null) : null}
          locale={locale}
        />
      )}

      {/* Oynanan maçların — pul aşamasında pul maçları, elemede eleme maçları */}
      {displayed.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{isPoolPhase ? t(locale, "canli.poolMatches") : t(locale, "canli.deMatches")}</h2>
          <div className="mt-3 space-y-3">
            {displayed.map((m, i) => {
              const isLast = i === displayed.length - 1;
              const auto = isLast && gateNext; // yalnız yeni oynanan maç canlı akar
              const label = isPoolPhase
                ? `${m.round} · ${t(locale, "canli.matchN", { n: i + 1 })}`
                : `${t(locale, "canli.eleme")} · ${m.round}`;
              return (
                <div key={i}>
                  <div className="mb-1 text-xs font-medium opacity-60">
                    {m.timeLabel} · {label}
                  </div>
                  <CanliMac
                    aName={m.aName}
                    bName={m.bName}
                    scoreA={m.scoreA}
                    scoreB={m.scoreB}
                    log={m.log}
                    autoPlay={auto}
                    past={!auto}
                    instantThrough={!isPoolPhase ? lastPeriodStart(m.log) : 0}
                    afterDone={isLast && gateNext ? nextAction : undefined}
                    locale={locale}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tour.byes.length > 0 && (
        <div className="mt-4 space-y-1">
          {tour.byes.map((b, i) => (
            <div key={i} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm">
              {b.timeLabel} · <span className="font-medium">{b.round}</span>: {t(locale, "canli.bye")}.
            </div>
          ))}
        </div>
      )}

      {/* Devam eden eleme maçı — periyot akışı + devre arası taktik değişimi */}
      {tour.liveMatch && (
        <section className="mt-6">
          <div className="mb-1 text-xs font-medium opacity-60">
            {t(locale, "canli.eleme")} · {t(locale, "canli.periodEnded", { round: tour.liveMatch.round, n: tour.liveMatch.periodsPlayed })}
          </div>
          <CanliPeriyot
            key={tour.liveMatch.log.length}
            aName={t(locale, "common.youShort")}
            oppName={tour.liveMatch.oppName}
            scoreHuman={tour.liveMatch.scoreHuman}
            scoreOpp={tour.liveMatch.scoreOpp}
            log={tour.liveMatch.log}
            instantThrough={tour.liveMatch.prevLen}
            locale={locale}
            afterDone={
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <h2 className="text-lg font-semibold">
                  {t(locale, "canli.break", {
                    n: tour.liveMatch.nextPeriod,
                    a: tour.liveMatch.scoreHuman,
                    b: tour.liveMatch.scoreOpp,
                  })}
                </h2>
                <p className="mt-1 text-sm opacity-70">{t(locale, "canli.breakHint", { n: tour.liveMatch.totalPeriods })}</p>
                <TacticGrid locale={locale} />
              </div>
            }
          />
        </section>
      )}

      {/* Sıradaki aksiyon — izlenecek taze maç yoksa (giriş/eleme geçişi) doğrudan gösterilir */}
      {!gateNext && nextAction && <div className="mt-6">{nextAction}</div>}

      {/* Pul aşamasında kilitli sıradaki maçlar */}
      {tour.phase === "POOL" && !tour.poolAwaitingResult && tour.upcoming.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold opacity-70">{t(locale, "canli.upcomingLocked")}</h3>
          <ul className="mt-2 space-y-1">
            {tour.upcoming.map((u, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm opacity-50 dark:border-white/15"
              >
                <span>🔒 vs {u.oppName}</span>
                <span className="tabular-nums">{u.timeLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pul kağıtları — pul aşamasında (POOL_DONE) doğrudan; elemede katlanır (ön sayfada kalsın). */}
      {tour.poolSheets && tour.poolSheets.length > 0 && isPoolPhase && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t(locale, "canli.poolSheets")}</h2>
          <p className="mt-1 text-xs opacity-60">{t(locale, "canli.poolSheetsNote")}</p>
          <div className="mt-3 space-y-5">
            {tour.poolSheets.map((sheet) => (
              <PulKagidi key={sheet.poolNumber} sheet={sheet} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Elemede: pul maçları + kağıtları katlanmış olarak erişilebilir kalır */}
      {!isPoolPhase && (poolMatches.length > 0 || (tour.poolSheets?.length ?? 0) > 0) && (
        <details className="mt-8 rounded-lg border border-black/10 p-3 dark:border-white/15">
          <summary className="cursor-pointer text-sm font-medium opacity-80">{t(locale, "canli.poolCollapse")}</summary>
          <div className="mt-3 space-y-3">
            {poolMatches.map((m, i) => (
              <div key={i}>
                <div className="mb-1 text-xs font-medium opacity-60">
                  {m.timeLabel} · {m.round} · {t(locale, "canli.matchN", { n: i + 1 })}
                </div>
                <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past locale={locale} />
              </div>
            ))}
            {tour.poolSheets?.map((sheet) => (
              <PulKagidi key={sheet.poolNumber} sheet={sheet} locale={locale} />
            ))}
          </div>
        </details>
      )}
    </main>
  );
}

/** Turnuva bitiş ekranı — sonuç + klasman + eve dön. */
function DoneScreen({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  return (
    <div>
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <div className="text-sm opacity-70">{t(locale, "canli.doneTitle")}</div>
        <div className="mt-1 text-3xl font-bold">{positionLabel(locale, tour.finalPosition)}</div>
        <div className="mt-1 text-sm opacity-70">{t(locale, "canli.champion", { name: tour.championName ?? "?" })}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-black/10 px-3 py-2 text-center dark:border-white/15">
          <div className="text-xs opacity-60">{t(locale, "canli.earned")}</div>
          <div className="font-semibold text-emerald-600">
            {tour.earnedPoints != null && tour.earnedPoints > 0 ? `+${tour.earnedPoints}` : "0"}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 px-3 py-2 text-center dark:border-white/15">
          <div className="text-xs opacity-60">{t(locale, "canli.rankPlace")}</div>
          <div className="font-semibold">{tour.newRank != null ? `#${tour.newRank}` : "—"}</div>
        </div>
      </div>
      <p className="mt-1 text-center text-xs opacity-50">{t(locale, "canli.quarterNote")}</p>

      {tour.standings && (
        <ol className="mt-4 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
          {tour.standings.slice(0, 8).map((s, i) => (
            <li
              key={i}
              className={`flex items-center justify-between px-3 py-2 text-sm ${
                s.isHuman ? "bg-emerald-500/10 font-medium" : ""
              }`}
            >
              <span>
                {s.name}
                {s.isHuman ? ` ${t(locale, "common.you")}` : ""}
              </span>
              <span className="opacity-70">{positionLabel(locale, s.position)}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form action={leaveLiveTournamentAction}>
          <button className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            {t(locale, "canli.home")}
          </button>
        </form>
        {tour.finalTournamentId != null && (
          <Link
            href={`/turnuva/${tour.finalTournamentId}`}
            className="rounded-lg border border-black/15 px-4 py-3 text-sm opacity-70 transition hover:opacity-100 dark:border-white/20"
          >
            {t(locale, "canli.seeTable")}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Canlı eleme çatalı — TÜM eşleşmeler (insan + AI), tur tur sütunlar; senin maçların vurgulu.
 * `hideRound`: o an animasyonu süren tur → senin o turdaki maçının skoru gizlenir (spoiler önleme).
 */
function ElemeCatali({
  bracket,
  hideRound,
  locale,
}: {
  bracket: NonNullable<LiveTournamentDTO["bracket"]>;
  hideRound: string | null;
  locale: Locale;
}) {
  const rounds: string[] = [];
  for (const m of bracket) if (!rounds.includes(m.round)) rounds.push(m.round);
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{t(locale, "canli.bracket")}</h2>
      <p className="mt-1 text-xs opacity-60">{t(locale, "canli.bracketAll")}</p>
      <div className="mt-3 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {rounds.map((round) => (
            <div key={round} className="flex min-w-[160px] flex-col justify-around gap-3">
              <h3 className="text-center text-xs font-medium opacity-70">{round}</h3>
              {bracket
                .filter((m) => m.round === round)
                .map((m, i) => {
                  const mine = m.aIsHuman;
                  const hide = mine && hideRound != null && m.round === hideRound; // animasyonu süren maç
                  const aWon = m.scoreA >= m.scoreB;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-2 text-xs ${
                        mine ? "border-emerald-500/50 bg-emerald-500/10" : "border-black/10 dark:border-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate ${!hide && aWon ? "font-semibold" : "opacity-60"}`}>{m.aName}</span>
                        <span className="tabular-nums opacity-80">{hide ? "•" : m.scoreA}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={`truncate ${!hide && !aWon ? "font-semibold" : "opacity-60"}`}>{m.bName}</span>
                        <span className="tabular-nums opacity-80">{hide ? "•" : m.scoreB}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
