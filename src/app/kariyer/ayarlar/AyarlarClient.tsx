"use client";

/** Ayarlar sayfasının istemci parçaları: ses tercihi (localStorage) + onaylı kariyer sıfırlama. */
import { useState } from "react";
import { resetCareerAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";

const SOUND_KEY = "engarde_sound";

function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true; // SSR / localStorage yoksa varsayılan açık
  }
}

export function SoundToggle({ locale }: { locale: Locale }) {
  const [on, setOn] = useState<boolean>(readSound); // lazy init → effect'te setState yok
  const set = (v: boolean) => {
    setOn(v);
    try {
      localStorage.setItem(SOUND_KEY, v ? "on" : "off");
    } catch {
      /* yoksay */
    }
  };
  return (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          onClick={() => set(v)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            on === v
              ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "border-black/15 opacity-70 hover:opacity-100 dark:border-white/20"
          }`}
        >
          {v ? `🔊 ${t(locale, "settings.soundOn")}` : `🔇 ${t(locale, "settings.soundOff")}`}
        </button>
      ))}
    </div>
  );
}

export function CareerResetButton({
  locale,
  label,
  warning,
  danger,
}: {
  locale: Locale;
  label: string;
  warning: string;
  danger?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
          danger
            ? "border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
            : "border-black/15 hover:border-emerald-500 dark:border-white/20"
        }`}
      >
        {label}
      </button>
    );
  }
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
      <p className="text-sm">{warning}</p>
      <div className="mt-2 flex gap-2">
        <form action={resetCareerAction}>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
            {t(locale, "settings.deleteConfirm")}
          </button>
        </form>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm opacity-70 transition hover:opacity-100 dark:border-white/20"
        >
          {t(locale, "settings.cancel")}
        </button>
      </div>
    </div>
  );
}
