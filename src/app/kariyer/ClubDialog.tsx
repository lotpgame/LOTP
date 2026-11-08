"use client";

/**
 * Kulüp rozeti → tıklayınca pencere: büyük logo + kulüp adı + şehir (kullanıcı 08.11).
 * Kulüp sayfasında logoya, klasmanda kulüp satırına sarılır. Pencere portal ile body'ye taşınır (her yerde üstte).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/app/ui/Icon";

export function ClubDialog({
  logo,
  name,
  city,
  closeLabel,
  triggerClassName,
  children,
}: {
  logo: string;
  name: string;
  city: string;
  closeLabel: string;
  triggerClassName?: string;
  children: ReactNode;
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
      <button type="button" onClick={() => dialog.current?.showModal()} className={triggerClassName} aria-label={name}>
        {children}
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={name}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="p-4">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={close} className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center text-steel" aria-label={closeLabel}>
                  <Icon name="close" />
                </button>
              </div>
              <div className="flex flex-col items-center gap-3 pb-2">
                <img src={logo} alt={name} className="h-40 w-40 object-contain" />
                <div className="text-center">
                  <div className="font-display text-[20px] font-bold">{name}</div>
                  {city && <div className="mt-0.5 text-[14px] text-steel">{city}</div>}
                </div>
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
