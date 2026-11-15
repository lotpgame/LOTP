"use client";

/**
 * Görünüm — tek tık açılan pop-up (kullanıcı kararı 15.11, Geri Bildirim gibi). Satıra tıkla → ortada pencere,
 * içinde ThemeSettings (arka fon + yazı rengi). Pencere document.body'ye taşınır (portal).
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { ThemeSettings } from "../ThemeSettings";

export function GorunumModal({ locale, rowClassName }: { locale: Locale; rowClassName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" className={rowClassName}>
        <span className="flex-1 text-left">{t(locale, "settings.appearance")}</span>
        <Icon name="chevron-right" size={18} className="shrink-0 text-steel" />
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={t(locale, "settings.appearance")}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="flex max-h-[82svh] flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[19px] font-bold">{t(locale, "settings.appearance")}</span>
                <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(locale, "common.close")}>
                  <Icon name="close" />
                </button>
              </div>
              <div className="-mr-1 flex-1 overflow-y-auto pr-1">
                <ThemeSettings locale={locale} />
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
