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

          </div>

          {/* İki antrenör — eşit yetenek, farklı uzmanlık (GDD 13). */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium opacity-80">Antrenörler</span>
              <span className="text-xs opacity-60">Yetenek {c.club.coachSkill}/100</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { name: c.club.coachName, spec: c.club.coachSpecialty },
                { name: c.club.coach2Name, spec: c.club.coach2Specialty },
              ].map((co, i) => (
                <div key={i} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
                  <div className="text-sm font-medium">{co.name}</div>
                  <div className="mt-0.5 text-xs opacity-60">
                    Uzmanlık:{" "}
                    {co.spec
                      .split(",")
                      .filter(Boolean)
                      .map((s) => CATEGORY_LABEL_TR[s as SkillCategory] ?? s)
                      .join(", ") || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-xs opacity-50">
            Tesis ve antrenörler antrenman verimini güçlendirir; bir antrenörün uzmanlığı o yetenek
            grubunu daha çok geliştirir. (Kulüp değiştirme/teklifler ileride.)
          </p>
        </section>
      ) : (
        <p className="mt-4 text-sm opacity-60">Henüz bir kulübe bağlı değilsin.</p>
      )}
    </main>
  );
}
