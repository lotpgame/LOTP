import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveTournamentAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getTournament, type TournamentResultDTO } from "@/server/careerService";
import { CanliMac } from "./CanliMac";
import { LiveAutoRefresh } from "./LiveAutoRefresh";
import { LiveTournamentPanel } from "./LiveTournamentPanel";
import { PulKagidi } from "./PulKagidi";
import { Icon } from "@/app/ui/Icon";
import { HeadlineCard, whatsAppHref } from "@/app/ui/HeadlineCard";
import { buildHeadline, lastBoutFrom } from "@/app/ui/headlineText";

type MatchDTO = TournamentResultDTO["matches"][number];
type RevealedMatch = MatchDTO & {
  isPending: false;
  aName: string;
  bName: string;
  scoreA: number;
  scoreB: number;
  log: string[];
};

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

/** Devam eden eleme maçında yalnız O ANKİ periyot animasyonla aksın (öncekiler anında) — baştan sarmayı önler. */
function instantThroughFor(log: string[]): number {
  const headers = log.map((l, i) => (l.startsWith("▸") ? i : -1)).filter((i) => i >= 0);
  return headers.length >= 2 ? headers[headers.length - 1] : 0;
}

/** Maçın kimliği (stabil React key) — aynı maç tazeleme boyunca aynı bileşende kalır → animasyon sıfırlanmaz. */
function matchKey(m: { phase: string; round: string; aName?: string | null; bName?: string | null }): string {
  return `${m.phase}-${m.round}-${m.aName ?? "?"}-${m.bName ?? "?"}`;
}

