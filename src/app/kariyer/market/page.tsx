import { redirect } from "next/navigation";
import { ArenaPage } from "@/app/ArenaPage";
import { buyEquipmentAction } from "@/app/actions";
import type { AgeCategory, Gender, Weapon } from "@/engine/domain";
import { itemsForWeapon, itemName, itemDesc, itemsInSlot, MAX_PER_SLOT, requiredSize, sizeLabel, type EquipmentSlot, type GladiusItem } from "@/engine/equipment";
import { discountedPrice } from "@/engine/lifeEvents";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { Icon, weaponIcon, type IconName } from "@/app/ui/Icon";
import { EquipImage } from "../EquipImage";
import { equipFull, equipImageName, equipThumb } from "../equipmentImage";
import { DenarMark } from "../DenarMark";
import { BrandPanel } from "../ekipman/BrandPanel";
import { ErrorBanner } from "../ErrorBanner";

export const dynamic = "force-dynamic";

// Yuva → ikon (silah yuvası oyuncunun silahına göre çizilir).
const SLOT_ICON: Record<Exclude<EquipmentSlot, "WEAPON">, IconName> = {
  MASK: "mask", CORD: "cord", MASK_CORD: "mask-cord", CLOTHING: "jacket", PANTS: "jacket", PLASTRON: "plastron",
  GLOVE: "glove", LAME: "lame", CHEST: "chest", SHOES: "shoes", SOCKS: "socks", BAG: "bag",
};

// Mağazada gruplama (gösterim sırası). Silaha uymayanlar itemsForWeapon ile elenir.
const GROUPS: { key: string; slots: EquipmentSlot[] }[] = [
  { key: "weapon", slots: ["WEAPON", "CORD", "MASK_CORD"] },
  { key: "protection", slots: ["MASK", "LAME", "CLOTHING", "PANTS", "PLASTRON", "GLOVE", "CHEST"] },
  { key: "feet", slots: ["SHOES", "SOCKS"] },
  { key: "accessory", slots: ["BAG"] },
];

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const { err } = await searchParams;
  const owned = new Set(c.kit.map((k) => k.itemId));
  const catalog = itemsForWeapon(c.weapon as Weapon, c.gender as Gender);
  const ownedCount = catalog.filter((i) => owned.has(i.id)).length;
  const ageCat = (c.categoryId.split("-")[0] ?? "U10") as AgeCategory;

  const card = (item: GladiusItem) => {
    const slotCount = itemsInSlot(c.kit, item.slot).length;
    const isOwned = slotCount >= MAX_PER_SLOT;
    const onOffer = c.offer?.itemId === item.id;
    const price = onOffer ? discountedPrice(item.denar, c.offer!.discountPct) : item.denar;
    const missing = Math.max(0, Math.ceil(price - c.balance));
    const icon = item.slot === "WEAPON" ? weaponIcon(c.weapon) : SLOT_ICON[item.slot];
    // Market'te ürün oyuncunun KATEGORİ bedeniyle gösterilir (satın alınca o beden gelir). Görsel yoksa generic ikona düşer.
    const reqSize = requiredSize(item.slot, c.age, ageCat);
    const imgName = equipImageName(item.slot, c.weapon as Weapon, c.gender as Gender, reqSize);
    const sizeBadge = sizeLabel(item.slot, reqSize);
    return (
      <li key={item.id} className={`panel flex flex-col p-3 ${isOwned ? "border-ink" : ""}`}>
        <div className="flex items-start gap-3">
          {imgName ? (
            <EquipImage
              thumbSrc={equipThumb(imgName)}
              fullSrc={equipFull(imgName)}
              alt={itemName(item, locale)}
              closeLabel={t(locale, "common.close")}
              className="press mesh h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-arena-2"
            />
          ) : (
            <span className="mesh flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-arena-2 text-ink">
              <Icon name={icon} size={30} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-semibold leading-snug">{itemName(item, locale)}</span>
              {sizeBadge && <span className="kicker shrink-0 rounded border border-line px-1 text-[10px] text-steel">{sizeBadge}</span>}
            </div>
            <div className="text-[13px] text-steel">{itemDesc(item, locale)}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
          <span className="flex flex-wrap items-center gap-1.5 text-[15px]">
            <DenarMark size={15} /> <span className="num">{price}</span>
            {onOffer && (
              <>
                <span className="num text-[12px] text-steel line-through">{item.denar}</span>
                <span className="kicker rounded bg-sig-red/15 px-1 py-px text-[10px] font-semibold text-sig-red">🔥 %{c.offer!.discountPct} · {c.offer!.daysLeft}g</span>
              </>
            )}
          </span>
          {isOwned ? (
            <span className="flex min-h-11 items-center gap-1.5 text-[14px] font-semibold">
              <Icon name="check" size={18} className="text-ink" /> {t(locale, "ekipman.owned")} <span className="num text-steel">{slotCount}/{MAX_PER_SLOT}</span>
            </span>
          ) : missing > 0 ? (
            <span className="btn-ghost cursor-not-allowed text-[13px] text-steel" aria-disabled="true">
              {t(locale, "ekipman.missing")} <DenarMark size={13} /> <span className="num">{missing}</span>
            </span>
          ) : (
            <form action={buyEquipmentAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <button className="btn-ink press text-[14px]">
                {slotCount >= 1 ? `${slotCount + 1}. ` : ""}{t(locale, "ekipman.buy")}
              </button>
            </form>
          )}
        </div>
      </li>
    );
  };

  return (
    <ArenaPage bg="/img/bg-ekipman.webp">
      <div className="flex items-center justify-between gap-3">
        <h1 className="display text-[28px]">{t(locale, "ekipman.market")}</h1>
        <span className="flex items-center gap-1.5 rounded-md border border-line bg-arena-1 px-3 py-1.5 text-[15px]">
          <DenarMark size={16} /> <span className="num">{c.balance.toFixed(0)}</span>
        </span>
      </div>

      {/* Dolaba dön */}
      <a href="/kariyer/ekipman" className="press mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line bg-arena-1 px-3 text-[14px] font-semibold">
        <Icon name="chevron-down" size={16} className="rotate-90" /> {t(locale, "ekipman.myKit")}
      </a>

      <div className="mt-4">
        <ErrorBanner code={err} locale={locale} dismissHref="/kariyer/market" />
      </div>

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
    </ArenaPage>
  );
}
