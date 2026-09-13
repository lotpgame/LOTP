import { redirect } from "next/navigation";
import { getCareer } from "@/server/careerService";
import { Stat } from "../parts";
import { TrainingPlanForm } from "./TrainingPlanForm";

export const dynamic = "force-dynamic";

export default async function AntrenmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");

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
        <TrainingPlanForm initial={c.trainingPlan} />
        <p className="mt-2 text-xs opacity-50">
          Dinlenme yorgunluğu düşürür ama keskinliği azaltır; çok yüklenme sakatlık riskini artırır.
        </p>
      </section>
    </main>
  );
}
