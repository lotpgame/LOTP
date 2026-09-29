import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveLiveTournamentAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getTournament, type TournamentResultDTO } from "@/server/careerService";
import { CanliMac } from "./CanliMac";
import { PulKagidi } from "./PulKagidi";
import { Icon } from "@/app/ui/Icon";
import { HeadlineCard, whatsAppHref } from "@/app/ui/HeadlineCard";
import { buildHeadline, lastBoutFrom } from "@/app/ui/headlineText";

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
  const myPool = tour.pools.flatMap((p) => p.players).find((p) => p.isHuman);
  const headline = buildHeadline(locale, {
    name: tour.standings.find((s) => s.isHuman)?.name ?? "",
    tournament: tour.name,
    position: tour.yourPosition,
    fieldSize: tour.standings.length,
    pool: myPool ? { wins: myPool.wins, losses: myPool.losses, indicator: myPool.indicator } : null,
    lastBout: lastBoutFrom(tour.matches),
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/kariyer" className="inline-flex min-h-11 items-center text-[14px] text-steel underline underline-offset-2">
        {t(locale, "idp.back")}
      </Link>

      <h1 className="mt-2 font-display text-[26px] font-bold leading-tight">{tour.name}</h1>
      <p className="text-[14px] text-steel">{tour.categoryId}</p>

      <div className="mt-5">
        <HeadlineCard h={headline} kicker={t(locale, "idp.result")} shareHref={await whatsAppHref(locale, headline)} locale={locale}>
          <p className="mt-1 text-[14px] text-steel">
            {tour.yourSeedRank ? t(locale, "idp.seedLine", { n: tour.yourSeedRank }) : ""}
            {!headline.champion && t(locale, "canli.champion", { name: tour.championName })}
          </p>
        </HeadlineCard>
      </div>

      <section className="mt-6">
        <h2 className="display text-[20px]">{t(locale, "idp.yourMatches")}</h2>
        <p className="text-[14px] text-steel">{t(locale, "idp.intro")}</p>

        {yourPool.length > 0 && (
          <>
            <h3 className="mt-4 kicker">{t(locale, "idp.poolMatches")}</h3>
            <div className="mt-2 space-y-3">
              {yourPool.map((m, i) => (
                <div key={i}>
                  <div className="mb-1 kicker">{m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past locale={locale} />
                </div>
              ))}
            </div>
          </>
        )}

        {tour.yourSeedRank != null && (
          <div className="mt-4 panel p-3 text-[14px]">
            <span className="font-medium">{t(locale, "idp.poolResultLead")}</span>{" "}
            {t(locale, "idp.seedFrom", { n: tour.yourSeedRank })}
            {hadBye && <> {t(locale, "idp.byeInfo", { round: deRounds[0], first: firstDeRound ?? "" })}</>}
          </div>
        )}

        {yourDE.length > 0 && (
          <>
            <h3 className="mt-4 kicker">{t(locale, "idp.deMatches")}</h3>
            <div className="mt-2 space-y-3">
              {yourDE.map((m, i) => (
                <div key={i}>
                  <div className="mb-1 kicker">{t(locale, "canli.eleme")} · {m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past locale={locale} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Pul kağıtları (poule) */}
      <section className="mt-8">
        <h2 className="display text-[20px]">{t(locale, "canli.poolSheets")}</h2>
        <p className="mt-1 text-[13px] text-steel">{t(locale, "idp.poolSheetsNote")}</p>
        <div className="mt-3 space-y-5">
          {tour.poolSheets.map((sheet) => (
            <PulKagidi key={sheet.poolNumber} sheet={sheet} locale={locale} />
          ))}
        </div>
      </section>

      {/* Eleme çatalı (bracket) */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="display text-[20px]">{t(locale, "canli.bracket")}</h2>
          {deRounds.length > 1 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-steel">
              {t(locale, "canli.bracketScrollHint")}
              <Icon name="chevron-right" size={14} />
            </span>
          )}
        </div>
        <div className="mt-3 snap-x snap-proximity overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {deRounds.map((round) => (
              <div key={round} className="flex min-w-[150px] shrink-0 snap-start flex-col justify-around gap-3">
                <h3 className="text-center kicker">{round}</h3>
                {tour.matches
                  .filter((m) => m.phase === "DE" && m.round === round)
                  .map((m, i) => {
                    const aWon = m.scoreA >= m.scoreB;
                    const mine = m.aIsHuman || m.bIsHuman;
                    return (
                      <div
                        key={i}
                        className={`rounded-md border p-2.5 text-[13px] ${
                          mine ? "border-line border-l-2 border-l-sig-red bg-arena-1" : "border-line"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate ${aWon ? "font-semibold" : "text-steel"}`}>{m.aName}</span>
                          <span className="num">{m.scoreA}</span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <span className={`truncate ${!aWon ? "font-semibold" : "text-steel"}`}>{m.bName}</span>
                          <span className="num">{m.scoreB}</span>
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

      <div className="mt-8">
        <form action={leaveLiveTournamentAction}>
          <button className="btn-ink press h-12 w-full text-[16px]">
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
      <h2 className="display text-[20px]">{t(locale, "idp.standings")}</h2>
      <ol className="mt-3 panel overflow-hidden divide-y divide-line">
        {standings.map((s, i) => (
          <li
            key={i}
            className={`relative flex items-center justify-between px-3 py-2 text-[14px] ${
              s.isHuman ? "bg-arena-2 font-semibold" : ""
            }`}
          >
            {(s.isHuman || s.position === 1) && (
              <span className={`absolute inset-y-0 left-0 w-[3px] ${s.isHuman ? "bg-sig-red" : "bg-prio"}`} aria-hidden="true" />
            )}
            <span>
              {s.name}
              {s.isHuman ? ` (${t(locale, "common.youShort")})` : ""}
            </span>
            <span className="text-steel">{positionLabel(locale, s.position)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
