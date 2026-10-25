import type { ReactNode } from "react";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";

/**
 * Açılır-kapanır açıklama (varsayılan KAPALI) — ana ekranı sade tutar; isteyen "Nasıl işler?"e dokunup okur.
 * Native <details>, JS gerekmez. Uzun yardım metinleri için (mobil + genç kitle: daha az metin duvarı).
 */
export function InfoNote({
  locale,
  label,
  children,
}: {
  locale: Locale;
  label?: string;
  children: ReactNode;
}) {
  return (
    <details className="group mt-2">
      <summary className="flex min-h-9 w-fit cursor-pointer list-none items-center gap-1.5 rounded-md text-[13px] font-medium text-steel transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <Icon name="info" size={15} className="shrink-0" />
        <span>{label ?? t(locale, "tour.howItWorks")}</span>
        <Icon name="chevron-down" size={14} className="shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-1.5 flex flex-col gap-1.5 text-[13px] leading-relaxed text-steel">{children}</div>
    </details>
  );
}
