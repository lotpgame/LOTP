"use client";

/**
 * "Bildir" — geri bildirim / hata bildirme (test haftası). Artık yüzen buton değil: menüde bir satır
 * (telefonda "Daha fazla" alt sayfası, masaüstünde sidebar). Form, sayfanın üstünde açılan bir pencerede.
 * Pencere document.body'ye taşınır (portal) → "Daha fazla" sayfası kapansa da açık kalır.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { submitFeedbackAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";

export function FeedbackWidget({
  locale,
  className,
  onOpen,
  withChevron = false,
}: {
  locale: Locale;
  className: string;
  onOpen?: () => void;
  withChevron?: boolean;
}) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const open = () => {
    onOpen?.();
    setSent(false);
    setError(false);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const send = () => {
    if (!msg.trim()) return;
    start(async () => {
      const fd = new FormData();
      fd.set("message", msg);
      fd.set("page", pathname);
      fd.set("kind", "feedback");
      try {
        await submitFeedbackAction(fd);
        setSent(true);
        setMsg("");
      } catch {
        setError(true); // gönderilemediyse kullanıcı görsün (sessiz hata yok)
      }
    });
  };

  return (
    <>
      <button type="button" onClick={open} aria-haspopup="dialog" className={className}>
        <Icon name="feedback" size={withChevron ? 22 : 20} className="text-steel" />
        <span className="flex-1 text-left">{t(locale, "feedback.open")}</span>
        {withChevron && <Icon name="chevron-right" size={18} className="text-steel" />}
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={t(locale, "feedback.title")}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[19px] font-bold">{t(locale, "feedback.title")}</span>
                <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(locale, "common.close")}>
                  <Icon name="close" />
                </button>
              </div>
              {sent ? (
                <p className="flex items-center justify-center gap-2 py-4 text-[15px]">
                  <Icon name="check" className="anim-check text-sig-green" /> {t(locale, "feedback.thanks")}
                </p>
              ) : (
                <>
                  <textarea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder={t(locale, "feedback.placeholder")}
                    rows={4}
                    className="w-full resize-none rounded-md border border-line bg-arena-1 px-3 py-2 text-[15px] outline-none focus:border-ink"
                  />
                  {error && <p className="mt-2 text-[13px] text-sig-red">{t(locale, "feedback.error")}</p>}
                  <button type="button" onClick={send} disabled={pending || !msg.trim()} className="btn-ink press mt-3 w-full disabled:opacity-50">
                    {pending ? t(locale, "feedback.sending") : t(locale, "feedback.send")}
                  </button>
                </>
              )}
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
