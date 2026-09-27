"use client";

/**
 * Kariyer üst başlığı — kimlik afişi (avatar + isim + rozetler) + açılır menü. Her kariyer
 * sayfasında görünür (tek kimlik başlığı; profil sayfası bunu tekrar etmez). Mobil öncelikli.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { t, type Locale } from "@/i18n";
import { Flag } from "./Flag";

interface NavItem {
  href: string;
  key: string; // i18n anahtarı
  icon: string;
}

const ITEMS: NavItem[] = [
  { href: "/kariyer", key: "nav.profil", icon: "👤" },
  { href: "/kariyer/antrenman", key: "nav.antrenman", icon: "🎯" },
  { href: "/kariyer/turnuvalar", key: "nav.turnuvalar", icon: "🏆" },
  { href: "/kariyer/klasman", key: "nav.klasman", icon: "📊" },
  { href: "/kariyer/kulup", key: "nav.kulup", icon: "🏛️" },
  { href: "/kariyer/ekipman", key: "nav.ekipman", icon: "🗡️" },
  { href: "/kariyer/gecmis", key: "nav.gecmis", icon: "📜" },
  { href: "/kariyer/ayarlar", key: "nav.ayarlar", icon: "⚙️" },
];

const WEAPON_EMOJI: Record<string, string> = { FOIL: "🤺", EPEE: "⚔️", SABRE: "🗡️" };

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
}

export function CareerNav({ name, locale, weapon, gender, ageCategory, age, city, nationalTeam }: CareerNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = [...ITEMS].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  const currentLabel = active ? t(locale, active.key) : t(locale, "nav.menu");

  const badge = "rounded-full bg-black/10 px-2 py-0.5 font-medium dark:bg-white/15";

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-black/10 bg-white/85 px-4 pt-4 backdrop-blur sm:-mx-6 sm:px-6 dark:border-white/10 dark:bg-black/70">
      {/* Kimlik afişi */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-sky-500/10 to-transparent p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 text-xl font-bold text-white shadow-lg shadow-emerald-500/30 sm:h-16 sm:w-16 sm:text-2xl">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl">{name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span className={badge}>
                {WEAPON_EMOJI[weapon] ?? "🤺"} {t(locale, `weapon.${weapon}`)}
              </span>
              <span className={badge}>{t(locale, `gender.${gender}`)}</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                {ageCategory} · {age} {t(locale, "common.age")}
              </span>
              {/* Ülke bayrağı (görsel) + şehir (V1 TR-only; çok ülkeli fazda gerçek koddan). */}
              {city && (
                <span className={`${badge} inline-flex items-center gap-1`}>
                  <Flag code="TR" /> {city}
                </span>
              )}
              {nationalTeam && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 font-semibold text-red-700 dark:text-red-300">
                  <Flag code="TR" /> {t(locale, "common.nationalTeam")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Açılır menü tetikleyici */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 mb-3 flex w-full items-center justify-between rounded-lg border border-black/15 px-3 py-2.5 text-sm font-medium transition hover:border-emerald-500 dark:border-white/20"
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{active?.icon ?? "☰"}</span>
          {currentLabel}
        </span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <nav className="mb-3 overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
          {ITEMS.map((item) => {
            const isActive = item.href === active?.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 border-b border-black/5 px-4 py-3 text-sm last:border-b-0 transition dark:border-white/5 ${
                  isActive ? "bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-300" : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {t(locale, item.key)}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
