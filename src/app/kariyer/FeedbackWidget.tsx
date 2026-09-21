"use client";

/** Yüzen "Geri bildirim / hata bildir" butonu (test haftası). Her kariyer sayfasında görünür. */
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { submitFeedbackAction } from "@/app/actions";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const send = () => {
    if (!msg.trim()) return;
    start(async () => {
      const fd = new FormData();
      fd.set("message", msg);
      fd.set("page", pathname);
      fd.set("kind", "feedback");
      await submitFeedbackAction(fd);
      setSent(true);
      setMsg("");
    });
  };

  return (
    <div className="fixed bottom-20 right-3 z-40 sm:bottom-24 sm:right-5">
      {open ? (
        <div className="w-72 rounded-xl border border-black/15 bg-white p-3 shadow-xl dark:border-white/20 dark:bg-neutral-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">💬 Geri bildirim</span>
            <button onClick={() => { setOpen(false); setSent(false); }} className="text-xs opacity-50 hover:opacity-100">✕</button>
          </div>
          {sent ? (
            <p className="py-3 text-center text-sm text-emerald-600 dark:text-emerald-400">Teşekkürler! 🙏 Aldık.</p>
          ) : (
            <>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Bir hata, gariplik veya fikir? Yaz…"
                rows={3}
                className="w-full resize-none rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-white/20"
              />
              <button
                onClick={send}
                disabled={pending || !msg.trim()}
                className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {pending ? "Gönderiliyor…" : "Gönder"}
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          title="Geri bildirim / hata bildir"
          className="flex h-11 items-center gap-1.5 rounded-full border border-black/15 bg-white px-4 text-sm font-medium shadow-lg transition hover:border-emerald-500 dark:border-white/20 dark:bg-neutral-900"
        >
          💬 Bildir
        </button>
      )}
    </div>
  );
}
