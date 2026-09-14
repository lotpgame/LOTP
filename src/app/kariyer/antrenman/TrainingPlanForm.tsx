"use client";

/**
 * Haftalık antrenman planı formu (KONTROLLÜ + onClick).
 * `<form action>` kullanılmıyor: React 19 server action sonrası formu otomatik resetleyip seçimi
 * eskiye döndürüyordu. Kaydet butonu server action'ı doğrudan çağırır; kontrollü state korunur.
 */
import { useState, useTransition } from "react";
import { setTrainingPlanAction } from "@/app/actions";
import { TRAINING_TYPES, type TrainingType } from "@/engine/training";
import { t, type Locale } from "@/i18n";

// Antrenman günleri: Pzt/Çrş/Cuma/Pazar → gün indeksleri 0,2,4,6.
const TRAINING_DAY_KEYS = ["day.0", "day.2", "day.4", "day.6"];

export function TrainingPlanForm({ initial, locale }: { initial: string[]; locale: Locale }) {
  const [slots, setSlots] = useState<string[]>(() =>
    TRAINING_DAY_KEYS.map((_, i) => initial[i] ?? "REST"),
  );
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      const fd = new FormData();
      slots.forEach((v, i) => fd.append(`slot${i + 1}`, v));
      await setTrainingPlanAction(fd);
      setSaved(true);
    });
  };

  return (
    <div className="mt-3 space-y-3">
      {TRAINING_DAY_KEYS.map((dayKey, i) => (
        <label key={dayKey} className="block">
          <span className="mb-1 block text-xs opacity-60">{t(locale, dayKey)}</span>
          <select
            value={slots[i]}
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
