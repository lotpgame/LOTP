"use client";

/** Ayarlar → Görünüm: kişiye özel arka fon + yazı rengi (localStorage). Preset + serbest renk + sıfırla. */
import { useEffect, useState } from "react";
import { THEME_BG_KEY, THEME_FG_KEY, applyTheme } from "@/app/ThemeApplier";

interface Preset {
  name: string;
  bg: string;
  fg: string;
}
const PRESETS: Preset[] = [
  { name: "Koyu", bg: "#0a0a0a", fg: "#ededed" },
  { name: "Açık", bg: "#ffffff", fg: "#171717" },
  { name: "Gece Mavisi", bg: "#0b1220", fg: "#e6eefb" },
  { name: "Sepya", bg: "#f5efe0", fg: "#3a2f22" },
  { name: "Eskrim Yeşili", bg: "#07130d", fg: "#d7f5e6" },
];

const DEFAULT_BG = "#0a0a0a";
const DEFAULT_FG = "#ededed";

export function ThemeSettings() {
  const [bg, setBg] = useState<string>(DEFAULT_BG);
  const [fg, setFg] = useState<string>(DEFAULT_FG);
  const [custom, setCustom] = useState(false);

  // Kayıtlı değerleri yükle (setState mount sonrası → hydration/cascade güvenli).
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
      if (sbg) setBg(sbg);
      if (sfg) setFg(sfg);
      if (sbg || sfg) setCustom(true);
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
    setBg(DEFAULT_BG);
    setFg(DEFAULT_FG);
    setCustom(false);
  };

  return (
    <div>
      <p className="text-sm opacity-70">Arka fon ve yazı rengini kendine göre ayarla. Yalnız bu cihazda saklanır.</p>

      {/* Hazır temalar */}
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => persist(p.bg, p.fg)}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium transition hover:border-emerald-500 dark:border-white/20"
            style={{ background: p.bg, color: p.fg }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Serbest renk */}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-xs">
          <span className="mb-1 block opacity-70">Arka fon</span>
          <input type="color" value={bg} onChange={(e) => persist(e.target.value, fg)} className="h-9 w-16 cursor-pointer rounded border border-black/15 bg-transparent dark:border-white/20" />
        </label>
        <label className="text-xs">
          <span className="mb-1 block opacity-70">Yazı</span>
          <input type="color" value={fg} onChange={(e) => persist(bg, e.target.value)} className="h-9 w-16 cursor-pointer rounded border border-black/15 bg-transparent dark:border-white/20" />
        </label>
        <button
          onClick={reset}
          className="rounded-lg border border-black/15 px-3 py-2 text-sm opacity-70 transition hover:opacity-100 dark:border-white/20"
        >
          Sistem varsayılanı
        </button>
      </div>

      {/* Canlı önizleme */}
      <div className="mt-4 rounded-lg border border-black/15 p-3 dark:border-white/20" style={{ background: bg, color: fg }}>
        <div className="text-sm font-semibold">Önizleme</div>
        <div className="text-xs opacity-80">Örnek metin — {custom ? "kişisel tema aktif" : "sistem varsayılanı"}.</div>
      </div>
    </div>
  );
}
