"use client";

/**
 * Branş (silah) değiştirme (kullanıcı 24.11). Antrenman sayfasının altındaki buton → pop-up:
 *  - Diğer silahların maliyet dökümü (eksik ekipman + artan branş ücreti).
 *  - İKİ ADIM (çift onay): silah seç → "Emin misin?" (klasman sıfır + keskinlik düşer) → değiştir.
 *  - Yetersiz Denar → kart pasif ("Yetersiz Denar"). Sezon hakkı bittiyse → kilitli mesaj.
 * Gönderim server action (changeWeaponAction); sunucu TÜM kuralları yeniden doğrular (hesap eksiye düşmez).
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t, type Locale } from "@/i18n";
import { itemById, itemName } from "@/engine/equipment";
import type { Weapon } from "@/engine/domain";
import { DenarMark } from "../DenarMark";
import { changeWeaponAction } from "@/app/actions";
import type { WeaponChangeInfo } from "@/server/careerService";

export function WeaponChangeButton({ info, locale }: { info: WeaponChangeInfo; locale: Locale }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Weapon | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  const open = () => {
    setSelected(null);
    dialog.current?.showModal();
  };
  const close = () => {
    dialog.current?.close();
    setSelected(null);
  };

  const sel = selected ? info.options.find((o) => o.weapon === selected) : null;

  return (
    <>
      <button type="button" onClick={open} className="press flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-arena-1 py-2.5 text-[15px] font-semibold text-ink">
        ⚔️ {t(locale, "branch.button")}
      </button>

      {mounted &&
        createPortal(
          <dialog ref={dialog} className="modal" aria-label={t(locale, "branch.title")} onClick={(e) => { if (e.target === dialog.current) close(); }}>
            <div className="w-full max-w-md p-4">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-display text-[20px] font-bold">{t(locale, "branch.title")}</h2>
                <button type="button" onClick={close} className="press rounded-md px-2 py-1 text-[13px] text-steel">✕</button>
              </div>
              <p className="mb-3 text-[13px] text-steel">{t(locale, "branch.sub")}</p>

              {!info.allowedThisSeason ? (
                // Sezon hakkı bitti
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-[14px]">
                  🔒 {t(locale, "branch.lockedSeason")}
                </div>
              ) : selected == null ? (
                // Adım 1: silah seç
                <div className="flex flex-col gap-2.5">
                  {info.options.map((o) => (
                    <button
                      key={o.weapon}
                      type="button"
                      disabled={!o.affordable}
                      onClick={() => setSelected(o.weapon)}
                      className={`rounded-lg border p-3 text-left transition-colors ${o.affordable ? "border-line bg-arena-1 hover:bg-arena-2" : "cursor-not-allowed border-line bg-arena-1 opacity-50"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[17px] font-bold">{t(locale, `weapon.${o.weapon}`)}</span>
                        <span className="num inline-flex items-center gap-1 text-[16px] font-bold">
                          {o.total} <DenarMark size={13} />
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-steel">
                        <span>{t(locale, "branch.equipment")}: <span className="num">{o.equipmentCost}</span></span>
                        <span>{t(locale, "branch.fee")}: <span className="num">{o.fee}</span></span>
                        {!o.affordable && <span className="font-semibold text-sig-red">{t(locale, "branch.notEnough")}</span>}
                      </div>
                      {o.missing.length > 0 && (
                        <div className="mt-1.5 text-[11px] text-steel">
                          {o.missing.map((id) => { const it = itemById(id); return it ? itemName(it, locale) : id; }).join(" · ")}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                // Adım 2: çift onay
                <div className="rounded-lg border border-sig-red/40 bg-red-500/[0.06] p-3.5">
                  <p className="text-[15px] font-semibold">⚠️ {t(locale, "branch.confirmTitle")}</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/90">
                    {t(locale, "branch.confirmBody", { weapon: t(locale, `weapon.${sel!.weapon}`), total: sel!.total })}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => setSelected(null)} className="press flex-1 rounded-lg border border-line bg-arena-1 py-2.5 text-[14px] font-semibold">
                      {t(locale, "branch.cancel")}
                    </button>
                    <form action={changeWeaponAction} className="flex-1">
                      <input type="hidden" name="weapon" value={sel!.weapon} />
                      <button type="submit" className="press w-full rounded-lg bg-sig-red py-2.5 text-[14px] font-bold text-white">
                        {t(locale, "branch.confirmYes")}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
