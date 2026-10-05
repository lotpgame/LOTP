"use client";

/**
 * Ayarlar → Görünüm: oyun düzeni (Klasik dikey / Yatay). Tema gibi localStorage'da saklanır (kişiye/cihaza
 * özel, sunucuya gitmez) ve <html data-view> ile ANINDA uygulanır — "vland:" varyantı bu işareti dinler.
 */
import { useEffect, useState } from "react";
import { VIEW_MODE_KEY } from "@/app/themeKeys";
import { Icon } from "@/app/ui/Icon";
import { t, type Locale } from "@/i18n";

type ViewMode = "portrait" | "landscape";

function applyView(mode: ViewMode): void {
  document.documentElement.setAttribute("data-view", mode);
}

export function ViewSettings({ locale }: { locale: Locale }) {
  // Mount sonrası oku (hydration güvenli); varsayılan "portrait" (klasik).
  const [mode, setMode] = useState<ViewMode | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(VIEW_MODE_KEY);
    } catch {
      // yoksay
    }
    setMode(saved === "landscape" ? "landscape" : "portrait");
  }, []);

  const choose = (next: ViewMode) => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, next);
    } catch {
      // yoksay
    }
    applyView(next);
    setMode(next);
  };

  if (mode == null) return null; // ilk render: tercih henüz okunmadı (yanıp sönme yok)

  const options: { key: ViewMode; icon: Parameters<typeof Icon>[0]["name"] }[] = [
    { key: "portrait", icon: "today" },
    { key: "landscape", icon: "tournament" },
  ];

  return (
    <div>
      <p className="text-[13px] text-steel">{t(locale, "settings.viewNote")}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t(locale, "settings.view")}>
        {options.map((o) => {
          const active = mode === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => choose(o.key)}
              aria-pressed={active}
              className={`press flex min-h-11 items-center gap-2 rounded-md border-2 px-4 text-[14px] font-medium ${
                active ? "border-ink text-ink" : "border-line text-steel"
              }`}
            >
              {active ? <Icon name="check" size={15} /> : <Icon name={o.icon} size={15} />}
              {t(locale, `settings.viewMode.${o.key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
