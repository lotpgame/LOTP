"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/app/ui/Icon";

/**
 * Turnuva sekme rayı — panelin ÜSTÜNDE (önce nerede olduğunu gör). Sekmeler turnuva ilerledikçe açılır;
 * kilitli sekme kilit ikonuyla gösterilir, tıklanınca kısa uyarı (spoiler yok). `key={stage}` ile aşama
 * değişince aktif sekme otomatik canlı bölüme atlar; aynı aşamada kullanıcı serbest gezinebilir.
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
  const navRef = useRef<HTMLElement>(null);

  // Telefonda ray yatay kayar: aktif sekme (örn. sondaki "Sonuç") ekran dışında kalmasın.
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

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
    <div className="mt-4">
      <nav ref={navRef} className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist">
        {tabs.map((tb) => {
          const on = tb.id === active && !tb.locked;
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-disabled={tb.locked || undefined}
              onClick={() => onTab(tb.id, tb.locked)}
              className={`relative flex min-h-11 shrink-0 items-center gap-1.5 px-3 text-[14px] ${
                tb.locked ? "cursor-not-allowed text-steel" : on ? "font-semibold text-ink" : "text-steel"
              }`}
            >
              {tb.locked && <Icon name="lock" size={14} />}
              {tb.label}
              {on && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-sig-red" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      {toast && (
        <div role="status" className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-arena-2 px-3 py-2 text-[13px] text-steel">
          <Icon name="lock" size={14} /> {toast}
        </div>
      )}

      <div className="mt-4">{panels[active]}</div>
    </div>
  );
}
