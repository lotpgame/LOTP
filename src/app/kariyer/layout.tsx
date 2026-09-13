import { redirect } from "next/navigation";
import { advanceDayAction, attendTournamentAction } from "@/app/actions";
import { GENDER_LABEL_TR, WEAPON_LABEL_TR, type Gender, type Weapon } from "@/engine/domain";
import { getCareerHeader } from "@/server/careerService";
import { CareerNav } from "./CareerNav";

// Kariyer verisine bağlı: her istekte taze.
export const dynamic = "force-dynamic";

export default async function KariyerLayout({ children }: LayoutProps<"/kariyer">) {
  const h = await getCareerHeader();
  if (!h) redirect("/");
  // Devam eden canlı turnuva varsa tüm kariyer sayfaları yerine turnuva ekranına götür (immersion).
  if (h.liveTournamentActive) redirect("/turnuva/canli");

  const meta = `${h.code} · ${GENDER_LABEL_TR[h.gender as Gender]} · ${WEAPON_LABEL_TR[h.weapon as Weapon]} · ${h.age} yaş · ${h.categoryId}`;
  const dateLabel = `Q${h.quarter} · H${h.month} · ${h.dayName}`;

  // Bugün katılabileceğin bir turnuva mı? (sağlıklı + uygun) → Katıl/Geç; değilse İlerle.
  const canAttend = !h.injured && h.today.kind === "TOURNAMENT" && h.today.qualified === true;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 sm:px-6">
      <CareerNav name={h.name} meta={meta} />
      {children}

      {/* Sabit alt çubuk — sayfalar arası değişmez (gün-bazlı zaman sürücüsü). Online'da otomatik akar. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 text-sm">
            <div className="font-medium tabular-nums">{dateLabel}</div>
            <div className="truncate text-xs opacity-60">
              {h.injured
                ? `🩹 Sakat — ${h.injuryDaysRemaining} gün`
                : h.today.kind === "TOURNAMENT"
                  ? `🏆 ${h.today.label}${h.today.qualified ? "" : ` · 🔒 ${h.today.requirement}`}`
                  : `🏋️ ${h.today.trainingLabel}`}
            </div>
          </div>

          {canAttend ? (
            <div className="flex shrink-0 gap-2">
              <form action={advanceDayAction}>
                <button
                  title="Turnuvaya girme, bugün antrenman yap"
                  className="rounded-lg border border-black/15 px-3 py-2.5 text-sm opacity-70 transition hover:opacity-100 dark:border-white/20"
                >
                  Geç · antren ⏭
                </button>
              </form>
              <form action={attendTournamentAction}>
                <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
                  🏆 Katıl
                </button>
              </form>
            </div>
          ) : (
            <form action={advanceDayAction} className="shrink-0">
              <button
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                  h.injured ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                İlerle →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
