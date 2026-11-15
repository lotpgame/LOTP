"use client";

/**
 * Kulüp sayfası B2B teaser (kullanıcı 15.11): gerçek eskrim kulüpleri "İlgileniyorum" ile bilgi bırakır
 * (kulüp adı + iletişim kişisi + telefon). Feedback tablosuna kind="club-lead" kaydolur (migration yok).
 * Premium kulüp sistemi launch sonrası; bu yalnız ilgi/lead toplar. docs/KULUPLER.md.
 */
import { useState } from "react";
import { submitClubLeadAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";

export function ClubInterest({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const handle = async (formData: FormData) => {
    await submitClubLeadAction(formData);
    setSent(true);
  };

  const inputCls = "min-h-11 w-full rounded-md border border-line bg-arena-1 px-3 text-[16px] outline-none focus:border-ink";

  return (
    <section className="panel overflow-hidden border-l-2 border-l-prio p-4">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-[20px]">🏛️</span>
        <div className="min-w-0">
          <h3 className="font-display text-[17px] font-bold">{t(locale, "clubLead.title")}</h3>
          <p className="mt-0.5 text-[14px] text-steel">{t(locale, "clubLead.desc")}</p>
        </div>
      </div>

      {sent ? (
        <p className="mt-3 rounded-md border border-sig-green/40 bg-sig-green/10 px-3 py-2 text-[14px] font-semibold text-sig-green">
          ✓ {t(locale, "clubLead.thanks")}
        </p>
      ) : !open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn-ink press mt-3 h-11 px-5 text-[15px]">
          {t(locale, "clubLead.cta")}
        </button>
      ) : (
        <form action={handle} className="mt-3 space-y-2">
          <input name="clubName" required maxLength={120} placeholder={t(locale, "clubLead.clubName")} className={inputCls} />
          <input name="contact" required maxLength={120} placeholder={t(locale, "clubLead.contact")} autoComplete="name" className={inputCls} />
          <input name="phone" required maxLength={60} type="tel" inputMode="tel" placeholder={t(locale, "clubLead.phone")} autoComplete="tel" className={inputCls} />
          <button type="submit" className="btn-ink press h-11 w-full text-[15px]">
            {t(locale, "clubLead.submit")}
          </button>
        </form>
      )}
    </section>
  );
}
