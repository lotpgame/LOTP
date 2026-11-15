"use client";

/**
 * Market B2B teaser (kullanıcı 15.11): gerçek eskrim ürün markaları "ürünlerim burada olsun" ile bilgi bırakır
 * (marka adı + iletişim kişisi + telefon + e-posta). Feedback tablosuna kind="brand-lead" kaydolur (migration yok).
 * E-posta zorunlu: otomatik teklif e-postası için. Kulüp teaser'ının (ClubInterest) market karşılığı.
 */
import { useState } from "react";
import { submitBrandLeadAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";

export function MarketInterest({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const handle = async (formData: FormData) => {
    await submitBrandLeadAction(formData);
    setSent(true);
  };

  const inputCls = "min-h-11 w-full rounded-md border border-line bg-arena-1 px-3 text-[16px] outline-none focus:border-ink";

  return (
    <section className="panel overflow-hidden border-l-2 border-l-prio p-4">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-[20px]">🏷️</span>
        <div className="min-w-0">
          <h3 className="font-display text-[17px] font-bold">{t(locale, "brandLead.title")}</h3>
          <p className="mt-0.5 text-[14px] text-steel">{t(locale, "brandLead.desc")}</p>
        </div>
      </div>

      {sent ? (
        <p className="mt-3 rounded-md border border-sig-green/40 bg-sig-green/10 px-3 py-2 text-[14px] font-semibold text-sig-green">
          ✓ {t(locale, "brandLead.thanks")}
        </p>
      ) : !open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn-ink press mt-3 h-11 px-5 text-[15px]">
          {t(locale, "brandLead.cta")}
        </button>
      ) : (
        <form action={handle} className="mt-3 space-y-2">
          <input name="brandName" required maxLength={120} placeholder={t(locale, "brandLead.brandName")} className={inputCls} />
          <input name="contact" required maxLength={120} placeholder={t(locale, "brandLead.contact")} autoComplete="name" className={inputCls} />
          <input name="phone" required maxLength={60} type="tel" inputMode="tel" placeholder={t(locale, "brandLead.phone")} autoComplete="tel" className={inputCls} />
          <input name="email" required maxLength={160} type="email" inputMode="email" placeholder={t(locale, "brandLead.email")} autoComplete="email" className={inputCls} />
          <button type="submit" className="btn-ink press h-11 w-full text-[15px]">
            {t(locale, "brandLead.submit")}
          </button>
        </form>
      )}
    </section>
  );
}
