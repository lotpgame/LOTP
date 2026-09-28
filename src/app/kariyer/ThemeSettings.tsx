"use client";

/**
 * Ayarlar → Görünüm: kişiye özel arka fon + yazı rengi (localStorage). Hazır temalar uygulamanın kendi
 * varsayılanlarıyla eşleşir (Salon/Pist — bkz. globals.css); serbest renk seçiminde WCAG kontrast uyarısı.
 */
import { useEffect, useState } from "react";
import { THEME_BG_KEY, THEME_FG_KEY, applyTheme } from "@/app/ThemeApplier";
import { contrastRatio, MIN_CONTRAST } from "@/app/ui/contrast";
import { Icon } from "@/app/ui/Icon";
import { t, type Locale } from "@/i18n";

interface Preset {
  key: string;
  bg: string;
  fg: string;
}

// Uygulamanın kendi varsayılanlarıyla aynı (globals.css :root / prefers-color-scheme: dark).
const PRESETS: Preset[] = [
  { key: "salon", bg: "#f4f5f2", fg: "#111418" },
  { key: "pist", bg: "#0b0e12", fg: "#e8ecf0" },
  { key: "gece", bg: "#0b1220", fg: "#e6eefb" },
  { key: "yesil", bg: "#07130d", fg: "#d7f5e6" },
];

const sameHex = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function ThemeSettings({ locale }: { locale: Locale }) {
  const [bg, setBg] = useState<string | null>(null);
  const [fg, setFg] = useState<string | null>(null);
  const [custom, setCustom] = useState(false);

  // Kayıtlı değer varsa onu, yoksa sayfaya zaten uygulanmış (no-flash script'in bıraktığı) sistem
  // varsayılanını oku — sabit bir renk tahmin etmiyoruz (mount sonrası → hydration güvenli).
  useEffect(() => {
    let sbg: string | null = null;
    let sfg: string | null = null;
    try {
      sbg = localStorage.getItem(THEME_BG_KEY);
      sfg = localStorage.getItem(THEME_FG_KEY);
    } catch {
      // yoksay
    }
    const id = setTimeout(() => {
      if (sbg && sfg) {
        setBg(sbg);
        setFg(sfg);
        setCustom(true);
      } else {
        const cs = getComputedStyle(document.documentElement);
        setBg(cs.getPropertyValue("--background").trim() || "#f4f5f2");
        setFg(cs.getPropertyValue("--foreground").trim() || "#111418");
        setCustom(false);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const persist = (nbg: string, nfg: string) => {
    try {
      localStorage.setItem(THEME_BG_KEY, nbg);
      localStorage.setItem(THEME_FG_KEY, nfg);
    } catch {
      // yoksay
    }
    applyTheme(nbg, nfg);
    setBg(nbg);
    setFg(nfg);
    setCustom(true);
  };

  const reset = () => {
    try {
      localStorage.removeItem(THEME_BG_KEY);
      localStorage.removeItem(THEME_FG_KEY);
    } catch {
      // yoksay
    }
    applyTheme(null, null); // sistem varsayılanına dön (açık/koyu otomatik)
    const cs = getComputedStyle(document.documentElement);
    setBg(cs.getPropertyValue("--background").trim() || "#f4f5f2");
    setFg(cs.getPropertyValue("--foreground").trim() || "#111418");
    setCustom(false);
  };

  if (bg == null || fg == null) return null; // ilk render: sistem rengi henüz okunmadı (yanıp sönme yok)

  const lowContrast = contrastRatio(bg, fg) < MIN_CONTRAST;

  return (
    <div>
      <p className="text-[13px] text-steel">{t(locale, "settings.themeNote")}</p>

      {/* Hazır temalar */}
      <div className="mt-3">
        <span className="kicker">{t(locale, "settings.themePresets")}</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = sameHex(bg, p.bg) && sameHex(fg, p.fg);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => persist(p.bg, p.fg)}
                aria-pressed={active}
                className={`press flex min-h-11 items-center gap-1.5 rounded-md border-2 px-3.5 text-[14px] font-medium ${
                  active ? "border-ink" : "border-line"
                }`}
                style={{ background: p.bg, color: p.fg }}
              >
                {active && <Icon name="check" size={15} />}
                {t(locale, `settings.themePreset.${p.key}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Serbest renk */}
      <div className="mt-4">
        <span className="kicker">{t(locale, "settings.themeCustom")}</span>
        <div className="mt-1.5 flex flex-wrap items-end gap-4">
          <label className="text-[13px] text-steel">
            <span className="mb-1 block">{t(locale, "settings.themeBg")}</span>
            <input
              type="color"
              value={bg}
              onChange={(e) => persist(e.target.value, fg)}
              className="h-11 w-16 cursor-pointer rounded-md border border-line bg-transparent"
            />
          </label>
          <label className="text-[13px] text-steel">
            <span className="mb-1 block">{t(locale, "settings.themeFg")}</span>
            <input
              type="color"
              value={fg}
              onChange={(e) => persist(bg, e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-md border border-line bg-transparent"
            />
          </label>
          <button type="button" onClick={reset} className="btn-ghost press">
            {t(locale, "settings.themeReset")}
          </button>
        </div>
        {lowContrast && (
          <p role="status" className="mt-2 flex items-center gap-1.5 text-[13px] text-sig-red">
            <Icon name="info" size={15} className="shrink-0" />
            {t(locale, "settings.themeContrastWarning")}
          </p>
        )}
      </div>

      {/* Canlı önizleme */}
      <div className="mt-4 rounded-xl border border-line p-3" style={{ background: bg, color: fg }}>
        <div className="text-[15px] font-semibold">{t(locale, "settings.themePreviewTitle")}</div>
        <div className="text-[13px] opacity-80">
          {custom ? t(locale, "settings.themePreviewCustom") : t(locale, "settings.themePreviewDefault")}
        </div>
      </div>
    </div>
  );
}
