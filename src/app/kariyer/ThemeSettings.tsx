"use client";

/**
 * Ayarlar → Görünüm: kişiye özel arka fon + yazı rengi (localStorage). Hazır temalar uygulamanın kendi
 * varsayılanlarıyla eşleşir (Salon/Pist — bkz. globals.css); serbest renk seçiminde WCAG kontrast uyarısı.
 */
import { useEffect, useState } from "react";
import { THEME_BG_KEY, THEME_FG_KEY, THEME_ME_KEY, applyMe, applyTheme } from "@/app/ThemeApplier";
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
  const [me, setMe] = useState<string | null>(null); // "kendi rengin" (yoksa varsayılan sig-red)

  // Kayıtlı değer varsa onu, yoksa sayfaya zaten uygulanmış (no-flash script'in bıraktığı) sistem
  // varsayılanını oku — sabit bir renk tahmin etmiyoruz (mount sonrası → hydration güvenli).
  useEffect(() => {
    let sbg: string | null = null;
    let sfg: string | null = null;
    let sme: string | null = null;
    try {
      sbg = localStorage.getItem(THEME_BG_KEY);
      sfg = localStorage.getItem(THEME_FG_KEY);
      sme = localStorage.getItem(THEME_ME_KEY);
    } catch {
      // yoksay
    }
    const id = setTimeout(() => {
      const cs = getComputedStyle(document.documentElement);
      if (sbg && sfg) {
        setBg(sbg);
        setFg(sfg);
        setCustom(true);
      } else {
        setBg(cs.getPropertyValue("--background").trim() || "#f4f5f2");
        setFg(cs.getPropertyValue("--foreground").trim() || "#111418");
        setCustom(false);
      }
      // "Kendi rengin": kayıtlı varsa onu, yoksa varsayılan sig-red (hex; --me var() olduğu için --sig-red okunur).
      setMe(sme && /^#[0-9a-fA-F]{3,8}$/.test(sme) ? sme : cs.getPropertyValue("--sig-red").trim() || "#d91f26");
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

  const persistMe = (color: string) => {
    try {
      localStorage.setItem(THEME_ME_KEY, color);
    } catch {
      // yoksay
    }
    applyMe(color);
    setMe(color);
  };

  const resetMe = () => {
    try {
      localStorage.removeItem(THEME_ME_KEY);
    } catch {
      // yoksay
    }
    applyMe(null); // varsayılan sig-red'e dön
    const cs = getComputedStyle(document.documentElement);
    setMe(cs.getPropertyValue("--sig-red").trim() || "#d91f26");
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

      {/* Kendi rengin — klasman/turnuva/milli'de kendi adın + satır kenarı bu renkte (varsayılan kırmızı) */}
      <div className="mt-5 border-t border-line pt-4">
        <span className="kicker">{t(locale, "settings.meColor")}</span>
        <p className="mt-1 text-[13px] text-steel">{t(locale, "settings.meColorNote")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <input
            type="color"
            value={me ?? "#d91f26"}
            onChange={(e) => persistMe(e.target.value)}
            aria-label={t(locale, "settings.meColor")}
            className="h-11 w-16 cursor-pointer rounded-md border border-line bg-transparent"
          />
          {/* önizleme: kendi adın seçilen renkte, satır zemininde (kenar çizgisiyle) */}
          <span className="flex items-center gap-2 rounded-md bg-arena-2 px-3 py-2 text-[15px]">
            <span className="h-5 w-[3px] rounded-sm" style={{ background: me ?? undefined }} aria-hidden="true" />
            <span className="font-semibold" style={{ color: me ?? undefined }}>
              {t(locale, "settings.meColorPreviewName")}
            </span>
          </span>
          <button type="button" onClick={resetMe} className="btn-ghost press">
            {t(locale, "settings.themeReset")}
          </button>
        </div>
        {me != null && contrastRatio(me, bg) < MIN_CONTRAST && (
          <p role="status" className="mt-2 flex items-center gap-1.5 text-[13px] text-sig-red">
            <Icon name="info" size={15} className="shrink-0" />
            {t(locale, "settings.meColorContrast")}
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
