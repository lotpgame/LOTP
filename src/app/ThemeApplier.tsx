"use client";

/**
 * Kişiye özel tema uygulayıcı: kullanıcının seçtiği arka fon/yazı rengini (localStorage) her sayfada
 * <html>'e uygular. localStorage yalnız o tarayıcıda; okunamazsa sessizce varsayılan (sistem) teması kalır.
 */
import { useEffect } from "react";

import { THEME_BG_KEY, THEME_FG_KEY, THEME_ME_KEY } from "./themeKeys";

export { THEME_BG_KEY, THEME_FG_KEY, THEME_ME_KEY };

/** Kayıtlı tema renklerini <html> stiline yazar (yoksa temizler → sistem varsayılanı). */
export function applyTheme(bg: string | null, fg: string | null): void {
  const el = document.documentElement;
  if (bg) el.style.setProperty("--background", bg);
  else el.style.removeProperty("--background");
  if (fg) el.style.setProperty("--foreground", fg);
  else el.style.removeProperty("--foreground");
}

/** "Kendi rengin"i <html> stiline yazar (yoksa temizler → varsayılan sig-red). */
export function applyMe(me: string | null): void {
  const el = document.documentElement;
  if (me) el.style.setProperty("--me", me);
  else el.style.removeProperty("--me");
}

export function ThemeApplier() {
  useEffect(() => {
    try {
      applyTheme(localStorage.getItem(THEME_BG_KEY), localStorage.getItem(THEME_FG_KEY));
      applyMe(localStorage.getItem(THEME_ME_KEY));
    } catch {
      // özel pencere / erişim engeli → varsayılan tema
    }
  }, []);
  return null;
}
