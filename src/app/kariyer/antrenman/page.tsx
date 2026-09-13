import { redirect } from "next/navigation";
import { setTrainingPlanAction } from "@/app/actions";
import { TRAINING_LABEL_TR, TRAINING_TYPES } from "@/engine/training";
import { getCareer } from "@/server/careerService";
import { Stat } from "../parts";

export const dynamic = "force-dynamic";

// Antrenman günleri (haftalık program): Pazartesi / Çarşamba / Cuma / Pazar.
const TRAINING_DAYS = ["Pazartesi", "Çarşamba", "Cuma", "Pazar"];

export default async function AntrenmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  const plan = c.trainingPlan;

  return (
    <main>
      <h1 className="text-xl font-bold">Antrenman</h1>

      <section className="mt-3 grid grid-cols-3 gap-2.5">
        <Stat label="Bugün" value={c.dayName} />
        <Stat label="Kondisyon" value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} />
        <Stat label="Keskinlik" value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} />
      </section>

      {c.injured && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          🩹 Sakatsın — {c.injuryDaysRemaining} gün pistlerden uzaksın. Alttaki <b>İlerle</b> ile
          iyileşene kadar dinlenirsin (antrenman/turnuva yok).
        </div>
      )}

      <section className="mt-5">
        <h2 className="text-lg font-semibold">Haftalık Plan</h2>
        <p className="mt-1 text-sm opacity-70">
          Program her ay tekrar eder: Salı İl, Perşembe Türkiye, Cumartesi Open turnuvaları;
          <b> Pazartesi/Çarşamba/Cuma/Pazar antrenman</b>. Bu 4 antrenman gününde ne çalışacağını
          seç ve kaydet — alttaki <b>İlerle</b> planı uygular, turnuva gününde durur.
        </p>
        <form action={setTrainingPlanAction} className="mt-3 space-y-3">
          {TRAINING_DAYS.map((day, i) => (
            <label key={day} className="block">
              <span className="mb-1 block text-xs opacity-60">{day}</span>
              <select
                name={`slot${i + 1}`}
                defaultValue={plan[i] ?? "REST"}
                className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/20"
              >
                {TRAINING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TRAINING_LABEL_TR[t]}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button className="w-full rounded-lg border border-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-500/10">
            Planı Kaydet
          </button>
        </form>
        <p className="mt-2 text-xs opacity-50">
          Dinlenme yorgunluğu düşürür ama keskinliği azaltır; çok yüklenme sakatlık riskini artırır.
        </p>
      </section>
    </main>
  );
}
