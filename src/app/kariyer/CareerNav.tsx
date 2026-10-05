"use client";

/**
 * Kariyer kabuğu — navigasyon + kimlik (her kariyer sayfasında).
 *  - Telefon: üstte ince kimlik şeridi; altta sabit gün çubuğu (ticker) + 5 sekmeli menü (başparmak bölgesi).
 *    Az kullanılan sayfalar + Bildir "Daha fazla" alt sayfasında.
 *  - Masaüstü (lg+): solda sabit sidebar — kimlik, tüm sayfalar, en altta gün çubuğu.
 * İki görünüm de aynı NAV tanımından beslenir. Aktif sayfa: kırmızı "en-garde" çizgisi + aria-current.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { t, type Locale } from "@/i18n";
import { Icon, weaponIcon, type IconName } from "@/app/ui/Icon";
import { FeedbackWidget } from "./FeedbackWidget";
import { Flag } from "./Flag";
import { WorldClockBadge } from "./WorldClockBadge";

interface NavItem {
  href: string;
  key: string; // i18n anahtarı
  icon: IconName;
}

// Alt sekme çubuğundaki 4 ana sayfa (5. sekme "Daha fazla").
const MAIN: NavItem[] = [
  { href: "/kariyer", key: "nav.profil", icon: "today" },
  { href: "/kariyer/antrenman", key: "nav.antrenman", icon: "train" },
  { href: "/kariyer/turnuvalar", key: "nav.turnuvalar", icon: "tournament" },
  { href: "/kariyer/klasman", key: "nav.klasman", icon: "ranking" },
];
const MORE: NavItem[] = [
  { href: "/kariyer/kulup", key: "nav.kulup", icon: "club" },
  { href: "/kariyer/ekipman", key: "nav.ekipman", icon: "shop" },
  { href: "/kariyer/gecmis", key: "nav.gecmis", icon: "history" },
  { href: "/kariyer/sozluk", key: "nav.sozluk", icon: "glossary" },
  { href: "/kariyer/ayarlar", key: "nav.ayarlar", icon: "settings" },
];
const ALL = [...MAIN, ...MORE];

function activeHref(pathname: string): string | undefined {
  return [...ALL]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.href;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Maske-oval avatar: tel dokusu + baş harfler (fotoğraf yok). */
