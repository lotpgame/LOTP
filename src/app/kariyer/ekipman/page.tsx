import { redirect } from "next/navigation";
import { buyEquipmentAction } from "@/app/actions";
import { GLADIUS_ITEMS, type EquipmentSlot } from "@/engine/equipment";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";

export const dynamic = "force-dynamic";

const MAX_LEVEL = 5;

// Slot → emoji (yer tutucu; gerçek ürün görselleri V2 — bkz. NOTLAR).
const SLOT_EMOJI: Record<EquipmentSlot, string> = {
  WEAPON: "🗡️",
  MASK: "🎭",
  CORD: "🔌",
  MASK_CORD: "🔗",
  CLOTHING: "👕",
  PLASTRON: "🛡️",
  LAME: "🦺",
  SHOES: "👟",
  SOCKS: "🧦",
  BAG: "🎒",
};

export default async function EkipmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const owned = new Set(c.ownedEquipment);

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t(locale, "ekipman.title")}</h1>
        <span className="rounded-full border border-black/10 px-3 py-1 text-sm font-medium dark:border-white/15">
          🪙 Đ {c.balance.toFixed(0)}
        </span>
      </div>

      {/* Genel ekipman seviyesi (eski sistem, küçük genel katkı) */}
      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/15">
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-80">{t(locale, "ekipman.level")}</span>
          <span className="font-semibold">
            {c.equipmentLevel}/{MAX_LEVEL}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: MAX_LEVEL }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i < c.equipmentLevel ? "bg-emerald-500" : "bg-black/10 dark:bg-white/15"}`}
            />
          ))}
        </div>
      </section>

      {/* GLADIUS mağazası */}
      <section className="mt-5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-widest">GLADIUS</span>
          <span className="text-xs opacity-60">· eskrim ekipman mağazası</span>
        </div>
        <p className="mt-1 text-xs opacity-55">
          Her parça maça çok çok az katkı verir (~+0.003) — donanım prestij ve his içindir, maçı yetenek kazanır.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {GLADIUS_ITEMS.map((item) => {
            const isOwned = owned.has(item.id);
            const affordable = c.balance >= item.denar;
            return (
              <div key={item.id} className="flex flex-col rounded-xl border border-black/10 p-3 dark:border-white/15">
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{SLOT_EMOJI[item.slot]}</span>
                  {item.cosmetic ? (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium opacity-60 dark:bg-white/10">
                      kozmetik
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                      +{item.combatBonus}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm font-medium">{item.name}</div>
                <div className="text-xs opacity-60">{item.desc}</div>

                <div className="mt-auto flex items-center justify-between border-t border-black/10 pt-2.5 dark:border-white/10" style={{ marginTop: "0.75rem" }}>
                  <span className="text-sm font-semibold">Đ {item.denar}</span>
                  {isOwned ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Sahipsin</span>
                  ) : (
                    <form action={buyEquipmentAction}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                          affordable ? "bg-emerald-600 hover:bg-emerald-500" : "bg-black/20 dark:bg-white/20"
                        }`}
                        title={affordable ? "" : "Yeterli Denar yok"}
                      >
                        Satın al
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
