import { redirect } from "next/navigation";
import { setTrainingPlanAction } from "@/app/actions";
import { TRAINING_LABEL_TR, TRAINING_TYPES } from "@/engine/training";
import { getCareer } from "@/server/careerService";
import { Stat } from "../parts";

export const dynamic = "force-dynamic";

export default async function AntrenmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  const plan = c.trainingPlan;

  return (
    <main>
      <h1 className="text-xl font-bold">Antrenman</h1>

      <section className="mt-3 grid grid-cols-3 gap-2.5">
        <Stat label="Sezon" value={`Q${c.quarter} · H${c.week}`} />
        <Stat label="Kondisyon" value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} />
        <Stat label="Keskinlik" value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} />
      </section>

      {c.injured ? (
        <section className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <h2 className="text-lg font-semibold">🩹 Sakatsın</h2>
          <p className="mt-1 text-sm opacity-80">
            {c.injuryWeeksRemaining} hafta pistlerden uzak kalacaksın. Bu sürede antrenman ve turnuva
            yok. Aşağıdaki <span className="font-medium">Dinlen</span> düğmesiyle iyileş.
          </p>
        </section>
      ) : c.dueThisWeek ? (
        <section className="mt-5 rounded-xl border border-emerald-500/50 bg-emerald-500/15 p-4">
          <h2 className="text-lg font-semibold">🏆 Bu hafta turnuva var</h2>
          <p className="mt-1 text-sm opacity-80">
            {c.registration?.label}. Bu hafta antrenman yok — aşağıdaki{" "}
            <span className="font-medium">Turnuvaya Git</span> ile canlı turnuvaya geç.
          </p>
        </section>
      ) : (
        <section className="mt-5">
          <h2 className="text-lg font-semibold">Haftalık Plan</h2>
          <p className="mt-1 text-sm opacity-70">
            Haftanın 3 seansını planla (sabah/öğlen/akşam). Dinlenme yorgunluğu düşürür ama keskinliği
            azaltır; çok yüklenme sakatlık riskini artırır. Planı kaydet — aşağıdaki{" "}
            <span className="font-medium">Haftayı İlerle</span> bu planı uygular.
          </p>
          <form action={setTrainingPlanAction} className="mt-3 space-y-3">
            {[
              { name: "slot1", label: "1. Seans", def: plan[0] ?? "TECHNICAL" },
              { name: "slot2", label: "2. Seans", def: plan[1] ?? "PHYSICAL" },
              { name: "slot3", label: "3. Seans", def: plan[2] ?? "REST" },
            ].map((slot) => (
              <label key={slot.name} className="block">
                <span className="mb-1 block text-xs opacity-60">{slot.label}</span>
                <select
                  name={slot.name}
                  defaultValue={slot.def}
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
        </section>
      )}
    </main>
  );
}
