"use client";

/** Oynanan turnuvalar listesi + Quarter (oyun yılı) filtresi (M11.4/UI). En yeni önce. */
import Link from "next/link";
import { useMemo, useState } from "react";
import { t, type Locale } from "@/i18n";

export interface HistoryTournament {
  id: number;
  name: string;
  level: string;
  categoryId: string;
  date: string;
  position: number;
  quarter: number;
  month: number;
}

const POSITION_BADGE: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
function placementLabel(pos: number): string {
  if (pos === 0) return "—";
  return POSITION_BADGE[pos] ? `${POSITION_BADGE[pos]} ${pos}.` : `${pos}.`;
}

export function TournamentsFilter({ tournaments, locale }: { tournaments: HistoryTournament[]; locale: Locale }) {
  const dateLoc = locale === "en" ? "en-GB" : "tr-TR";
  const quarters = useMemo(
    () => [...new Set(tournaments.map((t) => t.quarter))].sort((a, b) => b - a),
    [tournaments],
  );
  const [q, setQ] = useState<number | "all">("all");
  const shown = q === "all" ? tournaments : tournaments.filter((tr) => tr.quarter === q);

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs opacity-60">{t(locale, "gecmis.filter")}</span>
        <button
          onClick={() => setQ("all")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
            q === "all" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-black/10 opacity-70 hover:opacity-100 dark:bg-white/10"
          }`}
        >
          {t(locale, "gecmis.filterAll")}
        </button>
        {quarters.map((qq) => (
          <button
            key={qq}
            onClick={() => setQ(qq)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              q === qq ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-black/10 opacity-70 hover:opacity-100 dark:bg-white/10"
            }`}
          >
            Q{qq}
          </button>
        ))}
      </div>

      <ul className="mt-3 space-y-2">
        {shown.map((tour) => (
          <li key={tour.id}>
            <Link
              href={`/turnuva/${tour.id}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/[0.015] px-3 py-2.5 text-sm transition hover:border-emerald-500/40 hover:bg-emerald-500/5 dark:border-white/15 dark:bg-white/[0.02]"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{tour.name}</span>
                <span className="text-xs opacity-50">
                  {tour.level} · Q{tour.quarter} · H{tour.month} · {new Date(tour.date).toLocaleDateString(dateLoc)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    tour.position >= 1 && tour.position <= 3
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      : "bg-black/10 opacity-70 dark:bg-white/15"
                  }`}
                >
                  {placementLabel(tour.position)}
                </span>
                <span className="opacity-40">›</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
