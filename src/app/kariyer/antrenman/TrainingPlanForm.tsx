"use client";

/**
 * 7 günlük antrenman planı formu (Pzt..Paz; KONTROLLÜ + onClick).
 * `<form action>` kullanılmıyor: React 19 server action sonrası formu resetleyip seçimi
 * eskiye döndürüyordu. Kaydet butonu server action'ı doğrudan çağırır; kontrollü state korunur.
 * Turnuva günlerinde (Sal/Prş/Cmt) seçilen seans yalnız o turnuvaya KATILMAZSAN uygulanır.
 */
import { useState, useTransition } from "react";
import { setTrainingPlanAction } from "@/app/actions";
import { TRAINING_TYPES, type TrainingType } from "@/engine/training";
import { t, type Locale } from "@/i18n";

const TOURNAMENT_DAYS = new Set([1, 3, 5]); // Salı / Perşembe / Cumartesi

export function TrainingPlanForm({ initial, locale }: { initial: string[]; locale: Locale }) {
  const [slots, setSlots] = useState<string[]>(() =>
    Array.from({ length: 7 }, (_, i) => (TRAINING_TYPES.includes(initial[i] as TrainingType) ? initial[i] : "REST")),
  );
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      const fd = new FormData();
      slots.forEach((v, i) => fd.append(`slot${i}`, v));
      await setTrainingPlanAction(fd);
      setSaved(true);
    });
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs opacity-60">{t(locale, "plan.everyDayNote")}</p>
      {slots.map((val, i) => (
        <label key={i} className="block">
          <span className="mb-1 block text-xs opacity-60">
            {t(locale, `day.${i}`)}
            {TOURNAMENT_DAYS.has(i) && <span className="ml-1 text-sky-600 dark:text-sky-400">· {t(locale, "plan.tournamentDay")}</span>}
          </span>
          <select
            value={val}
            onChange={(e) => {
              const v = e.target.value;
              setSaved(false);
              setSlots((prev) => prev.map((s, j) => (j === i ? v : s)));
            }}
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/20"
          >
            {TRAINING_TYPES.map((tt: TrainingType) => (
              <option key={tt} value={tt}>
                {t(locale, `training.${tt}`)}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg border border-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-50"
        >
          {pending ? t(locale, "plan.saving") : t(locale, "plan.save")}
        </button>
        {saved && !pending && <span className="text-sm text-emerald-600">{t(locale, "plan.saved")}</span>}
      </div>
    </div>
  );
}
