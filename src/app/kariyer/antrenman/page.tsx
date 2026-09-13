import { redirect } from "next/navigation";
import { advanceWeekAction, cancelRegistrationAction, restWeekAction } from "@/app/actions";
import { TRAINING_LABEL_TR, TRAINING_TYPES } from "@/engine/training";
import { getCareer } from "@/server/careerService";
import { Stat } from "../parts";

export const dynamic = "force-dynamic";

export default async function AntrenmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");

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
            yok — dinlenerek iyileş.
          </p>
          <form action={restWeekAction} className="mt-3">
            <button className="w-full rounded-lg bg-amber-600 px-4 py-3 font-medium text-white transition hover:bg-amber-500">
              Bu Haftayı Dinlen ({c.injuryWeeksRemaining} hafta kaldı)
            </button>
          </form>
        </section>
      ) : (
        <section className="mt-5">
          {c.registration && (
            <div
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                c.dueThisWeek ? "border-emerald-500/50 bg-emerald-500/15" : "border-sky-500/40 bg-sky-500/10"
              }`}
            >
              <div className="text-sm">
                {c.dueThisWeek ? (
                  <>
                    <span className="font-semibold">🏆 Turnuva bu hafta: {c.registration.label}</span>
                    <br />
                    <span className="opacity-70">İlerle&apos;ye bas → turnuva ekranına geç.</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">📅 Kayıtlısın: {c.registration.label}</span>
                    <br />
                    <span className="opacity-70">
                      {c.registration.dateLabel} · {c.registration.weeksAway} hafta sonra (H
                      {c.registration.weekInQuarter}/12).
                    </span>
                  </>
                )}
              </div>
              <form action={cancelRegistrationAction}>
                <button className="shrink-0 rounded-md border border-black/15 px-2.5 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20">
                  İptal
                </button>
              </form>
            </div>
          )}

          <form action={advanceWeekAction} className="mt-3 space-y-3">
            {c.dueThisWeek ? (
              <p className="text-sm opacity-70">
                Bu hafta yarışma haftan — antrenman yok. &quot;Haftayı İlerle&quot; seni doğrudan
                turnuvaya götürür.
              </p>
            ) : (
              <>
                <p className="text-sm opacity-70">
                  Haftanın 3 seansını planla (sabah/öğlen/akşam). Dinlenme yorgunluğu düşürür ama
                  keskinliği azaltır; çok yüklenme sakatlık riskini artırır.
                </p>
                <div className="space-y-3">
                  {[
                    { name: "slot1", label: "1. Seans", def: "TECHNICAL" },
                    { name: "slot2", label: "2. Seans", def: "PHYSICAL" },
                    { name: "slot3", label: "3. Seans", def: "REST" },
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
                </div>
              </>
            )}
            <button className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500">
              {c.dueThisWeek ? "Haftayı İlerle → Turnuvaya Git 🏆" : "Haftayı İlerle →"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
