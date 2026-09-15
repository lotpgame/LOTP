"use client";

import { useRef, useState, type ReactNode } from "react";

/**
 * Turnuva alt sekme çubuğu — yalnız yazı (ikon yok). Sekmeler turnuva ilerledikçe açılır;
 * kilitli sekmeye tıklanınca kısa uyarı. `key={stage}` ile aşama değişince aktif sekme
 * otomatik canlı bölüme atlar; aynı aşamada kullanıcı serbest gezinebilir.
 */
export function TournamentTabs({
  tabs,
  defaultTab,
  panels,
  lockedMsg,
}: {
  tabs: { id: string; label: string; locked: boolean }[];
  defaultTab: string;
  panels: Record<string, ReactNode>;
  lockedMsg: string;
}) {
  const [active, setActive] = useState(defaultTab);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onTab(id: string, locked: boolean) {
    if (locked) {
      setToast(lockedMsg);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 1800);
      return;
    }
    setToast(null);
    setActive(id);
  }

  return (
    <div>
      <div className="mt-6">{panels[active]}</div>

      {toast && (
        <div className="mt-3 rounded-lg bg-amber-500/15 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-300">{toast}</div>
      )}

      <nav className="mt-4 grid grid-cols-5 gap-1 border-t border-black/10 pt-2 dark:border-white/15">
        {tabs.map((tb) => {
          const on = tb.id === active && !tb.locked;
          return (
            <button
              key={tb.id}
              onClick={() => onTab(tb.id, tb.locked)}
              aria-current={on ? "page" : undefined}
              className={`rounded-lg px-1 py-2 text-center text-xs leading-tight transition ${
                tb.locked
                  ? "cursor-not-allowed opacity-40"
                  : on
                    ? "bg-emerald-500/15 font-medium text-emerald-700 dark:text-emerald-300"
                    : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {tb.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
