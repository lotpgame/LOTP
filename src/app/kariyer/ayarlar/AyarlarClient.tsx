"use client";

/** Ayarlar sayfasının istemci parçaları: ses tercihi (localStorage) + onaylı kariyer sıfırlama. */
import { useState } from "react";
import { resetCareerAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";
import { DenarMark } from "../DenarMark";

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
    <div className="flex max-w-xs rounded-md border border-line p-0.5" role="group" aria-label={t(locale, "settings.sound")}>
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => set(v)}
          aria-pressed={on === v}
          className={`press flex min-h-11 flex-1 items-center justify-center rounded-[5px] text-[15px] ${
            on === v ? "bg-ink font-semibold text-arena-0" : "text-steel"
          }`}
        >
          {v ? t(locale, "settings.soundOn") : t(locale, "settings.soundOff")}
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
  cost = 0,
  canAfford = true,
}: {
  locale: Locale;
  label: string;
  warning: string;
  danger?: boolean;
  cost?: number;
  canAfford?: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className={`btn-ghost press ${danger ? "border-sig-red/50 text-sig-red" : ""}`}
      >
        {label}
      </button>
    );
  }
  return (
    <div className="panel border-sig-red/50 p-3">
      <p className="text-[15px]">{warning}</p>
      {cost > 0 && (
        <p className="mt-1 flex items-center gap-1 text-[13px] text-steel">
          {t(locale, "settings.resetFee")} <DenarMark size={13} /> <span className="num">{cost}</span>
        </p>
      )}
      {canAfford ? (
        <div className="mt-3 flex gap-2">
          <form action={resetCareerAction}>
            <button className="press inline-flex min-h-11 items-center rounded-md bg-sig-red px-4 text-[15px] font-semibold text-white">
              {t(locale, "settings.deleteConfirm")}
            </button>
          </form>
          <button type="button" onClick={() => setConfirm(false)} className="btn-ghost press">
            {t(locale, "settings.cancel")}
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <p className="flex flex-wrap items-center gap-1 text-[14px] font-medium text-sig-red">
            {t(locale, "settings.notEnough")} <DenarMark size={13} /> <span className="num">{cost}</span>. {t(locale, "settings.earnMore")}
          </p>
          <button type="button" onClick={() => setConfirm(false)} className="btn-ghost press mt-3">
            {t(locale, "settings.cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