function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <span
      className="mesh flex shrink-0 items-center justify-center bg-ink font-display font-bold text-arena-0"
      style={{ width: size, height: size * 1.15, borderRadius: "46% 46% 50% 50%", fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export interface CareerNavProps {
  name: string;
  locale: Locale;
  weapon: string;
  gender: string;
  ageCategory: string;
  age: number;
  city: string;
  nationalTeam: boolean;
  /** Gün çubuğu (tarih · bugünkü etkinlik · sıradaki turnuva · Turnuvaya Git/Geç) — sunucuda render edilir. */
  ticker: ReactNode;
}

export function CareerNav({ name, locale, weapon, ageCategory, age, city, nationalTeam, ticker }: CareerNavProps) {
  const pathname = usePathname();
  const current = activeHref(pathname);
  const moreActive = MORE.some((i) => i.href === current);
  const sheet = useRef<HTMLDialogElement>(null);
  const closeSheet = () => sheet.current?.close();

  const meta = (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-steel">
      <span className="inline-flex items-center gap-1">
        <Icon name={weaponIcon(weapon)} size={15} />
        {t(locale, `weapon.${weapon}`)}
      </span>
      <span aria-hidden="true">·</span>
      <span className="num">{ageCategory}</span>
      <span aria-hidden="true">·</span>
      <span>
        {age} {t(locale, "common.age")}
      </span>
      {city && (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Flag code="TR" /> {city}
          </span>
        </>
      )}
    </span>
  );

  const nationalBadge = nationalTeam && (
    <span className="inline-flex items-center gap-1 rounded-md border border-prio/50 px-1.5 py-0.5 text-[12px] font-semibold text-prio">
      <Flag code="TR" /> {t(locale, "common.nationalTeam")}
    </span>
  );

  return (
    <>
      {/* ——— Telefon DİKEY: kimlik şeridi (yatayda gizlenir, dikey alan kazanmak için) ——— */}
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex h-16 items-center gap-3 border-b border-line bg-arena-0/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 vland:hidden lg:hidden">
        <Avatar name={name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-[19px] font-bold leading-tight">{name}</h1>
            {nationalBadge}
          </div>
          {meta}
        </div>
      </header>

      {/* ——— Telefon YATAY: üst sekme şeridi (4 ana sayfa) + sağda canlı GMT saat (CLAUDE.md UI prototip) ——— */}
      <nav
        className="sticky top-0 z-20 -mx-4 mb-2 hidden items-stretch border-b border-line bg-arena-0/90 px-2 backdrop-blur sm:-mx-6 vland:flex lg:!hidden"
        aria-label={t(locale, "nav.menu")}
      >
        <div className="grid flex-1 grid-cols-4">
          {MAIN.map((item) => {
            const on = item.href === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`press relative flex min-h-9 flex-row items-center justify-center gap-1.5 py-1.5 text-[12px] ${
                  on ? "font-semibold text-ink" : "text-steel"
                }`}
              >
                {on && <span className="absolute inset-x-5 bottom-0 h-[2px] rounded-t-full bg-sig-red" aria-hidden="true" />}
                <Icon name={item.icon} size={16} className="shrink-0" />
                <span className="truncate">{t(locale, item.key)}</span>
              </Link>
            );
          })}
        </div>
        <WorldClockBadge locale={locale} />
      </nav>

      {/* ——— Masaüstü: sol sidebar ——— */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-arena-1 lg:flex">
        <div className="px-5 pt-5">
          <span lang="en" className="display text-[15px] tracking-[0.18em] text-steel">Legends of the Piste</span>
        </div>
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-line bg-arena-0 p-3">
          <Avatar name={name} size={40} />
          <div className="min-w-0">
            <div className="truncate font-display text-[19px] font-bold leading-tight">{name}</div>
            {meta}
            {nationalBadge && <div className="mt-1">{nationalBadge}</div>}
          </div>
        </div>
        <nav className="mt-4 flex flex-col gap-0.5 px-3" aria-label={t(locale, "nav.menu")}>
          {ALL.map((item) => {
            const on = item.href === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] transition-colors ${
                  on ? "bg-arena-0 font-semibold text-ink" : "text-steel hover:bg-arena-2 hover:text-ink"
                }`}
              >
                {on && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-sig-red" aria-hidden="true" />}
                <Icon name={item.icon} size={20} />
                {t(locale, item.key)}
              </Link>
            );
          })}
          <FeedbackWidget
            locale={locale}
            className="flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] text-steel transition-colors hover:bg-arena-2 hover:text-ink"
          />
        </nav>
      </aside>

      {/* ——— Alt blok: gün çubuğu (telefon: sekmelerin üstünde · masaüstü: sidebar'ın dibinde) + sekmeler ——— */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-arena-1/95 backdrop-blur lg:right-auto lg:w-64 lg:border-r lg:bg-arena-1">
        {/* Gün çubuğu: yatayda gizli (tarih/saat üst şeride taşındı); dikey + masaüstünde görünür. */}
        <div className="mx-auto max-w-3xl vland:hidden lg:block lg:max-w-none">{ticker}</div>

        <nav
          className="mx-auto grid max-w-3xl grid-cols-5 border-t border-line pb-[env(safe-area-inset-bottom)] vland:hidden lg:hidden"
          aria-label={t(locale, "nav.menu")}
        >
          {MAIN.map((item) => {
            const on = item.href === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`press relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${
                  on ? "font-semibold text-ink" : "text-steel"
                }`}
              >
                {on && <span className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-sig-red" aria-hidden="true" />}
                <Icon name={item.icon} size={24} />
                <span className="max-w-full truncate px-1">{t(locale, item.key)}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => sheet.current?.showModal()}
            aria-haspopup="dialog"
            className={`press relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${
              moreActive ? "font-semibold text-ink" : "text-steel"
            }`}
          >
            {moreActive && <span className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-sig-red" aria-hidden="true" />}
            <Icon name="more" size={24} />
            <span>{t(locale, "nav.more")}</span>
          </button>
        </nav>

        {/* ——— Telefon YATAY: alt şerit = "Daha" sayfaları (5) — üstteki 4 ile birlikte tüm menü görünür ——— */}
        <nav
          className="mx-auto hidden max-w-3xl grid-cols-5 border-t border-line pb-[env(safe-area-inset-bottom)] vland:grid lg:!hidden"
          aria-label={t(locale, "nav.menu")}
        >
          {MORE.map((item) => {
            const on = item.href === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`press relative flex min-h-9 flex-row items-center justify-center gap-1.5 py-1.5 text-[12px] ${
                  on ? "font-semibold text-ink" : "text-steel"
                }`}
              >
                {on && <span className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-sig-red" aria-hidden="true" />}
                <Icon name={item.icon} size={16} className="shrink-0" />
                <span className="truncate">{t(locale, item.key)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* "Daha fazla" alt sayfası (yalnız telefon) */}
      <dialog
        ref={sheet}
        className="sheet"
        aria-label={t(locale, "nav.more")}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeSheet(); // karartmaya dokununca kapan
        }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="kicker">{t(locale, "nav.more")}</span>
          <button type="button" onClick={closeSheet} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(locale, "common.close")}>
            <Icon name="close" />
          </button>
        </div>
        <ul className="px-2 pb-3">
          {MORE.map((item) => {
            const on = item.href === current;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeSheet}
                  aria-current={on ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-[16px] ${on ? "bg-arena-1 font-semibold" : "active:bg-arena-1"}`}
                >
                  <Icon name={item.icon} size={22} className="text-steel" />
                  <span className="flex-1">{t(locale, item.key)}</span>
                  <Icon name="chevron-right" size={18} className="text-steel" />
                </Link>
              </li>
            );
          })}
          <li>
            <FeedbackWidget
              locale={locale}
              onOpen={closeSheet}
              className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-[16px] active:bg-arena-1"
              withChevron
            />
          </li>
        </ul>
      </dialog>
    </>
  );
}
