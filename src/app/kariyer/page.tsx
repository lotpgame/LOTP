import { redirect } from "next/navigation";
import { type SkillCategory } from "@/engine/domain";
import { getCareer } from "@/server/careerService";
import { CATEGORY_LABEL_TR, SkillBar, Stat, StatBar } from "./parts";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  const date = new Date(c.currentDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main>
      {/* Durum özeti — Kondisyon = 100−yorgunluk (dolu başlar, antrenmanla azalır). */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <Stat label="Sezon" value={`Q${c.quarter} · h${c.month} · ${c.dayName}`} />
        <Stat label="Genel" value={c.overall.toFixed(1)} />
        <Stat label="Kondisyon" value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} />
        <Stat label="Keskinlik" value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} />
        <Stat label="Milli Takım" value={c.nationalTeam ? "✔" : "—"} />
      </section>
      <p className="mt-2 text-xs opacity-50">{date}</p>

      {c.injured && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          🩹 Sakatsın — {c.injuryDaysRemaining} gün pistlerden uzaksın. (Alttaki İlerle ile iyileşirsin.)
        </div>
      )}

      {/* Fizik + Psikoloji */}
      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold opacity-80">Fizik</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span>Boy</span><span className="tabular-nums opacity-70">{c.physique.heightCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>Kulaç (erişim)</span><span className="tabular-nums opacity-70">{c.physique.reachCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>Bacak</span><span className="tabular-nums opacity-70">{c.physique.legLengthCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>Kilo</span><span className="tabular-nums opacity-70">{c.physique.weightKg.toFixed(0)} kg</span></li>
            <li className="flex justify-between"><span>El</span><span className="opacity-70">{c.physique.leftHanded ? "Solak" : "Sağlak"}</span></li>
          </ul>
          <p className="mt-2 text-xs opacity-50">Boy/kilo yaşla gelişir. Kulaç Epe&apos;de avantaj.</p>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold opacity-80">Psikoloji</h3>
          <div className="space-y-2">
            <StatBar label="Moral" value={c.psychology.morale} />
            <StatBar label="Motivasyon" value={c.psychology.motivation} />
            <StatBar label="Özgüven" value={c.psychology.confidence} />
            <StatBar label="Stres" value={c.psychology.stress} tone="warn" />
          </div>
          {c.traits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.traits.map((t) => (
                <span key={t} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Yetenekler */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Yetenekler</h2>
        <div className="mt-3 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {(Object.keys(CATEGORY_LABEL_TR) as SkillCategory[]).map((cat) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-medium opacity-80">{CATEGORY_LABEL_TR[cat]}</h3>
              <ul className="space-y-2">
                {c.skills
                  .filter((s) => s.category === cat)
                  .map((s) => (
                    <SkillBar key={s.key} label={s.label} current={s.current} potential={s.potential} />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
