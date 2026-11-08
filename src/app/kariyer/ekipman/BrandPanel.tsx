/**
 * Marka paneli — açılır/kapanır (Yusuf, 28.09): ileride birden çok marka geldiğinde (Leon, PBT…) her biri
 * kendi panelinde durur, oyuncu istediğini açar. Şimdilik tek marka (GLADIUS) → varsayılan açık, tek panel
 * olduğu için pratikte her zaman görünür durur. Katalog verisi hâlâ `GLADIUS_ITEMS` (motor); bu bileşen
 * yalnız kabuk — yeni bir marka eklemek `ekipman/page.tsx`'te bir `<BrandPanel>` daha render etmek demektir.
 */
import type { ReactNode } from "react";
import { t, type Locale } from "@/i18n";
import { Icon, type IconName } from "@/app/ui/Icon";

export function BrandPanel({
  icon,
  logo,
  name,
  sub,
  ownedCount,
  total,
  locale,
  defaultOpen = true,
  children,
}: {
  icon: IconName;
  logo?: string; // verilirse marka logosu görseli (ikon + ad metni yerine; logoda ad zaten var)
  name: string;
  sub: string;
  ownedCount: number;
  total: number;
  locale: Locale;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="panel group" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        {logo ? (
          <img src={logo} alt={name} className="shrink-0 object-contain" style={{ height: 30, width: "auto" }} />
        ) : (
          <Icon name={icon} size={32} className="shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {!logo && <div className="font-display text-[20px] font-bold leading-none tracking-[0.25em]">{name}</div>}
          <div className={logo ? "text-[13px] text-steel" : "mt-1 text-[13px] text-steel"}>{sub}</div>
        </div>
        <span className="num shrink-0 text-[14px] text-steel">
          {ownedCount}/{total}
        </span>
        <Icon name="chevron-down" size={18} className="shrink-0 text-steel transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-4 pb-4 pt-3">
        <div className="flex items-baseline justify-between">
          <span className="kicker">{t(locale, "ekipman.kit")}</span>
          <span className="num text-[15px]">
            {ownedCount}/{total}
          </span>
        </div>
        <div className="mt-1.5 flex gap-[3px]" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-[2px] ${i < ownedCount ? "bg-ink" : "bg-line"}`} />
          ))}
        </div>
        <div className="mt-4 space-y-6">{children}</div>
      </div>
    </details>
  );
}
