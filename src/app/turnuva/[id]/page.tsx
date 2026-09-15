import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveLiveTournamentAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getTournament, type TournamentResultDTO } from "@/server/careerService";
import { CanliMac } from "./CanliMac";
import { PulKagidi } from "./PulKagidi";

function positionLabel(locale: Locale, pos: number): string {
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

export default async function TurnuvaPage({ params }: PageProps<"/turnuva/[id]">) {
  const { id } = await params;
  const tour = await getTournament(Number(id));
  if (!tour) notFound();
  const locale = await getLocale();

  // Eleme turlarını göründükleri sırada grupla.
  const deRounds: string[] = [];
  for (const m of tour.matches) {
    if (m.phase === "DE" && !deRounds.includes(m.round)) deRounds.push(m.round);
  }
  const yourMatches = tour.matches.filter((m) => m.aIsHuman || m.bIsHuman);
  const yourPool = yourMatches.filter((m) => m.phase === "POOL");
  const yourDE = yourMatches.filter((m) => m.phase === "DE");
  const firstDeRound = yourDE[0]?.round;
  const hadBye = firstDeRound != null && deRounds.length > 0 && firstDeRound !== deRounds[0];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/kariyer" className="text-sm text-emerald-600 hover:underline">
        {t(locale, "idp.back")}
      </Link>

      <h1 className="mt-2 text-2xl font-bold">{tour.name}</h1>
      <p className="text-sm opacity-70">{tour.categoryId}</p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t(locale, "idp.yourMatches")}</h2>
        <p className="text-sm opacity-70">{t(locale, "idp.intro")}</p>

        {yourPool.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold opacity-70">{t(locale, "idp.poolMatches")}</h3>
            <div className="mt-2 space-y-3">
              {yourPool.map((m, i) => (
                <div key={i}>
                  <div className="mb-1 text-xs font-medium opacity-60">{m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past locale={locale} />
                </div>
              ))}
            </div>
          </>
        )}

        {tour.yourSeedRank != null && (
          <div className="mt-4 rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-sm">
            <span className="font-medium">{t(locale, "idp.poolResultLead")}</span>{" "}
            {t(locale, "idp.seedFrom", { n: tour.yourSeedRank })}
            {hadBye && <> {t(locale, "idp.byeInfo", { round: deRounds[0], first: firstDeRound ?? "" })}</>}
          </div>
        )}

        {yourDE.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold opacity-70">{t(locale, "idp.deMatches")}</h3>
            <div className="mt-2 space-y-3">
              {yourDE.map((m, i) => (
                <div key={i}>
                  <div className="mb-1 text-xs font-medium opacity-60">{t(locale, "canli.eleme")} · {m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past locale={locale} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="text-sm opacity-70">{t(locale, "idp.result")}</div>
        <div className="text-xl font-semibold">{positionLabel(locale, tour.yourPosition)}</div>
        <div className="mt-1 text-sm opacity-70">
          {tour.yourSeedRank ? t(locale, "idp.seedLine", { n: tour.yourSeedRank }) : ""}
          {t(locale, "canli.champion", { name: tour.championName })}
        </div>
      </div>

      {/* Pul kağıtları (poule) */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t(locale, "canli.poolSheets")}</h2>
        <p className="mt-1 text-xs opacity-60">{t(locale, "idp.poolSheetsNote")}</p>
        <div className="mt-3 space-y-5">
          {tour.poolSheets.map((sheet) => (
            <PulKagidi key={sheet.poolNumber} sheet={sheet} locale={locale} />
          ))}
        </div>
      </section>

      {/* Eleme çatalı (bracket) */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t(locale, "canli.bracket")}</h2>
        <div className="mt-3 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {deRounds.map((round) => (
              <div key={round} className="flex min-w-[170px] flex-col justify-around gap-3">
                <h3 className="text-center text-xs font-medium opacity-70">{round}</h3>
                {tour.matches
                  .filter((m) => m.phase === "DE" && m.round === round)
                  .map((m, i) => {
                    const aWon = m.scoreA >= m.scoreB;
                    const mine = m.aIsHuman || m.bIsHuman;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-2 text-xs ${
                          mine ? "border-emerald-500/50 bg-emerald-500/10" : "border-black/10 dark:border-white/15"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate ${aWon ? "font-semibold" : "opacity-60"}`}>{m.aName}</span>
                          <span className="tabular-nums opacity-80">{m.scoreA}</span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <span className={`truncate ${!aWon ? "font-semibold" : "opacity-60"}`}>{m.bName}</span>
                          <span className="tabular-nums opacity-80">{m.scoreB}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalStandings standings={tour.standings} locale={locale} />

      <div className="mt-8 flex justify-center">
        <form action={leaveLiveTournamentAction}>
          <button className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            {t(locale, "idp.backHome")}
          </button>
        </form>
      </div>
    </main>
  );
}

function FinalStandings({ standings, locale }: { standings: TournamentResultDTO["standings"]; locale: Locale }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{t(locale, "idp.standings")}</h2>
      <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
        {standings.map((s, i) => (
          <li
            key={i}
            className={`flex items-center justify-between px-3 py-2 text-sm ${
              s.isHuman ? "bg-emerald-500/10 font-medium" : ""
            }`}
          >
            <span>
              {s.name}
              {s.isHuman ? ` (${t(locale, "common.youShort")})` : ""}
            </span>
            <span className="opacity-70">{positionLabel(locale, s.position)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
