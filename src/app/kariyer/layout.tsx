import { redirect } from "next/navigation";
import { advanceWeekAction } from "@/app/actions";
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

  const advanceLabel = h.injured
    ? `🩹 Dinlen (${h.injuryWeeksRemaining} hf)`
    : h.dueThisWeek
      ? "🏆 Turnuvaya Git"
      : "Haftayı İlerle →";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 sm:px-6">
      <CareerNav name={h.name} meta={meta} />
      {children}

      {/* Sabit "Haftayı İlerle" çubuğu — sayfalar arası değişmez. (Online'da zaman otomatik akacak;
          bu çubuk yalnız tek-oyuncu zaman sürücüsüdür.) */}
      <form
        action={advanceWeekAction}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/80"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-sm tabular-nums opacity-70">
            Q{h.quarter} · H{h.week}/12
          </span>
          <button
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
              h.injured ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {advanceLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
