"use client";

/**
 * Sözlük — tek tık açılan pop-up (kullanıcı kararı 15.11, Geri Bildirim gibi). Satıra tıkla → ortada pencere,
 * üstte arama kutusu (terim + açıklamada arar), altında kaydırmalı liste. İçerik sunucudan prop ile gelir
 * (glossaryFor). Pencere document.body'ye taşınır (portal).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import type { GlossarySection } from "../sozluk/glossary";

export function SozlukModal({ locale, sections, rowClassName }: { locale: Locale; sections: GlossarySection[]; rowClassName: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const close = () => dialog.current?.close();

  // Arama: terim veya açıklamada geçen terimleri süz; boş bölümleri gizle. Türkçe/aksan duyarsız basit normalize.
  const norm = (s: string) => s.toLocaleLowerCase("tr").replace(/[ıİ]/g, "i");
  const filtered = useMemo(() => {
    const query = norm(q.trim());
    if (!query) return sections;
    return sections
      .map((sec) => ({ ...sec, terms: sec.terms.filter((e) => norm(e.term).includes(query) || norm(e.definition).includes(query)) }))
      .filter((sec) => sec.terms.length > 0);
  }, [q, sections]);

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog" className={rowClassName}>
        <Icon name="glossary" size={20} className="shrink-0 text-steel" />
        <span className="flex-1 text-left">{t(locale, "nav.sozluk")}</span>
        <Icon name="chevron-right" size={18} className="shrink-0 text-steel" />
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={t(locale, "nav.sozluk")}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="flex max-h-[82svh] flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-[19px] font-bold">{t(locale, "nav.sozluk")}</span>
                <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(locale, "common.close")}>
                  <Icon name="close" />
                </button>
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t(locale, "sozluk.search")}
                className="mb-3 w-full rounded-md border border-line bg-arena-1 px-3 py-2 text-[15px] outline-none focus:border-ink"
              />
              <div className="-mr-1 flex-1 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-[14px] text-steel">{t(locale, "sozluk.noResult")}</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filtered.map((section) => (
                      <div key={section.title}>
                        <div className="kicker mb-1.5">{section.title}</div>
                        <dl className="panel divide-y divide-line overflow-hidden">
                          {section.terms.map((entry) => (
                            <div key={entry.term} className="px-3 py-2.5">
                              <dt className="text-[15px] font-semibold">{entry.term}</dt>
                              <dd className="mt-0.5 text-[14px] text-steel">{entry.definition}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
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