export default async function TurnuvaPage({ params }: PageProps<"/turnuva/[id]">) {
  const { id } = await params;
  const tour = await getTournament(Number(id));
  if (!tour) notFound();
  const locale = await getLocale();

  // Eleme turlarını göründükleri sırada grupla (PENDING maçlar da round/phase taşır — bracket'in TAMAMI görünür).
  const deRounds: string[] = [];
  for (const m of tour.matches) {
    if (m.phase === "DE" && !deRounds.includes(m.round)) deRounds.push(m.round);
  }
  const yourMatches = tour.matches.filter((m): m is RevealedMatch => !m.isPending && (m.aIsHuman || m.bIsHuman));
  const yourPool = yourMatches.filter((m) => m.phase === "POOL");
  const yourDE = yourMatches.filter((m) => m.phase === "DE");

  const liveNow = tour.live?.status === "RUNNING";
  // 2b: devam eden (periyotları açılan) eleme maçı — bitmeden canlı izlenir.
  const liveDe = liveNow
    ? (tour.matches.find((m) => m.phase === "DE" && m.inProgress && (m.aIsHuman || m.bIsHuman) && m.aName && m.bName && m.log) ?? null)
    : null;
  // "Olay anı" maçı: devam eden eleme maçı → yoksa en yeni biten maç (eleme/havuz). Tek üst blokta, stabil key ile
  // gösterilir (CanliMac otomatik akar); #45: baştan sarma ve çoklu-render replay'i böyle biter.
  const currentLive: (MatchDTO & { aName: string; bName: string; log: string[] }) | null = liveNow
    ? ((liveDe as (MatchDTO & { aName: string; bName: string; log: string[] }) | null) ??
      (yourDE[yourDE.length - 1] as RevealedMatch | undefined) ??
      (yourPool[yourPool.length - 1] as RevealedMatch | undefined) ??
      null)
    : null;
  // Geçmiş (katlanır) listeler — olay anı maçı hariç.
  const histPool = yourPool.filter((m) => m !== currentLive);
  const histDE = yourDE.filter((m) => m !== currentLive);

  const firstDeRound = yourDE[0]?.round;
  const hadBye = firstDeRound != null && deRounds.length > 0 && firstDeRound !== deRounds[0];
  const myPool = tour.pools.flatMap((p) => p.players).find((p) => p.isHuman);
  const headline = tour.isFullyRevealed && tour.youParticipated
    ? buildHeadline(locale, {
        name: tour.standings.find((s) => s.isHuman)?.name ?? "",
        tournament: tour.name,
        position: tour.yourPosition ?? 0,
        fieldSize: tour.standings.length,
        pool: myPool ? { wins: myPool.wins, losses: myPool.losses, indicator: myPool.indicator } : null,
        lastBout: lastBoutFrom(yourMatches),
      })
    : null;

  // Klasman/bay bilgisi (pul bitince): kendi seed sıran + bay geçtiysen açık bildirim (#44).
  const seedInfo =
    tour.yourSeedRank != null && (tour.isFullyRevealed || tour.live != null) ? (
      <div className="panel p-3 text-[14px]">
        <span className="font-medium">{t(locale, "idp.poolResultLead")}</span>{" "}
        {t(locale, "idp.seedFrom", { n: tour.yourSeedRank })}
        {hadBye && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[13px] text-prio">
            <Icon name="flag" size={15} className="mt-px shrink-0" />
            <span>{t(locale, "idp.byeInfo", { round: deRounds[0], first: firstDeRound ?? "" })}</span>
          </div>
        )}
      </div>
    ) : null;

  // #44: pul sonrası turnuva klasmanı (seed sırası) — kendi + diğer oyuncuların durumu (G-M · averaj).
  const seedingTable =
    tour.seeding.length > 0 ? (
      <section>
        <h2 className="display text-[20px]">{t(locale, "idp.seedingTitle")}</h2>
        <ol className="mt-2 panel max-h-80 divide-y divide-line overflow-y-auto">
          {tour.seeding.map((p) => (
            <li
              key={p.position}
              className={`relative flex items-center gap-3 px-3 py-1.5 text-[14px] ${p.isHuman ? "bg-arena-2 font-semibold" : ""}`}
            >
              {p.isHuman && <span className="absolute inset-y-0 left-0 w-[3px] bg-me" aria-hidden="true" />}
              <span className="num w-6 shrink-0 text-steel">{p.position}.</span>
              <span className={`min-w-0 flex-1 truncate ${p.isHuman ? "text-me" : ""}`}>{p.name}</span>
              <span className="num shrink-0 text-[13px] text-steel">
                {p.wins}-{p.losses} · {p.indicator >= 0 ? "+" : ""}
                {p.indicator}
              </span>
            </li>
          ))}
        </ol>
      </section>
    ) : null;

  const bracket = (
    <section>
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
                  if (m.isPending) {
                    if (m.aName && m.bName) {
                      const mineNext = m.aIsHuman || m.bIsHuman;
                      return (
                        <div
                          key={i}
                          className={`rounded-md border border-dashed p-2.5 text-[13px] text-steel ${
                            mineNext ? "border-l-2 border-l-me border-line" : "border-line"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{m.aName}</span>
                            <Icon name="lock" size={13} className="shrink-0" />
                          </div>
                          <div className="mt-0.5 truncate">{m.bName}</div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex items-center gap-1.5 rounded-md border border-line p-2.5 text-[13px] text-steel">
                        <Icon name="lock" size={14} className="shrink-0" />
                        {t(locale, "idp.pending")}
                      </div>
                    );
                  }
                  const aWon = m.scoreA! >= m.scoreB!;
                  const mine = m.aIsHuman || m.bIsHuman;
                  return (
                    <div
                      key={i}
                      className={`rounded-md border p-2.5 text-[13px] ${
                        mine ? "border-line border-l-2 border-l-me bg-arena-1" : "border-line"
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
  );

  const poolSheets =
    tour.poolSheets.length > 0 ? (
      <section>
        <h2 className="display text-[20px]">{t(locale, "canli.poolSheets")}</h2>
        <p className="mt-1 text-[13px] text-steel">{t(locale, "idp.poolSheetsNote")}</p>
        <div className="mt-3 space-y-5">
          {tour.poolSheets.map((sheet) => (
            <PulKagidi key={sheet.poolNumber} sheet={sheet} locale={locale} />
          ))}
        </div>
      </section>
    ) : null;

  // Geçmiş maçlar (katlanır) — isteyen açar bakar; olay anı maçı üstte olduğu için burada durağan.
  const historyMatches = (histPool.length > 0 || histDE.length > 0) && (
    <>
      {histPool.map((m) => (
        <div key={matchKey(m)}>
          <div className="mb-1 kicker">{m.round}</div>
          <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past youSide={m.aIsHuman ? "left" : "right"} locale={locale} />
        </div>
      ))}
      {histDE.map((m) => (
        <div key={matchKey(m)}>
          <div className="mb-1 kicker">{t(locale, "canli.eleme")} · {m.round}</div>
          <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past youSide={m.aIsHuman ? "left" : "right"} locale={locale} />
        </div>
      ))}
    </>
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {!tour.isFullyRevealed && <LiveAutoRefresh everyMs={tour.live ? 4_000 : 15_000} />}
      <Link href="/kariyer" className="inline-flex min-h-11 items-center text-[14px] text-steel underline underline-offset-2">
        {t(locale, "idp.back")}
      </Link>

      <h1 className="mt-2 font-display text-[26px] font-bold leading-tight">{tour.name}</h1>
      <p className="text-[14px] text-steel">{tour.categoryId}</p>

      {!tour.youParticipated && <p className="mt-3 panel p-3 text-[14px] text-steel">{t(locale, "idp.spectator")}</p>}

      {liveNow ? (
        /* ——— CANLI DÜZEN (#48): üstte olay anı, ortada klasman/çatal, altta katlanır geçmiş ——— */
        <div className="mt-5 flex flex-col gap-6">
          {/* 1) OLAY ANI: taktik paneli + o an oynanan maç (podyum, hep üstte) */}
          <LiveTournamentPanel tournamentId={tour.tournamentId} live={tour.live!} locale={locale} />
          {currentLive && (
            <section>
              <h2 className="kicker mb-1">
                {currentLive.phase === "DE" ? `${t(locale, "canli.eleme")} · ${currentLive.round}` : currentLive.round}
              </h2>
              <CanliMac
                key={matchKey(currentLive)}
                aName={currentLive.aName}
                bName={currentLive.bName}
                scoreA={currentLive.scoreA ?? 0}
                scoreB={currentLive.scoreB ?? 0}
                log={currentLive.log}
                autoPlay
                instantThrough={currentLive.phase === "DE" ? instantThroughFor(currentLive.log) : 0}
                youSide={currentLive.aIsHuman ? "left" : "right"}
                locale={locale}
                serverNow={tour.live!.serverNow}
                playStartAt={tour.live!.podium?.playStartAt}
                animMs={tour.live!.podium?.animMs}
              />
            </section>
          )}

          {/* 2) KLASMAN (seeding) + bay + eleme çatalı */}
          {seedInfo}
          {seedingTable}
          {deRounds.length > 0 && tour.showBracket && bracket}

          {/* 3) EN ALTTA: pul kağıtları + geçmiş maçlar (katlanır, ekran sadeleşsin #46) */}
          {poolSheets && (
            <details className="panel group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
                <Icon name="ranking" size={18} className="text-steel" />
                <span className="flex-1 font-display text-[16px] font-semibold">{t(locale, "canli.poolSheets")}</span>
                <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4">{poolSheets}</div>
            </details>
          )}
          {historyMatches && (
            <details className="panel group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
                <Icon name="history" size={18} className="text-steel" />
                <span className="flex-1 font-display text-[16px] font-semibold">{t(locale, "idp.yourMatches")}</span>
                <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 px-4 pb-4">{historyMatches}</div>
            </details>
          )}
        </div>
      ) : (
        /* ——— BİTMİŞ / ESKİ MODEL: inceleme düzeni ——— */
        <>
          {!tour.isFullyRevealed ? (
            <div className="mt-5 panel border-ink p-4">
              <div className="flex items-center gap-2">
                <span className="lamp bg-ink anim-live h-2 w-2" aria-hidden="true" />
                <h2 className="font-display text-[18px] font-bold">{t(locale, "idp.live.title")}</h2>
              </div>
              <p className="mt-1.5 text-[14px] text-steel">{t(locale, "idp.live.note")}</p>
              <p className="mt-1 text-[13px] text-steel">{t(locale, "idp.live.nextSoon")}</p>
            </div>
          ) : headline ? (
            <div className="mt-5">
              <HeadlineCard h={headline} kicker={t(locale, "idp.result")} shareHref={await whatsAppHref(locale, headline)} locale={locale}>
                <p className="mt-1 text-[14px] text-steel">
                  {tour.yourSeedRank ? t(locale, "idp.seedLine", { n: tour.yourSeedRank }) : ""}
                  {!headline.champion && tour.championName && t(locale, "canli.champion", { name: tour.championName })}
                </p>
              </HeadlineCard>
            </div>
          ) : (
            tour.championName && (
              <div className="mt-5 panel p-4 text-[16px] font-semibold">{t(locale, "canli.champion", { name: tour.championName })}</div>
            )
          )}

          {tour.youParticipated && (yourPool.length > 0 || yourDE.length > 0) && (
            <section className="mt-6 flex flex-col gap-6">
              <div>
                <h2 className="display text-[20px]">{t(locale, "idp.yourMatches")}</h2>
                <p className="text-[14px] text-steel">{t(locale, "idp.intro")}</p>
              </div>
              {yourPool.length > 0 && (
                <div>
                  <h3 className="kicker">{t(locale, "idp.poolMatches")}</h3>
                  <div className="mt-2 space-y-3">
                    {yourPool.map((m) => (
                      <div key={matchKey(m)}>
                        <div className="mb-1 kicker">{m.round}</div>
                        <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past youSide={m.aIsHuman ? "left" : "right"} locale={locale} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {seedInfo}
              {seedingTable}
              {yourDE.length > 0 && (
                <div>
                  <h3 className="kicker">{t(locale, "idp.deMatches")}</h3>
                  <div className="mt-2 space-y-3">
                    {yourDE.map((m) => (
                      <div key={matchKey(m)}>
                        <div className="mb-1 kicker">{t(locale, "canli.eleme")} · {m.round}</div>
                        <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past youSide={m.aIsHuman ? "left" : "right"} locale={locale} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {poolSheets && <div className="mt-8">{poolSheets}</div>}
          {deRounds.length > 0 && tour.showBracket && <div className="mt-8">{bracket}</div>}
          {tour.isFullyRevealed && <FinalStandings standings={tour.standings} locale={locale} />}
        </>
      )}

      <div className="mt-8">
        <form action={leaveTournamentAction}>
          <input type="hidden" name="tournamentId" value={tour.tournamentId} />
          <button className="btn-ink press h-12 w-full text-[16px]">{t(locale, "idp.backHome")}</button>
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
              <span className={`absolute inset-y-0 left-0 w-[3px] ${s.isHuman ? "bg-me" : "bg-prio"}`} aria-hidden="true" />
            )}
            <span className={s.isHuman ? "text-me" : ""}>{s.name}</span>
            <span className="text-steel">{positionLabel(locale, s.position)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
