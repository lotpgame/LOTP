"use client";

/**
 * Haftalık antrenman planı formu (KONTROLLÜ). Server action sonrası kontrolsüz <select>'ler
 * defaultValue'ya sıfırlandığı için seçim "geri dönüyordu"; kontrollü state ile seçim korunur.
 */
import { useActionState, useState } from "react";
import { setTrainingPlanAction } from "@/app/actions";
import { TRAINING_LABEL_TR, TRAINING_TYPES, type TrainingType } from "@/engine/training";

const TRAINING_DAYS = ["Pazartesi", "Çarşamba", "Cuma", "Pazar"];

// useActionState imzası: (prevState, formData) => newState. Kaydedip "kaydedildi" işareti döner.
async function saveAction(_prev: boolean, formData: FormData): Promise<boolean> {
  await setTrainingPlanAction(formData);
  return true;
}

export function TrainingPlanForm({ initial }: { initial: string[] }) {
  const [slots, setSlots] = useState<string[]>(() =>
    TRAINING_DAYS.map((_, i) => initial[i] ?? "REST"),
  );
  const [saved, formAction, pending] = useActionState(saveAction, false);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      {TRAINING_DAYS.map((day, i) => (
        <label key={day} className="block">
          <span className="mb-1 block text-xs opacity-60">{day}</span>
          <select
            name={`slot${i + 1}`}
            value={slots[i]}
            onChange={(e) => setSlots((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
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
          disabled={pending}
          className="rounded-lg border border-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : "Planı Kaydet"}
        </button>
        {saved && !pending && <span className="text-sm text-emerald-600">Kaydedildi ✓</span>}
      </div>
    </form>
  );
}
