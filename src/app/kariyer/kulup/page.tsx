import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { Segments } from "@/app/ui/Piste";

export const dynamic = "force-dynamic";

export default async function KulupPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();

  return (
    <main>
      <h1 className="display text-[28px]">{t(locale, "kulup.title")}</h1>
      {c.club ? (
        <section className="panel mt-3 p-4">
          <div className="flex items-center gap-3">
            {/* Nötr arma — kulüplerin kendi arması yok (gerçek kulüp logosu kullanılmaz) */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-arena-0">
              <Icon name="club" size={26} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[18px] font-semibold">{c.club.name}</div>
              <div className="text-[14px] text-steel">{c.club.city}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between text-[14px]">
              <span>{t(locale, "kulup.facility")}</span>
              <span className="num text-[15px]">{c.club.facility}/100</span>
            </div>
            <Segments value={c.club.facility} className="mt-2" />
          </div>

          {/* İki antrenör — eşit yetenek, farklı uzmanlık (GDD 13). */}
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="kicker">{t(locale, "kulup.coaches")}</h2>
              <span className="text-[13px] text-steel">
                {t(locale, "kulup.skill")} <span className="num text-ink">{c.club.coachSkill}/100</span>
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { name: c.club.coachName, spec: c.club.coachSpecialty },
                { name: c.club.coach2Name, spec: c.club.coach2Specialty },
              ].map((co, i) => (
                <div key={i} className="rounded-md border border-line bg-arena-0 p-3">
                  <div className="text-[13px] text-steel">{t(locale, "kulup.coach")}</div>
                  <div className="text-[15px] font-medium">{co.name}</div>
                  <div className="mt-0.5 text-[13px] text-steel">
                    {t(locale, "kulup.specialty")}:{" "}
                    {co.spec
                      .split(",")
                      .filter(Boolean)
                      .map((s) => t(locale, `category.${s}`))
                      .join(", ") || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[13px] text-steel">{t(locale, "kulup.note")}</p>
        </section>
      ) : (
        <p className="mt-4 text-[14px] text-steel">{t(locale, "kulup.none")}</p>
      )}
    </main>
  );
}
