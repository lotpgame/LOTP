/**
 * Eleme çatalı (#55 yenileme, 11.10) — tur sütunları (yatay kaydırma), her maç temiz bir kart:
 * kazanan kalın + öne çıkar, kaybeden soluk; SENİN maçların --me ile vurgulu (yolunu turlar boyunca izlersin);
 * finalin kazananı kupa (şampiyon). Bay (bye) tabloyu ikili-ağaç yapmadığı için sıkı bağlantı çizgisi yerine
 * kart vurgusu tercih edildi (mobil-dostu, bay'a dayanıklı). Spoiler: podyumda O AN oynanan maç skorsuz "oynanıyor".
 */
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import type { TournamentResultDTO } from "@/server/careerService";

type MatchDTO = TournamentResultDTO["matches"][number];

export function Bracket({
  matches,
  deRounds,
  locale,
  currentLive,
  podiumPlaying,
}: {
  matches: MatchDTO[];
  deRounds: string[];
  locale: Locale;
  currentLive: MatchDTO | null;
  podiumPlaying: boolean;
}) {
  return (
    <details open className="panel group">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
        <Icon name="trophy" size={18} className="text-steel" />
        <span className="flex-1 font-display text-[16px] font-semibold">{t(locale, "canli.bracket")}</span>
        <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
      </summary>
      <div className="overflow-x-auto px-4 pb-4">
        <div className="flex min-w-max items-stretch gap-4">
          {deRounds.map((round, ri) => {
            const isFinal = ri === deRounds.length - 1;
            const roundMatches = matches.filter((m) => m.phase === "DE" && m.round === round);
            return (
              <div key={round} className="flex min-w-[164px] shrink-0 flex-col justify-around gap-3">
                <h3 className="text-center kicker">{round}</h3>
                {roundMatches.map((m, i) => (
                  <BracketMatch
                    key={i}
                    m={m}
                    mine={m.aIsHuman || m.bIsHuman}
                    isFinal={isFinal}
                    playing={podiumPlaying && m === currentLive}
                    locale={locale}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function BracketMatch({
  m,
  mine,
  isFinal,
  playing,
  locale,
}: {
  m: MatchDTO;
  mine: boolean;
  isFinal: boolean;
  playing: boolean;
  locale: Locale;
}) {
  // Henüz oynanmadı (eşleşme belli / değil) — kilitli.
  if (m.isPending) {
    return (
      <div className={`rounded-lg border border-dashed p-2.5 text-[12px] text-steel ${mine ? "border-me" : "border-line"}`}>
        {m.aName && m.bName ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{m.aName}</span>
              <Icon name="lock" size={12} className="shrink-0" />
            </div>
            <div className="mt-0.5 truncate">{m.bName}</div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <Icon name="lock" size={13} className="shrink-0" />
            {t(locale, "idp.pending")}
          </div>
        )}
      </div>
    );
  }
  // SPOILER önlemi: podyumda ŞU AN oynanan (çözülmüş ama animasyonu bitmemiş) maç skorsuz "oynanıyor".
  if (playing) {
    return (
      <div className={`rounded-lg border border-dashed p-2.5 text-[12px] text-steel ${mine ? "border-me" : "border-line"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">{m.aName}</span>
          <span className="lamp lamp-red anim-live h-2 w-2 shrink-0" aria-hidden="true" />
        </div>
        <div className="mt-0.5 truncate">{m.bName}</div>
      </div>
    );
  }
  const aWon = (m.scoreA ?? 0) >= (m.scoreB ?? 0);
  return (
    <div className={`overflow-hidden rounded-lg border bg-arena-1 text-[12px] ${mine ? "border-me" : "border-line"}`}>
      <Row name={m.aName} score={m.scoreA} won={aWon} human={m.aIsHuman} champ={isFinal && aWon} />
      <div className="h-px bg-line" />
      <Row name={m.bName} score={m.scoreB} won={!aWon} human={m.bIsHuman} champ={isFinal && !aWon} />
    </div>
  );
}

/** Maç kartında bir oyuncu satırı: kazanan kalın/net, kaybeden soluk; sen --me; şampiyon kupa. */
function Row({
  name,
  score,
  won,
  human,
  champ,
}: {
  name: string | null;
  score: number | null;
  won: boolean;
  human: boolean;
  champ: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5">
      {human && <span className="h-3.5 w-[3px] shrink-0 rounded-full bg-me" aria-hidden="true" />}
      <span className={`min-w-0 flex-1 truncate ${won ? "font-semibold" : "text-steel"} ${human ? "text-me" : ""}`}>{name}</span>
      {champ && <Icon name="trophy" size={13} className="shrink-0 text-prio" />}
      <span className={`num shrink-0 ${won ? "text-ink" : "text-steel"}`}>{score}</span>
    </div>
  );
}
