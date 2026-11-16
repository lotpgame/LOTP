"use client";

/**
 * Turnuva kayıt onayı — tek tık açılan "resmi fiş" pop-up (kullanıcı kararı 16.11). Kaydol'a tıkla → pencere:
 * turnuva adı, ne verir (ödül), kayıt ücreti + yol/konaklama (kendi şehrinse yok) + toplam; taktik seçimi
 * (varsayılan hazır); "Onaylıyorum" / "Vazgeç". Zaten kayıtlıysa yalnız taktik güncelle / kaydı iptal.
 * Form server action'a gider (registerTournamentAction / unregisterTournamentAction); pencere portal ile body'de.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { registerTournamentAction, unregisterTournamentAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { TacticSegment } from "@/app/ui/TacticSegment";
import { DenarMark } from "../DenarMark";

export function RegisterDialog({
  locale,
  worldDay,
  level,
  label,
  rewardText,
  entryFee,
  travelCost,
  prizes,
  playerCity,
  defaultTactic,
  registered,
  isToday,
  triggerClassName,
}: {
  locale: Locale;
  worldDay: number;
  level: string;
  label: string;
  rewardText: string;
  entryFee: number;
  travelCost: number;
  prizes: number[]; // 1./2./3. derece Denar ödülü
  playerCity: string;
  defaultTactic: string;
  registered: boolean;
  isToday: boolean;
  triggerClassName: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  const close = () => dialog.current?.close();

  const total = entryFee + travelCost;
  const costRow = (labelNode: React.ReactNode, amount: number, strong = false) => (
    <div className={`flex items-center justify-between gap-3 text-[14px] ${strong ? "font-semibold" : ""}`}>
      <span className={strong ? "" : "text-steel"}>{labelNode}</span>
      <span className="flex items-center gap-1">
        <DenarMark size={14} /> <span className="num">{amount}</span>
      </span>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" className={triggerClassName}>
        {registered ? t(locale, "tour.changeTactic") : t(locale, "turnuvalar.register")}
        <Icon name="chevron-down" size={16} className="-rotate-90" />
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={t(locale, "tour.regTitle")}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="flex max-h-[86svh] flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[19px] font-bold">{t(locale, "tour.regTitle")}</span>
                <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(locale, "common.close")}>
                  <Icon name="close" />
                </button>
              </div>

              <div className="-mr-1 flex-1 overflow-y-auto pr-1">
                {/* Resmi fiş: turnuva + ödül */}
                <div className="rounded-lg border border-line bg-arena-1 p-3">
                  <div className="font-display text-[17px] font-bold leading-snug">{label}</div>
                  <div className="mt-0.5 text-[13px] text-steel">{rewardText}</div>
                </div>

                {/* Ödüller (derece) — ne kazanabilirsin. Eskrimde 3.lük maçı yok → iki yarı finalist de 3. (4. yok). */}
                {prizes.some((p) => p > 0) && (
                  <div className="mt-3 rounded-lg border border-line p-3">
                    <div className="kicker mb-2">{t(locale, "tour.prizes")}</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px]">
                      {prizes.map((amt, i) =>
                        amt > 0 ? (
                          <span key={i} className="flex items-center gap-1">
                            <span className="num text-steel">{i + 1}.</span> <DenarMark size={13} /> <span className="num font-semibold">{amt}</span>
                          </span>
                        ) : null,
                      )}
                    </div>
                    <p className="mt-1.5 text-[12px] text-steel">{t(locale, "tour.bronzeNote")}</p>
                  </div>
                )}

                {/* Masraf dökümü — yalnız YENİ kayıtta (zaten kayıtlıysa ödendi) */}
                {!registered && (
                  <div className="mt-3 flex flex-col gap-2 rounded-lg border border-line p-3">
                    {costRow(t(locale, "tour.entry"), entryFee)}
                    {travelCost > 0
                      ? costRow(t(locale, "tour.travelReason", { city: playerCity }), travelCost)
                      : costRow(<span className="text-sig-green">{t(locale, "tour.localNoTravel", { city: playerCity })}</span>, 0)}
                    <div className="border-t border-line pt-2">{costRow(t(locale, "tour.total"), total, true)}</div>
                  </div>
                )}

                {/* Taktik seçimi (varsayılan hazır) */}
                <form action={registerTournamentAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="worldDay" value={worldDay} />
                  <input type="hidden" name="level" value={level} />
                  <TacticSegment defaultValue={defaultTactic} locale={locale} />
                  {isToday && <p className="text-[13px] text-steel">{t(locale, "turnuvalar.todayTactic")}</p>}
                  <div className="mt-1 flex gap-2">
                    <button className="btn-ink press flex-1">
                      {registered ? t(locale, "turnuvalar.update") : t(locale, "tour.approve")}
                    </button>
                    {registered && !isToday ? (
                      <button formAction={unregisterTournamentAction} className="min-h-11 px-3 text-[14px] text-steel underline underline-offset-2">
                        {t(locale, "turnuvalar.cancel")}
                      </button>
                    ) : (
                      <button type="button" onClick={close} className="btn-ghost press">
                        {t(locale, "tour.decline")}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
