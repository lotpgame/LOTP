import { notFound } from "next/navigation";
import { leaveTournamentAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getTournament, type TournamentResultDTO } from "@/server/careerService";
import { Bracket } from "./Bracket";
import { CanliMac } from "./CanliMac";
import { LiveAutoRefresh } from "./LiveAutoRefresh";
import { LivePodium, LiveStatusBadge, type PodiumMatch } from "./LivePodium";
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
  // #51: podyum (olay anı) maçı — sunucu-zaman çapasıyla LivePodium'a verilir.
  const podium: PodiumMatch | null = currentLive
    ? {
        aName: currentLive.aName,
        bName: currentLive.bName,
        scoreA: currentLive.scoreA ?? 0,
        scoreB: currentLive.scoreB ?? 0,
        log: currentLive.log,
        phase: currentLive.phase === "DE" ? "DE" : "POOL",
        round: currentLive.round,
        aIsHuman: currentLive.aIsHuman,
        instantThrough: currentLive.phase === "DE" ? instantThroughFor(currentLive.log) : 0,
      }
    : null;
  // SPOILER önlemi (11.10): maç sunucuda OYNAMA BAŞINDA çözülür → sonucu DTO'da hemen hazır. Podyum animasyonla
  // gizlerken, podyumdaki maç animasyon penceresi BİTENE kadar (serverNow < playStart+animMs) geçmişte/çatalda
  // GÖSTERİLMEZ — yoksa final skor podyum akışını spoil eder. Oynama bitince geçmişe düşer (#49).
  const podiumPlayEndMs =
    tour.live?.podium != null ? new Date(tour.live.podium.playStartAt).getTime() + tour.live.podium.animMs : null;
  const podiumPlaying =
    tour.live != null && podiumPlayEndMs != null && new Date(tour.live.serverNow).getTime() < podiumPlayEndMs;
  const histPool = podiumPlaying ? yourPool.filter((m) => m !== currentLive) : yourPool;
  const histDE = podiumPlaying ? yourDE.filter((m) => m !== currentLive) : yourDE;

  // Bay bilgisi: oyuncunun İLK eleme maçı — oynadıysa yourDE[0], oynamadıysa (daha yeni girdi) canlı sıradaki DE maçı.
  // Böylece elemeye girer girmez (maç oynamadan) de "Son 32'yi bay geçtin, ilk maçın Son 16" netçe görünür (#44).
  const nextDe = tour.live?.you?.nextMatch?.phase === "DE" ? tour.live.you.nextMatch : null;
  const firstDeRound = yourDE[0]?.round ?? nextDe?.round;
  const hadBye = firstDeRound != null && deRounds.length > 0 && firstDeRound !== deRounds[0];
  // İlk eleme rakibi henüz belli değil (önceki tur sonuçları bekleniyor) — oyuncuya açıkça yazılır.
  const firstOppPending = nextDe != null && yourDE.length === 0 && !nextDe.opponentName;
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
      <div className="panel p-3">
        <div className="flex items-center gap-1.5">
          <Icon name="ranking" size={15} className="text-steel" />
          <span className="kicker">{t(locale, "idp.poolResultLead")}</span>
        </div>
        <p className="mt-1.5 text-[14px]">{t(locale, "idp.seedFrom", { n: tour.yourSeedRank })}</p>
        {hadBye && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[13px] text-prio">
            <Icon name="flag" size={15} className="mt-px shrink-0" />
            <span>{t(locale, "idp.byeInfo", { round: deRounds[0], first: firstDeRound ?? "" })}</span>
          </div>
        )}
        {firstOppPending && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[13px] text-steel">
            <Icon name="clock" size={15} className="mt-px shrink-0" />
            <span>{t(locale, "idp.oppPending", { round: firstDeRound ?? "" })}</span>
          </div>
        )}
      </div>
    ) : null;

  // #44: pul sonrası turnuva klasmanı (seed sırası) — kendi + diğer oyuncuların durumu (G-M · averaj).
  // Açılır-kapanır (varsayılan açık): pul bitince gösterilir, isteyen kapatır (kullanıcı kararı).
  const seedingTable =
    tour.seeding.length > 0 ? (
      <details open className="panel group">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
          <Icon name="ranking" size={18} className="text-steel" />
          <span className="flex-1 font-display text-[16px] font-semibold">{t(locale, "idp.seedingTitle")}</span>
          <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
        </summary>
        <ol className="mx-4 mb-4 max-h-80 divide-y divide-line overflow-y-auto rounded-md border border-line">
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
      </details>
    ) : null;

  const bracket = (
    <Bracket matches={tour.matches} deRounds={deRounds} locale={locale} currentLive={currentLive} podiumPlaying={podiumPlaying} />
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
      {histPool.map((m, i) => (
        <div key={matchKey(m)}>
          <div className="mb-1 kicker">{m.round} · {t(locale, "canli.matchN", { n: i + 1 })}</div>
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

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-bold leading-tight">{tour.name}</h1>
          <p className="text-[14px] text-steel">
            {tour.categoryId} · {tour.dateLabel}
          </p>
        </div>
        {liveNow && tour.live && <LiveStatusBadge serverNow={tour.live.serverNow} locale={locale} />}
      </div>

      {!tour.youParticipated && <p className="mt-3 panel p-3 text-[14px] text-steel">{t(locale, "idp.spectator")}</p>}

      {liveNow ? (
        /* ——— CANLI DÜZEN (#51): üstte PODYUM (olay anı: oynama↔hazırlık), ortada klasman/çatal, altta katlanır geçmiş ——— */
        <div className="mt-5 flex flex-col gap-6">
          {/* 1) PODYUM: o an oynanan maç + taktiği TEK blokta, sunucu-zamanına göre oynama/hazırlık (hep üstte) */}
          <LivePodium tournamentId={tour.tournamentId} live={tour.live!} podiumMatch={podium} locale={locale} />

          {/* 2) ELEME ÇATALI (üstte) → Pul sonucu/bay bilgisi (arada) → TURNUVA KLASMANI (altta); çatal+klasman açılır-kapanır */}
          {deRounds.length > 0 && tour.showBracket && bracket}
          {seedInfo}
          {seedingTable}

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
                    {yourPool.map((m, i) => (
                      <div key={matchKey(m)}>
                        <div className="mb-1 kicker">{m.round} · {t(locale, "canli.matchN", { n: i + 1 })}</div>
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
