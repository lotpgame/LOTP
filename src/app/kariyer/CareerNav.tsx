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
import { Avatar } from "./Avatar";
import { avatarSrc } from "./avatarImage";
import { DenarBadge } from "./DenarBadge";
import { Flag } from "./Flag";
import { WorldClockBadge } from "./WorldClockBadge";

// Menü ikonları — kullanıcının özel görselleri (public/img/menu). Kulüp = oyuncunun kulüp logosu (dinamik).
const MENU_IMG: Record<string, string> = {
  "/kariyer": "bugun",
  "/kariyer/antrenman": "antrenman",
  "/kariyer/ekipman": "ekipman",
  "/kariyer/turnuvalar": "turnuvalar",
  "/kariyer/klasman": "klasman",
  "/kariyer/gecmis": "kariyer-gecmisi",
  "/kariyer/ayarlar": "ayarlar",
};

/** Menü ikonu: Kulüp → kulüp logosu (DB'de sabit); diğerleri → özel menü görseli. Aktifse tam, değilse hafif soluk. */
function NavIcon({ href, size, clubLogo, active }: { href: string; size: number; clubLogo: string; active: boolean }) {
  const src = href === "/kariyer/kulup" ? clubLogo : `/img/menu/${MENU_IMG[href]}.webp`;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`shrink-0 object-contain ${active ? "opacity-100" : "opacity-60"}`}
      style={{ width: size, height: size }}
    />
  );
}

interface NavItem {
  href: string;
  key: string; // i18n anahtarı
  icon: IconName;
}

// Tüm sayfalar — kullanıcının istediği sıra (06.11). Masaüstü sidebar bunu birebir gösterir.
// Sözlük menüde değil → Ayarlar içinden açılır (kullanıcı kararı, Bildir gibi).
const NAV: NavItem[] = [
  { href: "/kariyer", key: "nav.profil", icon: "today" },
  { href: "/kariyer/kulup", key: "nav.kulup", icon: "club" },
  { href: "/kariyer/antrenman", key: "nav.antrenman", icon: "train" },
  { href: "/kariyer/ekipman", key: "nav.ekipman", icon: "shop" },
  { href: "/kariyer/turnuvalar", key: "nav.turnuvalar", icon: "tournament" },
  { href: "/kariyer/klasman", key: "nav.klasman", icon: "ranking" },
  { href: "/kariyer/gecmis", key: "nav.gecmis", icon: "history" },
  { href: "/kariyer/ayarlar", key: "nav.ayarlar", icon: "settings" },
];
// Telefon üst şeridi / alt sekme çubuğu = ilk 4 (çekirdek). Gerisi "Daha fazla" / alt şerit.
const PRIMARY = new Set(["/kariyer", "/kariyer/kulup", "/kariyer/antrenman", "/kariyer/ekipman"]);
const MAIN = NAV.filter((i) => PRIMARY.has(i.href)); // Bugün · Kulüp · Antrenman · Ekipman
const MORE = NAV.filter((i) => !PRIMARY.has(i.href)); // Turnuvalar · Klasman · Geçmiş · Ayarlar
const ALL = NAV;
// Telefon-yatay tek yatay üst bar: Ayarlar hariç tüm sekmeler (Ayarlar = sağdaki dişli ikonu). Kullanıcı kararı 15.11.
const TABBAR = NAV.filter((i) => i.href !== "/kariyer/ayarlar");
const SETTINGS_HREF = "/kariyer/ayarlar";

function activeHref(pathname: string): string | undefined {
  return [...ALL]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))?.href;
}

export interface CareerNavProps {
  name: string;
  locale: Locale;
  weapon: string;
  gender: string;
  ageCategory: string;
  age: number;
  city: string;
  clubLogo: string; // kulüp logosu yolu (DB'de sabit) — sidebar "Kulüp" ikonu
  countryCode: string; // oyuncunun ülkesi (bayrak)
  nationalTeam: boolean;
  avatar: string | null; // seçilen avatar seti (yaşa göre portre); null → harf rozeti
  // Denar rozeti (alt menü): bakiye + ödüllü reklam durumu.
  balance: number;
  adsLeft: number;
  adDailyCap: number;
  adReward: number;
  /** Gün çubuğu (tarih · bugünkü etkinlik · sıradaki turnuva · Turnuvaya Git/Geç) — sunucuda render edilir. */
  ticker: ReactNode;
}

