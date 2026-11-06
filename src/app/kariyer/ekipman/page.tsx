import { redirect } from "next/navigation";
import { ArenaPage } from "@/app/ArenaPage";
import { buyEquipmentAction, discardEquipmentAction } from "@/app/actions";
import type { Weapon } from "@/engine/domain";
import { itemById, itemsForWeapon, itemName, itemDesc, itemsInSlot, kitItemFits, MAX_PER_SLOT, weaponSizeLabel, type EquipmentSlot, type GladiusItem } from "@/engine/equipment";
import { discountedPrice } from "@/engine/lifeEvents";
import type { AgeCategory } from "@/engine/domain";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { Icon, weaponIcon, type IconName } from "@/app/ui/Icon";
import { DenarMark } from "../DenarMark";
import { BrandPanel } from "./BrandPanel";
import { ErrorBanner } from "../ErrorBanner";

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

export default async function EkipmanPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const { err } = await searchParams;
  // "Sahip" = çantadaki parçalar (başlangıç takımı dahil) → eski oyuncular da tam takım görür, market tutarlı.
  const owned = new Set(c.kit.map((k) => k.itemId));
  // Silaha göre katalog: oyuncu yalnız kendi silahının + ortak ürünlerini görür (epe → yelek/maske kordonu yok).
  const catalog = itemsForWeapon(c.weapon as Weapon);
  const ownedCount = catalog.filter((i) => owned.has(i.id)).length;
  // Yaş kategorisi (categoryId: "U10-M-EP" → "U10") — çantada beden uygunluğu için (silah 0/2/5).
  const ageCat = (c.categoryId.split("-")[0] ?? "U10") as AgeCategory;

  const card = (item: GladiusItem) => {
    // Her parçadan 3'e kadar yedek alınabilir → "dolu" sadece 3/3'te.
    const slotCount = itemsInSlot(c.kit, item.slot).length;
    const isOwned = slotCount >= MAX_PER_SLOT;
    // 3-3: bu üründe aktif fırsat varsa indirimli fiyat gösterilir.
    const onOffer = c.offer?.itemId === item.id;
    const price = onOffer ? discountedPrice(item.denar, c.offer!.discountPct) : item.denar;
    const missing = Math.max(0, Math.ceil(price - c.balance));
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
            // Yetmiyorsa ipucu tooltip'te değil, görünür yazı olarak.
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
        <h1 className="display text-[28px]">{t(locale, "ekipman.title")}</h1>
        <span className="flex items-center gap-1.5 rounded-md border border-line bg-arena-1 px-3 py-1.5 text-[15px]">
          <DenarMark size={16} /> <span className="num">{c.balance.toFixed(0)}</span>
        </span>
      </div>

      <div className="mt-4">
        <ErrorBanner code={err} locale={locale} dismissHref="/kariyer/ekipman" />
      </div>

      {/* Malzeme Çantam — açılır/kapanır panel (Market gibi). Oyuncunun takımı: parça + beden + dayanıklılık + KIRIK. */}
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
            const tooSmall = !kitItemFits(k, c.age, ageCat); // yaşla büyüdü, beden küçük geldi → yenileme
            // Çoklu parça: aynı slotta birden çok varsa "1./2./3." ön eki + çöp at (index = slot içi sıra)
            const slotItems = c.kit.filter((x) => x.slot === k.slot);
            const idxInSlot = slotItems.indexOf(k);
            const multiPrefix = slotItems.length > 1 ? `${idxInSlot + 1}. ` : "";
            return (
              <li key={`${k.slot}-${ki}`} className={`panel flex items-center gap-3 p-2.5 ${k.broken || tooSmall ? "border-sig-red" : ""}`}>
                <span className="mesh flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-arena-2 text-ink">
                  <Icon name={kicon} size={24} />
                </span>
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
                {/* Çöp at — parçayı çantadan çıkarır (iade yok). İleride marka değişiminde işe yarar. */}
                <form action={discardEquipmentAction} className="shrink-0">
                  <input type="hidden" name="slot" value={k.slot} />
                  <input type="hidden" name="index" value={idxInSlot} />
                  <button className="flex h-8 w-8 items-center justify-center rounded-md text-steel active:bg-arena-2" aria-label={t(locale, "ekipman.discard")} title={t(locale, "ekipman.discard")}>
                    <Icon name="close" size={16} />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </details>

      {/* Market (Gladius) — marka paneli, açılır/kapanır (BrandPanel.tsx). Yeni marka → yeni <BrandPanel>. */}
      <h2 className="kicker mt-6 mb-2">{t(locale, "ekipman.market")}</h2>
      <div className="mt-0">
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
    </ArenaPage>
  );
}
