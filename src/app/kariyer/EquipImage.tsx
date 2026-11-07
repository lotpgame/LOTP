"use client";

/**
 * Ekipman ürün görseli: küçük thumbnail (buton) → tıklayınca TAM kolaj (tüm açılar) bir pencerede açılır,
 * kapatılabilir (kullanıcı kararı 07.11). Pencere document.body'ye taşınır (portal) → her yerde üstte çıkar.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/app/ui/Icon";

export function EquipImage({
  thumbSrc,
  fullSrc,
  alt,
  closeLabel,
  className,
  imgClassName,
}: {
  thumbSrc: string;
  fullSrc: string;
  alt: string;
  closeLabel: string;
  className?: string;
  imgClassName?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={className} aria-label={alt}>
        <img src={thumbSrc} alt={alt} className={imgClassName ?? "h-full w-full object-cover"} loading="lazy" />
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={alt}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate font-display text-[16px] font-bold">{alt}</span>
                <button type="button" onClick={close} className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center text-steel" aria-label={closeLabel}>
                  <Icon name="close" />
                </button>
              </div>
              <img src={fullSrc} alt={alt} className="w-full rounded-md" />
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
