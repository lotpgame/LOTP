import type { ReactNode } from "react";
import { Icon } from "@/app/ui/Icon";

/**
 * Açılır-kapanır BÖLÜM — başlık (h2 gibi) + sağda chevron; dokununca içerik açılır. Native <details>, JS yok.
 * `defaultOpen` ile ana bölümler açık (ör. Haftalık Plan), bilgi/referans bölümleri kapalı gelir.
 * Mobil + genç kitle: sayfa taranabilir "akordeon", az metin duvarı.
 */
export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: string; // verilirse başlıkta metinden önce bu görsel (ör. yetenekler rozeti)
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
        <h2 className="display flex items-center gap-2 text-[22px]">
          {icon && <img src={icon} alt="" aria-hidden="true" className="h-7 w-7 shrink-0 object-contain" />}
          {title}
        </h2>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-steel transition-colors group-hover:text-ink">
          <Icon name="chevron-down" size={18} className="transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
