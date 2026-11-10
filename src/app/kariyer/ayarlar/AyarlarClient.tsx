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
  warning2,
  danger,
}: {
  locale: Locale;
  label: string;
  warning: string;
  warning2: string;
  danger?: boolean;
}) {
  // ÇİFT onay (kullanıcı kararı 10.11): Denar bedeli kaldırıldı; yerine iki kez "emin misin?" sorulur.
  // step 0 = buton, 1 = ilk onay, 2 = son (kalıcı) onay → ancak 2. adımda gerçek silme formu çıkar.
  const [step, setStep] = useState<0 | 1 | 2>(0);

  if (step === 0) {
    return (
      <button
        type="button"
        onClick={() => setStep(1)}
        className={`btn-ghost press ${danger ? "border-sig-red/50 text-sig-red" : ""}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="panel border-sig-red/50 p-3">
      <p className="text-[15px]">{step === 1 ? warning : warning2}</p>
      <div className="mt-3 flex gap-2">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="press inline-flex min-h-11 items-center rounded-md bg-sig-red/90 px-4 text-[15px] font-semibold text-white"
          >
            {t(locale, "settings.deleteConfirm")}
          </button>
        ) : (
          <form action={resetCareerAction}>
            <button className="press inline-flex min-h-11 items-center rounded-md bg-sig-red px-4 text-[15px] font-semibold text-white">
              {t(locale, "settings.deleteConfirm2")}
            </button>
          </form>
        )}
        <button type="button" onClick={() => setStep(0)} className="btn-ghost press">
          {t(locale, "settings.cancel")}
        </button>
      </div>
    </div>
  );
}
