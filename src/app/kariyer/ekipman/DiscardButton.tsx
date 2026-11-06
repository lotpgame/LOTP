"use client";

/**
 * Dolaptan eşya silme — 2 kademeli onay (kullanıcı kararı 06.11: "cat diye silinmesin").
 * İlk tık → "Sil?" + ✓/✗ belirir; ✓ sunucu aksiyonunu çalıştırır, ✗ vazgeçer.
 */
import { useState } from "react";
import { discardEquipmentAction } from "@/app/actions";
import { Icon } from "@/app/ui/Icon";

export function DiscardButton({
  slot,
  index,
  labels,
}: {
  slot: string;
  index: number;
  labels: { discard: string; sure: string };
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-steel active:bg-arena-2"
        aria-label={labels.discard}
        title={labels.discard}
      >
        <Icon name="close" size={16} />
      </button>
    );
  }

  return (
    <form action={discardEquipmentAction} className="flex shrink-0 items-center gap-1">
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="index" value={index} />
      <span className="text-[11px] font-semibold text-sig-red">{labels.sure}</span>
      <button
        type="submit"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-sig-red text-white"
        aria-label={labels.sure}
      >
        <Icon name="check" size={15} />
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-arena-2 text-ink"
        aria-label="✕"
      >
        <Icon name="close" size={15} />
      </button>
    </form>
  );
}
