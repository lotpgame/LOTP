import { redirect } from "next/navigation";
import { upgradeEquipmentAction } from "@/app/actions";
import { getCareer } from "@/server/careerService";

export const dynamic = "force-dynamic";

const MAX_LEVEL = 5;

export default async function EkipmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Ekipman</h1>
        <span className="rounded-lg border border-black/10 px-3 py-1 text-sm dark:border-white/15">💰 {c.balance.toFixed(0)} ₺</span>
      </div>

      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/15">
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-80">Ekipman seviyesi</span>
          <span className="font-semibold">{c.equipmentLevel}/{MAX_LEVEL}</span>
        </div>
        {/* Seviye göstergesi */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: MAX_LEVEL }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i < c.equipmentLevel ? "bg-emerald-500" : "bg-black/10 dark:bg-white/15"}`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs opacity-60">
          Daha iyi ekipman antrenman verimine ve maç gücüne küçük bir katkı sağlar.
        </p>

        <form action={upgradeEquipmentAction} className="mt-3">
          <button
            disabled={!c.canUpgradeEquipment}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-current disabled:opacity-50 dark:disabled:bg-white/10"
          >
            {c.equipmentLevel >= MAX_LEVEL
              ? "Ekipman en üst seviyede"
              : `Ekipman Yükselt (${c.equipmentUpgradeCost.toFixed(0)} ₺)`}
          </button>
        </form>
        {c.equipmentLevel < MAX_LEVEL && !c.canUpgradeEquipment && (
          <p className="mt-2 text-center text-xs opacity-50">Yeterli paran yok.</p>
        )}
      </section>

      {/* İleride: mağaza (kordon, maske, silah markaları…) */}
      <section className="mt-4 rounded-xl border border-dashed border-black/15 p-4 text-center text-sm opacity-50 dark:border-white/20">
        🛒 Mağaza yakında — farklı markalar ve ekipman parçaları burada olacak.
      </section>
    </main>
  );
}
