import { redirect } from "next/navigation";
import { buyEquipmentAction } from "@/app/actions";
import type { Weapon } from "@/engine/domain";
import { itemsForWeapon, itemName, itemDesc, type EquipmentSlot, type GladiusItem } from "@/engine/equipment";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { Icon, weaponIcon, type IconName } from "@/app/ui/Icon";
import { DenarMark } from "../DenarMark";
import { BrandPanel } from "./BrandPanel";

export const dynamic = "force-dynamic";

const MAX_LEVEL = 5;

// Yuva → kendi çizdiğimiz ikon (silah yuvası oyuncunun silahına göre çizilir).
const SLOT_ICON: Record<Exclude<EquipmentSlot, "WEAPON">, IconName> = {
  MASK: "mask",
  CORD: "cord",
  MASK_CORD: "mask-cord",
  CLOTHING: "jacket",
  PLASTRON: "plastron",
  GLOVE: "glove",
  LAME: "lame",
  CHEST: "chest",
  SHOES: "shoes",
  SOCKS: "socks",
  BAG: "bag",
};

// Mağazada gruplama (sıra = gösterim sırası). Silaha uygun olmayan ürünler zaten itemsForWeapon ile elenir
// (ör. epe'de LAME/MASK_CORD hiç gelmez), o yüzden ayrı "gerekmez" notu gerekmiyor.
const GROUPS: { key: string; slots: EquipmentSlot[] }[] = [
  { key: "weapon", slots: ["WEAPON", "CORD", "MASK_CORD"] },
  { key: "protection", slots: ["MASK", "LAME", "CLOTHING", "PLASTRON", "GLOVE", "CHEST"] },
  { key: "feet", slots: ["SHOES", "SOCKS"] },
  { key: "accessory", slots: ["BAG"] },
];

export default async function EkipmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const owned = new Set(c.ownedEquipment);
  // Silaha göre katalog: oyuncu yalnız kendi silahının + ortak ürünlerini görür (epe → yelek/maske kordonu yok).
  const catalog = itemsForWeapon(c.weapon as Weapon);
  const ownedCount = catalog.filter((i) => owned.has(i.id)).length;

  const card = (item: GladiusItem) => {
    const isOwned = owned.has(item.id);
    const missing = Math.max(0, Math.ceil(item.denar - c.balance));
    const icon = item.slot === "WEAPON" ? weaponIcon(c.weapon) : SLOT_ICON[item.slot];
    return (
      <li key={item.id} className={`panel flex flex-col p-3 ${isOwned ? "border-ink" : ""}`}>
        <div className="flex items-start gap-3">
          <span className="mesh flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-arena-2 text-ink">
            <Icon name={icon} size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold leading-snug">{itemName(item, locale)}</div>
            <div className="text-[13px] text-steel">{itemDesc(item, locale)}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
          <span className="flex items-center gap-1 text-[15px]">
            <DenarMark size={15} /> <span className="num">{item.denar}</span>
          </span>
          {isOwned ? (
            <span className="flex min-h-11 items-center gap-1.5 text-[14px] font-semibold">
              <Icon name="check" size={18} className="text-ink" /> {t(locale, "ekipman.owned")}
            </span>
          ) : missing > 0 ? (
            // Yetmiyorsa ipucu tooltip'te değil, görünür yazı olarak.
            <span className="btn-ghost cursor-not-allowed text-[13px] text-steel" aria-disabled="true">
              {t(locale, "ekipman.missing")} <DenarMark size={13} /> <span className="num">{missing}</span>
            </span>
          ) : (
            <form action={buyEquipmentAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <button className="btn-ink press text-[14px]">{t(locale, "ekipman.buy")}</button>
            </form>
          )}
        </div>
      </li>
    );
  };

  return (
    <main>
      <div className="flex items-center justify-between gap-3">
        <h1 className="display text-[28px]">{t(locale, "ekipman.title")}</h1>
        <span className="flex items-center gap-1.5 rounded-md border border-line bg-arena-1 px-3 py-1.5 text-[15px]">
          <DenarMark size={16} /> <span className="num">{c.balance.toFixed(0)}</span>
        </span>
      </div>

      {/* Marka paneli — açılır/kapanır (bkz. BrandPanel.tsx). Şimdilik tek marka: GLADIUS.
          Yeni bir marka geldiğinde burada bir <BrandPanel> daha eklenir. */}
      <div className="mt-4">
        <BrandPanel icon="gladius" name="GLADIUS" sub={t(locale, "ekipman.brandSub")} ownedCount={ownedCount} total={catalog.length} locale={locale}>
          {GROUPS.map((g) => {
            const items = catalog.filter((i) => g.slots.includes(i.slot));
            if (items.length === 0) return null;
            return (
              <section key={g.key}>
                <h2 className="kicker mb-2">{t(locale, `ekipman.group.${g.key}`)}</h2>
                <ul className="grid gap-2.5 sm:grid-cols-2">{items.map(card)}</ul>
              </section>
            );
          })}
        </BrandPanel>
      </div>

      {/* Eski genel ekipman seviyesi (küçük genel katkı) — ayrıntı, tıklayınca açılır */}
      <details className="panel group mt-6">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
          <span className="flex-1 text-[15px]">{t(locale, "ekipman.level")}</span>
          <span className="num text-[15px]">
            {c.equipmentLevel}/{MAX_LEVEL}
          </span>
          <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
          <div className="flex gap-[3px]" aria-hidden="true">
            {Array.from({ length: MAX_LEVEL }).map((_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-[2px] ${i < c.equipmentLevel ? "bg-ink" : "bg-line"}`} />
            ))}
          </div>
          <p className="mt-2 text-[13px] text-steel">{t(locale, "ekipman.levelNote")}</p>
        </div>
      </details>
    </main>
  );
}
