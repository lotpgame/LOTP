"use client";

/**
 * 7 günlük antrenman planı (Pzt..Paz) — her gün için ikonlu 5'li segment (KONTROLLÜ + onClick).
 * `<form action>` kullanılmıyor: React 19 server action sonrası formu resetleyip seçimi
 * eskiye döndürüyordu. Kaydet butonu server action'ı doğrudan çağırır; kontrollü state korunur.
 * Turnuva günlerinde (Sal/Prş/Cmt) seçilen seans yalnız o turnuvaya KATILMAZSAN uygulanır.
 * Kaydedilmemiş değişiklik görünür (oyuncu seçip kaydetmeden çıkmasın).
 */
import { useState, useTransition } from "react";
import { setTrainingPlanAction } from "@/app/actions";
import { TRAINING_TYPES, type TrainingType } from "@/engine/training";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { trainingImg } from "../trainingImage";

const TOURNAMENT_DAYS = new Set([1, 3, 5]); // Salı / Perşembe / Cumartesi

export function TrainingPlanForm({ initial, locale }: { initial: string[]; locale: Locale }) {
  const normalized = () =>
    Array.from({ length: 7 }, (_, i) => (TRAINING_TYPES.includes(initial[i] as TrainingType) ? initial[i] : "REST"));
  const [slots, setSlots] = useState<string[]>(normalized);
  const [savedSlots, setSavedSlots] = useState<string[]>(normalized);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirty = slots.some((v, i) => v !== savedSlots[i]);

  const pick = (day: number, value: string) => {
    setJustSaved(false);
    setSlots((prev) => prev.map((s, j) => (j === day ? value : s)));
  };

  const save = () => {
    const snapshot = slots;
    startTransition(async () => {
      const fd = new FormData();
      snapshot.forEach((v, i) => fd.append(`slot${i}`, v));
      await setTrainingPlanAction(fd);
      setSavedSlots(snapshot);
      setJustSaved(true);
    });
  };

  return (
    <div className="mt-3">
      <p className="text-[13px] text-steel">{t(locale, "plan.everyDayNote")}</p>
      <ol className="mt-3 space-y-3">
        {slots.map((val, i) => (
          <li key={i}>
            <fieldset>
              <legend className="mb-1.5 flex w-full flex-wrap items-center gap-x-2 text-[14px] font-semibold">
                {t(locale, `day.${i}`)}
                {TOURNAMENT_DAYS.has(i) && (
                  <span className="inline-flex items-center gap-1 text-[13px] font-normal text-steel">
                    <Icon name="tournament" size={15} />
                    {t(locale, "plan.tournamentDay")}
                  </span>
                )}
              </legend>
              <div className="grid grid-cols-5 rounded-md border border-line bg-black/35 p-0.5 backdrop-blur-sm">
                {TRAINING_TYPES.map((tt) => (
                  <label key={tt} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`slot${i}`}
                      value={tt}
                      checked={val === tt}
                      onChange={() => pick(i, tt)}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[5px] px-0.5 text-center text-[12px] leading-tight text-ink/75 transition-colors peer-checked:bg-ink peer-checked:font-semibold peer-checked:text-arena-0 peer-focus-visible:ring-2 peer-focus-visible:ring-ink">
                      <img src={trainingImg(tt)} alt="" aria-hidden="true" className="object-contain" style={{ width: 18, height: 18 }} />
                      {t(locale, `plan.short.${tt}`)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending || !dirty} className="btn-ink press h-12 flex-1 text-[16px] disabled:opacity-40">
          {pending ? t(locale, "plan.saving") : t(locale, "plan.save")}
        </button>
        <span role="status" className="flex min-w-0 items-center gap-1.5 text-[14px]">
          {dirty && !pending && (
            <>
              <span className="lamp lamp-red h-2 w-2 shrink-0" aria-hidden="true" />
              {t(locale, "plan.unsaved")}
            </>
          )}
          {justSaved && !dirty && !pending && (
            <>
              <Icon name="check" size={18} />
              {t(locale, "plan.saved")}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
