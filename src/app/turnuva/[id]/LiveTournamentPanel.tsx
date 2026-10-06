"use client";

/**
 * B Faz 3 — canlı turnuva paneli: sıradaki çözüm adımı + geri sayım, kendi sıradaki maçın ve taktik
 * penceresi. İstemci yalnız GÖSTERİR ve taktik YOLLAR; maçlar sunucuda çözülür (sayfa birkaç saniyede bir
 * tazelenir, geri sayım bitince hemen). Pencere kapalıyken form kilitli; manuel "geç/oyna" yok.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitLiveTacticAction } from "@/app/actions";
import { TACTICS, type Tactic } from "@/engine/combat";
import { t, type Locale } from "@/i18n";
import { Icon, type IconName } from "@/app/ui/Icon";
import type { TournamentLiveDTO } from "@/server/careerService";

const TACTIC_ICON: Record<Tactic, IconName> = { OFFENSIVE: "attack", BALANCED: "balanced", DEFENSIVE: "defence" };

function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function hhmmGMT(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleTimeString(locale === "tr" ? "tr-TR" : locale, {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiveTournamentPanel({
  tournamentId,
  live,
  locale,
}: {
  tournamentId: number;
  live: TournamentLiveDTO;
  locale: Locale;
}) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const skew = useRef(0); // sunucu saati − istemci saati (geri sayım sunucuya göre)
  useEffect(() => {
    skew.current = new Date(live.serverNow).getTime() - Date.now();
  }, [live.serverNow]);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now() + skew.current), 0);
    const id = setInterval(() => setNow(Date.now() + skew.current), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  // Geri sayım bitince bir kez tazele → sunucu adımı çözer, sonuç hemen görünür.
  const nextAtMs = live.nextAt ? new Date(live.nextAt).getTime() : null;
  const refreshedFor = useRef<string | null>(null);
  useEffect(() => {
    if (now == null || nextAtMs == null || now < nextAtMs || refreshedFor.current === live.nextAt) return;
    refreshedFor.current = live.nextAt;
    router.refresh();
  }, [now, nextAtMs, live.nextAt, router]);

  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const send = (tactic: Tactic) => {
    setMsg(null);
    startTransition(async () => {
      const res = await submitLiveTacticAction(tournamentId, tactic);
      setMsg(
        res.ok
          ? { ok: true, text: t(locale, "live.tactic.sent", { tactic: t(locale, `tactic.${res.tactic}`) }) }
          : { ok: false, text: t(locale, `live.tactic.err.${res.reason}`) },
      );
      router.refresh();
    });
  };

  const you = live.you;
  const closesAtMs = you?.windowClosesAt ? new Date(you.windowClosesAt).getTime() : null;
  const windowOpen = !!you?.windowOpen && (now == null || closesAtMs == null || now < closesAtMs);

  return (
    <section className="mt-5 panel border-ink p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="lamp lamp-red anim-live h-2.5 w-2.5" aria-hidden="true" />
          <h2 className="font-display text-[18px] font-bold">{t(locale, "live.title")}</h2>
        </div>
        {live.nextAt && <span className="num text-[13px] text-steel">{hhmmGMT(live.nextAt, locale)} GMT</span>}
      </div>

      {live.stepLabel && (
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="kicker">{t(locale, "live.next")}</div>
            <div className="mt-0.5 text-[15px] font-semibold">{live.stepLabel}</div>
          </div>
          <div className="num shrink-0 text-[28px] leading-none" aria-live="polite">
            {now == null || nextAtMs == null ? "—" : now >= nextAtMs ? t(locale, "live.resolving") : fmtLeft(nextAtMs - now)}
          </div>
        </div>
      )}
      <p className="mt-2 text-[13px] text-steel">{t(locale, "idp.live.note")}</p>

      {you && (
        <div className="mt-4 border-t border-line pt-3">
          {you.eliminated ? (
            <p className="text-[14px]">{t(locale, "live.you.eliminated")}</p>
          ) : you.nextMatch ? (
            <>
              <div className="kicker">{t(locale, "live.you.title")}</div>
              <div className="mt-0.5 text-[15px] font-semibold">
                {you.nextMatch.round} ·{" "}
                {you.nextMatch.opponentName
                  ? t(locale, "live.you.vs", { name: you.nextMatch.opponentName })
                  : t(locale, "live.you.tbd")}
              </div>
              {you.nextMatch.isNextStep ? (
                <div className="mt-3">
                  <div className="text-[13px] font-semibold">{t(locale, "live.tactic.title")}</div>
                  <div className="mt-1.5 flex w-full rounded-md border border-line p-0.5" role="group">
                    {TACTICS.map((tac) => {
                      const active = tac === you.effectiveTactic;
                      return (
                        <button
                          key={tac}
                          type="button"
                          onClick={() => send(tac)}
                          disabled={!windowOpen || pending}
                          aria-pressed={active}
                          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[5px] text-[14px] transition-colors disabled:opacity-50 ${
                            active ? "bg-ink font-semibold text-arena-0" : "text-steel"
                          }`}
                        >
                          <Icon name={TACTIC_ICON[tac]} size={17} />
                          {t(locale, `tactic.${tac}`)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[13px] text-steel">
                    {windowOpen
                      ? `${t(locale, "live.tactic.closesIn", {
                          time: now == null || closesAtMs == null ? "—" : fmtLeft(closesAtMs - now),
                        })} · ${t(locale, you.pendingSet ? "live.tactic.sent" : "live.tactic.fallback", {
                          tactic: t(locale, `tactic.${you.effectiveTactic}`),
                        })}`
                      : t(locale, "live.tactic.locked")}
                  </p>
                  {msg && (
                    <p className={`mt-1 text-[13px] ${msg.ok ? "text-ink" : "text-sig-red"}`} role="status">
                      {msg.text}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[13px] text-steel">{t(locale, "live.you.bye", { round: you.nextMatch.round })}</p>
              )}
            </>
          ) : (
            <p className="text-[14px] text-steel">
              {live.nextKind === "RESULTS" ? t(locale, "live.you.waitBracket") : t(locale, "live.you.none")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
