"use client";

/**
 * Market — tek tık açılan pop-up (kullanıcı kararı 15.11). İki kademe: (1) marka logoları ızgarası,
 * (2) markaya girince o markanın oyuncuya UYGUN eşyaları (silah/cinsiyet/kategori bedeniyle). Satın alma
 * sunucu action'ı (buyEquipmentAction) ile. Şimdilik tek marka (GLADIUS); yeni marka BRANDS'e eklenir.
 * Pencere document.body'ye taşınır (portal).
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buyEquipmentAction } from "@/app/actions";
import type { AgeCategory, Gender, Weapon } from "@/engine/domain";
import {
  itemsForWeapon,
  itemName,
  itemDesc,
  itemsInSlot,
  MAX_PER_SLOT,
  requiredSize,
  sizeLabel,
  type EquipmentSlot,
  type GladiusItem,
  type KitItemState,
} from "@/engine/equipment";
import { discountedPrice } from "@/engine/lifeEvents";
import { t, type Locale } from "@/i18n";
import { Icon, weaponIcon, type IconName } from "@/app/ui/Icon";
import { EquipImage } from "../EquipImage";
import { equipFull, equipImageName, equipThumb } from "../equipmentImage";
import { DenarMark } from "../DenarMark";

const SLOT_ICON: Record<Exclude<EquipmentSlot, "WEAPON">, IconName> = {
  MASK: "mask", CORD: "cord", MASK_CORD: "mask-cord", CLOTHING: "jacket", PANTS: "jacket", PLASTRON: "plastron",
  GLOVE: "glove", LAME: "lame", CHEST: "chest", SHOES: "shoes", SOCKS: "socks", BAG: "bag",
};

const GROUPS: { key: string; slots: EquipmentSlot[] }[] = [
  { key: "weapon", slots: ["WEAPON", "CORD", "MASK_CORD"] },
  { key: "protection", slots: ["MASK", "LAME", "CLOTHING", "PANTS", "PLASTRON", "GLOVE", "CHEST"] },
  { key: "feet", slots: ["SHOES", "SOCKS"] },
  { key: "accessory", slots: ["BAG"] },
];

// Markalar — şimdilik tek (GLADIUS). Yeni marka: logo + kendi item filtresi eklenir.
const BRANDS = [{ id: "GLADIUS", name: "GLADIUS", logo: "/img/ui/gladius-logo.webp" }] as const;

export function MarketModal({
  locale,
  weapon,
  gender,
  age,
  categoryId,
  balance,
  kit,
  offer,
  triggerClassName,
}: {
  locale: Locale;
  weapon: string;
  gender: string;
  age: number;
  categoryId: string;
  balance: number;
  kit: KitItemState[];
  offer: { itemId: string; discountPct: number; daysLeft: number } | null;
  triggerClassName: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const close = () => dialog.current?.close();
  const open = () => {
    setBrand(null); // her açılışta marka seçiminden başla
    dialog.current?.showModal();
  };

  const ageCat = (categoryId.split("-")[0] ?? "U10") as AgeCategory;
  const catalog = itemsForWeapon(weapon as Weapon, gender as Gender);

  const card = (item: GladiusItem) => {
    const slotCount = itemsInSlot(kit, item.slot).length;
    const isOwned = slotCount >= MAX_PER_SLOT;
    const onOffer = offer?.itemId === item.id;
    const price = onOffer ? discountedPrice(item.denar, offer!.discountPct) : item.denar;
    const missing = Math.max(0, Math.ceil(price - balance));
    const icon = item.slot === "WEAPON" ? weaponIcon(weapon) : SLOT_ICON[item.slot];
    const reqSize = requiredSize(item.slot, age, ageCat);
    const imgName = equipImageName(item.slot, weapon as Weapon, gender as Gender, reqSize);
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
                <span className="kicker rounded bg-sig-red/15 px-1 py-px text-[10px] font-semibold text-sig-red">🔥 %{offer!.discountPct} · {offer!.daysLeft}g</span>
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

  const ownedCount = catalog.filter((i) => itemsInSlot(kit, i.slot).length >= MAX_PER_SLOT).length;

  return (
    <>
      <button type="button" onClick={open} aria-haspopup="dialog" className={triggerClassName}>
        <img src="/img/ui/market.webp" alt="" aria-hidden="true" className="shrink-0 object-contain" style={{ width: 40, height: 40 }} />
        <div className="min-w-0 flex-1 text-left">
          <div className="font-display text-[18px] font-bold uppercase leading-none tracking-wide">{t(locale, "ekipman.market")}</div>
          <div className="mt-1 text-[13px] text-steel">{t(locale, "ekipman.goMarketSub")}</div>
        </div>
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            style={{ maxWidth: "42rem" }} // market item kartları için daha geniş (24rem dar kalıyor)
            aria-label={t(locale, "ekipman.market")}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="flex max-h-[86svh] flex-col p-4">
              <div className="mb-3 flex items-center gap-2">
                {/* Başlığa tıkla → markalara dön (ayrı geri oku yok). */}
                <button
                  type="button"
                  onClick={() => brand && setBrand(null)}
                  disabled={!brand}
                  className="flex flex-1 items-center gap-2 font-display text-[19px] font-bold disabled:cursor-default"
                >
                  <img src="/img/ui/market.webp" alt="" aria-hidden="true" className="h-6 w-6 object-contain" /> {t(locale, "ekipman.market")}
                </button>
                <span className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[14px]">
                  <DenarMark size={15} /> <span className="num">{balance.toFixed(0)}</span>
                </span>
                <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(locale, "common.close")}>
                  <Icon name="close" />
                </button>
              </div>

              <div className="-mr-1 flex-1 overflow-y-auto pr-1">
                {!brand ? (
                  /* Kademe 1: marka logoları */
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {BRANDS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBrand(b.id)}
                        className="press flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-line bg-arena-1 p-4"
                      >
                        <img src={b.logo} alt={b.name} className="max-h-12 w-auto object-contain" />
                        <span className="num text-[12px] text-steel">{ownedCount}/{catalog.length}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Kademe 2: markanın uygun eşyaları, gruplanmış */
                  <div className="space-y-5">
                    {GROUPS.map((g) => {
                      const items = catalog.filter((i) => g.slots.includes(i.slot));
                      if (items.length === 0) return null;
                      return (
                        <section key={g.key}>
                          <h3 className="kicker mb-2">{t(locale, `ekipman.group.${g.key}`)}</h3>
                          <ul className="grid gap-2.5 sm:grid-cols-2">{items.map(card)}</ul>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
