"use client";

/**
 * Denar rozeti (alt menü, Ayarlar'ın yanı) — saat rozeti gibi hep görünür; tıklayınca "Denar kazan / satın al"
 * menüsü (DenarPanel) bir pencerede açılır (kullanıcı kararı 06.11). Pencere document.body'ye taşınır (portal).
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DENAR_PACKAGES } from "@/engine/ads";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { DenarMark } from "./DenarMark";
import { DenarPanel } from "./ekipman/DenarPanel";

export function DenarBadge({
  locale,
  balance,
  adsLeft,
  adDailyCap,
  adReward,
  className,
}: {
  locale: Locale;
  balance: number;
  adsLeft: number;
  adDailyCap: number;
  adReward: number;
  className: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" className={className}>
        <DenarMark size={16} className="shrink-0" />
        <span className="num">{balance.toFixed(0)}</span>
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={t(locale, "denar.title")}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="pb-1">
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="flex items-center gap-1.5 font-display text-[19px] font-bold">
                  <DenarMark size={18} /> {t(locale, "denar.title")}
                </span>
                <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(locale, "common.close")}>
                  <Icon name="close" />
                </button>
              </div>
              <DenarPanel
                adsLeft={adsLeft}
                adDailyCap={adDailyCap}
                adReward={adReward}
                packages={DENAR_PACKAGES}
                labels={{
                  earnTitle: t(locale, "denar.earnTitle"),
                  watch: t(locale, "denar.watch"),
                  left: t(locale, "denar.left"),
                  playing: t(locale, "denar.playing"),
                  earned: t(locale, "denar.earned"),
                  capReached: t(locale, "denar.capReached"),
                  buyTitle: t(locale, "denar.buyTitle"),
                  best: t(locale, "denar.best"),
                  soon: t(locale, "denar.soon"),
                  soonNote: t(locale, "denar.soonNote"),
                }}
              />
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
