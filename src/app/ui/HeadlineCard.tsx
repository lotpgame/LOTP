/**
 * Manşet kartı — gazete düzeni: üst çizgi, kicker, büyük başlık, alt satır. Şampiyonlukta solda altın blok
 * (tek prestij rengi). İsteğe bağlı WhatsApp paylaşımı: yalnız hazır metinli bağlantı, gönderen kullanıcı.
 */
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { t, type Locale } from "@/i18n";
import { Icon } from "./Icon";
import { headlineShareText, type Headline } from "./headlineText";

/** wa.me bağlantısı; metindeki site adresi isteğin host'undan (yerelde localhost, canlıda kendi alan adı). */
export async function whatsAppHref(locale: Locale, h: Headline): Promise<string> {
  const hd = await headers();
  const host = hd.get("x-forwarded-host") ?? hd.get("host") ?? "";
  const proto = hd.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = host ? `${proto}://${host}` : "";
  return `https://wa.me/?text=${encodeURIComponent(headlineShareText(locale, h, url))}`;
}

export function HeadlineCard({
  h,
  kicker,
  shareHref,
  locale,
  children,
}: {
  h: Headline;
  kicker?: string;
  shareHref?: string;
  locale: Locale;
  children?: ReactNode;
}) {
  return (
    <article className={`border-t-2 border-ink pt-3 ${h.champion ? "border-l-[6px] border-l-prio pl-3" : ""}`}>
      {kicker && <div className="kicker">{kicker}</div>}
      <h2 className="display mt-1.5 text-[26px] leading-[1.02]">{h.title}</h2>
      {h.deck.length > 0 && <p className="mt-2 text-[14px] text-steel">{h.deck.join(" · ")}</p>}
      {children}
      {shareHref && (
        <a href={shareHref} target="_blank" rel="noopener noreferrer" className="btn-ghost press mt-3">
          <Icon name="share" size={18} />
          {t(locale, "headline.share")}
        </a>
      )}
    </article>
  );
}
