"use client";

/**
 * Dil seçimi — tek tık açılan pop-up (kullanıcı kararı 15.11, Geri Bildirim gibi). Satıra tıkla → ortada pencere,
 * listeden dili seç → cookie'ye yaz + sayfayı tazele. Pencere document.body'ye taşınır (portal).
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { setLocaleAction } from "@/app/actions";
import { LOCALE_LABEL, LOCALES, t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";

export function LangModal({ current, rowClassName }: { current: Locale; rowClassName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const close = () => dialog.current?.close();
  const pick = (l: Locale) => {
    const fd = new FormData();
    fd.set("locale", l);
    start(async () => {
      await setLocaleAction(fd);
      close();
      router.refresh();
    });
  };

  // Diller görünen ada göre alfabetik (kullanıcı 09.11).
  const langs = [...LOCALES].sort((a, b) => LOCALE_LABEL[a].localeCompare(LOCALE_LABEL[b]));

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" className={rowClassName}>
        <span className="flex-1 text-left">{t(current, "settings.language")}</span>
        <span className="text-[14px] text-steel">{LOCALE_LABEL[current]}</span>
        <Icon name="chevron-right" size={18} className="shrink-0 text-steel" />
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={t(current, "settings.language")}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[19px] font-bold">{t(current, "settings.language")}</span>
                <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(current, "common.close")}>
                  <Icon name="close" />
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {langs.map((l) => {
                  const on = l === current;
                  return (
                    <li key={l}>
                      <button
                        type="button"
                        onClick={() => pick(l)}
                        disabled={pending}
                        aria-pressed={on}
                        className={`press flex min-h-11 w-full items-center gap-2 rounded-md border px-3 text-[15px] disabled:opacity-50 ${
                          on ? "border-ink bg-arena-1 font-semibold" : "border-line"
                        }`}
                      >
                        <span className="flex-1 text-left">{LOCALE_LABEL[l]}</span>
                        {on && <Icon name="check" size={18} className="text-sig-green" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
