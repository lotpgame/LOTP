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

type RevealedMatch = TournamentResultDTO["matches"][number] & {
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

export default async function TurnuvaPage({ params }: PageProps<"/turnuva/[id]">) {
  const { id } = await params;
  const tour = await getTournament(Number(id));
  if (!tour) notFound();
  const locale = await getLocale();

  // Eleme turlarını göründükleri sırada grupla (PENDING maçlar da round/phase bilgisini taşır —
  // bracket'in TAMAMI, henüz açılmamış turlar dahil, hep görünür; yalnız isim/skor B'de gizli).
  const deRounds: string[] = [];
  for (const m of tour.matches) {
    if (m.phase === "DE" && !deRounds.includes(m.round)) deRounds.push(m.round);
  }
  const yourMatches = tour.matches.filter((m): m is RevealedMatch => !m.isPending && (m.aIsHuman || m.bIsHuman));
  const yourPool = yourMatches.filter((m) => m.phase === "POOL");
  const yourDE = yourMatches.filter((m) => m.phase === "DE");
  // B canlı oynatma (Aşama 1): turnuva canlıyken oyuncunun EN YENİ maçı otomatik canlı akar
  // (CanliMac autoPlay — tuş-tuş + lamba/juice); önceki maçlar durağan (past) sonuç gösterir.
  const liveNow = tour.live?.status === "RUNNING";
  // Aşama 2b: devam eden (periyotları açılan) eleme maçı — bitmeden canlı izlenir, periyot arası taktik verilir.
  const liveDe = liveNow
    ? (tour.matches.find((m) => m.phase === "DE" && m.inProgress && (m.aIsHuman || m.bIsHuman) && m.aName && m.bName && m.log) ?? null)
    : null;
  // Devam eden eleme maçı varken o canlı akar; yoksa en yeni biten maç (havuz/eleme) otomatik oynatılır.
  const liveMatch = liveNow && !liveDe ? (yourDE[yourDE.length - 1] ?? yourPool[yourPool.length - 1]) : null;
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

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Canlı turnuva (B Faz 3): ~4 sn'de bir sunucudan tazelenir. Eski (anında çözülmüş) turnuva: 15 sn. */}
      {!tour.isFullyRevealed && <LiveAutoRefresh everyMs={tour.live ? 4_000 : 15_000} />}
      <Link href="/kariyer" className="inline-flex min-h-11 items-center text-[14px] text-steel underline underline-offset-2">
        {t(locale, "idp.back")}
      </Link>

      <h1 className="mt-2 font-display text-[26px] font-bold leading-tight">{tour.name}</h1>
      <p className="text-[14px] text-steel">{tour.categoryId}</p>

      {!tour.youParticipated && <p className="mt-3 panel p-3 text-[14px] text-steel">{t(locale, "idp.spectator")}</p>}

      {tour.live?.status === "RUNNING" ? (
        <LiveTournamentPanel tournamentId={tour.tournamentId} live={tour.live} locale={locale} />
      ) : !tour.isFullyRevealed ? (
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

      <section className="mt-6">
        {tour.youParticipated && (
          <>
            <h2 className="display text-[20px]">{t(locale, "idp.yourMatches")}</h2>
            <p className="text-[14px] text-steel">{t(locale, "idp.intro")}</p>
          </>
        )}

        {yourPool.length > 0 && (
          <>
            <h3 className="mt-4 kicker">{t(locale, "idp.poolMatches")}</h3>
            <div className="mt-2 space-y-3">
              {yourPool.map((m) => (
                <div key={`${m.round}-${m.aName}-${m.bName}`}>
                  <div className="mb-1 kicker">{m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past={m !== liveMatch} autoPlay={m === liveMatch} youSide={m.aIsHuman ? "left" : "right"} locale={locale} />
                </div>
              ))}
            </div>
          </>
        )}

        {tour.yourSeedRank != null && (tour.isFullyRevealed || tour.live != null) && (
          <div className="mt-4 panel p-3 text-[14px]">
            <span className="font-medium">{t(locale, "idp.poolResultLead")}</span>{" "}
            {t(locale, "idp.seedFrom", { n: tour.yourSeedRank })}
            {hadBye && <> {t(locale, "idp.byeInfo", { round: deRounds[0], first: firstDeRound ?? "" })}</>}
          </div>
        )}

        {(yourDE.length > 0 || liveDe) && (
          <>
            <h3 className="mt-4 kicker">{t(locale, "idp.deMatches")}</h3>
            <div className="mt-2 space-y-3">
              {liveDe && (
                <div>
                  <div className="mb-1 kicker">{t(locale, "canli.eleme")} · {liveDe.round}</div>
                  {/* Devam eden eleme maçı: log periyotlar açıldıkça büyür → CanliMac yeni satırları canlı akıtır. */}
                  <CanliMac aName={liveDe.aName!} bName={liveDe.bName!} scoreA={liveDe.scoreA ?? 0} scoreB={liveDe.scoreB ?? 0} log={liveDe.log!} autoPlay past={false} youSide={liveDe.aIsHuman ? "left" : "right"} locale={locale} />
                </div>
              )}
              {yourDE.map((m) => (
                <div key={`${m.round}-${m.aName}-${m.bName}`}>
                  <div className="mb-1 kicker">{t(locale, "canli.eleme")} · {m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past={m !== liveMatch} autoPlay={m === liveMatch} youSide={m.aIsHuman ? "left" : "right"} locale={locale} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Pul kağıtları: eski turnuvada her şey açılınca; canlıda çözüldükçe (veri DTO'da zaten kapılı). */}
      {tour.poolSheets.length > 0 && (
        <section className="mt-8">
          <h2 className="display text-[20px]">{t(locale, "canli.poolSheets")}</h2>
          <p className="mt-1 text-[13px] text-steel">{t(locale, "idp.poolSheetsNote")}</p>
          <div className="mt-3 space-y-5">
            {tour.poolSheets.map((sheet) => (
              <PulKagidi key={sheet.poolNumber} sheet={sheet} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Eleme çatalı (bracket) — tur yapısı hep görünür, sonuçlar açıldıkça dolar */}
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
                    if (m.isPending) {
                      // Canlıda eşleşme belli olduysa isimler görünür (skor yok); değilse kilitli yer.
                      if (m.aName && m.bName) {
                        const mineNext = m.aIsHuman || m.bIsHuman;
                        return (
                          <div
                            key={i}
                            className={`rounded-md border border-dashed p-2.5 text-[13px] text-steel ${
                              mineNext ? "border-l-2 border-l-sig-red border-line" : "border-line"
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
                    const aWon = m.scoreA! >= m.scoreB!; // isPending yukarıda elendi → dolu
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

      {tour.isFullyRevealed && <FinalStandings standings={tour.standings} locale={locale} />}

      <div className="mt-8">
        <form action={leaveTournamentAction}>
          <input type="hidden" name="tournamentId" value={tour.tournamentId} />
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
              <span className={`absolute inset-y-0 left-0 w-[3px] ${s.isHuman ? "bg-me" : "bg-prio"}`} aria-hidden="true" />
            )}
            {/* Kendi adın "(sen)" yerine kendi renginle ayırt edilir (Ayarlar → Görünüm; varsayılan kırmızı). */}
            <span className={s.isHuman ? "text-me" : ""}>{s.name}</span>
            <span className="text-steel">{positionLabel(locale, s.position)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
