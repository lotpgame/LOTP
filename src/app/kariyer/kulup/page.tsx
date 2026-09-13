import { redirect } from "next/navigation";
import { type SkillCategory } from "@/engine/domain";
import { getCareer } from "@/server/careerService";
import { CATEGORY_LABEL_TR } from "../parts";

export const dynamic = "force-dynamic";

export default async function KulupPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  return (
    <main>
      <h1 className="text-xl font-bold">Kulüp</h1>
      {c.club ? (
        <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/15">
          <div className="text-lg font-semibold">{c.club.name}</div>
          <div className="text-sm opacity-70">{c.club.city}</div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Tesis kalitesi</span>
              <span className="tabular-nums opacity-70">{c.club.facility}/100</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.club.facility}%` }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span>Koç</span>
              <span className="opacity-70">
                {c.club.coachName} · {CATEGORY_LABEL_TR[c.club.coachSpecialty as SkillCategory]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Koç yeteneği</span>
              <span className="tabular-nums opacity-70">{c.club.coachSkill}/100</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.club.coachSkill}%` }} />
            </div>
          </div>

          <p className="mt-4 text-xs opacity-50">
            Tesis ve koç, antrenman verimini güçlendirir; koç uzmanlığı ilgili yetenek grubunu daha çok
            geliştirir. (Kulüp değiştirme/teklifler ileride.)
          </p>
        </section>
      ) : (
        <p className="mt-4 text-sm opacity-60">Henüz bir kulübe bağlı değilsin.</p>
      )}
    </main>
  );
}
