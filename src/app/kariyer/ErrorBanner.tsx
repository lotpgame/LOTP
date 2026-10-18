import Link from "next/link";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";

/**
 * Yumuşak hata bandı (#4): bir aksiyon GameError fırlatıp `?err=<code>` ile yönlendirdiğinde,
 * generic hata sayfası yerine kullanıcının dilinde kısa bir açıklama gösterir. `dismissHref`
 * sorgusuz sayfaya döner (kapat). Bilinmeyen kod gelirse hiçbir şey basmaz.
 */
export function ErrorBanner({
  code,
  locale,
  dismissHref,
}: {
  code?: string;
  locale: Locale;
  dismissHref: string;
}) {
  if (!code || !/^[a-z_]+$/.test(code)) return null;
  const key = `err.${code}`;
  const msg = t(locale, key);
  if (msg === key) return null; // çevirisi olmayan kod → generic akışa bırak
  return (
    <div
      role="alert"
      className="panel flex items-start gap-3 border-l-4 border-l-amber-500 bg-amber-50 p-3 text-[14px] text-ink dark:bg-amber-950/30"
    >
      <span className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true">
        <Icon name="info" size={18} />
      </span>
      <p className="flex-1 leading-snug">{msg}</p>
      <Link href={dismissHref} aria-label={t(locale, "common.close")} className="shrink-0 text-steel hover:text-ink">
        <Icon name="close" size={18} />
      </Link>
    </div>
  );
}
