"use client";

/**
 * Kulüp rozeti → tıklayınca KULÜP KARTI penceresi (kullanıcı 09.11): solda büyük logo, sağda kulüp adı,
 * şehir + ülke (bayrak), tesis kalitesi, oyuncu sayısı ve antrenör isimleri. Kulüp sayfasında logoya,
 * klasmanda kulüp satırına sarılır. Pencere portal ile body'ye taşınır (her yerde üstte).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/app/ui/Icon";
import { Segments } from "@/app/ui/Piste";
import { t, type Locale } from "@/i18n";
import { Flag } from "./Flag";

export interface ClubCard {
  logo: string;
  name: string;
  city: string;
  country: string; // ülke kodu
  facility: number; // 0–100
  members: number;
  coaches: { name: string; specialty: string }[];
}

export function ClubDialog({
  club,
  locale,
  closeLabel,
  triggerClassName,
  children,
}: {
  club: ClubCard;
  locale: Locale;
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
  const fmtSpec = (s: string) =>
    s.split(",").filter(Boolean).map((x) => t(locale, `category.${x}`)).join(", ");

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={triggerClassName} aria-label={club.name}>
        {children}
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={club.name}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="p-4">
              <div className="mb-1 flex justify-end">
                <button type="button" onClick={close} className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center text-steel" aria-label={closeLabel}>
                  <Icon name="close" />
                </button>
              </div>

              {/* Üst: solda logo, sağda ad + şehir/ülke */}
              <div className="flex items-center gap-4">
                <img src={club.logo} alt={club.name} className="h-24 w-24 shrink-0 object-contain" />
                <div className="min-w-0">
                  <div className="font-display text-[20px] font-bold leading-tight">{club.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[14px] text-steel">
                    <Flag code={club.country} />
                    <span>{club.city} · {t(locale, `country.${club.country}`)}</span>
                  </div>
                </div>
              </div>

              {/* Tesis kalitesi */}
              <div className="mt-4">
                <div className="flex items-baseline justify-between text-[14px]">
                  <span className="text-steel">{t(locale, "kulup.facility")}</span>
                  <span className="num text-[15px]">{club.facility}/100</span>
                </div>
                <Segments value={club.facility} traffic className="mt-1.5" />
              </div>

              {/* Oyuncu sayısı */}
              <div className="mt-3 flex items-baseline justify-between text-[14px]">
                <span className="text-steel">{t(locale, "kulup.members")}</span>
                <span className="num text-[15px]">{club.members}</span>
              </div>

              {/* Antrenörler */}
              {club.coaches.length > 0 && (
                <div className="mt-4">
                  <div className="kicker mb-1.5">{t(locale, "kulup.coaches")}</div>
                  <ul className="space-y-1.5">
                    {club.coaches.map((co, i) => (
                      <li key={i} className="flex items-baseline justify-between gap-3 rounded-md border border-line bg-arena-0 px-3 py-2">
                        <span className="text-[15px] font-medium">{co.name}</span>
                        {fmtSpec(co.specialty) && <span className="shrink-0 text-[13px] text-steel">{fmtSpec(co.specialty)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
