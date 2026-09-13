"use client";

/**
 * Kariyer üst başlığı + gizli/açılır menü (mobil öncelikli). Üstte oyuncu adı (sol) ve avatar (sağ);
 * altında "☰" ile açılan menü: Profil / Antrenman / Turnuvalar / Kulüp / Ekipman / Geçmiş.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { resetCareerAction } from "@/app/actions";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const ITEMS: NavItem[] = [
  { href: "/kariyer", label: "Profil", icon: "👤" },
  { href: "/kariyer/antrenman", label: "Antrenman", icon: "🏋️" },
  { href: "/kariyer/turnuvalar", label: "Turnuvalar", icon: "🏆" },
  { href: "/kariyer/klasman", label: "Klasman", icon: "📊" },
  { href: "/kariyer/kulup", label: "Kulüp", icon: "🏛️" },
  { href: "/kariyer/ekipman", label: "Ekipman", icon: "🗡️" },
  { href: "/kariyer/gecmis", label: "Kariyer Geçmişi", icon: "📜" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CareerNav({ name, meta }: { name: string; meta: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = [...ITEMS].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  const currentLabel = active?.label ?? "Menü";

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-black/10 bg-white/85 px-4 pt-4 backdrop-blur sm:-mx-6 sm:px-6 dark:border-white/10 dark:bg-black/70">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{name}</h1>
          <p className="truncate text-xs opacity-60">{meta}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white">
          {initials(name)}
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
                {item.label}
              </Link>
            );
          })}
          <form action={resetCareerAction} className="border-t border-black/10 dark:border-white/10">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-500/10 dark:text-red-400">
              <span className="text-base">🔄</span>
              Yeni Kariyer
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
