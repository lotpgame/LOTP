"use client";

/**
 * Haftalık antrenman planı formu (KONTROLLÜ + onClick).
 * `<form action>` kullanılmıyor: React 19 server action sonrası formu otomatik resetleyip seçimi
 * eskiye döndürüyordu. Kaydet butonu server action'ı doğrudan çağırır; kontrollü state korunur.
 */
import { useState, useTransition } from "react";
import { setTrainingPlanAction } from "@/app/actions";
import { TRAINING_LABEL_TR, TRAINING_TYPES, type TrainingType } from "@/engine/training";

const TRAINING_DAYS = ["Pazartesi", "Çarşamba", "Cuma", "Pazar"];

export function TrainingPlanForm({ initial }: { initial: string[] }) {
  const [slots, setSlots] = useState<string[]>(() =>
    TRAINING_DAYS.map((_, i) => initial[i] ?? "REST"),
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
      {TRAINING_DAYS.map((day, i) => (
        <label key={day} className="block">
          <span className="mb-1 block text-xs opacity-60">{day}</span>
          <select
            value={slots[i]}
            onChange={(e) => {
              const v = e.target.value;
              setSaved(false);
              setSlots((prev) => prev.map((s, j) => (j === i ? v : s)));
            }}
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/20"
          >
            {TRAINING_TYPES.map((t: TrainingType) => (
              <option key={t} value={t}>
                {TRAINING_LABEL_TR[t]}
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
          {pending ? "Kaydediliyor…" : "Planı Kaydet"}
        </button>
        {saved && !pending && <span className="text-sm text-emerald-600">Kaydedildi ✓</span>}
      </div>
    </div>
  );
}
