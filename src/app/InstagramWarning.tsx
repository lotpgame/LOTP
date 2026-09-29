"use client";

/**
 * Instagram uygulama içi tarayıcı uyarısı (P1) — orada kalıcı oturum güvenilir çalışmayabilir.
 * Gösterilme kararı sunucuda verilir (User-Agent, layout.tsx) → `show` zaten kesin, ilk boyamada
 * doğrudan gösterilir. Yalnız "daha önce kapatıldı mı" bilgisi istemci-only (localStorage) — bunun
 * için sabit `false` varsayılır (göster), gerekirse mount sonrası `true`'ya düşer (nadir, kısa an).
 */
import { useEffect, useState } from "react";
import { t, type Locale } from "@/i18n";
import { Icon } from "./ui/Icon";

const DISMISS_KEY = "lotp.igWarningDismissed";

export function InstagramWarning({ show, locale }: { show: boolean; locale: Locale }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!show) return;
    let wasDismissed = false;
    try {
      wasDismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // yoksay
    }
    if (!wasDismissed) return;
    const id = setTimeout(() => setDismissed(true), 0);
    return () => clearTimeout(id);
  }, [show]);

  if (!show || dismissed) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // yoksay
    }
    setDismissed(true);
  };

  return (
    <div role="status" className="flex items-center gap-2 border-b border-line bg-arena-1 px-4 py-2 text-[13px] sm:px-6">
      <Icon name="info" size={16} className="shrink-0 text-steel" />
      <span className="min-w-0 flex-1">{t(locale, "browser.instagramWarning")}</span>
      <button
        type="button"
        onClick={close}
        aria-label={t(locale, "common.close")}
        className="flex h-8 w-8 shrink-0 items-center justify-center text-steel"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