export function CareerNav({ name, locale, weapon, ageCategory, age, city, clubLogo, countryCode, nationalTeam, avatar, balance, adsLeft, adDailyCap, adReward, ticker }: CareerNavProps) {
  const avatarUrl = avatarSrc(avatar, age);
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
            <Flag code={countryCode} /> {city}
          </span>
        </>
      )}
    </span>
  );

  const nationalBadge = nationalTeam && (
    <span className="inline-flex items-center gap-1 rounded-md border border-prio/50 px-1.5 py-0.5 text-[12px] font-semibold text-prio">
      <Flag code={countryCode} /> {t(locale, "common.nationalTeam")}
    </span>
  );

  return (
    <>
      {/* ——— Telefon DİKEY: kimlik şeridi (yatayda gizlenir, dikey alan kazanmak için) ——— */}
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex h-16 items-center gap-3 border-b border-line bg-arena-0/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 vland:hidden lg:hidden">
        <Avatar name={name} src={avatarUrl} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-[19px] font-bold leading-tight">{name}</h1>
            {nationalBadge}
          </div>
          {meta}
        </div>
      </header>

      {/* ——— Telefon YATAY: TEK yatay üst menü barı (kullanıcı kararı 15.11, futbol-oyunu tarzı) ———
          Sol: oyun saati (GMT) · Orta: tüm sekmeler tek sırada (dar ekranda yatay kayar) · Sağ: Denar + Ayarlar dişlisi.
          Eskiden üst (4 sekme) + alt (4 sekme) iki şeride bölünüydü; tek barda birleşti (dikey alan kazancı). */}
      <nav
        className="sticky top-0 z-20 mb-2 hidden h-16 w-screen items-center gap-2 border-b border-line bg-arena-0/90 pt-3 pb-1 backdrop-blur ml-[calc(50%-50vw)] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] vland:flex lg:!hidden"
        aria-label={t(locale, "nav.menu")}
      >
        <WorldClockBadge locale={locale} />
        <div className="flex flex-1 items-stretch justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABBAR.map((item) => {
            const on = item.href === current;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`press relative flex shrink-0 items-center whitespace-nowrap px-2 font-nav text-[14px] font-bold uppercase tracking-wide [-webkit-tap-highlight-color:transparent] ${
                  on ? "text-ink" : "text-steel"
                }`}
              >
                {t(locale, item.key)}
                {on && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t-full bg-sig-red" aria-hidden="true" />}
              </Link>
            );
          })}
        </div>
        <DenarBadge
          locale={locale}
          balance={balance}
          adsLeft={adsLeft}
          adDailyCap={adDailyCap}
          adReward={adReward}
          className="press flex shrink-0 items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[13px] font-semibold text-ink"
        />
        <Link
          href={SETTINGS_HREF}
          aria-current={current === SETTINGS_HREF ? "page" : undefined}
          aria-label={t(locale, "nav.ayarlar")}
          className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${current === SETTINGS_HREF ? "text-ink" : "text-steel"}`}
        >
          <Icon name="settings" size={18} />
        </Link>
      </nav>

      {/* ——— Masaüstü: sol sidebar ——— */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-arena-1 lg:flex">
        <div className="px-5 pt-5">
          {/* Marka logosu (sidebar başlık) — saydam amblem. */}
          <img src="/img/logo-mark.png" alt="Legends of the Piste" width={560} height={560} className="mx-auto w-40" />
        </div>
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-line bg-arena-0 p-3">
          <Avatar name={name} src={avatarUrl} size={40} />
          <div className="min-w-0">
            <div className="truncate font-display text-[19px] font-bold leading-tight">{name}</div>
            {meta}
            {nationalBadge && <div className="mt-1">{nationalBadge}</div>}
          </div>
        </div>
        {/* Denar rozeti — masaüstü sidebar (telefon-yatayda alt şeritte; burada kimlik altında). */}
        <div className="mx-4 mt-3">
          <DenarBadge
            locale={locale}
            balance={balance}
            adsLeft={adsLeft}
            adDailyCap={adDailyCap}
            adReward={adReward}
            className="press flex w-full items-center justify-center gap-2 rounded-md border border-line bg-arena-0 py-2 text-[15px] font-semibold text-ink"
          />
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
                <NavIcon href={item.href} size={20} clubLogo={clubLogo} active={on} />
                {t(locale, item.key)}
              </Link>
            );
          })}
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
                <NavIcon href={item.href} size={24} clubLogo={clubLogo} active={on} />
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

        {/* Telefon-yatay alt şerit kaldırıldı (15.11): tüm sekmeler + Denar + saat artık tek üst barda. */}
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
                  <NavIcon href={item.href} size={22} clubLogo={clubLogo} active={on} />
                  <span className="flex-1">{t(locale, item.key)}</span>
                  <Icon name="chevron-right" size={18} className="text-steel" />
                </Link>
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
