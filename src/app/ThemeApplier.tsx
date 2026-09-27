"use client";

/**
 * Kişiye özel tema uygulayıcı: kullanıcının seçtiği arka fon/yazı rengini (localStorage) her sayfada
 * <html>'e uygular. localStorage yalnız o tarayıcıda; okunamazsa sessizce varsayılan (sistem) teması kalır.
 */
import { useEffect } from "react";

import { THEME_BG_KEY, THEME_FG_KEY } from "./themeKeys";

export { THEME_BG_KEY, THEME_FG_KEY };

/** Kayıtlı tema renklerini <html> stiline yazar (yoksa temizler → sistem varsayılanı). */
export function applyTheme(bg: string | null, fg: string | null): void {
  const el = document.documentElement;
  if (bg) el.style.setProperty("--background", bg);
  else el.style.removeProperty("--background");
  if (fg) el.style.setProperty("--foreground", fg);
  else el.style.removeProperty("--foreground");
}

export function ThemeApplier() {
  useEffect(() => {
    try {
      applyTheme(localStorage.getItem(THEME_BG_KEY), localStorage.getItem(THEME_FG_KEY));
    } catch {
      // özel pencere / erişim engeli → varsayılan tema
    }
  }, []);
  return null;
}
