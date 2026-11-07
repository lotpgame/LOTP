import { redirect } from "next/navigation";
import { ArenaPage } from "@/app/ArenaPage";
import type { AgeCategory, Gender, Weapon } from "@/engine/domain";
import { itemById, itemName, kitItemFits, weaponSizeLabel, type EquipmentSlot } from "@/engine/equipment";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { Icon, weaponIcon, type IconName } from "@/app/ui/Icon";
import { DenarMark } from "../DenarMark";
import { EquipImage } from "../EquipImage";
import { equipFull, equipImageName, equipThumb } from "../equipmentImage";
import { DiscardButton } from "./DiscardButton";
import { Kumbara } from "./Kumbara";
import { ErrorBanner } from "../ErrorBanner";

export const dynamic = "force-dynamic";

// Yuva → ikon (silah yuvası oyuncunun silahına göre çizilir).
const SLOT_ICON: Record<Exclude<EquipmentSlot, "WEAPON">, IconName> = {
  MASK: "mask", CORD: "cord", MASK_CORD: "mask-cord", CLOTHING: "jacket", PLASTRON: "plastron",
  GLOVE: "glove", LAME: "lame", CHEST: "chest", SHOES: "shoes", SOCKS: "socks", BAG: "bag",
};

export default async function EkipmanPage({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const { err } = await searchParams;
  // Yaş kategorisi (categoryId: "U10-M-EP" → "U10") — çantada beden uygunluğu için (silah 0/2/5).
  const ageCat = (c.categoryId.split("-")[0] ?? "U10") as AgeCategory;

  return (
    <ArenaPage bg="/img/bg-ekipman.webp">
      <div className="flex items-center justify-between gap-3">
        <h1 className="display text-[28px]">{t(locale, "ekipman.title")}</h1>
        <span className="flex items-center gap-1.5 rounded-md border border-line bg-arena-1 px-3 py-1.5 text-[15px]">
          <DenarMark size={16} /> <span className="num">{c.balance.toFixed(0)}</span>
        </span>
      </div>

      <div className="mt-4">
        <ErrorBanner code={err} locale={locale} dismissHref="/kariyer/ekipman" />
      </div>

      {/* Malzeme Dolabım — oyuncunun takımı: parça + beden + dayanıklılık + KIRIK. */}
      <details className="panel group mt-4" open>
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <Icon name="bag" size={28} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[18px] font-bold uppercase leading-none tracking-wide">{t(locale, "ekipman.myKit")}</div>
          </div>
          <Icon name="chevron-down" size={18} className="shrink-0 text-steel transition-transform group-open:rotate-180" />
        </summary>
        <ul className="grid gap-2 border-t border-line px-4 pb-4 pt-3 sm:grid-cols-2">
          {c.kit.map((k, ki) => {
            const item = itemById(k.itemId);
            if (!item) return null;
            const kicon = item.slot === "WEAPON" ? weaponIcon(c.weapon) : SLOT_ICON[item.slot as Exclude<EquipmentSlot, "WEAPON">];
            const imgName = equipImageName(item.slot, c.weapon as Weapon, c.gender as Gender, k.size);
            const tooSmall = !kitItemFits(k, c.age, ageCat);
            const slotItems = c.kit.filter((x) => x.slot === k.slot);
            const idxInSlot = slotItems.indexOf(k);
            const multiPrefix = slotItems.length > 1 ? `${idxInSlot + 1}. ` : "";
            return (
              <li key={`${k.slot}-${ki}`} className={`panel flex items-center gap-3 p-2.5 ${k.broken || tooSmall ? "border-sig-red" : ""}`}>
                {imgName ? (
                  <EquipImage
                    thumbSrc={equipThumb(imgName)}
                    fullSrc={equipFull(imgName)}
                    alt={itemName(item, locale)}
                    closeLabel={t(locale, "common.close")}
                    className="press mesh h-12 w-12 shrink-0 overflow-hidden rounded-md border border-line bg-arena-2"
                  />
                ) : (
                  <span className="mesh flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-arena-2 text-ink">
                    <Icon name={kicon} size={24} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[14px] font-semibold">{multiPrefix}{itemName(item, locale)}</span>
                    {item.slot === "WEAPON" && (
                      <span className={`kicker shrink-0 rounded border px-1 text-[10px] ${tooSmall ? "border-sig-red text-sig-red" : "border-line text-steel"}`}>{weaponSizeLabel(k.size)}</span>
                    )}
                    {tooSmall && <span className="kicker shrink-0 rounded bg-sig-red/20 px-1 text-[10px] text-sig-red">{t(locale, "ekipman.tooSmall")}</span>}
                    {k.broken && <span className="kicker shrink-0 rounded bg-sig-red/20 px-1 text-[10px] text-sig-red">{t(locale, "ekipman.broken")}</span>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-arena-2" aria-hidden="true">
                      <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, k.durability))}%` }} />
                    </span>
                    <span className="num text-[11px] text-steel">%{k.durability.toFixed(0)}</span>
                  </div>
                </div>
                {/* Çöp at — 2 kademeli onay (iade yok). */}
                <DiscardButton slot={k.slot} index={idxInSlot} labels={{ discard: t(locale, "ekipman.discard"), sure: t(locale, "ekipman.confirmDiscard") }} />
              </li>
            );
          })}
        </ul>
      </details>

      {/* Kumbaram — cebindeki para + bu haftanın gelir/gider dökümü. */}
      <details className="panel group mt-4" open>
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <DenarMark size={24} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[18px] font-bold uppercase leading-none tracking-wide">{t(locale, "kumbara.title")}</div>
          </div>
          <Icon name="chevron-down" size={18} className="shrink-0 text-steel transition-transform group-open:rotate-180" />
        </summary>
        <Kumbara balance={c.balance} entries={c.ledgerWeek} totals={c.ledgerWeekTotals} locale={locale} />
      </details>

      {/* Market — ayrı sayfa (çok ürün + marka paneli orada). */}
      <a
        href="/kariyer/market"
        className="press mt-4 flex min-h-16 items-center gap-3 rounded-lg border border-line bg-arena-1 px-4 py-3"
      >
        <Icon name="shop" size={28} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-[18px] font-bold uppercase leading-none tracking-wide">{t(locale, "ekipman.market")}</div>
          <div className="mt-1 text-[13px] text-steel">{t(locale, "ekipman.goMarketSub")}</div>
        </div>
        <Icon name="chevron-down" size={18} className="shrink-0 -rotate-90 text-steel" />
      </a>

    </ArenaPage>
  );
}
